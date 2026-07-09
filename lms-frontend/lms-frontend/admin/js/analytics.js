(function(){
  'use strict';

  // Singleton guard: prevent duplicate initialization
  if(window.__adminAnalyticsLoaded) return;
  window.__adminAnalyticsLoaded = true;

  function el(id){ return document.getElementById(id); }

  const State = { charts: {} };

  async function fetchStats(extraParams = {}){
    try{
      // collect current filter values from the DOM unless explicitly provided
      const aaYear = el('aaAcademicYear')?.value || '';
      const aaSem = el('aaSemester')?.value || '';
      const aaProg = el('aaProgram')?.value || '';

      const params = Object.assign({}, {
        academic_year_id: aaYear || undefined,
        semester_id: aaSem || undefined,
        subject_id: aaProg || undefined
      }, extraParams || {});

      if(typeof DashboardAPI !== 'undefined' && DashboardAPI.getAdminStats) {
        return await DashboardAPI.getAdminStats(params);
      }

      // fallback: use generic API.get() if DashboardAPI wrapper isn't available
      if(typeof API !== 'undefined' && API.get && typeof API_ENDPOINTS !== 'undefined' && API_ENDPOINTS.ADMIN_STATS) {
        const query = Object.keys(params)
          .filter(k => params[k] !== undefined && params[k] !== '')
          .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
          .join('&');
        const url = query ? `${API_ENDPOINTS.ADMIN_STATS}?${query}` : API_ENDPOINTS.ADMIN_STATS;
        return await API.get(url);
      }

      throw new Error('No DashboardAPI or API.get available to fetch admin stats');
    }catch(err){
      console.warn('Failed to fetch admin stats:', err);
      throw err;
    }
  }

  function destroyChart(key){
    if(State.charts[key]){
      State.charts[key].destroy();
      State.charts[key] = null;
    }
  }

  function safeNumberArray(arr, length){
    if(Array.isArray(arr)) return arr;
    return new Array(length).fill(0);
  }

  
/**
 * Generate labels for the last 12 months, with the current month last.
 * Months from a prior year are shown as e.g. "Apr '25".
 */
function getLast12MonthLabels() {
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const labels = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(
            d.getFullYear() !== currentYear
                ? `${names[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`
                : names[d.getMonth()]
        );
    }
    return labels;
}


  function renderEnrollmentTrend(ctx, data){
    if(!ctx) return;
    destroyChart('enrollmentTrend');
    const labels = getLast12MonthLabels() || [];
    const values = data || safeNumberArray([], labels.length);
    State.charts.enrollmentTrend = new Chart(ctx, {
      type: 'line',
      data: { 
        labels, 
        datasets:[{ 
          label: 'Students Enrolled', 
          data: values, 
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 4
        }] 
      },
      options: { 
        responsive:true, 
        maintainAspectRatio:false, 
        scales:{ y:{ beginAtZero:true } },
        plugins: { legend: { display: true } }
      }
    });
  }

  function renderProgramPerformance(ctx, data){
    if(!ctx) return;
    destroyChart('programPerformance');
    const labels = (data && data.labels) || [];
    const values = (data && data.values) || safeNumberArray([], labels.length);
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    State.charts.programPerformance = new Chart(ctx, {
      type: 'bar',
      data: { 
        labels, 
        datasets:[{ 
          label: 'Average Score', 
          data: values, 
          backgroundColor: colors.slice(0, labels.length)
        }] 
      },
      options: { 
        responsive:true, 
        maintainAspectRatio:false, 
        scales:{ y:{ beginAtZero:true, max:100 } },
        plugins: { legend: { display: true } }
      }
    });
  }

  function renderTeacherPerformance(ctx, data){
    if(!ctx) return;
    destroyChart('teacherPerformance');
    const labels = (data && data.labels) || [];
    const values = (data && data.values) || safeNumberArray([], labels.length);

    State.charts.teacherPerformance = new Chart(ctx, {
      type: 'bar',
      data: { 
        labels, 
        datasets:[{ 
          label: 'Avg Student Score', 
          data: values, 
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: '#8b5cf6',
          borderWidth: 1
        }] 
      },
      options: { 
        responsive:true, 
        maintainAspectRatio:false, 
        indexAxis: 'y',
        scales:{ x:{ beginAtZero:true, max:100 } },
        plugins: { legend: { display: true } }
      }
    });
  }

  function renderClassComparison(ctx, data){
    if(!ctx) return;
    destroyChart('classComparison');
    const labels = (data && data.labels) || [];
    const datasets = (data && data.datasets) || [];

    State.charts.classComparison = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: { 
        responsive:true, 
        maintainAspectRatio:false, 
        scales:{ y:{ beginAtZero:true, max:100 } },
        plugins: { legend: { display: true, position: 'top' } }
      }
    });
  }

  function renderAttendanceStats(data){
    const container = el('attendanceStatsContainer');
    if(!container) return;

    const todayRate = (data && data.attendance_rate_today) ? parseInt(data.attendance_rate_today) : 0;
    const weekRate = (data && data.attendance_rate) ? parseInt(data.attendance_rate) : 0;
    
    let alertColor = '#10b981';
    let alertStatus = 'Good';
    if(todayRate < 80) {
      alertColor = '#ef4444';
      alertStatus = 'Below Target';
    } else if(todayRate < 90) {
      alertColor = '#f59e0b';
      alertStatus = 'Fair';
    }

    container.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div style="background:#f8fafc; padding:16px; border-radius:8px; border-left:3px solid #3b82f6;">
          <div style="font-size:0.85rem; color:#64748b; margin-bottom:8px;">Today's Attendance</div>
          <div style="font-size:2rem; font-weight:bold; color:#3b82f6;">${todayRate}%</div>
        </div>
        <div style="background:#f8fafc; padding:16px; border-radius:8px; border-left:3px solid ${alertColor};">
          <div style="font-size:0.85rem; color:#64748b; margin-bottom:8px;">Weekly Average</div>
          <div style="font-size:2rem; font-weight:bold; color:${alertColor};">${weekRate}%</div>
          <div style="font-size:0.75rem; color:${alertColor}; margin-top:4px;">${alertStatus}</div>
        </div>
      </div>
    `;
  }

  async function initCharts(){
    const root = el('adminAnalyticsRoot');
    if(!root) return;

    const enrollmentCtx = el('enrollmentTrendChart')?.getContext('2d');
    const programCtx = el('programPerformanceChart')?.getContext('2d');
    const teacherCtx = el('teacherPerformanceChart')?.getContext('2d');
    const classCtx = el('classComparisonChart')?.getContext('2d');

    if(window.showToast) window.showToast('Loading analytics...', 'info');

    try{
      const response = await fetchStats();
      const stats = response && response.data ? response.data : response;
      
      // Update summary stats
  el('aaTotalStudents').textContent = stats.total_students || 0;
  el('aaTotalTeachers').textContent = stats.total_teachers || 0;
  el('aaTotalClasses').textContent = stats.total_classes || 0;
  el('aaActiveStudents').textContent = stats.active_students || 0;
  el('aaTotalCourses').textContent = stats.total_courses || 0;
  el('aaPendingTasks').textContent = stats.pending_tasks || 0;

      // Growth metrics
      const studentsGrowth = stats.students_growth ? (stats.students_growth > 0 ? '+' : '') + stats.students_growth.toFixed(1) : '0';
      const teachersGrowth = stats.teachers_growth ? (stats.teachers_growth > 0 ? '+' : '') + stats.teachers_growth.toFixed(1) : '0';
      const classesGrowth = stats.classes_growth ? (stats.classes_growth > 0 ? '+' : '') + stats.classes_growth.toFixed(1) : '0';
      
      el('aaStudentsGrowth').textContent = studentsGrowth + '%';
      el('aaTeachersGrowth').textContent = teachersGrowth + '%';
      el('aaClassesGrowth').textContent = classesGrowth + '%';

      // Chart 1: Enrollment Trend
      let enrollmentData = null;
      if(stats && stats.enrollment_trend && Array.isArray(stats.enrollment_trend)) {
        enrollmentData = stats.enrollment_trend;
      }

      // Chart 2: Program Performance
      let programData = null;

      if(stats && stats.course_distribution && !Array.isArray(stats.course_distribution)) {
        programData = {
          labels: stats.course_distribution.labels || [],
          values: stats.course_distribution.data || []
        };
      }

      // Chart 3: Attendance
      renderAttendanceStats(stats);

      // Chart 4: Teacher Performance (simulated from class data)
      let teacherData = null;
      if(stats && stats.courses && Array.isArray(stats.courses) && stats.courses.length > 0) {
        const teacherMap = {};
        stats.courses.forEach(course => {
          const teacherName = course.teacher_name || 'Unknown';
          if(!teacherMap[teacherName]) {
            teacherMap[teacherName] = [];
          }
          teacherMap[teacherName].push(parseFloat(course.average_score || 0));
        });

        // Get top 5 teachers
        const topTeachers = Object.entries(teacherMap)
          .map(([name, scores]) => ({
            name: name.length > 20 ? name.substring(0, 17) + '...' : name,
            avg: scores.reduce((a, b) => a + b, 0) / scores.length
          }))
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 5);

        if(topTeachers.length > 0) {
          teacherData = {
            labels: topTeachers.map(t => t.name),
            values: topTeachers.map(t => t.avg)
          };
        }
      } else {
        console.warn('No courses array in stats; skipping teacher and class charts.');
      }

      // Chart 5: Class Comparison
      let classData = null;
      if(stats && stats.courses && Array.isArray(stats.courses)) {
        const classList = stats.courses.slice(0, 8).map(c => ({
          name: c.class_name || 'Unknown',
          score: parseFloat(c.average_score || 0)
        }));

        if(classList.length > 0) {
          classData = {
            labels: classList.map(c => c.name),
            datasets: [{
              label: 'Average Score',
              data: classList.map(c => c.score),
              backgroundColor: 'rgba(99, 102, 241, 0.8)',
              borderColor: '#6366f1',
              borderWidth: 1
            }]
          };
        }
      }

      // Render all charts
      renderEnrollmentTrend(enrollmentCtx, enrollmentData);
      renderProgramPerformance(programCtx, programData);
      renderTeacherPerformance(teacherCtx, teacherData);
      renderClassComparison(classCtx, classData);

      if(window.showToast) window.showToast('Analytics loaded', 'success');
    }catch(err){
      console.error('Analytics Error:', err);
      renderEnrollmentTrend(enrollmentCtx, null);
      renderProgramPerformance(programCtx, null);
      renderTeacherPerformance(teacherCtx, null);
      renderClassComparison(classCtx, null);
      renderAttendanceStats({});
      if(window.showToast) window.showToast('Failed to load analytics.', 'warning');
    }
  }

  async function populateFilters(){
    try{
      const aaYear = el('aaAcademicYear');
      const aaSem = el('aaSemester');
      const aaProg = el('aaProgram');
      if(!aaYear || !aaSem || !aaProg) return;

      // keep the first placeholder option, clear others
      while(aaYear.options.length > 1) aaYear.remove(1);
      while(aaSem.options.length > 1) aaSem.remove(1);
      while(aaProg.options.length > 1) aaProg.remove(1);

      // Helper to append options safely
      const appendOptions = (selectEl, items, valueField, labelField) => {
        // accept either an array or an object with `data` array
        const list = Array.isArray(items) ? items : (items && Array.isArray(items.data) ? items.data : null);
        if(!Array.isArray(list) || list.length === 0) return;

        list.forEach(item => {
          const opt = document.createElement('option');
          opt.value = item[valueField] || item.id || '';
          opt.textContent = item[labelField] || item.name || item.label || '';
          selectEl.appendChild(opt);
        });
      };

      // Use centralized API wrappers defined in assets/js/api.js
      try{
        const [yearsRes, semRes, subjRes] = await Promise.all([
          (typeof AcademicYearAPI !== 'undefined' && AcademicYearAPI.getAll) ? AcademicYearAPI.getAll() : API.get(API_ENDPOINTS.ACADEMIC_YEARS),
          (typeof SemesterAPI !== 'undefined' && SemesterAPI.getAll) ? SemesterAPI.getAll() : API.get(API_ENDPOINTS.SEMESTERS),
          (typeof SubjectAPI !== 'undefined' && SubjectAPI.getAll) ? SubjectAPI.getAll() : API.get(API_ENDPOINTS.SUBJECTS)
        ]);

        const years = (yearsRes && yearsRes.data) || (Array.isArray(yearsRes) ? yearsRes : []);
        const sems = (semRes && semRes.data) || (Array.isArray(semRes) ? semRes : []);
        const progs = (subjRes && subjRes.data) || (Array.isArray(subjRes) ? subjRes : []);


        appendOptions(aaYear, years, 'academic_year_id', 'year_name');
        appendOptions(aaSem, sems, 'semester_id', 'semester_name');
        appendOptions(aaProg, progs, 'subject_id', 'subject_name');
      }catch(err){
        console.warn('Failed to populate filters via API wrappers:', err);
      }

    }catch(err){
      console.warn('Filter population failed:', err);
    }
  }

  function setupFilterListeners(){
    const aaYear = el('aaAcademicYear');
    const aaSem = el('aaSemester');
    const aaProg = el('aaProgram');

    const handleFilterChange = () => {
      scheduleInit();
    };

    if(aaYear) aaYear.addEventListener('change', handleFilterChange);
    if(aaSem) aaSem.addEventListener('change', handleFilterChange);
    if(aaProg) aaProg.addEventListener('change', handleFilterChange);
  }

  function scheduleInit(){
    setTimeout(initCharts, 50);
  }

  async function init(){
    await populateFilters();
    setupFilterListeners();
    scheduleInit();
  }

  // Refresh handler
  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'aaRefresh'){
      scheduleInit();
    }
  });

  document.addEventListener('page:loaded', function(e){
    if(e && e.detail && e.detail.page === 'analytics'){
      init();
    }
  });

  window.addEventListener('pageshow', function(){
    if(window.location.hash === '#analytics'){
      scheduleInit();
    }
  });

  // Init on load if page present
  init();
})();

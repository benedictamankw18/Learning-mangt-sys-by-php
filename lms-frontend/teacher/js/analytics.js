(function(){
  'use strict';

  // Singleton guard: prevent duplicate initialization
  if(window.__teacherAnalyticsLoaded) return;
  window.__teacherAnalyticsLoaded = true;

  function el(id){ return document.getElementById(id); }

  const State = { charts: {} };

  async function fetchStats(){
    try{
      if(typeof DashboardAPI === 'undefined') throw new Error('DashboardAPI not available');
      return await DashboardAPI.getTeacherStats();
    }catch(err){
      console.warn('Failed to fetch teacher stats:', err);
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
    // fallback: return zeros of requested length
    return new Array(length).fill(0);
  }

  function renderClassPerformance(ctx, data){
    if(!ctx) return;
    destroyChart('classPerformance');
    const labels = (data && data.labels) || [];
    const values = (data && data.values) || safeNumberArray([], labels.length);

    State.charts.classPerformance = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets:[{ label: 'Average %', data: values, backgroundColor: 'rgba(59,130,246,0.7)' }] },
      options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true, max:100 } } }
    });
  }

  function renderSubjectTrends(ctx, data){
    if(!ctx) return;
    destroyChart('subjectTrends');
    const labels = (data && data.labels) || [];
    const datasets = (data && data.datasets) || [{ label:'Subject', data:safeNumberArray([], labels.length), borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,0.06)', tension:0.2 }];

    State.charts.subjectTrends = new Chart(ctx, { type:'line', data:{ labels, datasets }, options:{ responsive:true, maintainAspectRatio:false } });
  }

  function renderStudentProgress(ctx, data){
    if(!ctx) return;
    destroyChart('studentProgress');
    const labels = (data && data.labels) || [];
    const datasets = (data && data.datasets) || [{ label:'Progress', data:safeNumberArray([], labels.length), backgroundColor:'rgba(124,58,237,0.12)', borderColor:'#7c3aed' }];

    State.charts.studentProgress = new Chart(ctx, { type:'radar', data:{ labels, datasets }, options:{ responsive:true, maintainAspectRatio:false, scales:{ r:{ beginAtZero:true, max:100 } } } });
  }

  function renderSubmissionRate(data){
    const container = el('submissionRateContainer');
    if(!container) return;
    
    // Calculate submission rate
    const totalAssignments = data && data.total_assignments ? parseInt(data.total_assignments) : 0;
    const submitted = data && data.submitted_count ? parseInt(data.submitted_count) : 0;
    const pending = data && data.pending_count ? parseInt(data.pending_count) : 0;
    const overdue = data && data.overdue_count ? parseInt(data.overdue_count) : 0;
    
    const submissionRatePct = totalAssignments > 0 ? Math.round((submitted / totalAssignments) * 100) : 0;
    
    // Determine alert color based on submission rate
    let alertColor = '#10b981'; // green: >= 75%
    let alertBgColor = 'rgba(16, 185, 129, 0.1)';
    let alertText = 'On Track';
    if (submissionRatePct < 60) {
      alertColor = '#ef4444'; // red: < 60%
      alertBgColor = 'rgba(239, 68, 68, 0.1)';
      alertText = 'At Risk';
    } else if (submissionRatePct < 75) {
      alertColor = '#f59e0b'; // yellow: 60-74%
      alertBgColor = 'rgba(245, 158, 11, 0.1)';
      alertText = 'Needs Attention';
    }
    
    // Build HTML with metrics cards
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        <div style="background: #f8fafc; border-radius: 8px; padding: 12px; text-align: center; border-left: 3px solid #3b82f6;">
          <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">Submission Rate</div>
          <div style="font-size: 1.5rem; font-weight: bold; color: #1e293b;">${submissionRatePct}%</div>
        </div>
        <div style="background: ${alertBgColor}; border-radius: 8px; padding: 12px; text-align: center; border-left: 3px solid ${alertColor};">
          <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">Status</div>
          <div style="font-size: 1rem; font-weight: bold; color: ${alertColor};">${alertText}</div>
        </div>
        <div style="background: #f8fafc; border-radius: 8px; padding: 12px; text-align: center; border-left: 3px solid #8b5cf6;">
          <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">Submitted</div>
          <div style="font-size: 1.25rem; font-weight: bold; color: #1e293b;">${submitted} / ${totalAssignments}</div>
        </div>
        <div style="background: #f8fafc; border-radius: 8px; padding: 12px; text-align: center; border-left: 3px solid #f59e0b;">
          <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 4px;">Pending</div>
          <div style="font-size: 1.25rem; font-weight: bold; color: #1e293b;">${pending}</div>
        </div>
      </div>
    `;
  }

  async function initCharts(){
    const root = el('teacherAnalyticsRoot');
    if(!root) return;

    const classCtx = el('analyticsClassPerformanceChart')?.getContext('2d');
    const subjectCtx = el('subjectTrendsChart')?.getContext('2d');
    const studentCtx = el('studentProgressChart')?.getContext('2d');

    // show loading state
    if(window.showToast) window.showToast('Loading analytics...', 'info');

    try{
      const response = await fetchStats();
      // Extract actual data from API wrapper: { success, message, data: {...}, timestamp }
      const stats = response && response.data ? response.data : response;
      
      // Map backend response to chart format
      // Backend returns: { class_performance: { labels, data }, courses: [...], ... }
      
      // Chart 1: Class Performance (use backend data as-is, just map 'data' to 'values')
      const classData = (stats && stats.class_performance) ? {
        labels: stats.class_performance.labels || [],
        values: stats.class_performance.data || []
      } : null;

      // Chart 2: Subject Trends (derive from courses data if available)
      let subjectData = null;
      if (stats && stats.courses && Array.isArray(stats.courses)) {
        const subjectMap = {};
        stats.courses.forEach(course => {
          const subjectName = course.subject_name || 'Unknown';
          if (!subjectMap[subjectName]) {
            subjectMap[subjectName] = [];
          }
          // Collect average scores or enrollment counts as trend data
          const score = parseFloat(course.average_score || 0);
          subjectMap[subjectName].push(score);
        });

        const labels = Object.keys(subjectMap);
        const datasets = labels.map((subject, idx) => {
          const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
          const color = colors[idx % colors.length];
          const avg = subjectMap[subject];
          const avgScore = avg.length > 0 ? (avg.reduce((a, b) => a + b, 0) / avg.length) : 0;
          return {
            label: subject,
            data: [avgScore],
            borderColor: color,
            backgroundColor: color.replace(/[^,]+\)/, '0.1)'),
            tension: 0.2
          };
        });

        subjectData = { labels: ['Average'], datasets };
      }

      // Chart 3: Student Progress (use pending data as proxy)
      let studentData = null;
      if (stats && stats.pending_submissions !== undefined) {
        studentData = {
          labels: ['Pending', 'Graded', 'Active'],
          datasets: [{
            label: 'Submissions',
            data: [
              stats.pending_submissions || 0,
              stats.total_students ? Math.max(0, (stats.total_students * 0.6)) : 0,
              stats.active_assignments || 0
            ],
            backgroundColor: 'rgba(124,58,237,0.12)',
            borderColor: '#7c3aed'
          }]
        };
      }

      // Card 4: Submission Rate
      const submissionRateData = (stats && stats.active_assignments !== undefined && stats.pending_submissions !== undefined) ? {
        total_assignments: stats.active_assignments || 0,
        submitted_count: Math.max(0, (stats.active_assignments || 0) - (stats.pending_submissions || 0)),
        pending_count: stats.pending_submissions || 0,
        overdue_count: 0 // can be enhanced with backend data
      } : null;
      
      renderClassPerformance(classCtx, classData);
      renderSubjectTrends(subjectCtx, subjectData);
      renderStudentProgress(studentCtx, studentData);
      if(submissionRateData) renderSubmissionRate(submissionRateData);
      
      if(window.showToast) window.showToast('Analytics loaded', 'success');
    }catch(err){
      // On error, render fallback empty charts and notify user
      renderClassPerformance(classCtx, null);
      renderSubjectTrends(subjectCtx, null);
      renderStudentProgress(studentCtx, null);
      renderSubmissionRate({ total_assignments: 0, submitted_count: 0, pending_count: 0 });
      if(window.showToast) window.showToast('Failed to load analytics.', 'warning');
    }
  }

  function scheduleInit(){
    setTimeout(initCharts, 50);
  }

  // Refresh handler
  document.addEventListener('click', function(e){
    if(e.target && e.target.id === 'taRefresh'){
      scheduleInit();
    }
  });

  document.addEventListener('page:loaded', function(e){
    if(e && e.detail && e.detail.page === 'analytics'){
      scheduleInit();
    }
  });

  window.addEventListener('pageshow', function(){
    if(window.location.hash === '#analytics'){
      scheduleInit();
    }
  });

  // Init on load if page present
  scheduleInit();
})();

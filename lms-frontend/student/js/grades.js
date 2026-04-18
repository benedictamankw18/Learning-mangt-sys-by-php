/* ============================================
   Student Grades Page
   SPA fragment: student/page/grades.html
============================================ */
(function () {
  'use strict';

  const STATE = {
    academicYears: [],
    semesters: [],
    currentAcademicYear: null,
    currentSemester: null,
    selectedAcademicYearId: '',
    selectedSemesterId: '',
    reportCard: null,
    transcript: null,
    currentReport: null,
    gradeScales: [],
    trendChart: null,
    inited: false,
  };

  const DOM = {};

  document.addEventListener('DOMContentLoaded', initIfPresent);
  document.addEventListener('page:loaded', function (event) {
    if (event?.detail?.page === 'grades') {
      initIfPresent();
    }
  });

  function initIfPresent() {
    const root = document.getElementById('studentGradesPageRoot');
    if (!root || root.dataset.bound === '1') {
      return;
    }

    root.dataset.bound = '1';
    cacheDom();
    bindEvents();
    loadBootstrapData();
  }

  function cacheDom() {
    DOM.root = document.getElementById('studentGradesPageRoot');
    DOM.academicYear = document.getElementById('sgdAcademicYear');
    DOM.semester = document.getElementById('sgdSemester');
    DOM.refreshBtn = document.getElementById('sgdRefreshBtn');
    DOM.downloadBtn = document.getElementById('sgdDownloadBtn');
    DOM.printBtn = document.getElementById('sgdPrintBtn');
    DOM.status = document.getElementById('sgdStatus');
    DOM.currentTermPill = document.getElementById('sgdCurrentTermPill');
    DOM.averageValue = document.getElementById('sgdAverageValue');
    DOM.averageMeta = document.getElementById('sgdAverageMeta');
    DOM.gradeValue = document.getElementById('sgdGradeValue');
    DOM.gradeMeta = document.getElementById('sgdGradeMeta');
    DOM.rankValue = document.getElementById('sgdRankValue');
    DOM.rankMeta = document.getElementById('sgdRankMeta');
    DOM.subjectsValue = document.getElementById('sgdSubjectsValue');
    DOM.subjectsMeta = document.getElementById('sgdSubjectsMeta');
    DOM.attendanceValue = document.getElementById('sgdAttendanceValue');
    DOM.attendanceMeta = document.getElementById('sgdAttendanceMeta');
    DOM.statusValue = document.getElementById('sgdStatusValue');
    DOM.statusMeta = document.getElementById('sgdStatusMeta');
    DOM.subjectCountBadge = document.getElementById('sgdSubjectCountBadge');
    DOM.subjectTableBody = document.getElementById('sgdSubjectTableBody');
    DOM.transcriptBody = document.getElementById('sgdTranscriptBody');
    DOM.transcriptSummary = document.getElementById('sgdTranscriptSummary');
    DOM.gradeScale = document.getElementById('sgdGradeScale');
    DOM.trendChart = document.getElementById('sgdTrendChart');
  }

  function bindEvents() {
    DOM.academicYear?.addEventListener('change', function () {
      STATE.selectedAcademicYearId = String(this.value || '');
      populateSemesterOptions();
      STATE.selectedSemesterId = String(DOM.semester?.value || '');
      loadReportData();
    });

    DOM.semester?.addEventListener('change', function () {
      STATE.selectedSemesterId = String(this.value || '');
      loadReportData();
    });

    DOM.refreshBtn?.addEventListener('click', function () {
      loadBootstrapData(true);
    });

    DOM.downloadBtn?.addEventListener('click', downloadReportCard);
    DOM.printBtn?.addEventListener('click', printReportCard);

    DOM.transcriptBody?.addEventListener('click', function (event) {
      const button = event.target.closest('[data-action="term"]');
      if (!button) return;
      const yearId = String(button.getAttribute('data-year') || '');
      const semesterId = String(button.getAttribute('data-semester') || '');
      if (!yearId || !semesterId) return;
      if (DOM.academicYear) DOM.academicYear.value = yearId;
      STATE.selectedAcademicYearId = yearId;
      populateSemesterOptions();
      if (DOM.semester) DOM.semester.value = semesterId;
      STATE.selectedSemesterId = semesterId;
      loadReportData();
    });
  }

  async function loadBootstrapData(forceReload) {
    showStatus('Loading your grade data...', 'info');
    setLoadingState(true);

    try {
      const [yearListRes, currentYearRes, semesterListRes, currentSemesterRes, gradeScaleRes] = await Promise.all([
        API.get(API_ENDPOINTS.ACADEMIC_YEARS).catch(function () { return null; }),
        API.get(API_ENDPOINTS.ACADEMIC_YEAR_CURRENT).catch(function () { return null; }),
        API.get(API_ENDPOINTS.SEMESTERS).catch(function () { return null; }),
        API.get(API_ENDPOINTS.SEMESTER_CURRENT).catch(function () { return null; }),
        (typeof GradeScaleAPI !== 'undefined' && GradeScaleAPI?.getAll
          ? GradeScaleAPI.getAll()
          : API.get(API_ENDPOINTS.GRADE_SCALES)
        ).catch(function () { return null; }),
      ]);

      STATE.academicYears = normalizeList(yearListRes, ['academic_years', 'data', 'items']);
      STATE.semesters = normalizeList(semesterListRes, ['semesters', 'data', 'items']);
      STATE.currentAcademicYear = unwrapSingle(currentYearRes);
      STATE.currentSemester = unwrapSingle(currentSemesterRes);
      STATE.gradeScales = resolveActiveGradeScaleRows(gradeScaleRes);

      if (!STATE.selectedAcademicYearId) {
        STATE.selectedAcademicYearId = String(STATE.currentAcademicYear?.academic_year_id || STATE.currentAcademicYear?.id || getFirstId(STATE.academicYears, 'academic_year_id') || getFirstId(STATE.academicYears, 'id') || '');
      }

      if (!STATE.selectedSemesterId) {
        STATE.selectedSemesterId = String(STATE.currentSemester?.semester_id || STATE.currentSemester?.id || '');
      }

      populateAcademicYearOptions();
      populateSemesterOptions();

      syncSelectValues();
      renderScaleReference();
      await loadReportData(forceReload);
    } catch (error) {
      console.error('Failed to load grade bootstrap data', error);
      showStatus(error?.message || 'Failed to load grade data.', 'error');
      renderEmptyState();
    } finally {
      setLoadingState(false);
    }
  }

  function populateAcademicYearOptions() {
    if (!DOM.academicYear) return;

    const currentValue = String(DOM.academicYear.value || STATE.selectedAcademicYearId || '');
    const years = STATE.academicYears.slice();
    const items = years.length
      ? years
      : (STATE.currentAcademicYear ? [STATE.currentAcademicYear] : []);

    const html = ['<option value="">Select academic year</option>'];
    items.forEach(function (row) {
      const id = String(row?.academic_year_id || row?.id || '');
      if (!id) return;
      const label = String(row?.year_name || row?.name || row?.title || `Academic Year ${id}`);
      html.push('<option value="' + esc(id) + '">' + esc(label) + '</option>');
    });
    DOM.academicYear.innerHTML = html.join('');
    if (currentValue) {
      DOM.academicYear.value = currentValue;
    }
  }

  function filteredSemesters() {
    const academicYearId = String(STATE.selectedAcademicYearId || '');
    const rows = STATE.semesters.slice();
    if (!academicYearId) return rows;

    return rows.filter(function (row) {
      const rowYearId = String(row?.academic_year_id || row?.academicYearId || row?.academic_year?.academic_year_id || '');
      return rowYearId === academicYearId;
    });
  }

  function populateSemesterOptions() {
    if (!DOM.semester) return;

    const currentValue = String(DOM.semester.value || STATE.selectedSemesterId || '');
    const rows = filteredSemesters();
    const items = rows.length ? rows : (STATE.currentSemester ? [STATE.currentSemester] : []);

    const html = ['<option value="">Select semester</option>'];
    items.forEach(function (row) {
      const id = String(row?.semester_id || row?.id || '');
      if (!id) return;
      const label = String(row?.semester_name || row?.name || row?.title || `Semester ${id}`);
      html.push('<option value="' + esc(id) + '">' + esc(label) + '</option>');
    });

    DOM.semester.innerHTML = html.join('');
    if (currentValue) {
      const hasMatch = Array.from(DOM.semester.options).some(function (option) {
        return option.value === currentValue;
      });
      if (hasMatch) {
        DOM.semester.value = currentValue;
        STATE.selectedSemesterId = currentValue;
        return;
      }
    }

    const firstAvailable = rows.length
      ? String(rows[0]?.semester_id || rows[0]?.id || '')
      : '';

    DOM.semester.value = firstAvailable;
    STATE.selectedSemesterId = firstAvailable;
  }

  function syncSelectValues() {
    if (DOM.academicYear && STATE.selectedAcademicYearId) {
      DOM.academicYear.value = STATE.selectedAcademicYearId;
    }
    if (DOM.semester && STATE.selectedSemesterId) {
      DOM.semester.value = STATE.selectedSemesterId;
    }
  }

  async function loadReportData(forceReload) {
    const studentId = getStudentId();
    if (!studentId) {
      showStatus('Unable to identify your student profile. Please refresh the page.', 'error');
      renderEmptyState();
      return;
    }

    const academicYearId = String(STATE.selectedAcademicYearId || DOM.academicYear?.value || '');
    const semesterId = String(STATE.selectedSemesterId || DOM.semester?.value || '');

    if (!academicYearId || !semesterId) {
      showStatus('Select an academic year and semester to view grades.', 'info');
      renderEmptyState();
      return;
    }

    showStatus('Loading report card and transcript...', 'info');
    setSectionLoading(true);

    try {
      const params = {
        academic_year_id: academicYearId,
        semester_id: semesterId,
      };

      const [reportRes, transcriptRes] = await Promise.all([
        GradeReportAPI.getReportCard(studentId, params).catch(function () { return null; }),
        GradeReportAPI.getTranscript(studentId, { all_terms: 1 }).catch(function () { return null; }),
      ]);

      STATE.reportCard = unwrapSingle(reportRes);
      STATE.transcript = unwrapSingle(transcriptRes);
      STATE.currentReport = resolveCurrentReport();

      renderCurrentReport();
      renderTranscript();
      renderTrendChart();
      renderHeaderPill();
      showStatus(forceReload ? 'Grade data refreshed.' : 'Grade data loaded successfully.', 'success');
    } catch (error) {
      console.error('Failed to load grades', error);
      showStatus(error?.message || 'Failed to load grade data.', 'error');
      renderEmptyState();
    } finally {
      setSectionLoading(false);
    }
  }

  function resolveCurrentReport() {
    const currentYearId = String(STATE.selectedAcademicYearId || '');
    const currentSemesterId = String(STATE.selectedSemesterId || '');

    const fromReportCard = STATE.reportCard && typeof STATE.reportCard === 'object'
      ? STATE.reportCard
      : null;

    if (fromReportCard && reportMatchesSelection(fromReportCard, currentYearId, currentSemesterId)) {
      return fromReportCard;
    }

    const transcriptReports = Array.isArray(STATE.transcript?.reports) ? STATE.transcript.reports : [];
    const match = transcriptReports.find(function (row) {
      return reportMatchesSelection(row, currentYearId, currentSemesterId);
    });

    return match || null;
  }

  function renderHeaderPill() {
    if (!DOM.currentTermPill) return;
    const yearName = getSelectedAcademicYearLabel();
    const semesterName = getSelectedSemesterLabel();
    DOM.currentTermPill.innerHTML = '<i class="fas fa-calendar-check"></i><span>'
      + esc(yearName || 'Academic Year') + ' • ' + esc(semesterName || 'Semester') + '</span>';
  }

  function renderCurrentReport() {
    const report = STATE.currentReport;
    
    // Only display if report is published
    const isPublished = isReportPublished(report);
    if (!isPublished) {
      renderEmptyState();
      return;
    }
    
    const details = getReportDetails(report);
    const summary = summarizeDetails(details);
    const average = getCurrentAverage(report, details);
    const overallGrade = getCurrentGrade(report, average, details);
    const overallGradePoint = getCurrentGradePoint(report, average, details);
    const rank = report?.class_rank ?? report?.rank ?? null;
    const attendance = toNumber(report?.attendance_percentage, null);
    const status = getReportStatus(report);

    updateMetric(DOM.averageValue, average != null ? formatPct(average) : 'N/A');
    updateMetric(DOM.averageMeta, report ? 'Based on current term result' : 'No report found for selected term');
    updateMetric(DOM.gradeValue, overallGrade || 'N/A');
    updateMetric(DOM.gradeMeta, overallGradePoint != null ? 'Grade point ' + overallGradePoint.toFixed(2) : 'From the active grade scale');
    updateMetric(DOM.rankValue, rank ? '#' + rank : 'Not set');
    updateMetric(DOM.rankMeta, rank ? 'Class ranking is enabled' : 'Class ranking not available yet');
    updateMetric(DOM.subjectsValue, String(summary.count));
    updateMetric(DOM.subjectsMeta, summary.count ? 'Subjects in the current report' : 'No subject rows available');
    updateMetric(DOM.attendanceValue, attendance != null ? formatPct(attendance) : 'N/A');
    updateMetric(DOM.attendanceMeta, attendance != null ? 'Attendance computed from report data' : 'Attendance unavailable');
    updateMetric(DOM.statusValue, status.label);
    updateMetric(DOM.statusMeta, status.hint);

    if (DOM.subjectCountBadge) {
      DOM.subjectCountBadge.textContent = summary.count + ' subject' + (summary.count === 1 ? '' : 's');
    }

    if (!DOM.subjectTableBody) return;

    if (!details.length) {
      DOM.subjectTableBody.innerHTML = '<tr><td colspan="5"><div class="sgd-empty">No subject grades found for this term.</div></td></tr>';
      return;
    }

    DOM.subjectTableBody.innerHTML = details.map(function (row) {
      const score = toNumber(row?.total_score ?? row?.score ?? row?.marks ?? row?.mark, null);
      const percentage = toNumber(row?.percentage ?? row?.average_percentage, null);
      const grade = getRowGrade(row, percentage);
      const remark = String(row?.remarks || row?.grade_description || gradeDescription(grade) || '—');
      const subject = String(row?.subject_name || row?.subject_code || row?.name || 'Subject');

      return '<tr>'
        + '<td>' + esc(subject) + '</td>'
        + '<td>' + esc(score != null ? score.toFixed(2) : 'N/A') + '</td>'
        + '<td>' + esc(percentage != null ? formatPct(percentage) : 'N/A') + '</td>'
        + '<td><span class="sgd-badge ' + esc(gradeClass(grade)) + '">' + esc(grade) + '</span></td>'
        + '<td>' + esc(remark) + '</td>'
        + '</tr>';
    }).join('');

      updateExportActionAvailability();
  }

  function renderTranscript() {
    const transcript = STATE.transcript;
    const reports = Array.isArray(transcript?.reports) ? transcript.reports.slice() : [];
    const student = transcript?.student || STATE.currentReport?.student || null;

    if (DOM.transcriptSummary) {
      const studentName = student ? String(student.student_name || student.name || '') : '';
      const className = student ? String(student.class_name || '') : '';
      const programName = student ? String(student.program_name || '') : '';
      DOM.transcriptSummary.textContent = student
        ? [studentName, className, programName].filter(Boolean).join(' • ')
        : 'No transcript available for the selected academic year.';
    }

    if (!DOM.transcriptBody) return;

    if (!reports.length) {
      DOM.transcriptBody.innerHTML = '<tr><td colspan="5"><div class="sgd-empty">No semester history found for this academic year.</div></td></tr>';
      return;
    }

    const sortedReports = reports.sort(function (a, b) {
      const ay = toNumber(a?.academic_year_id, 0);
      const by = toNumber(b?.academic_year_id, 0);
      if (ay !== by) return ay - by;
      const as = toNumber(a?.semester_id, 0);
      const bs = toNumber(b?.semester_id, 0);
      return as - bs;
    });

    // Filter to show only published reports
    const publishedReports = sortedReports.filter(function (report) {
      return Number(report?.is_published ?? report?.published ?? 0) === 1;
    });

    if (!publishedReports.length) {
      DOM.transcriptBody.innerHTML = '<tr><td colspan="5"><div class="sgd-empty">No published semester history found for this academic year.</div></td></tr>';
      return;
    }

    DOM.transcriptBody.innerHTML = publishedReports.map(function (report) {
      const yearLabel = String(report?.academic_year || report?.year_name || getSelectedAcademicYearLabel() || 'Academic Year');
      const semesterLabel = String(report?.semester_name || report?.semester || getSelectedSemesterLabel() || 'Semester');
      const reportDetails = getReportDetails(report);
      const average = getAveragePercentage(report, reportDetails);
      const overallGrade = getCurrentGrade(report, average, reportDetails);
      const rank = report?.class_rank ?? report?.rank ?? '—';
      const status = getReportStatus(report);
      const yearId = String(report?.academic_year_id || '');
      const semesterId = String(report?.semester_id || '');

      return '<tr class="sgd-row-link" data-action="term" data-year="' + esc(yearId) + '" data-semester="' + esc(semesterId) + '">'
        + '<td><strong>' + esc(yearLabel) + '</strong><br><span class="sgd-muted">' + esc(semesterLabel) + '</span></td>'
        + '<td>' + esc(average != null ? formatPct(average) : 'N/A') + '</td>'
        + '<td>' + esc(overallGrade || 'N/A') + '</td>'
        + '<td>' + esc(rank) + '</td>'
        // + '<td><span class="sgd-badge ' + esc(status.cls) + '">' + esc(status.label) + '</span></td>'
        + '</tr>';
    }).join('');
  }

  function renderTrendChart() {
    if (!DOM.trendChart || typeof Chart === 'undefined') return;

    const gradeRows = getTrendGradeScaleRows();
    const reports = Array.isArray(STATE.transcript?.reports) ? STATE.transcript.reports.slice() : [];
    const sorted = reports.sort(function (a, b) {
      const ay = toNumber(a?.academic_year_id, 0);
      const by = toNumber(b?.academic_year_id, 0);
      if (ay !== by) return ay - by;
      return toNumber(a?.semester_id, 0) - toNumber(b?.semester_id, 0);
    });

    const labels = sorted.map(function (report) {
      const yearLabel = String(report?.academic_year || report?.year_name || 'Year');
      const semesterLabel = String(report?.semester_name || report?.semester || 'Semester');
      return yearLabel + ' • ' + semesterLabel;
    });

    const data = sorted.map(function (report) {
      const details = getReportDetails(report);
      const average = getAveragePercentage(report, details);
      const gradePosition = getTrendGradePosition(average, gradeRows);
      return gradePosition != null ? gradePosition : null;
    });

    const maxGradeIndex = gradeRows.length ? gradeRows.length - 1 : 0;

    if (STATE.trendChart) {
      STATE.trendChart.destroy();
      STATE.trendChart = null;
    }

    STATE.trendChart = new Chart(DOM.trendChart.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['No data'],
        datasets: [{
          label: 'Grade',
          data: data.length ? data : [0],
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.18)',
          pointBackgroundColor: '#38bdf8',
          pointRadius: 4,
          tension: 0.35,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: maxGradeIndex,
            ticks: {
              stepSize: 1,
              callback: function (value) {
                return getTrendGradeLabel(value, gradeRows);
              },
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                const gradeLabel = getTrendGradeLabel(context.parsed.y, gradeRows);
                const gradeAverage = getTrendAverageForPosition(context.parsed.y, gradeRows, sorted, context.dataIndex);
                const percentageLabel = gradeAverage != null ? formatPct(gradeAverage) : 'N/A';
                return 'Grade: ' + (gradeLabel || 'N/A') + ' (' + percentageLabel + ')';
              },
            },
          },
        },
      },
    });
  }

  function renderScaleReference() {
    if (!DOM.gradeScale) return;

    if (!STATE.gradeScales.length) {
      DOM.gradeScale.innerHTML = '<div class="sgd-empty">No active grade scale is configured.</div>';
      return;
    }

    DOM.gradeScale.innerHTML = STATE.gradeScales.map(function (row) {
      return '<div class="sgd-scale-row">'
        + '<div><strong>' + esc(formatScore(row.min_score) + ' - ' + formatScore(row.max_score)) + '</strong><br><span class="sgd-muted">' + esc(getScaleLabel(row)) + '</span></div>'
        + '<span class="sgd-badge ' + esc(row.cls) + '">' + esc(row.grade) + '</span>'
        + '</div>';
    }).join('');
  }

  async function downloadReportCard() {
    const report = STATE.currentReport;
    const details = getReportDetails(report);
    if (!isReportPublished(report)) {
      showStatus('Report card is not published yet. Download is only available after publication.', 'error');
      return;
    }
    if (!details.length) {
      showStatus('No report card available for the selected term.', 'error');
      return;
    }

    const jsPdfCtor = getJsPdfCtor();
    if (!jsPdfCtor) {
      showStatus('PDF library unavailable. Use Print instead.', 'info');
      printReportCard();
      return;
    }

    const doc = new jsPdfCtor({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 36;
    const contentWidth = pageWidth - (marginX * 2);

    const schoolName = String(report?.institution_name || 'GHANA SHS Learning Management System').toUpperCase();
    const studentName = formatStudentName(report);
    const yearLabel = getSelectedAcademicYearLabel();
    const semesterLabel = getSelectedSemesterLabel();
    const average = getCurrentAverage(report, details);
    const rank = report?.class_rank ?? report?.rank ?? 'N/A';
    const previous = getPreviousSemesterSummary(report);
    const attendanceOutOf = String(report?.attendance_out_of ?? report?.attendance_total_days ?? 'N/A');
    const attendancePct = report?.attendance_percentage != null ? formatPct(report.attendance_percentage) : 'N/A';
    const aggregateBestSix = getBestSixAggregate(details);
    const groupedDetails = groupDetailsByCore(details);
    const gradeScaleLines = buildGradeScaleLines();
    const totalScore = getTotalSubjectScore(details);
    const logoUrl = resolveMediaUrl(report?.institution_logo);
    const logoDataUrl = await loadImageAsDataUrl(logoUrl);
    const attendanceSummary = getAttendanceSummary(report);
    const attendanceDisplay = attendanceSummary
      ? (attendanceSummary.present + ' out of ' + attendanceSummary.total + ' (' + formatPct(attendanceSummary.percentage) + ')')
      : (attendancePct + ' out of ' + attendanceOutOf);

    // Header band
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 84, 'F');

    // School logo container (top-left)
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(marginX, 14, 54, 54, 4, 4, 'F');
    if (logoDataUrl) {
      const logoFormat = /^data:image\/jpe?g/i.test(logoDataUrl) ? 'JPEG' : 'PNG';
      doc.addImage(logoDataUrl, logoFormat, marginX + 4, 18, 46, 46);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(schoolName, pageWidth / 2, 32, { align: 'center' });
    doc.setFontSize(10);
    doc.text(String(report?.institution_motto || 'Knowledge, Discipline, Excellence'), pageWidth / 2, 48, { align: 'center' });
    doc.text('Website: ' + String(report?.institution_website || 'N/A') + '   |   Email: ' + String(report?.institution_email || 'N/A'), pageWidth / 2, 62, { align: 'center' });
    doc.text('Phone: ' + String(report?.institution_phone || 'N/A') + '   |   Postal: ' + String(report?.institution_postal_code || 'N/A'), pageWidth / 2, 74, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text('STUDENT REPORT CARD', marginX, 110);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('Academic Year: ' + yearLabel + '   |   Semester: ' + semesterLabel, marginX, 126);

    const profileRows = [
      ['Student Name', studentName, 'Student Index', String(report?.student_id_number || report?.student_id || 'N/A')],
      ['Gender', resolveGender(report), 'Class', String(report?.class_name || 'N/A')],
      ['Programme', String(report?.program_name || 'N/A'), 'Level', String(report?.grade_level_name || 'N/A')],
      ['Email', String(report?.email || report?.alternative_email || 'N/A'), 'Phone', String(report?.phone_number || 'N/A')],
      ['Address', formatAddress(report), 'No. on Roll', String(report?.class_roll_count || 'N/A')],
    ];

    const summaryRows = [
      ['Student\'s Average Mark', average != null ? average.toFixed(2) : 'N/A', 'Position in Class', rank ? formatOrdinal(rank) : 'N/A'],
      ['Last Semester Avg', previous ? (previous.average != null ? previous.average.toFixed(2) : 'N/A') : 'N/A', 'Last Semester Position', previous ? (previous.rank ? formatOrdinal(previous.rank) : 'N/A') : 'N/A'],
      ['Total Subjects Score', totalScore != null ? totalScore.toFixed(2) : 'N/A', 'Best Six Aggregate', aggregateBestSix != null ? aggregateBestSix.toFixed(2) : 'N/A'],
      ['Attendance', attendanceDisplay, '', ''],
    ];

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 138,
        head: [['Field', 'Value', 'Field', 'Value']],
        body: profileRows,
        styles: { fontSize: 8.5, cellPadding: 5, textColor: [15, 23, 42] },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        margin: { left: marginX, right: marginX },
        columnStyles: {
          0: { cellWidth: 92, fontStyle: 'bold' },
          1: { cellWidth: 168 },
          2: { cellWidth: 92, fontStyle: 'bold' },
          3: { cellWidth: 168 },
        },
      });

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Summary Metric', 'Value', 'Summary Metric', 'Value']],
        body: summaryRows,
        styles: { fontSize: 8.5, cellPadding: 5 },
        headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255] },
        margin: { left: marginX, right: marginX },
        columnStyles: {
          0: { cellWidth: 120, fontStyle: 'bold' },
          1: { cellWidth: 140 },
          2: { cellWidth: 120, fontStyle: 'bold' },
          3: { cellWidth: 140 },
        },
      });

      const detailRows = [];
      if (groupedDetails.core.length) {
        detailRows.push(['CORE SUBJECTS', '', '', '', '', '', '']);
        groupedDetails.core.forEach(function (row) {
          detailRows.push(buildReportCardTableRow(row));
        });
      }
      if (groupedDetails.elective.length) {
        detailRows.push(['ELECTIVE SUBJECTS', '', '', '', '', '', '']);
        groupedDetails.elective.forEach(function (row) {
          detailRows.push(buildReportCardTableRow(row));
        });
      }

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 12,
        head: [['Subject', 'Total', 'Percentage', 'Class Avg', 'Position', 'Grade', 'Remarks']],
        body: detailRows.length ? detailRows : [['No detail rows available.', '', '', '', '', '', '']],
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255] },
        margin: { left: marginX, right: marginX },
        didParseCell: function (hook) {
          if (hook.section === 'body' && hook.row.raw && (hook.row.raw[0] === 'CORE SUBJECTS' || hook.row.raw[0] === 'ELECTIVE SUBJECTS')) {
            hook.cell.styles.fontStyle = 'bold';
            hook.cell.styles.fillColor = [226, 232, 240];
            if (hook.column.index > 0) {
              hook.cell.text = [''];
            }
          }
        },
      });

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Grade Scale (' + getPrimaryGradeCategoryName() + ')', 'Interpretation']],
        body: gradeScaleLines.length ? gradeScaleLines : [['No active grade scale configured', 'N/A']],
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255] },
        margin: { left: marginX, right: marginX },
      });
    }

    const footerY = doc.internal.pageSize.getHeight() - 16;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.text('Generated on ' + new Date().toLocaleString(), marginX, footerY);
    doc.text('GHANA SHS Learning Management System', pageWidth - marginX, footerY, { align: 'right' });

    doc.save('report-card-' + slugify(studentName) + '-' + String(semesterLabel).replace(/\s+/g, '-').toLowerCase() + '.pdf');
  }

  function printReportCard() {
    const report = STATE.currentReport;
    const details = getReportDetails(report);
    if (!isReportPublished(report)) {
      showStatus('Report card is not published yet. Printing is only available after publication.', 'error');
      return;
    }
    if (!details.length) {
      showStatus('No report card available for the selected term.', 'error');
      return;
    }

    const studentName = formatStudentName(report);
    const yearLabel = getSelectedAcademicYearLabel();
    const semesterLabel = getSelectedSemesterLabel();
    const average = getCurrentAverage(report, details);
    const overallGrade = getCurrentGrade(report, average, details);
    const previous = getPreviousSemesterSummary(report);
    const rank = report?.class_rank ?? report?.rank ?? 'N/A';
    const attendance = report?.attendance_percentage != null ? formatPct(report.attendance_percentage) : 'N/A';
    const attendanceOutOf = String(report?.attendance_out_of ?? report?.attendance_total_days ?? 'N/A');
    const aggregateBestSix = getBestSixAggregate(details);
    const groupedDetails = groupDetailsByCore(details);
    const gradeScaleLines = buildGradeScaleLines();
    const schoolName = String(report?.institution_name || 'GHANA SHS Learning Management System');
    const logoUrl = resolveMediaUrl(report?.institution_logo);

    const buildRows = function (rows) {
      return rows.map(function (row) {
        const score = toNumber(row?.total_score ?? row?.score ?? row?.marks ?? row?.mark, null);
        const percentage = toNumber(row?.percentage ?? row?.average_percentage, null);
        const classAverage = toNumber(row?.class_average ?? row?.class_average_score, null);
        const positionInSubject = toNumber(row?.position_in_subject, null);
        const grade = getRowGrade(row, percentage);
        const remark = String(row?.remarks || row?.grade_description || gradeDescription(grade) || '—');
        return '<tr>'
          + '<td>' + esc(row?.subject_name || row?.subject_code || 'Subject') + '</td>'
          + '<td>' + esc(score != null ? score.toFixed(2) : 'N/A') + '</td>'
          + '<td>' + esc(percentage != null ? formatPct(percentage) : 'N/A') + '</td>'
          + '<td>' + esc(classAverage != null ? classAverage.toFixed(2) : 'N/A') + '</td>'
          + '<td>' + esc(positionInSubject != null ? formatOrdinal(positionInSubject) : 'N/A') + '</td>'
          + '<td>' + esc(grade) + '</td>'
          + '<td>' + esc(remark) + '</td>'
          + '</tr>';
      }).join('');
    };

    const coreRows = buildRows(groupedDetails.core);
    const electiveRows = buildRows(groupedDetails.elective);
    const scaleRows = gradeScaleLines.map(function (line) {
      return '<tr><td>' + esc(line[0]) + '</td><td>' + esc(line[1]) + '</td></tr>';
    }).join('');

    const html = '<!doctype html><html><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width, initial-scale=1">'
      + '<title>Student Report Card</title>'
      + '<style>'
      + 'body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#0f172a;background:#fff;}'
      + '.top{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:10px;}'
      + '.logo{width:80px;height:80px;object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;padding:4px;}'
      + '.school h1{margin:0;font-size:20pt;font-weight:700;letter-spacing:.04em;text-transform:uppercase;}'
      + '.school p{margin:2px 0;font-size:12pt;}'
      + '.report-title{margin:10px 0 8px;font-size:20pt;font-weight:700;}'
      + '.line{border-top:1px solid #0f172a;margin:6px 0 10px;}'
      + '.meta-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 16px;font-size:11pt;margin-bottom:10px;}'
      + '.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px 14px;font-size:11pt;margin:10px 0;}'
      + 'table{width:100%;border-collapse:collapse;margin-top:8px;} th,td{border:1px solid #0f172a;padding:6px 8px;font-size:11pt;text-align:left;vertical-align:top;} th{font-weight:700;background:#f8fafc;}'
      + '.section-row td{font-weight:700;background:#f1f5f9;}'
      + '.totals{margin-top:8px;font-size:11pt;font-weight:700;}'
      + '.attendance{margin-top:8px;font-size:11pt;}'
      + '.scale{margin-top:10px;font-size:11pt;}'
      + '.scale table{margin-top:6px;}'
      + '.scale th,.scale td{font-size:10pt;}'
      + '.scale th{background:#e2e8f0;}'
      + '.footer{margin-top:12px;font-size:10pt;color:#334155;}'
      + '@media print{body{padding:10px;}}'
      + '</style></head><body>'
      + '<div class="top">'
      + (logoUrl ? ('<img class="logo" src="' + esc(logoUrl) + '" alt="School Logo">') : '<div class="logo"></div>')
      + '<div class="school">'
      + '<h1>' + esc(schoolName) + '</h1>'
      + '<p>' + esc(String(report?.institution_motto || 'N/A')) + '</p>'
      + '<p>Website: ' + esc(String(report?.institution_website || 'N/A')) + '</p>'
      + '<p>Email: ' + esc(String(report?.institution_email || 'N/A')) + '</p>'
      + '<p>Phone: ' + esc(String(report?.institution_phone || 'N/A')) + '</p>'
      + '<p>Postal Address: ' + esc(String(report?.institution_postal_code || 'N/A')) + '</p>'
      + '</div></div>'
      + '<div class="report-title">STUDENT\'S REPORT</div><div class="line"></div>'
      + '<div class="meta-grid">'
      + '<div><b>Name:</b> ' + esc(studentName) + '</div>'
      + '<div><b>Gender:</b> ' + esc(resolveGender(report)) + '</div>'
      + '<div><b>Student Index Number:</b> ' + esc(String(report?.student_id_number || report?.student_id || 'N/A')) + '</div>'
      + '<div><b>Class:</b> ' + esc(String(report?.class_name || 'N/A')) + '</div>'
      + '<div><b>Programme:</b> ' + esc(String(report?.program_name || 'N/A')) + '</div>'
      + '<div><b>Academic Year:</b> ' + esc(yearLabel) + '</div>'
      + '<div><b>Semester:</b> ' + esc(semesterLabel) + '</div>'
      + '<div><b>Level:</b> ' + esc(String(report?.grade_level_name || 'N/A')) + '</div>'
      + '<div><b>Email:</b> ' + esc(String(report?.email || report?.alternative_email || 'N/A')) + '</div>'
      + '<div><b>Phone:</b> ' + esc(String(report?.phone_number || 'N/A')) + '</div>'
      + '<div style="grid-column:1 / -1;"><b>Address:</b> ' + esc(formatAddress(report)) + '</div>'
      + '</div>'
      + '<div class="summary-grid">'
      + '<div><b>Student\'s Average Mark:</b> ' + esc(average != null ? average.toFixed(2) : 'N/A') + '</div>'
      + '<div><b>No. On Roll:</b> ' + esc(String(report?.class_roll_count || 'N/A')) + '</div>'
      + '<div><b>Position in Class:</b> ' + esc(rank && rank !== 'N/A' ? formatOrdinal(rank) : 'N/A') + '</div>'
      + '<div><b>Last Semester\'s Average Mark:</b> ' + esc(previous ? (previous.average != null ? previous.average.toFixed(2) : 'N/A') : 'N/A') + '</div>'
      + '<div><b>Last Semester\'s Position in Class:</b> ' + esc(previous ? (previous.rank ? formatOrdinal(previous.rank) : 'N/A') : 'N/A') + '</div>'
      + '<div><b>Overall Grade:</b> ' + esc(overallGrade || 'N/A') + '</div>'
      + '</div>'
      + '<table><thead><tr><th>Subjects</th><th>Total</th><th>Percentage</th><th>Class Average Score in Subject</th><th>Position in Subject</th><th>Grade</th><th>Remarks</th></tr></thead><tbody>'
      + '<tr class="section-row"><td colspan="7">CORE SUBJECTS</td></tr>'
      + (coreRows || '<tr><td colspan="7">No core subjects.</td></tr>')
      + '<tr class="section-row"><td colspan="7">ELECTIVE SUBJECTS</td></tr>'
      + (electiveRows || '<tr><td colspan="7">No elective subjects.</td></tr>')
      + '</tbody></table>'
      + '<div class="totals">TOTAL: ' + esc(getTotalSubjectScore(details) != null ? getTotalSubjectScore(details).toFixed(2) : 'N/A') + ' &nbsp;&nbsp; AGGREGATE OF BEST SIX SUBJECTS: ' + esc(aggregateBestSix != null ? aggregateBestSix.toFixed(2) : 'N/A') + '</div>'
      + '<div class="attendance">Attendance: ' + esc(getAttendanceSummary(report) ? (getAttendanceSummary(report).present + ' out of ' + getAttendanceSummary(report).total + ' (' + formatPct(getAttendanceSummary(report).percentage) + ')') : (attendance + ' out of ' + attendanceOutOf)) + '</div>'
      + '<div class="scale"><b>Grade Scale (' + esc(getPrimaryGradeCategoryName()) + '):</b>'
      + '<table><thead><tr><th>Score Range(Grade)</th><th>Remarks</th></tr></thead><tbody>'
      + (scaleRows || '<tr><td>No active grade scale configured.</td><td>N/A</td></tr>')
      + '</tbody></table></div>'
      + '<div class="footer">Printed on ' + esc(new Date().toLocaleString()) + '</div>'
      + '</body></html>';

    const win = window.open('', '_blank', 'width=1100,height=800');
    if (!win) {
      showStatus('Popup blocked. Please allow popups and try again.', 'error');
      return;
    }

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.onload = function () {
      win.print();
    };
  }

  function formatStudentName(report) {
    const title = String(report?.title?.toUpperCase().concat('.') || '').trim();
    const firstName = String(report?.first_name?.toUpperCase() || '').trim();
    const lastName = String(report?.last_name?.toUpperCase() || '').trim();
    const built = [title, lastName, firstName].filter(Boolean).join(' ').trim();
    if (built) return built;
    return String(report?.student_name || 'Student').trim();
  }

  function resolveGender(report) {
    return String(report?.user_gender?.toUpperCase() || report?.gender?.toUpperCase() || 'N/A');
  }

  function formatAddress(report) {
    const direct = String(report?.address || '').trim();
    const city = String(report?.city || '').trim();
    const region = String(report?.region || '').trim();
    const composed = [direct, city, region].filter(Boolean).join(', ').trim();
    return composed || 'N/A';
  }

  function getPreviousSemesterSummary(currentReport) {
    const reports = Array.isArray(STATE.transcript?.reports) ? STATE.transcript.reports.slice() : [];
    if (!currentReport || !reports.length) return null;

    const currentYearId = String(currentReport?.academic_year_id || STATE.selectedAcademicYearId || '');
    const currentSemesterId = Number(currentReport?.semester_id || STATE.selectedSemesterId || 0);
    if (!currentYearId || !Number.isFinite(currentSemesterId) || currentSemesterId <= 0) return null;

    const previous = reports
      .filter(function (row) {
        return String(row?.academic_year_id || '') === currentYearId
          && Number(row?.semester_id || 0) < currentSemesterId;
      })
      .sort(function (a, b) {
        return Number(b?.semester_id || 0) - Number(a?.semester_id || 0);
      })[0];

    if (!previous) return null;

    const previousAverage = getCurrentAverage(previous, getReportDetails(previous));
    return {
      average: previousAverage,
      rank: previous?.class_rank ?? previous?.rank ?? null,
    };
  }

  function groupDetailsByCore(details) {
    const rows = Array.isArray(details) ? details.slice() : [];
    const grouped = { core: [], elective: [] };

    rows.forEach(function (row) {
      const isCore = Number(row?.is_core ?? row?.subject_is_core ?? 0) === 1;
      if (isCore) {
        grouped.core.push(row);
      } else {
        grouped.elective.push(row);
      }
    });

    return grouped;
  }

  function getBestSixAggregate(details) {
    const rows = Array.isArray(details) ? details.slice() : [];
    const points = rows
      .map(function (row) {
        const score = toNumber(row?.percentage ?? row?.average_percentage, null);
        if (score == null) return null;
        const scale = findScaleByScore(score);
        return toNumber(scale?.grade_point, null);
      })
      .filter(function (value) { return value != null; })
      .sort(function (a, b) { return a - b; })
      .slice(0, 6);

    if (!points.length) return null;
    return points.reduce(function (sum, value) { return sum + value; }, 0);
  }

  function buildReportCardTableRow(row) {
    const score = toNumber(row?.total_score ?? row?.score ?? row?.marks ?? row?.mark, null);
    const percentage = toNumber(row?.percentage ?? row?.average_percentage, null);
    const classAverage = toNumber(row?.class_average, null);
    const positionInSubject = toNumber(row?.position_in_subject, null);
    const grade = getRowGrade(row, percentage);
    const remark = String(row?.remarks || row?.grade_description || gradeDescription(grade) || 'N/A');

    return [
      String(row?.subject_name || row?.subject_code || 'Subject'),
      score != null ? score.toFixed(2) : 'N/A',
      percentage != null ? formatPct(percentage) : 'N/A',
      classAverage != null ? classAverage.toFixed(2) : 'N/A',
      positionInSubject != null ? formatOrdinal(positionInSubject) : 'N/A',
      grade,
      remark,
    ];
  }

  function buildGradeScaleLines() {
    return STATE.gradeScales.map(function (row) {
      const range = formatScore(row.min_score) + ' - ' + formatScore(row.max_score) + ' (' + String(row.grade || 'N/A') + ')';
      return [range, getScaleLabel(row)];
    });
  }

  function getPrimaryGradeCategoryName() {
    if (STATE.gradeScales.length && STATE.gradeScales[0]?.grade_categories_name) {
      return String(STATE.gradeScales[0].grade_categories_name);
    }
    return 'Primary Scale';
  }

  function renderEmptyState() {
    if (DOM.subjectTableBody) {
      DOM.subjectTableBody.innerHTML = '<tr><td colspan="5"><div class="sgd-empty">No grade data available.</div></td></tr>';
    }
    if (DOM.transcriptBody) {
      DOM.transcriptBody.innerHTML = '<tr><td colspan="5"><div class="sgd-empty">No transcript data available.</div></td></tr>';
    }
    if (DOM.transcriptSummary) {
      DOM.transcriptSummary.textContent = 'No transcript available yet.';
    }
    updateMetric(DOM.averageValue, 'N/A');
    updateMetric(DOM.gradeValue, 'N/A');
    updateMetric(DOM.rankValue, 'N/A');
    updateMetric(DOM.subjectsValue, '0');
    updateMetric(DOM.attendanceValue, 'N/A');
    updateMetric(DOM.statusValue, 'N/A');
    updateMetric(DOM.averageMeta, 'No report found for selected term');
    updateMetric(DOM.gradeMeta, 'From the active grade scale');
    updateMetric(DOM.rankMeta, 'Ranking not available');
    updateMetric(DOM.subjectsMeta, 'No subject rows available');
    updateMetric(DOM.attendanceMeta, 'Attendance unavailable');
    updateMetric(DOM.statusMeta, 'Draft / pending / published');
    if (DOM.subjectCountBadge) DOM.subjectCountBadge.textContent = '0 subjects';
    updateExportActionAvailability();
  }

  function renderGradeChartFallback() {
    if (!DOM.trendChart || typeof Chart === 'undefined') return;
    if (STATE.trendChart) {
      STATE.trendChart.destroy();
      STATE.trendChart = null;
    }
    STATE.trendChart = new Chart(DOM.trendChart.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['No data'],
        datasets: [{
          label: 'Average %',
          data: [0],
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.18)',
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });
  }

  function setLoadingState(loading) {
    if (DOM.subjectTableBody) {
      DOM.subjectTableBody.innerHTML = loading
        ? '<tr><td colspan="5"><div class="sgd-loading">Loading grades...</div></td></tr>'
        : DOM.subjectTableBody.innerHTML;
    }
    if (DOM.transcriptBody) {
      DOM.transcriptBody.innerHTML = loading
        ? '<tr><td colspan="5"><div class="sgd-loading">Loading transcript...</div></td></tr>'
        : DOM.transcriptBody.innerHTML;
    }
  }

  function setSectionLoading(loading) {
    if (loading) {
      if (DOM.status) DOM.status.textContent = 'Loading report card and transcript...';
      if (DOM.downloadBtn) DOM.downloadBtn.disabled = true;
      if (DOM.printBtn) DOM.printBtn.disabled = true;
    } else {
      updateExportActionAvailability();
    }
  }

  function updateExportActionAvailability() {
    const report = STATE.currentReport;
    const details = getReportDetails(report);
    const canExport = isReportPublished(report) && details.length > 0;

    if (DOM.downloadBtn) DOM.downloadBtn.disabled = !canExport;
    if (DOM.printBtn) DOM.printBtn.disabled = !canExport;
  }

  function showStatus(message, type) {
    if (DOM.status) {
      DOM.status.textContent = message;
      DOM.status.style.color = type === 'error' ? '#fecaca' : type === 'success' ? '#bbf7d0' : '#cbd5e1';
    }
    if (typeof showToast === 'function' && type && type !== 'info') {
      showToast(message, type);
    }
  }

  function getStudentId() {
    const user = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
    return user?.student_id || user?.id || null;
  }

  function getSelectedAcademicYearLabel() {
    const select = DOM.academicYear;
    if (select && select.selectedIndex >= 0) {
      const option = select.options[select.selectedIndex];
      if (option && option.value) return option.textContent.trim();
    }
    const current = STATE.currentAcademicYear;
    return String(current?.year_name || current?.name || 'Academic Year');
  }

  function getSelectedSemesterLabel() {
    const select = DOM.semester;
    if (select && select.selectedIndex >= 0) {
      const option = select.options[select.selectedIndex];
      if (option && option.value) return option.textContent.trim();
    }
    const current = STATE.currentSemester;
    return String(current?.semester_name || current?.name || 'Semester');
  }

  function getReportDetails(report) {
    if (!report) return [];
    if (Array.isArray(report.details)) return report.details;
    return [];
  }

  function getTrendGradeScaleRows() {
    return STATE.gradeScales.slice().sort(function (a, b) {
      if (a.max_score !== b.max_score) return b.max_score - a.max_score;
      return a.min_score - b.min_score;
    });
  }

  function getTrendGradePosition(average, gradeRows) {
    const score = toNumber(average, null);
    if (score == null || !Array.isArray(gradeRows) || !gradeRows.length) {
      return null;
    }

    const scale = findScaleByScore(score);
    if (!scale) return null;

    const scaleIndex = gradeRows.findIndex(function (row) {
      return String(row.grade || '').toUpperCase() === String(scale.grade || '').toUpperCase()
        && Number(row.min_score) === Number(scale.min_score)
        && Number(row.max_score) === Number(scale.max_score);
    });

    if (scaleIndex < 0) return null;

    return gradeRows.length - 1 - scaleIndex;
  }

  function getTrendGradeLabel(value, gradeRows) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || !Array.isArray(gradeRows) || !gradeRows.length) return 'N/A';

    const position = Math.max(0, Math.min(gradeRows.length - 1, Math.round(numeric)));
    const rowIndex = gradeRows.length - 1 - position;
    const row = gradeRows[rowIndex];
    return row ? String(row.grade || 'N/A').toUpperCase() : 'N/A';
  }

  function getTrendAverageForPosition(value, gradeRows, reports, dataIndex) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;

    const selectedReport = Array.isArray(reports) ? reports[dataIndex] : null;
    if (!selectedReport) return null;

    const details = getReportDetails(selectedReport);
    return getAveragePercentage(selectedReport, details);
  }

  function reportMatchesSelection(report, academicYearId, semesterId) {
    if (!report) return false;

    return String(report?.academic_year_id || '') === String(academicYearId || '')
      && String(report?.semester_id || '') === String(semesterId || '');
  }

  function summarizeDetails(details) {
    const rows = Array.isArray(details) ? details : [];
    if (!rows.length) return { count: 0, average: null, total: null };
    const totals = rows
      .map(function (row) { return toNumber(row?.total_score ?? row?.score, null); })
      .filter(function (value) { return value != null; });
    const totalSum = totals.length ? totals.reduce(function (sum, value) { return sum + value; }, 0) : null;
    const average = totals.length ? totalSum / totals.length : null;
    return { count: rows.length, average: average, total: totalSum };
  }

  function getCurrentAverage(report, details) {
    const reportAverage = toNumber(report?.average_percentage ?? report?.percentage, null);
    if (reportAverage != null) return reportAverage;

    const summaryAverage = summarizeDetails(details).average;
    if (summaryAverage != null) return summaryAverage;

    return null;
  }

  function getAveragePercentage(report, details) {
    const rows = Array.isArray(details) ? details : [];
    const percentages = rows
      .map(function (row) { return toNumber(row?.percentage ?? row?.average_percentage, null); })
      .filter(function (value) { return value != null; });
    if (percentages.length) {
      return percentages.reduce(function (sum, value) { return sum + value; }, 0) / percentages.length;
    }
    return toNumber(report?.average_percentage ?? report?.percentage, null);
  }

  function getGradeComputationScore(report, details, fallbackAverage) {
    const reportAveragePct = toNumber(report?.average_percentage ?? report?.percentage, null);
    if (reportAveragePct != null) return reportAveragePct;

    const rows = Array.isArray(details) ? details : [];
    const percentages = rows
      .map(function (row) { return toNumber(row?.percentage ?? row?.average_percentage, null); })
      .filter(function (value) { return value != null; });
    if (percentages.length) {
      return percentages.reduce(function (sum, value) { return sum + value; }, 0) / percentages.length;
    }

    return toNumber(fallbackAverage, null);
  }

  function getTotalSubjectScore(details) {
    const rows = Array.isArray(details) ? details : [];
    const totals = rows
      .map(function (row) { return toNumber(row?.total_score ?? row?.score, null); })
      .filter(function (value) { return value != null; });
    return totals.length ? totals.reduce(function (sum, value) { return sum + value; }, 0) : null;
  }

  function getAttendanceSummary(report) {
    const presentCount = toNumber(report?.attendance_present_count, null);
    const totalDays = toNumber(report?.attendance_total_days, null);
    const percentage = toNumber(report?.attendance_percentage, null);
    if (presentCount != null && totalDays != null && percentage != null) {
      return { present: presentCount, total: totalDays, percentage: percentage };
    }
    return null;
  }

  function formatOrdinal(num) {
    const n = Number(num);
    if (!Number.isFinite(n)) return String(num);
    if (n === 0) return '0';
    const suffix = ['th', 'st', 'nd', 'rd'][n % 100 > 3 && n % 100 < 21 ? 0 : n % 10 > 3 ? 0 : n % 10];
    return n + suffix;
  }

  function getCurrentGrade(report, average, details) {
    const reportGrade = String(report?.grade || report?.grade_letter || '').trim().toUpperCase();
    if (reportGrade) return reportGrade;

    const gradeScore = getGradeComputationScore(report, details, average);
    if (gradeScore == null) return null;

    const scale = findScaleByScore(gradeScore);
    return scale ? String(scale.grade || '').toUpperCase() : null;
  }

  function getCurrentGradePoint(report, average, details) {
    const reportGradePoint = toNumber(report?.grade_point, null);
    if (reportGradePoint != null) return reportGradePoint;

    const gradeScore = getGradeComputationScore(report, details, average);
    if (gradeScore == null) return null;

    const scale = findScaleByScore(gradeScore);
    return scale ? toNumber(scale.grade_point, null) : null;
  }

  function getRowGrade(row, percentage) {
    const rawGrade = String(row?.grade || row?.grade_letter || '').trim().toUpperCase();
    if (rawGrade) return rawGrade;
    if (percentage == null) return 'N/A';
    return marksToScaleGrade(percentage);
  }

  function gradeDescription(grade) {
    const scale = findScaleByGrade(grade);
    return scale ? getScaleLabel(scale) : '';
  }

  function gradeClass(grade) {
    const scale = findScaleByGrade(grade);
    return scale?.cls || 'neutral';
  }

  function getReportStatus(report) {
    const isPublished = Number(report?.is_published ?? report?.published ?? 0) === 1;
    const statusValue = String(report?.status || '').toLowerCase();
    if (isPublished) {
      return { label: 'Published', hint: 'Visible to students and parents', cls: 'excellent' };
    }
    if (statusValue.includes('approved')) {
      return { label: 'Approved', hint: 'Awaiting publication', cls: 'good' };
    }
    if (statusValue.includes('draft')) {
      return { label: 'Draft', hint: 'Work in progress', cls: 'neutral' };
    }
    if (statusValue.includes('pending')) {
      return { label: 'Pending', hint: 'Awaiting review', cls: 'pass' };
    }
    return { label: report ? 'Complete' : 'N/A', hint: report ? 'Report data loaded' : 'No report found', cls: 'neutral' };
  }

  function isReportPublished(report) {
    return !!report && Number(report?.is_published ?? report?.published ?? 0) === 1;
  }

  function marksToScaleGrade(marks) {
    const score = Number(marks);
    if (!Number.isFinite(score)) return 'N/A';
    const scale = findScaleByScore(score);
    if (scale) return String(scale.grade || '').toUpperCase();
    return 'N/A';
  }

  function resolveActiveGradeScaleRows(response) {
    const rows = normalizeList(response, ['grade_scales', 'data', 'items']);
    if (!rows.length) return [];

    const normalized = rows
      .map(function (row) {
        const min = toNumber(row?.min_score, null);
        const max = toNumber(row?.max_score, null);
        const grade = String(row?.grade || '').trim().toUpperCase();
        if (min == null || max == null || !grade) return null;

        const status = String(row?.Status || row?.status || '').trim().toLowerCase();
        const categoryStatus = String(row?.category_status || '').trim().toLowerCase();
        const interpretation = String(row?.Interpretation || row?.interpretation || '').trim();
        const remark = String(row?.remark || '').trim();
        const point = toNumber(row?.grade_point, null);
        const categoryId = String(row?.grade_categories_id || '');
        const categoryName = String(row?.grade_categories_name || '').trim();
        const isPrimary = Number(row?.set_as_primary || 0) === 1;

        return {
          grade: grade,
          min_score: min,
          max_score: max,
          grade_point: point,
          interpretation: interpretation,
          remark: remark,
          status: status,
          category_status: categoryStatus,
          grade_categories_id: categoryId,
          grade_categories_name: categoryName,
          set_as_primary: isPrimary,
          cls: classifyScaleRow(interpretation, remark),
        };
      })
      .filter(Boolean)
      .filter(function (row) {
        const rowActive = !row.status || row.status === 'active';
        const categoryActive = !row.category_status || row.category_status === 'active';
        return rowActive && categoryActive;
      });

    if (!normalized.length) return [];

    const grouped = normalized.reduce(function (acc, row) {
      const key = row.grade_categories_id || '__uncategorized__';
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    const groups = Object.values(grouped);
    const primaryGroup = groups.find(function (rowsByCategory) {
      return rowsByCategory.some(function (row) { return row.set_as_primary; });
    });
    const selected = primaryGroup
      || groups.sort(function (a, b) { return b.length - a.length; })[0]
      || [];

    return selected.sort(function (a, b) {
      if (a.max_score !== b.max_score) return b.max_score - a.max_score;
      return a.min_score - b.min_score;
    });
  }

  function findScaleByScore(score) {
    if (!Number.isFinite(score)) return null;
    return STATE.gradeScales.find(function (row) {
      return score >= row.min_score && score <= row.max_score;
    }) || null;
  }

  function findScaleByGrade(grade) {
    const key = String(grade || '').trim().toUpperCase();
    if (!key) return null;
    return STATE.gradeScales.find(function (row) {
      return String(row.grade || '').toUpperCase() === key;
    }) || null;
  }

  function getScaleLabel(row) {
    const interpretation = String(row?.interpretation || '').trim();
    if (interpretation) return interpretation;
    const remark = String(row?.remark || '').trim();
    if (remark) return remark;
    return 'Grade band';
  }

  function getScalePointLabel(row) {
    const point = toNumber(row?.grade_point, null);
    return point != null ? point.toFixed(2) : 'N/A';
  }

  function classifyScaleRow(interpretation, remark) {
    const text = (String(interpretation || '') + ' ' + String(remark || '')).toLowerCase();
    if (text.includes('fail')) return 'fail';
    if (text.includes('excellent') || text.includes('outstanding')) return 'excellent';
    if (text.includes('very good') || text.includes('good') || text.includes('credit')) return 'good';
    if (text.includes('pass')) return 'pass';
    return 'neutral';
  }

  function getJsPdfCtor() {
    if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
    if (typeof jsPDF !== 'undefined') return jsPDF;
    return null;
  }

  function normalizeList(response, keys) {
    const list = unwrapList(response, keys);
    return Array.isArray(list) ? list : [];
  }

  function unwrapList(response, keys) {
    if (!response) return [];
    const base = response?.data && typeof response.data === 'object' ? response.data : response;
    if (Array.isArray(base)) return base;
    if (Array.isArray(response)) return response;
    for (const key of keys || []) {
      if (Array.isArray(base?.[key])) return base[key];
      if (Array.isArray(response?.[key])) return response[key];
    }
    return [];
  }

  function unwrapSingle(response) {
    if (!response) return null;
    if (response?.data && typeof response.data === 'object' && !Array.isArray(response.data)) return response.data;
    if (response?.result && typeof response.result === 'object' && !Array.isArray(response.result)) return response.result;
    if (typeof response === 'object' && !Array.isArray(response)) return response;
    return null;
  }

  function getFirstId(rows, key) {
    const first = Array.isArray(rows) && rows.length ? rows[0] : null;
    return first ? first[key] : '';
  }

  function toNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function formatPct(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'N/A';
    return n.toFixed(2).replace(/\.00$/, '') + '%';
  }

  function formatScore(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 'N/A';
    return n.toFixed(2).replace(/\.00$/, '');
  }

  function getApiBase() {
    return (typeof API_BASE_URL !== 'undefined' ? String(API_BASE_URL || '') : '').replace(/\/$/, '');
  }

  function resolveMediaUrl(rawUrl) {
    const input = String(rawUrl || '').trim();
    if (!input) return '';

    const apiBase = getApiBase();

    if (/^https?:\/\//i.test(input)) {
      if (apiBase && /\/uploads\//i.test(input) && input.indexOf(apiBase) !== 0) {
        const match = input.match(/\/uploads\/.+$/i);
        if (match && match[0]) return apiBase + match[0];
      }
      return input;
    }

    if (input.charAt(0) === '/') {
      return apiBase ? (apiBase + input) : input;
    }

    return apiBase ? (apiBase + '/' + input.replace(/^\/+/, '')) : input;
  }

  function loadImageAsDataUrl(url) {
    const source = String(url || '').trim();
    if (!source) return Promise.resolve(null);

    return new Promise(function (resolve) {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = function () {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth || image.width;
          canvas.height = image.naturalHeight || image.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(image, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          resolve(null);
        }
      };
      image.onerror = function () {
        resolve(null);
      };
      image.src = source;
    });
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function updateMetric(node, value) {
    if (node) node.textContent = value;
  }

  function slugify(value) {
    return String(value || 'report-card')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'report-card';
  }
})();

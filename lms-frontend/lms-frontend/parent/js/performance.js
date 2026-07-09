(function () {
  'use strict';

  const S = {
    children: [],
    recentAccess: [],
    selectedChildId: null,
    reportCard: null,
    transcript: null,
    gradeScales: [],
    reportLoading: false,
    reportError: '',
    trendChart: null,
  };

  function esc(v) {
    if (typeof escapeHtml === 'function') return escapeHtml(String(v ?? ''));
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function toNumber(value, fallback = null) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function formatPct(value, digits = 1) {
    const n = toNumber(value, null);
    return n == null ? 'N/A' : `${n.toFixed(digits)}%`;
  }

  function formatOrdinal(value) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n) || n <= 0) return 'N/A';
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return `${n}st`;
    if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
    if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
    return `${n}th`;
  }

  function resolveMediaUrl(rawUrl) {
    const value = String(rawUrl || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
      return value;
    }
    const configuredBase =
      (typeof API_BASE_URL !== 'undefined' && API_BASE_URL) ||
      (window.ENV_CONFIG && window.ENV_CONFIG.API_BASE_URL) ||
      (window.API && window.API.baseURL) ||
      '';
    const base = String(configuredBase || window.location.origin || '').replace(/\/$/, '');
    if (!base) return value;
    return value.startsWith('/') ? `${base}${value}` : `${base}/${value}`;
  }

  async function loadImageAsDataUrl(url) {
    if (!url) return '';
    try {
      const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) return '';
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || ''));
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return '';
    }
  }

  function fmtDateTime(v) {
    if (!v) return '-';
    const d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  }

  function childName(child) {
    return child?.full_name || [child?.first_name, child?.last_name].filter(Boolean).join(' ') || 'Child';
  }

  function childScore(child) {
    if (!child) return 0;
    const selectedReport = S.reportCard && String(S.reportCard.student_id) === String(child.student_id)
      ? S.reportCard
      : null;
    if (selectedReport) {
      const details = Array.isArray(selectedReport.details) ? selectedReport.details : [];
      if (details.length > 0) {
        const average = details.reduce((sum, row) => sum + toNumber(row.percentage, 0), 0) / details.length;
        return Math.round(average);
      }
      if (selectedReport.gpa != null) {
        return Math.round(toNumber(selectedReport.gpa, 0) * 25);
      }
    }
    if (child.current_average != null) return Math.round(Number(child.current_average));
    const trend = child.grade_trend?.data;
    if (Array.isArray(trend) && trend.length > 0) {
      const total = trend.reduce((sum, n) => sum + Number(n || 0), 0);
      return Math.round(total / trend.length);
    }
    return 0;
  }

  function aggregateSubjectPerformance(materials) {
    if (!Array.isArray(materials)) return {};
    const subjects = {};
    materials.forEach((m) => {
      const subj = m.subject_name || 'Other';
      if (!subjects[subj]) {
        subjects[subj] = { scores: [], count: 0 };
      }
      if (m.current_average != null) {
        subjects[subj].scores.push(Number(m.current_average || 0));
      }
      subjects[subj].count++;
    });
    return Object.entries(subjects).map(([name, data]) => {
      const avg = data.scores.length > 0
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0;
      return { name, average: avg, count: data.count };
    }).sort((a, b) => b.average - a.average);
  }

  function findSelectedChild() {
    return S.children.find((c) => String(c.student_id) === String(S.selectedChildId)) || null;
  }

  function getSelectedReportCard() {
    const child = findSelectedChild();
    if (!child || !S.reportCard) return null;
    return String(S.reportCard.student_id) === String(child.student_id) ? S.reportCard : null;
  }

  function getSelectedTranscript() {
    const child = findSelectedChild();
    if (!child || !S.transcript) return null;
    return S.transcript;
  }

  function getReportDetails(reportCard) {
    return Array.isArray(reportCard?.details) ? reportCard.details.slice() : [];
  }

  function getReportAverage(reportCard) {
    const details = getReportDetails(reportCard);
    if (details.length) {
      const total = details.reduce((sum, row) => sum + toNumber(row.percentage, 0), 0);
      return total / details.length;
    }
    const fallback = toNumber(reportCard?.gpa, null);
    return fallback != null ? fallback * 25 : null;
  }

  function getReportStrengths(reportCard) {
    const details = getReportDetails(reportCard)
      .filter((row) => toNumber(row.percentage, null) != null)
      .sort((a, b) => toNumber(b.percentage, 0) - toNumber(a.percentage, 0));

    return {
      strengths: details.slice(0, 3),
      weaknesses: details.slice(-3).reverse(),
    };
  }

  function getHistoricalReports() {
    const transcript = getSelectedTranscript();
    return Array.isArray(transcript?.reports) ? transcript.reports.slice() : [];
  }

  function isPublishedReport(report) {
    if (!report) return false;
    return Number(report?.is_published ?? report?.published ?? 0) === 1;
  }

  function pickLatestReport(reports, publishedOnly = false) {
    const rows = (Array.isArray(reports) ? reports.slice() : []).filter((row) => {
      if (!publishedOnly) return true;
      return isPublishedReport(row);
    });
    if (!rows.length) return null;
    rows.sort((a, b) => {
      const ay = Number(b?.academic_year_id || 0) - Number(a?.academic_year_id || 0);
      if (ay !== 0) return ay;
      return Number(b?.semester_id || 0) - Number(a?.semester_id || 0);
    });
    return rows[0] || null;
  }

  function populateSelector() {
    const sel = document.getElementById('ppfChildSelector');
    if (!sel) return;

    if (!S.children.length) {
      sel.innerHTML = '<option value="">No linked children</option>';
      return;
    }

    sel.innerHTML = S.children.map((child) => {
      const id = String(child.student_id);
      const selected = String(S.selectedChildId) === id ? ' selected' : '';
      return `<option value="${esc(id)}"${selected}>${esc(childName(child))}</option>`;
    }).join('');
  }

  function renderSummary() {
    const child = findSelectedChild();
    if (!child) {
      setText('ppfAvgScore', '0%');
      setText('ppfAttendance', '0%');
      setText('ppfCourses', '0');
      setText('ppfMaterialsAccessed', '0');
      setText('ppfQuizCompletion', '0%');
      setText('ppfHeroSubtitle', 'Select a child to view their performance overview');
      setText('ppfTrendLabel', 'No child selected');
      return;
    }

    setText('ppfAvgScore', `${childScore(child)}%`);
    setText('ppfAttendance', `${Math.round(Number(child.attendance_rate || 0))}%`);
    setText('ppfCourses', String(Number(child.enrolled_courses || 0)));
    setText('ppfMaterialsAccessed', String(Number(child.materials_accessed || 0)));
    setText('ppfQuizCompletion', `${Number(child.quiz_completion?.completion_rate || 0).toFixed(1)}%`);
    setText('ppfHeroSubtitle', `${childName(child)}'s academic journey`);
    setText('ppfTrendLabel', 'Performance trend');
    setText('ppfTrendChartLabel', `${childName(child)}'s average score progression`);
  }

  function renderReportCardSnapshot() {
    const container = document.getElementById('ppfReportCardSnapshot');
    if (!container) return;

    const child = findSelectedChild();
    if (!child) {
      container.innerHTML = '<div class="ppf-empty"><i class="fas fa-inbox"></i><br>Select a child to load report card details</div>';
      return;
    }

    if (S.reportLoading) {
      container.innerHTML = '<div class="ppf-empty"><i class="fas fa-spinner fa-spin"></i><br>Loading report card...</div>';
      return;
    }

    const reportCard = getSelectedReportCard();
    if (!reportCard) {
      container.innerHTML = '<div class="ppf-empty"><i class="fas fa-file-alt"></i><br>No published report card found for this child yet.</div>';
      return;
    }

    const isPublished = isPublishedReport(reportCard);
    const details = getReportDetails(reportCard);
    const average = isPublished ? getReportAverage(reportCard) : null;
    const latestHistorical = pickLatestReport(getHistoricalReports(), true);
    const rank = reportCard.class_rank || reportCard.rank || latestHistorical?.class_rank || latestHistorical?.rank || null;
    const attendance = toNumber(reportCard.attendance_percentage, null);
    const attendanceText = attendance == null
      ? 'N/A'
      : `${formatPct(attendance)} (${toNumber(reportCard.attendance_present_count, 0)} of ${toNumber(reportCard.attendance_total_days, 0)})`;
    const bestSix = isPublished ? getBestSixAggregate(details) : null;
    const strengths = isPublished ? getReportStrengths(reportCard) : { strengths: [], weaknesses: [] };
    const insightsSection = isPublished
      ? `
      <div class="ppf-strength-grid">
        <div>
          <h4>Strengths</h4>
          <ul class="ppf-insight-list">${strengths.strengths.length ? strengths.strengths.map((row) => `<li><strong>${esc(row.subject_name || '-')}</strong> ${formatPct(row.percentage)}</li>`).join('') : '<li>No highlighted strengths yet.</li>'}</ul>
        </div>
        <div>
          <h4>Focus Areas</h4>
          <ul class="ppf-insight-list">${strengths.weaknesses.length ? strengths.weaknesses.map((row) => `<li><strong>${esc(row.subject_name || '-')}</strong> ${formatPct(row.percentage)}</li>`).join('') : '<li>No focus areas yet.</li>'}</ul>
        </div>
      </div>
      `
      : '';

    container.innerHTML = `
      <div class="ppf-report-actions">
        <button class="btn-secondary" type="button" id="ppfDownloadReportCardBtn"><i class="fas fa-download"></i> Download report card</button>
      </div>
      <div class="ppf-report-summary">
        <div class="ppf-metric-mini"><small>Average</small><strong>${formatPct(average)}</strong></div>
        <div class="ppf-metric-mini"><small>Position</small><strong>${rank ? formatOrdinal(rank) : 'N/A'}</strong></div>
        <div class="ppf-metric-mini"><small>Attendance</small><strong>${attendanceText}</strong></div>
        <div class="ppf-metric-mini"><small>Best Six</small><strong>${bestSix != null ? bestSix.toFixed(2) : 'N/A'}</strong></div>
      </div>
      ${insightsSection}
    `;

    document.getElementById('ppfDownloadReportCardBtn')?.addEventListener('click', downloadReportCard);
  }

  function renderHistoricalReports() {
    const tbody = document.getElementById('ppfHistoricalReportsTable');
    if (!tbody) return;

    const child = findSelectedChild();
    if (!child) {
      tbody.innerHTML = '<tr><td colspan="6" class="ppf-empty"><i class="fas fa-inbox"></i><br>Select a child to see historical reports</td></tr>';
      return;
    }

    if (S.reportLoading) {
      tbody.innerHTML = '<tr><td colspan="6" class="ppf-empty"><i class="fas fa-spinner fa-spin"></i><br>Loading historical reports...</td></tr>';
      return;
    }

    const reports = getHistoricalReports();
    const publishedReports = reports.filter((row) => isPublishedReport(row));
    if (!publishedReports.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="ppf-empty"><i class="fas fa-inbox"></i><br>No published historical report data available yet.</td></tr>';
      return;
    }

    tbody.innerHTML = publishedReports.map((row) => {
      const details = Array.isArray(row.details) ? row.details : [];
      const average = details.length
        ? details.reduce((sum, detail) => sum + toNumber(detail.percentage, 0), 0) / details.length
        : (toNumber(row.gpa, null) != null ? toNumber(row.gpa) * 25 : null);
      const grade = getCurrentGrade(row, average, details) || 'N/A';

      return `
        <tr>
          <td><strong>${esc(row.semester_name || '-')}</strong><br><small>${esc(row.academic_year || '-')}</small></td>
          <td>${formatPct(average)}</td>
          <td>${row.class_rank ? formatOrdinal(row.class_rank) : 'N/A'}</td>
          <td>${grade}</td>
          <td>${formatPct(row.attendance_percentage)}</td>
          <td><span class="ppf-chip quiz-complete">Published</span></td>
        </tr>
      `;
    }).join('');
  }

  function formatStudentNameForReport(report, child) {
    const fromReport = String(report?.student_name || '').trim();
    if (fromReport) return fromReport;
    return childName(child);
  }

  function resolveGenderForReport(report) {
    return String(report?.user_gender || report?.gender || 'N/A').toUpperCase();
  }

  function formatAddressForReport(report) {
    const direct = String(report?.address || '').trim();
    const city = String(report?.city || '').trim();
    const region = String(report?.region || '').trim();
    const composed = [direct, city, region].filter(Boolean).join(', ').trim();
    return composed || 'N/A';
  }

  function getTotalSubjectScore(details) {
    const rows = Array.isArray(details) ? details : [];
    const totals = rows
      .map((row) => toNumber(row?.total_score, null))
      .filter((value) => value != null);
    return totals.length ? totals.reduce((sum, value) => sum + value, 0) : null;
  }

  function normalizeApiList(response) {
    if (Array.isArray(response)) return response;

    const payload = response?.data ?? response;
    if (Array.isArray(payload)) return payload;

    const candidates = [
      payload?.grade_scales,
      payload?.data,
      payload?.items,
      response?.grade_scales,
      response?.items,
    ];

    for (const value of candidates) {
      if (Array.isArray(value)) return value;
    }

    return [];
  }

  function resolveActiveGradeScaleRows(response) {
    const rows = normalizeApiList(response);
    if (!rows.length) return [];

    const normalized = rows
      .map((row) => {
        const min = toNumber(row?.min_score, null);
        const max = toNumber(row?.max_score, null);
        const grade = String(row?.grade || '').trim().toUpperCase();
        if (min == null || max == null || !grade) return null;

        const status = String(row?.Status || row?.status || '').trim().toLowerCase();
        const categoryStatus = String(row?.category_status || '').trim().toLowerCase();
        const interpretation = String(row?.Interpretation || row?.interpretation || '').trim();
        const remark = String(row?.remark || '').trim();
        const gradePoint = toNumber(row?.grade_point, null);
        const categoryId = String(row?.grade_categories_id || '');
        const categoryName = String(row?.grade_categories_name || '').trim();
        const isPrimary = Number(row?.set_as_primary || 0) === 1;

        return {
          grade,
          min_score: min,
          max_score: max,
          status,
          category_status: categoryStatus,
          interpretation,
          remark,
          grade_point: gradePoint,
          grade_categories_id: categoryId,
          grade_categories_name: categoryName,
          set_as_primary: isPrimary,
        };
      })
      .filter(Boolean)
      .filter((row) => {
        const rowActive = !row.status || row.status === 'active';
        const categoryActive = !row.category_status || row.category_status === 'active';
        return rowActive && categoryActive;
      });

    if (!normalized.length) return [];

    const grouped = normalized.reduce((acc, row) => {
      const key = row.grade_categories_id || '__uncategorized__';
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    const groups = Object.values(grouped);
    const primaryGroup = groups.find((rowsByCategory) => rowsByCategory.some((row) => row.set_as_primary));
    const selected = primaryGroup || groups.sort((a, b) => b.length - a.length)[0] || [];

    return selected.sort((a, b) => {
      if (a.max_score !== b.max_score) return b.max_score - a.max_score;
      return a.min_score - b.min_score;
    });
  }

  function findScaleByScore(score) {
    if (!Number.isFinite(score)) return null;
    return S.gradeScales.find((row) => score >= row.min_score && score <= row.max_score) || null;
  }

  function findScaleByGrade(grade) {
    const key = String(grade || '').trim().toUpperCase();
    if (!key) return null;
    return S.gradeScales.find((row) => String(row.grade || '').toUpperCase() === key) || null;
  }

  function getScaleLabel(row) {
    const interpretation = String(row?.interpretation || '').trim();
    if (interpretation) return interpretation;
    const remark = String(row?.remark || '').trim();
    if (remark) return remark;
    return 'N/A';
  }

  function marksToScaleGrade(marks) {
    const score = Number(marks);
    if (!Number.isFinite(score)) return 'N/A';
    const scale = findScaleByScore(score);
    return scale ? String(scale.grade || '').toUpperCase() : 'N/A';
  }

  function getGradeComputationScore(report, details, fallbackAverage) {
    const reportAveragePct = toNumber(report?.average_percentage ?? report?.percentage, null);
    if (reportAveragePct != null) return reportAveragePct;

    const rows = Array.isArray(details) ? details : [];
    const percentages = rows
      .map((row) => toNumber(row?.percentage ?? row?.average_percentage, null))
      .filter((value) => value != null);

    if (percentages.length) {
      return percentages.reduce((sum, value) => sum + value, 0) / percentages.length;
    }

    return toNumber(fallbackAverage, null);
  }

  function getCurrentGrade(report, average, details) {
    const reportGrade = String(report?.grade || report?.grade_letter || '').trim().toUpperCase();
    if (reportGrade) return reportGrade;

    const gradeScore = getGradeComputationScore(report, details, average);
    if (gradeScore == null) return null;

    const scaleGrade = marksToScaleGrade(gradeScore);
    return scaleGrade !== 'N/A' ? scaleGrade : getGradeByPercentage(gradeScore);
  }

  function getRowGrade(row, percentage) {
    const rawGrade = String(row?.grade || row?.grade_letter || '').trim().toUpperCase();
    if (rawGrade) return rawGrade;
    if (percentage == null) return 'N/A';

    const scaleGrade = marksToScaleGrade(percentage);
    return scaleGrade !== 'N/A' ? scaleGrade : getGradeByPercentage(percentage);
  }

  function getGradeByPercentage(value) {
    const score = toNumber(value, null);
    if (score == null) return 'N/A';
    return marksToScaleGrade(score);
  }

  function getGradeInterpretation(grade) {
    const scale = findScaleByGrade(grade);
    if (scale) return getScaleLabel(scale);
    return 'N/A';
  }

  function getBestSixAggregate(details) {
    const points = (Array.isArray(details) ? details : [])
      .map((row) => toNumber(row?.percentage, null))
      .map((score) => {
        if (score == null) return null;
        const scale = findScaleByScore(score);
        return toNumber(scale?.grade_point, null);
      })
      .filter((value) => value != null)
      .sort((a, b) => a - b)
      .slice(0, 6);
    return points.length ? points.reduce((sum, value) => sum + value, 0) : null;
  }

  function formatScaleScore(value) {
    const n = toNumber(value, null);
    if (n == null) return 'N/A';
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  function getPrimaryGradeCategoryName() {
    if (S.gradeScales.length && S.gradeScales[0]?.grade_categories_name) {
      return String(S.gradeScales[0].grade_categories_name);
    }
    return 'Active Scale';
  }

  function groupDetailsByCore(details) {
    const rows = Array.isArray(details) ? details.slice() : [];
    const grouped = { core: [], elective: [] };
    rows.forEach((row) => {
      const isCore = Number(row?.is_core ?? row?.subject_is_core ?? 0) === 1;
      if (isCore) grouped.core.push(row);
      else grouped.elective.push(row);
    });
    return grouped;
  }

  function buildReportCardTableRow(row) {
    const score = toNumber(row?.total_score, null);
    const percentage = toNumber(row?.percentage, null);
    const classAverage = toNumber(row?.class_average, null);
    const positionInSubject = toNumber(row?.position_in_subject, null);
    const grade = getRowGrade(row, percentage);
    const remark = String(row?.remarks || row?.grade_description || getGradeInterpretation(grade));

    return [
      String(row?.subject_name || row?.subject_code || 'Subject'),
      score != null ? score.toFixed(2) : 'N/A',
      percentage != null ? formatPct(percentage, 2) : 'N/A',
      classAverage != null ? classAverage.toFixed(2) : 'N/A',
      positionInSubject != null ? formatOrdinal(positionInSubject) : 'N/A',
      grade,
      remark,
    ];
  }

  function buildGradeScaleLines() {
    if (!S.gradeScales.length) {
      return [['No active grade scale configured', 'N/A']];
    }

    return S.gradeScales.map((row) => {
      const range = `${formatScaleScore(row.min_score)} - ${formatScaleScore(row.max_score)} (${String(row.grade || 'N/A')})`;
      return [range, getScaleLabel(row)];
    });
  }

  function buildHistoricalReportRows(currentReport) {
    const reports = getHistoricalReports();
    if (!reports.length) return [];

    const currentYearId = String(currentReport?.academic_year_id || '');
    const currentSemesterId = Number(currentReport?.semester_id || 0);

    return reports
      .filter((row) => {
        if (!isPublishedReport(row)) return false;
        if (!currentYearId || !currentSemesterId) return true;
        return String(row?.academic_year_id || '') === currentYearId
          && Number(row?.semester_id || 0) < currentSemesterId;
      })
      .sort((a, b) => {
        const yearDelta = Number(b?.academic_year_id || 0) - Number(a?.academic_year_id || 0);
        if (yearDelta !== 0) return yearDelta;
        return Number(b?.semester_id || 0) - Number(a?.semester_id || 0);
      })
      .map((row) => {
        const details = getReportDetails(row);
        const average = details.length
          ? details.reduce((sum, detail) => sum + toNumber(detail.percentage, 0), 0) / details.length
          : (toNumber(row?.gpa, null) != null ? toNumber(row.gpa) * 25 : null);
        const grade = getCurrentGrade(row, average, details) || 'N/A';

        return [
          String(row?.academic_year || '-'),
          String(row?.semester_name || '-'),
          average != null ? formatPct(average) : 'N/A',
          row?.class_rank ? formatOrdinal(row.class_rank) : 'N/A',
          grade,
          formatPct(row?.attendance_percentage),
        ];
      });
  }

  function getPreviousSemesterSummary(currentReport) {
    const reports = getHistoricalReports();
    if (!currentReport || !reports.length) return null;

    const currentYearId = String(currentReport?.academic_year_id || '');
    const currentSemesterId = Number(currentReport?.semester_id || 0);
    if (!currentYearId || !Number.isFinite(currentSemesterId) || currentSemesterId <= 0) return null;

    const previous = reports
      .filter((row) => String(row?.academic_year_id || '') === currentYearId && Number(row?.semester_id || 0) < currentSemesterId)
      .sort((a, b) => Number(b?.semester_id || 0) - Number(a?.semester_id || 0))[0];

    if (!previous) return null;

    const details = getReportDetails(previous);
    const average = details.length
      ? details.reduce((sum, row) => sum + toNumber(row?.percentage, 0), 0) / details.length
      : (toNumber(previous?.gpa, null) != null ? toNumber(previous.gpa) * 25 : null);

    return {
      average,
      rank: previous?.class_rank ?? previous?.rank ?? null,
    };
  }

  function getAttendanceSummary(report) {
    const presentCount = toNumber(report?.attendance_present_count, null);
    const totalDays = toNumber(report?.attendance_total_days, null);
    const percentage = toNumber(report?.attendance_percentage, null);
    if (presentCount != null && totalDays != null && percentage != null) {
      return { present: presentCount, total: totalDays, percentage };
    }
    return null;
  }

  async function downloadReportCard() {
    const child = findSelectedChild();
    const reportCard = getSelectedReportCard();
    if (!child) return;
    if (!reportCard) {
      if (typeof showToast === 'function') showToast('No report card available for this child yet.', 'error');
      return;
    }
    if (!isPublishedReport(reportCard)) {
      if (typeof showToast === 'function') showToast('Report card is not published yet. Download is only available after publication.', 'error');
      return;
    }

    const jsPdfCtor = window.jspdf?.jsPDF || null;
    const details = getReportDetails(reportCard);
    if (!jsPdfCtor || typeof jsPdfCtor !== 'function') {
      if (typeof showToast === 'function') showToast('PDF export is unavailable for this report card.', 'error');
      return;
    }

    const doc = new jsPdfCtor({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 36;

    const studentName = formatStudentNameForReport(reportCard, child);
    const schoolName = String(reportCard?.institution_name || 'GHANA SHS Learning Management System').toUpperCase();
    const yearLabel = String(reportCard?.academic_year || 'N/A');
    const semesterLabel = String(reportCard?.semester_name || 'N/A');
    const average = getReportAverage(reportCard);
    const rank = reportCard?.class_rank ?? reportCard?.rank ?? 'N/A';
    const previous = getPreviousSemesterSummary(reportCard);
    const aggregateBestSix = getBestSixAggregate(details);
    const groupedDetails = groupDetailsByCore(details);
    const gradeScaleLines = buildGradeScaleLines();
    const totalScore = getTotalSubjectScore(details);
    const attendanceSummary = getAttendanceSummary(reportCard);
    const attendanceDisplay = attendanceSummary
      ? (attendanceSummary.present + ' out of ' + attendanceSummary.total + ' (' + formatPct(attendanceSummary.percentage, 2) + ')')
      : 'N/A';
    const logoDataUrl = await loadImageAsDataUrl(resolveMediaUrl(reportCard?.institution_logo));
    const historicalReportRows = buildHistoricalReportRows(reportCard);

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 84, 'F');

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
    doc.text(String(reportCard?.institution_motto || 'Knowledge, Discipline, Excellence'), pageWidth / 2, 48, { align: 'center' });
    doc.text('Website: ' + String(reportCard?.institution_website || 'N/A') + '   |   Email: ' + String(reportCard?.institution_email || 'N/A'), pageWidth / 2, 62, { align: 'center' });
    doc.text('Phone: ' + String(reportCard?.institution_phone || 'N/A') + '   |   Postal: ' + String(reportCard?.institution_postal_code || 'N/A'), pageWidth / 2, 74, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.text('STUDENT REPORT CARD', marginX, 110);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('Academic Year: ' + yearLabel + '   |   Semester: ' + semesterLabel, marginX, 126);

    const profileRows = [
      ['Student Name', studentName, 'Student Index', String(reportCard?.student_id_number || reportCard?.student_id || 'N/A')],
      ['Gender', resolveGenderForReport(reportCard), 'Class', String(reportCard?.class_name || 'N/A')],
      ['Programme', String(reportCard?.program_name || 'N/A'), 'Level', String(reportCard?.grade_level_name || 'N/A')],
      ['Email', String(reportCard?.email || reportCard?.alternative_email || 'N/A'), 'Phone', String(reportCard?.phone_number || 'N/A')],
      ['Address', formatAddressForReport(reportCard), 'No. on Roll', String(reportCard?.class_roll_count || 'N/A')],
    ];

    const summaryRows = [
      ['Student\'s Average Mark', average != null ? average.toFixed(2) : 'N/A', 'Position in Class', rank ? formatOrdinal(rank) : 'N/A'],
      ['Last Semester Avg', previous ? (previous.average != null ? previous.average.toFixed(2) : 'N/A') : 'N/A', 'Last Semester Position', previous ? (previous.rank ? formatOrdinal(previous.rank) : 'N/A') : 'N/A'],
      ['Total Subjects Score', totalScore != null ? totalScore.toFixed(2) : 'N/A', 'Best Six Aggregate', aggregateBestSix != null ? aggregateBestSix.toFixed(2) : 'N/A'],
      ['Attendance', attendanceDisplay, '', ''],
    ];

    if (typeof doc.autoTable !== 'function') {
      if (typeof showToast === 'function') showToast('PDF export is unavailable for this report card.', 'error');
      return;
    }

    doc.autoTable({
      startY: 138,
      head: [['Field', 'Value', 'Field', 'Value']],
      body: profileRows,
      styles: { fontSize: 8.5, cellPadding: 5, textColor: [15, 23, 42], overflow: 'linebreak' },
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
      styles: { fontSize: 8.5, cellPadding: 5, overflow: 'linebreak' },
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
      groupedDetails.core.forEach((row) => {
        detailRows.push(buildReportCardTableRow(row));
      });
    }
    if (groupedDetails.elective.length) {
      detailRows.push(['ELECTIVE SUBJECTS', '', '', '', '', '', '']);
      groupedDetails.elective.forEach((row) => {
        detailRows.push(buildReportCardTableRow(row));
      });
    }

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 12,
      head: [['Subject', 'Total', 'Percentage', 'Class Avg', 'Position', 'Grade', 'Remarks']],
      body: detailRows.length ? detailRows : [['No detail rows available.', '', '', '', '', '', '']],
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
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
                head: [['Report History']],
                body: [['See below for historical performance in previous semesters.']],
                styles: { fontSize: 9, cellPadding: 6, textColor: [15, 23, 42], overflow: 'linebreak' },
                headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
                margin: { left: marginX, right: marginX },
        });
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Academic Year', 'Semester', 'Average', 'Position', 'Grade', 'Attendance']],
      body: historicalReportRows.length
        ? historicalReportRows
        : [['No historical reports available.', '', '', '', '', '']],
      styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255] },
      margin: { left: marginX, right: marginX },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 95 },
        2: { cellWidth: 90 },
        3: { cellWidth: 70 },
        4: { cellWidth: 90 },
        5: { cellWidth: 80 },
      },
    });

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [[`Grade Scale (${getPrimaryGradeCategoryName()})`, 'Interpretation']],
      body: gradeScaleLines,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255] },
      margin: { left: marginX, right: marginX },
    });

    const footerY = doc.internal.pageSize.getHeight() - 16;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.text('Generated on ' + new Date().toLocaleString(), marginX, footerY);
    doc.text('GHANA SHS Learning Management System', pageWidth - marginX, footerY, { align: 'right' });

    doc.save(`report-card-${studentName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${semesterLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
  }

  function renderQuizScoresBySubject() {
    const tbody = document.getElementById('ppfQuizSubjectScoresTable');
    if (!tbody) return;

    const child = findSelectedChild();
    const rows = Array.isArray(child?.quiz_subject_scores) ? child.quiz_subject_scores : [];

    if (!child) {
      tbody.innerHTML = '<tr><td colspan="4" class="ppf-empty"><i class="fas fa-inbox"></i><br>Select a child to see quiz score breakdown</td></tr>';
      return;
    }

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="ppf-empty"><i class="fas fa-inbox"></i><br>No quiz submissions yet</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => {
      return [
        '<tr>',
        '<td><strong>' + esc(row.subject_name || '-') + '</strong></td>',
        '<td>' + esc(String(row.submitted_attempts || 0)) + '</td>',
        '<td>' + Number(row.avg_percentage || 0).toFixed(1) + '%</td>',
        '<td>' + Number(row.best_percentage || 0).toFixed(1) + '%</td>',
        '</tr>'
      ].join('');
    }).join('');
  }

  function renderQuizCompletionCard() {
    const container = document.getElementById('ppfQuizCompletionCard');
    if (!container) return;

    const child = findSelectedChild();
    if (!child) {
      container.innerHTML = '<div class="ppf-empty"><i class="fas fa-inbox"></i><br>Select a child to view completion status</div>';
      return;
    }

    const completion = child.quiz_completion || {};
    const assigned = Number(completion.assigned_quizzes || 0);
    const completed = Number(completion.completed_quizzes || 0);
    const inProgress = Number(completion.in_progress_quizzes || 0);
    const completionRate = Number(completion.completion_rate || 0);

    let statusChip = '<span class="ppf-chip quiz-not-started">Not started</span>';
    if (completed > 0 && completed >= assigned && assigned > 0) {
      statusChip = '<span class="ppf-chip quiz-complete">Completed</span>';
    } else if (inProgress > 0 || completed > 0) {
      statusChip = '<span class="ppf-chip quiz-progress">In progress</span>';
    }

    container.innerHTML = [
      '<div class="ppf-engagement-grid">',
      '<div class="ppf-engagement-stat"><small><i class="fas fa-list"></i> Assigned</small><strong>' + assigned + '</strong></div>',
      '<div class="ppf-engagement-stat"><small><i class="fas fa-check-circle"></i> Completed</small><strong>' + completed + '</strong></div>',
      '<div class="ppf-engagement-stat"><small><i class="fas fa-hourglass-half"></i> In Progress</small><strong>' + inProgress + '</strong></div>',
      '</div>',
      '<div style="margin-top:1rem">',
      '<div class="ppf-progress-item">',
      '<div class="ppf-progress-label"><strong>Completion Rate</strong><span class="ppf-progress-value">' + completionRate.toFixed(1) + '%</span></div>',
      '<div class="ppf-progress-bar"><div class="ppf-progress-fill" style="width:' + completionRate.toFixed(1) + '%"></div></div>',
      '</div>',
      '<div style="margin-top:.8rem">' + statusChip + '</div>',
      '</div>'
    ].join('');
  }

  function renderQuizAttemptsTable() {
    const tbody = document.getElementById('ppfQuizAttemptsTable');
    if (!tbody) return;

    const child = findSelectedChild();
    const rows = Array.isArray(child?.recent_quiz_attempts) ? child.recent_quiz_attempts : [];

    if (!child) {
      tbody.innerHTML = '<tr><td colspan="5" class="ppf-empty"><i class="fas fa-inbox"></i><br>Select a child to view recent quiz attempts</td></tr>';
      return;
    }

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="ppf-empty"><i class="fas fa-inbox"></i><br>No quiz attempts yet</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => {
      const status = String(row.status || '-').toLowerCase();
      const statusChip = status === 'submitted'
        ? '<span class="ppf-chip quiz-complete">Submitted</span>'
        : status === 'in_progress'
          ? '<span class="ppf-chip quiz-progress">In Progress</span>'
          : '<span class="ppf-chip quiz-not-started">' + esc(status || 'unknown') + '</span>';
      const scoreText = Number(row.max_score || 0) > 0
        ? `${Number(row.score || 0)} / ${Number(row.max_score || 0)} (${Number(row.percentage || 0).toFixed(1)}%)`
        : '-';

      return [
        '<tr>',
        '<td><strong>' + esc(row.quiz_title || '-') + '</strong></td>',
        '<td>' + esc(row.subject_name || '-') + '</td>',
        '<td>' + statusChip + '</td>',
        '<td>' + esc(scoreText) + '</td>',
        '<td><small>' + esc(fmtDateTime(row.submitted_at || row.created_at)) + '</small></td>',
        '</tr>'
      ].join('');
    }).join('');
  }

  function renderSubjectPerformance() {
    const container = document.getElementById('ppfSubjectPerformanceContainer');
    if (!container) return;

    const child = findSelectedChild();
    if (!child) {
      container.innerHTML = '<div class="ppf-empty"><i class="fas fa-inbox"></i><br>Select a child to see subject breakdown</div>';
      return;
    }

    if (S.reportLoading) {
      container.innerHTML = '<div class="ppf-empty"><i class="fas fa-spinner fa-spin"></i><br>Loading subject results...</div>';
      return;
    }

    const reportDetails = getReportDetails(getSelectedReportCard());
    if (reportDetails.length) {
      container.innerHTML = reportDetails.map((row) => {
        const percentage = toNumber(row.percentage, 0);
        const classAverage = toNumber(row.class_average, null);
        const position = toNumber(row.position_in_subject, null);
        const totalScore = toNumber(row.total_score, null);
        const delta = classAverage != null ? percentage - classAverage : null;
        const color = percentage >= 80 ? '#16a34a' : percentage >= 60 ? '#0284c7' : '#dc2626';

        return `
          <div class="ppf-progress-item">
            <div class="ppf-subject-head">
              <div>
                <div class="ppf-subject-name">${esc(row.subject_name || 'Subject')}</div>
                <small>${esc(row.subject_code || '')}${position ? ` • Position ${formatOrdinal(position)}` : ''}</small>
              </div>
              <div class="ppf-subject-score">${formatPct(percentage)}</div>
            </div>
            <div class="ppf-subject-meta">
              <span>Class avg: ${classAverage != null ? formatPct(classAverage) : 'N/A'}</span>
              <span>Delta: ${delta != null ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%` : 'N/A'}</span>
              <span>Total: ${totalScore != null ? totalScore.toFixed(2) : 'N/A'}</span>
            </div>
            <div class="ppf-progress-bar">
              <div class="ppf-progress-fill" style="width: ${Math.min(100, Math.max(0, percentage))}%; background: ${color}"></div>
            </div>
          </div>
        `;
      }).join('');
      return;
    }

    // Prefer quiz subject averages from API; fallback to material-derived scores when unavailable.
    const quizSubjects = Array.isArray(child.quiz_subject_scores)
      ? child.quiz_subject_scores.map((row) => ({
          name: String(row.subject_name || 'Other'),
          average: Math.round(Number(row.avg_percentage || 0)),
          count: Number(row.submitted_attempts || 0),
        }))
      : [];

    const subjects = quizSubjects.length
      ? quizSubjects.sort((a, b) => b.average - a.average)
      : aggregateSubjectPerformance(Array.isArray(child.recent_material_access) ? child.recent_material_access : []);

    if (!subjects.length) {
      container.innerHTML = '<div class="ppf-empty"><i class="fas fa-inbox"></i><br>No subject data available yet</div>';
      return;
    }

    container.innerHTML = subjects.map((subj) => {
      const pct = Math.min(100, Math.max(0, subj.average));
      const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#0284c7' : '#dc2626';
      return `
        <div class="ppf-progress-item">
          <div class="ppf-subject-item">
            <div class="ppf-subject-name">${esc(subj.name)}</div>
            <div class="ppf-progress-bar">
              <div class="ppf-progress-fill" style="width: ${pct}%; background: ${color}"></div>
            </div>
            <div class="ppf-subject-score">${pct}%</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderEngagement() {
    const container = document.getElementById('ppfEngagementContainer');
    if (!container) return;

    const child = findSelectedChild();
    if (!child) {
      container.innerHTML = '<div class="ppf-empty"><i class="fas fa-inbox"></i><br>Select a child to see engagement</div>';
      return;
    }

    const materials = Array.isArray(child.recent_material_access) ? child.recent_material_access : [];
    const completed = materials.filter((m) => m.completed_at).length;
    const total = materials.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Engagement level based on both activity volume and completion quality.
    let engagementLevel = 'Low';
    let engagementColor = '#ef4444';
    if (total >= 8 || (completionRate >= 95 && total >= 4)) {
      engagementLevel = 'High';
      engagementColor = '#16a34a';
    } else if (total >= 4 || (completionRate >= 75 && total >= 2)) {
      engagementLevel = 'Moderate';
      engagementColor = '#0284c7';
    }

    container.innerHTML = `
      <div class="ppf-engagement-grid">
        <div class="ppf-engagement-stat">
          <small><i class="fas fa-download"></i> Accessed</small>
          <strong>${total}</strong>
        </div>
        <div class="ppf-engagement-stat">
          <small><i class="fas fa-check-circle"></i> Completed</small>
          <strong>${completed}</strong>
        </div>
        <div class="ppf-engagement-stat">
          <small><i class="fas fa-percent"></i> Rate</small>
          <strong>${completionRate}%</strong>
        </div>
      </div>
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #bfdbfe">
        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #0c4a6e">
          <i class="fas fa-signal"></i>
          <strong>Engagement:</strong>
          <span style="color: ${engagementColor}; font-weight: 600">${engagementLevel}</span>
        </div>
      </div>
    `;
  }

  function renderTrend() {
    const canvas = document.getElementById('ppfTrendChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const child = findSelectedChild();
    const labels = Array.isArray(child?.grade_trend?.labels) ? child.grade_trend.labels : [];
    const data = Array.isArray(child?.grade_trend?.data)
      ? child.grade_trend.data.map((n) => Number(n || 0))
      : [];

    if (S.trendChart) {
      S.trendChart.data.labels = labels;
      S.trendChart.data.datasets[0].data = data;
      S.trendChart.update();
      return;
    }

    S.trendChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Average Score (%)',
          data,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.14)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y}%`,
            },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: { callback: (v) => `${v}%` },
            grid: { color: '#e2e8f0' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });
  }

  function renderMaterialsTable() {
    const tbody = document.getElementById('ppfMaterialsTable');
    if (!tbody) return;

    const child = findSelectedChild();
    const rows = Array.isArray(child?.recent_material_access) ? child.recent_material_access : [];

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="ppf-empty"><i class="fas fa-inbox"></i><br>No accessed materials recorded yet.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((row) => {
      const how = String(row.completion_source || 'open').toUpperCase();
      const completed = !!row.completed_at;
      const statusChip = completed
        ? '<span class="ppf-chip complete"><i class="fas fa-check"></i> Completed</span>'
        : '<span class="ppf-chip preview"><i class="fas fa-eye"></i> Accessed</span>';
      const materialType = row.material_type ? ` <small style="color:#94a3b8">(${esc(row.material_type)})</small>` : '';
      
      let howChip = '';
      if (how === 'PREVIEW') howChip = '<span class="ppf-chip preview">Preview</span>';
      else if (how === 'OPEN') howChip = '<span class="ppf-chip open">Opened</span>';
      else if (how === 'DOWNLOAD') howChip = '<span class="ppf-chip pending">Download</span>';
      else howChip = `<span class="ppf-chip">${esc(how)}</span>`;

      return `
        <tr>
          <td>
            <strong>${esc(row.title || row.file_name || `Material #${row.material_id || ''}`)}</strong>
            ${materialType}
          </td>
          <td>${esc(row.subject_name || '-')}</td>
          <td><small>${esc(fmtDateTime(row.last_opened_at))}</small></td>
          <td>${howChip}</td>
          <td>${statusChip}</td>
        </tr>
      `;
    }).join('');
  }

  function renderRecentFeed() {
    const feed = document.getElementById('ppfRecentAccessFeed');
    if (!feed) return;

    if (!S.recentAccess.length) {
      feed.innerHTML = '<div class="ppf-empty"><i class="fas fa-inbox"></i><br>No recent material activity.</div>';
      return;
    }

    feed.innerHTML = S.recentAccess.slice(0, 8).map((row) => {
      const icon = row.completed_at ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-eye"></i>';
      return `
        <div class="ppf-feed-item">
          <strong>${icon} ${esc(row.child_name || 'Child')} accessed material</strong>
          <div class="ppf-feed-subject"><strong>${esc(row.title || row.file_name || 'Material')}</strong></div>
          <div class="ppf-feed-meta">${esc(row.subject_name || '-')} • ${esc(fmtDateTime(row.last_opened_at))}</div>
        </div>
      `;
    }).join('');
  }

  function renderAll() {
    renderSummary();
    renderReportCardSnapshot();
    renderSubjectPerformance();
    renderEngagement();
    renderQuizScoresBySubject();
    renderQuizCompletionCard();
    renderQuizAttemptsTable();
    renderTrend();
    renderHistoricalReports();
    renderMaterialsTable();
    renderRecentFeed();
  }

  async function loadSelectedPerformanceData() {
    const child = findSelectedChild();
    if (!child) {
      S.reportCard = null;
      S.transcript = null;
      S.reportError = '';
      S.reportLoading = false;
      return;
    }

    S.reportLoading = true;
    renderAll();

    try {
      const transcriptRes = await GradeReportAPI.getTranscript(child.student_id, { all_terms: 1 }).catch(() => null);
      const transcript = transcriptRes?.data || null;
      const transcriptReports = Array.isArray(transcript?.reports) ? transcript.reports : [];

      // Transcript rows can omit joined profile fields; fetch a full report-card row for the target term.
      const targetReport = pickLatestReport(transcriptReports, true) || pickLatestReport(transcriptReports);
      let reportCard = null;

      if (targetReport) {
        const params = {};
        if (targetReport?.academic_year_id != null) params.academic_year_id = targetReport.academic_year_id;
        if (targetReport?.semester_id != null) params.semester_id = targetReport.semester_id;

        const reportRes = await GradeReportAPI.getReportCard(
          child.student_id,
          Object.keys(params).length ? params : undefined
        ).catch(() => null);

        reportCard = reportRes?.data || null;
      }

      if (!reportCard && transcriptReports.length > 0) {
        const reportRes = await GradeReportAPI.getReportCard(child.student_id).catch(() => null);
        reportCard = reportRes?.data || null;
      }

      if ((!reportCard || !isPublishedReport(reportCard)) && transcriptReports.length > 0) {
        reportCard = pickLatestReport(transcriptReports, true) || reportCard;
      }

      if (!reportCard && transcriptReports.length > 0) {
        reportCard = pickLatestReport(transcriptReports);
      }

      S.reportCard = reportCard;
      S.transcript = transcript;
      S.reportError = S.reportCard ? '' : 'No report card available for the selected child.';
    } finally {
      S.reportLoading = false;
    }
  }

  async function loadData() {
    const [response, gradeScaleRes] = await Promise.all([
      DashboardAPI.getParentStats(),
      (typeof GradeScaleAPI !== 'undefined' && GradeScaleAPI?.getAll
        ? GradeScaleAPI.getAll()
        : API.get(API_ENDPOINTS.GRADE_SCALES)
      ).catch(() => null),
    ]);
    const payload = response?.data || {};

    S.children = Array.isArray(payload.children_data) ? payload.children_data : [];
    S.recentAccess = Array.isArray(payload.recent_material_access) ? payload.recent_material_access : [];
    S.gradeScales = resolveActiveGradeScaleRows(gradeScaleRes);

    if (!S.selectedChildId && S.children.length) {
      const saved = sessionStorage.getItem('parent:selectedChildId');
      const fallbackId = String(S.children[0].student_id);
      const exists = saved && S.children.some((c) => String(c.student_id) === String(saved));
      S.selectedChildId = exists ? String(saved) : fallbackId;
    }

    populateSelector();
    await loadSelectedPerformanceData();
    renderAll();
  }

  function bindEvents() {
    document.getElementById('ppfChildSelector')?.addEventListener('change', (e) => {
      S.selectedChildId = e.target.value || null;
      if (S.selectedChildId) sessionStorage.setItem('parent:selectedChildId', String(S.selectedChildId));
      loadSelectedPerformanceData().then(renderAll);
    });

    document.getElementById('ppfRefreshBtn')?.addEventListener('click', async () => {
      try {
        await loadData();
        if (typeof showToast === 'function') showToast('Performance data refreshed.', 'success');
      } catch (e) {
        if (typeof showToast === 'function') showToast('Failed to refresh performance data.', 'error');
      }
    });
  }

  async function init() {
    const root = document.getElementById('parentPerformancePageRoot');
    if (!root || root.dataset.inited === '1') return;
    root.dataset.inited = '1';

    try {
      bindEvents();
      await loadData();
    } catch (e) {
      console.error('Failed to initialize parent performance page:', e);
      const table = document.getElementById('ppfMaterialsTable');
      if (table) {
        table.innerHTML = '<tr><td colspan="5" class="ppf-empty"><i class="fas fa-triangle-exclamation"></i><br>Unable to load performance data right now.</td></tr>';
      }
    }
  }

  document.addEventListener('page:loaded', (e) => {
    if (e.detail?.page === 'performance') init();
  });
})();

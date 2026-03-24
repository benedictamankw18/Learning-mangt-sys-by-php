(function () {
  'use strict';

  const S = {
    children: [],
    recentAccess: [],
    selectedChildId: null,
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
    renderSubjectPerformance();
    renderEngagement();
    renderQuizScoresBySubject();
    renderQuizCompletionCard();
    renderQuizAttemptsTable();
    renderTrend();
    renderMaterialsTable();
    renderRecentFeed();
  }

  async function loadData() {
    const response = await DashboardAPI.getParentStats();
    const payload = response?.data || {};

    S.children = Array.isArray(payload.children_data) ? payload.children_data : [];
    S.recentAccess = Array.isArray(payload.recent_material_access) ? payload.recent_material_access : [];

    if (!S.selectedChildId && S.children.length) {
      const saved = sessionStorage.getItem('parent:selectedChildId');
      const fallbackId = String(S.children[0].student_id);
      const exists = saved && S.children.some((c) => String(c.student_id) === String(saved));
      S.selectedChildId = exists ? String(saved) : fallbackId;
    }

    populateSelector();
    renderAll();
  }

  function bindEvents() {
    document.getElementById('ppfChildSelector')?.addEventListener('change', (e) => {
      S.selectedChildId = e.target.value || null;
      if (S.selectedChildId) sessionStorage.setItem('parent:selectedChildId', String(S.selectedChildId));
      renderAll();
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

/* ============================================
   Admin Quizzes Overview
============================================ */

(function () {
  "use strict";

  const S = {
    rows: [],
    filtered: [],
    classFilter: "",
    search: "",
  };

  let E = {};

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toNumber(v, fallback) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function showToastSafe(message, type) {
    if (typeof showToast === "function") {
      showToast(message, type || "info");
      return;
    }
    console.log((type || "info").toUpperCase() + ": " + message);
  }

  function cacheEls() {
    E = {
      root: document.getElementById("admQuizzesRoot"),
      search: document.getElementById("admQzSearch"),
      classFilter: document.getElementById("admQzClassFilter"),
      refreshBtn: document.getElementById("admQzRefreshBtn"),
      kpiTotal: document.getElementById("admQzKpiTotal"),
      kpiActive: document.getElementById("admQzKpiActive"),
      kpiAverage: document.getElementById("admQzKpiAverage"),
      kpiCompletion: document.getElementById("admQzKpiCompletion"),
      classStatsBody: document.getElementById("admQzClassStatsBody"),
      quizRows: document.getElementById("admQzQuizRows"),
    };
  }

  function normalizeCourses(payload) {
    const rows = Array.isArray(payload?.data?.data)
      ? payload.data.data
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

    return rows
      .map((row) => ({
        courseId: toNumber(row.course_id || row.id, 0),
        className: String(row.class_name || row.section_name || "Unassigned Class"),
        subjectName: String(row.subject_name || row.course_name || "Unknown Subject"),
      }))
      .filter((row) => row.courseId > 0);
  }

  function normalizeCourseQuizzes(payload) {
    const quizzes = Array.isArray(payload?.data?.quizzes)
      ? payload.data.quizzes
      : Array.isArray(payload?.quizzes)
        ? payload.quizzes
        : [];
    return quizzes;
  }

  function statusChip(status) {
    const key = String(status || "").toLowerCase();
    if (key === "active") return '<span class="adm-qz-chip active">Active</span>';
    if (key === "draft") return '<span class="adm-qz-chip draft">Draft</span>';
    return '<span class="adm-qz-chip inactive">' + esc(key || "unknown") + "</span>";
  }

  function completionPercent(summary) {
    const total = toNumber(summary?.total_attempts, 0);
    const submitted = toNumber(summary?.submitted_attempts, 0);
    if (total <= 0) return 0;
    return (submitted / total) * 100;
  }

  async function fetchQuizRows() {
    const coursesRes = await CourseAPI.getAll({ page: 1, limit: 500 });
    const courses = normalizeCourses(coursesRes);

    const rows = [];

    await Promise.all(
      courses.map(async (course) => {
        try {
          const quizRes = await QuizAPI.getByCourse(course.courseId);
          const quizzes = normalizeCourseQuizzes(quizRes);

          await Promise.all(
            quizzes.map(async (quiz) => {
              const quizId = toNumber(quiz.quiz_id || quiz.id, 0);
              if (!quizId) return;

              let summary = {
                total_attempts: 0,
                submitted_attempts: 0,
                avg_percentage: 0,
              };

              try {
                const resultsRes = await QuizAPI.getResults(quizId);
                summary = resultsRes?.data?.summary || resultsRes?.summary || summary;
              } catch (_) {
                // Keep zero-summary when results endpoint fails for one quiz.
              }

              rows.push({
                quizId: quizId,
                title: String(quiz.title || "Untitled Quiz"),
                status: String(quiz.status || "draft"),
                className: course.className,
                subjectName: course.subjectName,
                totalAttempts: toNumber(summary.total_attempts, 0),
                submittedAttempts: toNumber(summary.submitted_attempts, 0),
                avgPercentage: toNumber(summary.avg_percentage, 0),
              });
            })
          );
        } catch (_) {
          // Ignore one broken course payload and continue.
        }
      })
    );

    return rows;
  }

  function populateClassFilter() {
    if (!E.classFilter) return;
    const unique = Array.from(new Set(S.rows.map((row) => row.className))).sort((a, b) => a.localeCompare(b));
    const prev = E.classFilter.value;

    E.classFilter.innerHTML = ['<option value="">All classes</option>']
      .concat(unique.map((name) => '<option value="' + esc(name) + '">' + esc(name) + '</option>'))
      .join("");

    if (unique.includes(prev)) E.classFilter.value = prev;
  }

  function applyFilters() {
    const classValue = String(E.classFilter?.value || S.classFilter || "").trim();
    const q = String(E.search?.value || S.search || "").trim().toLowerCase();

    S.filtered = S.rows.filter((row) => {
      if (classValue && row.className !== classValue) return false;
      if (!q) return true;
      const hay = [row.title, row.className, row.subjectName].join(" ").toLowerCase();
      return hay.includes(q);
    });

    renderKpis();
    renderClassStats();
    renderQuizRows();
  }

  function renderKpis() {
    const total = S.filtered.length;
    const active = S.filtered.filter((row) => String(row.status).toLowerCase() === "active").length;

    let attempts = 0;
    let submitted = 0;
    let weightedAverageSum = 0;

    S.filtered.forEach((row) => {
      attempts += row.totalAttempts;
      submitted += row.submittedAttempts;
      weightedAverageSum += row.avgPercentage * Math.max(1, row.totalAttempts);
    });

    const completion = attempts > 0 ? (submitted / attempts) * 100 : 0;
    const average = total > 0
      ? (attempts > 0 ? weightedAverageSum / Math.max(1, attempts) : (S.filtered.reduce((sum, row) => sum + row.avgPercentage, 0) / total))
      : 0;

    if (E.kpiTotal) E.kpiTotal.textContent = String(total);
    if (E.kpiActive) E.kpiActive.textContent = String(active);
    if (E.kpiAverage) E.kpiAverage.textContent = average.toFixed(1) + "%";
    if (E.kpiCompletion) E.kpiCompletion.textContent = completion.toFixed(1) + "%";
  }

  function renderClassStats() {
    if (!E.classStatsBody) return;

    const map = new Map();

    S.filtered.forEach((row) => {
      if (!map.has(row.className)) {
        map.set(row.className, {
          className: row.className,
          quizzes: 0,
          totalAttempts: 0,
          submittedAttempts: 0,
          avgSum: 0,
        });
      }

      const item = map.get(row.className);
      item.quizzes += 1;
      item.totalAttempts += row.totalAttempts;
      item.submittedAttempts += row.submittedAttempts;
      item.avgSum += row.avgPercentage;
    });

    const rows = Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className));

    if (!rows.length) {
      E.classStatsBody.innerHTML = '<tr><td colspan="5" class="adm-qz-empty">No class statistics to display.</td></tr>';
      return;
    }

    E.classStatsBody.innerHTML = rows.map((row) => {
      const avg = row.quizzes > 0 ? row.avgSum / row.quizzes : 0;
      const completion = row.totalAttempts > 0 ? (row.submittedAttempts / row.totalAttempts) * 100 : 0;
      return [
        "<tr>",
        "<td>" + esc(row.className) + "</td>",
        "<td>" + row.quizzes + "</td>",
        "<td>" + row.submittedAttempts + "/" + row.totalAttempts + "</td>",
        "<td>" + avg.toFixed(1) + "%</td>",
        '<td><div>' + completion.toFixed(1) + '%</div><div class="adm-qz-progress"><span style="width:' + completion.toFixed(1) + '%"></span></div></td>',
        "</tr>",
      ].join("");
    }).join("");
  }

  function renderQuizRows() {
    if (!E.quizRows) return;

    if (!S.filtered.length) {
      E.quizRows.innerHTML = '<tr><td colspan="6" class="adm-qz-empty">No quizzes match your filters.</td></tr>';
      return;
    }

    const sorted = S.filtered.slice().sort((a, b) => b.quizId - a.quizId);

    E.quizRows.innerHTML = sorted.map((row) => {
      const completion = completionPercent({ total_attempts: row.totalAttempts, submitted_attempts: row.submittedAttempts });
      return [
        "<tr>",
        "<td><strong>" + esc(row.title) + "</strong><br><small>#" + row.quizId + "</small></td>",
        "<td>" + esc(row.className) + "<br><small>" + esc(row.subjectName) + "</small></td>",
        "<td>" + statusChip(row.status) + "</td>",
        "<td>" + row.submittedAttempts + "/" + row.totalAttempts + "</td>",
        "<td>" + row.avgPercentage.toFixed(1) + "%</td>",
        '<td><div>' + completion.toFixed(1) + '%</div><div class="adm-qz-progress"><span style="width:' + completion.toFixed(1) + '%"></span></div></td>',
        "</tr>",
      ].join("");
    }).join("");
  }

  async function loadData() {
    if (E.quizRows) {
      E.quizRows.innerHTML = '<tr><td colspan="6" class="adm-qz-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading quizzes...</td></tr>';
    }
    if (E.classStatsBody) {
      E.classStatsBody.innerHTML = '<tr><td colspan="5" class="adm-qz-empty"><i class="fas fa-circle-notch fa-spin"></i> Loading class stats...</td></tr>';
    }

    try {
      S.rows = await fetchQuizRows();
      populateClassFilter();
      applyFilters();
    } catch (error) {
      console.error("Failed to load admin quizzes overview", error);
      showToastSafe("Failed to load quiz overview.", "error");
      if (E.quizRows) {
        E.quizRows.innerHTML = '<tr><td colspan="6" class="adm-qz-empty">Unable to load quizzes right now.</td></tr>';
      }
      if (E.classStatsBody) {
        E.classStatsBody.innerHTML = '<tr><td colspan="5" class="adm-qz-empty">Unable to load class statistics right now.</td></tr>';
      }
    }
  }

  function bindEvents() {
    if (!E.root || E.root.dataset.bound === "1") return;

    E.search?.addEventListener("input", () => {
      S.search = String(E.search.value || "");
      applyFilters();
    });

    E.classFilter?.addEventListener("change", () => {
      S.classFilter = String(E.classFilter.value || "");
      applyFilters();
    });

    E.refreshBtn?.addEventListener("click", () => {
      loadData().catch(() => {});
    });

    E.root.dataset.bound = "1";
  }

  async function initPage() {
    cacheEls();
    if (!E.root) return;
    bindEvents();
    await loadData();
  }

  document.addEventListener("page:loaded", (event) => {
    if (event?.detail?.page === "quizzes") {
      initPage().catch(() => {});
    }
  });
})();

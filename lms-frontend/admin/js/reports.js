/* ============================================
   Admin Reports Workspace
============================================ */
(function () {
  "use strict";

  const STATE = {
    rows: [],
    filteredRows: [],
    academicYears: [],
    semesters: [],
    classRows: [],
    programRows: [],
    attendanceRows: [],
    enrollmentRows: [],
    customRows: [],
    classChart: null,
    programChart: null,
    currentAcademicYearId: "",
    currentSemesterId: "",
    selectedAcademicYearId: "",
    selectedSemesterId: "",
    currentAcademicYearName: "-",
    currentSemesterName: "-",
    schedules: [],
  };

  const DOM = {};

  document.addEventListener("DOMContentLoaded", initIfPresent);
  document.addEventListener("page:loaded", function (event) {
    if (event?.detail?.page === "reports") {
      initIfPresent();
    }
  });

  function initIfPresent() {
    const root = document.getElementById("adminReportsRoot");
    if (!root || root.dataset.bound === "1") return;

    root.dataset.bound = "1";
    cacheDom();
    bindEvents();
    loadSchedules();
    loadData();
  }

  function cacheDom() {
    DOM.root = document.getElementById("adminReportsRoot");
    DOM.academicYear = document.getElementById("admRptAcademicYear");
    DOM.semester = document.getElementById("admRptSemester");
    DOM.type = document.getElementById("admRptType");
    DOM.search = document.getElementById("admRptSearch");
    DOM.format = document.getElementById("admRptFormat");
    DOM.loadBtn = document.getElementById("admRptLoadBtn");
    DOM.exportBtn = document.getElementById("admRptExportBtn");
    DOM.exportAllBtn = document.getElementById("admRptExportAllBtn");
    DOM.status = document.getElementById("admRptStatus");

    DOM.kpiStudents = document.getElementById("admRptKpiStudents");
    DOM.kpiTeachers = document.getElementById("admRptKpiTeachers");
    DOM.kpiClasses = document.getElementById("admRptKpiClasses");
    DOM.kpiPrograms = document.getElementById("admRptKpiPrograms");
    DOM.kpiPassRate = document.getElementById("admRptKpiPassRate");
    DOM.kpiAttendance = document.getElementById("admRptKpiAttendance");

    DOM.classChart = document.getElementById("admRptClassChart");
    DOM.programChart = document.getElementById("admRptProgramChart");
    DOM.tableBody = document.getElementById("admRptTableBody");

    DOM.builderSource = document.getElementById("admRptBuilderSource");
    DOM.builderMetric = document.getElementById("admRptBuilderMetric");
    DOM.builderTop = document.getElementById("admRptBuilderTop");
    DOM.buildBtn = document.getElementById("admRptBuildBtn");

    DOM.scheduleName = document.getElementById("admRptScheduleName");
    DOM.scheduleType = document.getElementById("admRptScheduleType");
    DOM.scheduleFreq = document.getElementById("admRptScheduleFreq");
    DOM.scheduleEmail = document.getElementById("admRptScheduleEmail");
    DOM.scheduleAddBtn = document.getElementById("admRptScheduleAddBtn");
    DOM.scheduleList = document.getElementById("admRptSchedules");
  }

  function bindEvents() {
    DOM.loadBtn?.addEventListener("click", loadData);
    DOM.search?.addEventListener("input", applyFiltersAndRender);
    DOM.type?.addEventListener("change", applyFiltersAndRender);
    DOM.academicYear?.addEventListener("change", function () {
      STATE.selectedAcademicYearId = String(this.value || "");
      populateSemesterOptions();
      STATE.selectedSemesterId = String(DOM.semester?.value || "");
      loadData();
    });
    DOM.semester?.addEventListener("change", function () {
      STATE.selectedSemesterId = String(this.value || "");
      loadData();
    });

    DOM.exportBtn?.addEventListener("click", function () {
      exportRows(STATE.filteredRows, "current");
    });

    DOM.exportAllBtn?.addEventListener("click", function () {
      exportRows(STATE.rows, "all-reports");
    });

    DOM.buildBtn?.addEventListener("click", buildCustomReport);
    DOM.scheduleAddBtn?.addEventListener("click", addSchedule);

    DOM.scheduleList?.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const id = button.getAttribute("data-id");
      const action = button.getAttribute("data-action");
      if (!id || !action) return;

      if (action === "toggle") {
        toggleSchedule(id);
      }
      if (action === "delete") {
        deleteSchedule(id);
      }
    });
  }

  async function loadData() {
    showStatus("Loading admin reports workspace...", "info");

    try {
      const user = getCurrentUser();
      const institutionId = user?.institution_id || "";

      const [yearRes, semesterRes] = await Promise.all([
        API.get(API_ENDPOINTS.ACADEMIC_YEAR_CURRENT),
        API.get(API_ENDPOINTS.SEMESTER_CURRENT),
      ]);

      const [yearListRes, semesterListRes] = await Promise.all([
        API.get(API_ENDPOINTS.ACADEMIC_YEARS, { limit: 200 }).catch(function () { return null; }),
        API.get(API_ENDPOINTS.SEMESTERS, { limit: 200 }).catch(function () { return null; }),
      ]);

      const year = unwrapSingle(yearRes) || {};
      const semester = unwrapSingle(semesterRes) || {};

      STATE.currentAcademicYearId = String(year?.academic_year_id || year?.id || "");
      STATE.currentSemesterId = String(semester?.semester_id || semester?.id || "");

      STATE.academicYears = toList(
        yearListRes?.data?.academic_years
        || yearListRes?.academic_years
        || yearListRes?.data?.data
        || yearListRes?.data
        || yearListRes
      );
      STATE.semesters = toList(
        semesterListRes?.data?.semesters
        || semesterListRes?.semesters
        || semesterListRes?.data?.data
        || semesterListRes?.data
        || semesterListRes
      );

      if (!STATE.academicYears.length && STATE.currentAcademicYearId) {
        STATE.academicYears = [{
          academic_year_id: STATE.currentAcademicYearId,
          year_name: String(year?.year_name || year?.name || "Current Academic Year"),
        }];
      }

      if (!STATE.semesters.length && STATE.currentSemesterId) {
        STATE.semesters = [{
          semester_id: STATE.currentSemesterId,
          semester_name: String(semester?.semester_name || semester?.name || "Current Semester"),
          academic_year_id: STATE.currentAcademicYearId,
        }];
      }

      if (!STATE.selectedAcademicYearId) {
        STATE.selectedAcademicYearId = String(
          DOM.academicYear?.value
          || STATE.currentAcademicYearId
          || STATE.academicYears[0]?.academic_year_id
          || STATE.academicYears[0]?.id
          || ""
        );
      }

      if (!STATE.selectedSemesterId) {
        STATE.selectedSemesterId = String(
          DOM.semester?.value
          || STATE.currentSemesterId
          || ""
        );
      }

      populateAcademicYearOptions();
      populateSemesterOptions();

      const selectedYear = findAcademicYearById(STATE.selectedAcademicYearId);
      const selectedSemester = findSemesterById(STATE.selectedSemesterId);

      STATE.currentAcademicYearId = String(STATE.selectedAcademicYearId || STATE.currentAcademicYearId || "");
      STATE.currentSemesterId = String(STATE.selectedSemesterId || STATE.currentSemesterId || "");
      STATE.currentAcademicYearName = String(selectedYear?.year_name || selectedYear?.name || year?.year_name || year?.name || "-");
      STATE.currentSemesterName = String(selectedSemester?.semester_name || selectedSemester?.name || semester?.semester_name || semester?.name || "-");

      const attendanceRange = resolveAttendanceDateRange(selectedYear || year, selectedSemester || semester);

      if (DOM.academicYear) DOM.academicYear.value = STATE.currentAcademicYearId;
      if (DOM.semester) DOM.semester.value = STATE.currentSemesterId;

      const [dashboardRes, reportsRes, classesRes, programsRes, attendanceRes] = await Promise.all([
        DashboardAPI.getAdminStats(institutionId ? { institution_id: institutionId } : {}),
        GradeReportAPI.getAll({
          page: 1,
          limit: 500,
          academic_year_id: STATE.currentAcademicYearId,
          semester_id: STATE.currentSemesterId,
        }),
        ClassAPI.getAll({ page: 1, limit: 500 }),
        ProgramAPI.getAll({ page: 1, limit: 200 }),
        AttendanceAPI.getSummary({
          start_date: attendanceRange.startDate,
          end_date: attendanceRange.endDate,
          academic_year_id: STATE.currentAcademicYearId,
          semester_id: STATE.currentSemesterId,
        }).catch(function () {
          return null;
        }),
      ]);

      const dashboard = unwrapSingle(dashboardRes) || dashboardRes || {};
      const rawReports = toList(reportsRes?.data?.reports || reportsRes);
      await hydrateReportDetails(rawReports);
      const reports = normalizeReportRows(rawReports);
      const classes = normalizeClasses(toList(classesRes?.data?.data || classesRes?.data || classesRes));
      const programs = normalizePrograms(toList(programsRes?.data?.data || programsRes?.data || programsRes));
      applyProgramFallback(reports, classes);

      STATE.classRows = aggregateBy(reports, "class_name", "class", "Academic performance by class", "Class");
      STATE.programRows = aggregateBy(reports, "program_name", "program", "Academic performance by program", "Program");
      STATE.attendanceRows = buildAttendanceRows(attendanceRes, classes);
      STATE.enrollmentRows = buildEnrollmentRows(classes, programs);
      STATE.customRows = [];

      const semesterRows = buildSemesterRows(reports);
      const annualRows = buildAnnualRows(reports);
      const wassceRows = buildWassceRows(reports);
      const progressRows = buildProgressRows(reports);
      const teacherRows = buildTeacherRows(reports);

      STATE.rows = []
        .concat(STATE.classRows)
        .concat(STATE.programRows)
        .concat(semesterRows)
        .concat(annualRows)
        .concat(wassceRows)
        .concat(progressRows)
        .concat(teacherRows)
        .concat(STATE.attendanceRows)
        .concat(STATE.enrollmentRows);

      applyFiltersAndRender();
      renderKpis(dashboard, reports, classes, programs, attendanceRes);
      renderCharts();

      showStatus("Admin reports loaded successfully.", "success");
    } catch (error) {
      console.error("Admin reports load failed", error);
      STATE.rows = [];
      STATE.filteredRows = [];
      renderTable();
      renderCharts();
      showStatus(error?.message || "Failed to load reports.", "error");
    }
  }

  function populateAcademicYearOptions() {
    if (!DOM.academicYear) return;

    const currentValue = String(STATE.selectedAcademicYearId || DOM.academicYear.value || "");
    const rows = Array.isArray(STATE.academicYears) ? STATE.academicYears.slice() : [];
    const options = ['<option value="">Select academic year</option>'];

    rows.forEach(function (row) {
      const id = String(row?.academic_year_id || row?.id || "");
      if (!id) return;
      const label = String(row?.year_name || row?.name || ("Academic Year " + id));
      options.push('<option value="' + esc(id) + '">' + esc(label) + '</option>');
    });

    DOM.academicYear.innerHTML = options.join("");
    if (currentValue) {
      DOM.academicYear.value = currentValue;
    }
  }

  function getSemestersForAcademicYear(academicYearId) {
    const yearId = String(academicYearId || "");
    const rows = Array.isArray(STATE.semesters) ? STATE.semesters.slice() : [];
    if (!yearId) return rows;

    return rows.filter(function (row) {
      const rowYearId = String(row?.academic_year_id || row?.academicYearId || row?.academic_year?.academic_year_id || "");
      return rowYearId === yearId;
    });
  }

  function populateSemesterOptions() {
    if (!DOM.semester) return;

    const rows = getSemestersForAcademicYear(STATE.selectedAcademicYearId);
    const currentValue = String(STATE.selectedSemesterId || DOM.semester.value || "");
    const options = ['<option value="">Select semester</option>'];

    rows.forEach(function (row) {
      const id = String(row?.semester_id || row?.id || "");
      if (!id) return;
      const label = String(row?.semester_name || row?.name || ("Semester " + id));
      options.push('<option value="' + esc(id) + '">' + esc(label) + '</option>');
    });

    DOM.semester.innerHTML = options.join("");

    const hasCurrent = rows.some(function (row) {
      return String(row?.semester_id || row?.id || "") === currentValue;
    });

    if (hasCurrent) {
      DOM.semester.value = currentValue;
      STATE.selectedSemesterId = currentValue;
      return;
    }

    const preferredCurrent = String(STATE.currentSemesterId || "");
    const hasPreferredCurrent = rows.some(function (row) {
      return String(row?.semester_id || row?.id || "") === preferredCurrent;
    });

    const fallback = hasPreferredCurrent
      ? preferredCurrent
      : String(rows[0]?.semester_id || rows[0]?.id || "");

    DOM.semester.value = fallback;
    STATE.selectedSemesterId = fallback;
  }

  function findAcademicYearById(id) {
    const key = String(id || "");
    return (Array.isArray(STATE.academicYears) ? STATE.academicYears : []).find(function (row) {
      return String(row?.academic_year_id || row?.id || "") === key;
    }) || null;
  }

  function findSemesterById(id) {
    const key = String(id || "");
    return (Array.isArray(STATE.semesters) ? STATE.semesters : []).find(function (row) {
      return String(row?.semester_id || row?.id || "") === key;
    }) || null;
  }

  function applyFiltersAndRender() {
    const type = String(DOM.type?.value || "all").trim();
    const search = String(DOM.search?.value || "").trim().toLowerCase();

    STATE.filteredRows = STATE.rows.filter(function (row) {
      if (type !== "all" && String(row.type) !== type) {
        return false;
      }

      if (!search) return true;
      const text = [row.name, row.group, row.notes, row.type].join(" ").toLowerCase();
      return text.includes(search);
    });

    renderTable();
  }

  function renderKpis(dashboard, reports, classes, programs, attendanceRes) {
    const avg = reports.length
      ? reports.reduce(function (sum, row) {
          return sum + toNumber(row.average);
        }, 0) / reports.length
      : 0;

    const pass = reports.length
      ? reports.reduce(function (sum, row) {
          return sum + toNumber(row.pass_rate);
        }, 0) / reports.length
      : 0;

    const attendanceRate = resolveAttendanceRate(attendanceRes, dashboard);

    setText(DOM.kpiStudents, String(toNumber(dashboard?.total_students, reports.length)));
    setText(DOM.kpiTeachers, String(toNumber(dashboard?.total_teachers, 0)));
    setText(DOM.kpiClasses, String(classes.length));
    setText(DOM.kpiPrograms, String(programs.length));
    setText(DOM.kpiPassRate, formatPct(pass || avg));
    setText(DOM.kpiAttendance, formatPct(attendanceRate));
  }

  function renderTable() {
    if (!DOM.tableBody) return;

    if (!STATE.filteredRows.length) {
      DOM.tableBody.innerHTML = '<tr><td colspan="7"><div class="adm-rpt-empty">No rows match the current report filter.</div></td></tr>';
      return;
    }

    DOM.tableBody.innerHTML = STATE.filteredRows.map(function (row) {
      return "<tr>"
        + "<td>" + esc(row.type_label || row.type) + "</td>"
        + "<td>" + esc(row.name) + "</td>"
        + "<td>" + esc(row.group || "-") + "</td>"
        + "<td>" + esc(formatPct(row.average)) + "</td>"
        + "<td>" + esc(formatPct(row.pass_rate)) + "</td>"
        + "<td>" + esc(String(toNumber(row.count, 0))) + "</td>"
        + "<td>" + esc(row.notes || "-") + "</td>"
        + "</tr>";
    }).join("");
  }

  function renderCharts() {
    if (typeof Chart === "undefined") return;

    if (STATE.classChart) {
      STATE.classChart.destroy();
      STATE.classChart = null;
    }

    if (STATE.programChart) {
      STATE.programChart.destroy();
      STATE.programChart = null;
    }

    const classRows = STATE.classRows.slice().sort(function (a, b) {
      return toNumber(b.average) - toNumber(a.average);
    }).slice(0, 10);

    if (DOM.classChart && classRows.length) {
      STATE.classChart = new Chart(DOM.classChart, {
        type: "bar",
        data: {
          labels: classRows.map(function (row) { return truncate(row.name, 18); }),
          datasets: [{
            label: "Average %",
            data: classRows.map(function (row) { return toNumber(row.average, 0); }),
            backgroundColor: "#0f766e",
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, max: 100 } },
        },
      });
    }

    const programRows = STATE.programRows.slice().sort(function (a, b) {
      return toNumber(b.count) - toNumber(a.count);
    });

    if (DOM.programChart && programRows.length) {
      STATE.programChart = new Chart(DOM.programChart, {
        type: "doughnut",
        data: {
          labels: programRows.map(function (row) { return truncate(row.name, 20); }),
          datasets: [{
            data: programRows.map(function (row) { return toNumber(row.count, 0); }),
            backgroundColor: getProgramChartColors(programRows.length),
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
    }
  }

  function buildCustomReport() {
    const source = String(DOM.builderSource?.value || "class");
    const metric = String(DOM.builderMetric?.value || "average");
    const top = Math.max(1, toNumber(DOM.builderTop?.value, 10));

    let base = [];
    if (source === "class") base = STATE.classRows.slice();
    if (source === "program") base = STATE.programRows.slice();
    if (source === "attendance") base = STATE.attendanceRows.slice();
    if (source === "enrollment") base = STATE.enrollmentRows.slice();

    const key = metric === "count" ? "count" : metric === "pass_rate" ? "pass_rate" : "average";

    const rows = base
      .sort(function (a, b) {
        return toNumber(b[key], 0) - toNumber(a[key], 0);
      })
      .slice(0, top)
      .map(function (row) {
        return Object.assign({}, row, {
          type: "custom",
          type_label: "Custom",
          notes: "Custom report from " + source + " by " + metric,
        });
      });

    STATE.rows = STATE.rows.filter(function (row) {
      return row.type !== "custom";
    }).concat(rows);

    STATE.customRows = rows;

    if (DOM.type) {
      DOM.type.value = "custom";
    }

    applyFiltersAndRender();
    showStatus("Custom report built successfully.", "success");
  }

  async function addSchedule() {
    const name = String(DOM.scheduleName?.value || "").trim();
    const type = String(DOM.scheduleType?.value || "semester");
    const frequency = String(DOM.scheduleFreq?.value || "monthly");
    const email = String(DOM.scheduleEmail?.value || "").trim();

    if (!name) {
      showStatus("Schedule name is required.", "error");
      return;
    }

    if (!email || !email.includes("@")) {
      showStatus("Enter a valid recipient email.", "error");
      return;
    }

    try {
      await ReportScheduleAPI.create({
        schedule_name: name,
        report_type: type,
        frequency: frequency,
        recipient_email: email,
      });

      if (DOM.scheduleName) DOM.scheduleName.value = "";
      if (DOM.scheduleEmail) DOM.scheduleEmail.value = "";

      await loadSchedules();
      showStatus("Automated schedule added.", "success");
    } catch (error) {
      showStatus(extractErrorMessage(error, "Failed to add schedule."), "error");
    }
  }

  async function toggleSchedule(id) {
    const target = toList(STATE.schedules).find(function (row) {
      return String(row?.schedule_id || row?.id || "") === String(id);
    });

    if (!target) return;

    const isActive = Number(target?.is_active ?? (target?.active ? 1 : 0)) === 1;

    try {
      await ReportScheduleAPI.updateStatus(id, !isActive);
      await loadSchedules();
      showStatus(!isActive ? "Schedule resumed." : "Schedule paused.", "success");
    } catch (error) {
      showStatus(extractErrorMessage(error, "Failed to update schedule status."), "error");
    }
  }

  async function deleteSchedule(id) {
    try {
      await ReportScheduleAPI.delete(id);
      await loadSchedules();
      showStatus("Schedule removed.", "success");
    } catch (error) {
      showStatus(extractErrorMessage(error, "Failed to remove schedule."), "error");
    }
  }

  async function loadSchedules() {
    try {
      const response = await ReportScheduleAPI.getAll();
      STATE.schedules = toList(response?.data?.schedules || response?.schedules || response);
    } catch (_error) {
      STATE.schedules = [];
    }

    renderSchedules();
  }

  function renderSchedules() {
    if (!DOM.scheduleList) return;

    if (!STATE.schedules.length) {
      DOM.scheduleList.innerHTML = '<div class="adm-rpt-empty">No automated schedules yet.</div>';
      return;
    }

    DOM.scheduleList.innerHTML = STATE.schedules.map(function (row) {
      const id = String(row?.schedule_id || row?.id || "");
      const active = Number(row?.is_active ?? (row?.active ? 1 : 0)) === 1;
      const reportType = String(row?.report_type || row?.type || "");
      const frequency = String(row?.frequency || "");
      const name = String(row?.schedule_name || row?.name || "Report schedule");
      const email = String(row?.recipient_email || row?.email || "");

      return '<article class="adm-rpt-schedule-item">'
        + '<strong>' + esc(name) + '</strong>'
        + '<small>Type: ' + esc(toTypeLabel(reportType)) + ' | Frequency: ' + esc(frequency) + '</small>'
        + '<small>Recipient: ' + esc(email) + '</small>'
        + '<small>Status: ' + esc(active ? 'Active' : 'Paused') + '</small>'
        + '<div class="adm-rpt-schedule-actions">'
        + '<button class="btn btn-outline btn-sm" type="button" data-action="toggle" data-id="' + esc(id) + '">'
        + (active ? 'Pause' : 'Resume') + '</button>'
        + '<button class="btn btn-outline btn-sm" type="button" data-action="delete" data-id="' + esc(id) + '">Delete</button>'
        + '</div>'
        + '</article>';
    }).join("");
  }

  function exportRows(rows, fileNamePrefix) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) {
      showStatus("No report rows available to export.", "error");
      return;
    }

    const format = String(DOM.format?.value || "pdf");
    if (format === "csv") {
      exportCsv(list, fileNamePrefix);
      return;
    }

    exportPdf(list, fileNamePrefix);
  }

  function exportCsv(rows, fileNamePrefix) {
    const headers = ["Type", "Name", "Group", "Average %", "Pass Rate", "Count", "Notes"];
    const dataRows = rows.map(function (row) {
      return [
        row.type_label || row.type,
        row.name,
        row.group,
        formatPct(row.average),
        formatPct(row.pass_rate),
        String(toNumber(row.count, 0)),
        row.notes || "",
      ];
    });

    const csv = [headers].concat(dataRows).map(function (line) {
      return line.map(function (cell) {
        const v = String(cell == null ? "" : cell).replace(/"/g, '""');
        return '"' + v + '"';
      }).join(",");
    }).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileNamePrefix + "-" + Date.now() + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showStatus("CSV exported successfully.", "success");
  }

  function exportPdf(rows, fileNamePrefix) {
    const jsPdfCtor = window?.jspdf?.jsPDF;
    if (!jsPdfCtor) {
      showStatus("PDF library unavailable. Opening print dialog instead.", "info");
      window.print();
      return;
    }

    const doc = new jsPdfCtor({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text("Admin Reports", 36, 36);
    doc.setFontSize(10);
    doc.text("Academic Year: " + STATE.currentAcademicYearName + " | Semester: " + STATE.currentSemesterName, 36, 52);

    const body = rows.map(function (row) {
      return [
        row.type_label || row.type,
        row.name,
        row.group,
        formatPct(row.average),
        formatPct(row.pass_rate),
        String(toNumber(row.count, 0)),
        row.notes || "",
      ];
    });

    if (typeof doc.autoTable === "function") {
      doc.autoTable({
        startY: 66,
        head: [["Type", "Name", "Group", "Average %", "Pass Rate", "Count", "Notes"]],
        body: body,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [3, 105, 161] },
      });
    }

    doc.save(fileNamePrefix + "-" + Date.now() + ".pdf");
    showStatus("PDF exported successfully.", "success");
  }

  function normalizeReportRows(reports) {
    return toList(reports).map(function (report) {
      const details = toList(report?.details);
      const gpaAsPct = toNumber(report?.gpa, NaN) * 25;
      const average = details.length
        ? details.reduce(function (sum, item) {
            return sum + toNumber(item?.percentage, 0);
          }, 0) / details.length
        : toNumber(report?.average_percentage, toNumber(report?.average_score, toNumber(gpaAsPct, 0)));

      const passRate = details.length
        ? (details.filter(function (item) {
            return toNumber(item?.percentage, 0) >= 50;
          }).length / details.length) * 100
        : toNumber(report?.pass_rate, Number.isFinite(average) ? average : 0);

      const sample = details[0] || {};

      return {
        report_id: report?.report_id || report?.id || report?.uuid || "-",
        student_name: String(report?.student_name || "Student"),
        class_name: String(sample?.class_name || report?.class_name || "Unassigned class"),
        program_name: String(sample?.program_name || report?.program_name || "Unassigned program"),
        teacher_name: String(report?.generated_by_name || report?.teacher_name || "Teacher"),
        average: toNumber(average, 0),
        pass_rate: toNumber(passRate, 0),
      };
    });
  }

  async function hydrateReportDetails(reports) {
    const list = toList(reports);
    const chunkSize = 8;

    for (let i = 0; i < list.length; i += chunkSize) {
      const chunk = list.slice(i, i + chunkSize);
      const details = await Promise.all(chunk.map(function (report) {
        if (toList(report?.details).length) {
          return report;
        }

        const uuid = String(report?.uuid || "").trim();
        if (!uuid) {
          return null;
        }

        return GradeReportAPI.getById(uuid).then(unwrapSingle).catch(function () {
          return null;
        });
      }));

      details.forEach(function (detail, index) {
        const report = chunk[index];
        if (!detail || !report) return;

        report.details = toList(detail.details);
        report.student_name = detail.student_name ?? report.student_name;
        report.class_name = detail.class_name ?? report.class_name;
        report.program_name = detail.program_name ?? report.program_name;
        report.gpa = detail.gpa ?? report.gpa;
      });
    }
  }

  function aggregateBy(rows, key, type, notes, groupLabel) {
    const map = new Map();

    rows.forEach(function (row) {
      const label = String(row?.[key] || "Unknown").trim() || "Unknown";
      if (!map.has(label)) {
        map.set(label, {
          type: type,
          type_label: toTypeLabel(type),
          name: label,
          group: groupLabel,
          average_sum: 0,
          pass_sum: 0,
          count: 0,
          notes: notes,
        });
      }

      const item = map.get(label);
      item.average_sum += toNumber(row.average, 0);
      item.pass_sum += toNumber(row.pass_rate, 0);
      item.count += 1;
    });

    return Array.from(map.values()).map(function (row) {
      const count = Math.max(1, toNumber(row.count, 0));
      return {
        type: row.type,
        type_label: row.type_label,
        name: row.name,
        group: row.group,
        average: row.average_sum / count,
        pass_rate: row.pass_sum / count,
        count: row.count,
        notes: row.notes,
      };
    }).sort(function (a, b) {
      return toNumber(b.average, 0) - toNumber(a.average, 0);
    });
  }

  function buildSemesterRows(reports) {
    const avg = reports.length
      ? reports.reduce(function (sum, row) { return sum + toNumber(row.average, 0); }, 0) / reports.length
      : 0;
    const pass = reports.length
      ? reports.reduce(function (sum, row) { return sum + toNumber(row.pass_rate, 0); }, 0) / reports.length
      : 0;

    return [{
      type: "semester",
      type_label: "Semester",
      name: STATE.currentSemesterName + " Summary",
      group: STATE.currentAcademicYearName,
      average: avg,
      pass_rate: pass,
      count: reports.length,
      notes: "Current semester report summary.",
    }];
  }

  function buildAnnualRows(reports) {
    const avg = reports.length
      ? reports.reduce(function (sum, row) { return sum + toNumber(row.average, 0); }, 0) / reports.length
      : 0;

    return [{
      type: "annual",
      type_label: "Annual",
      name: STATE.currentAcademicYearName + " Annual Snapshot",
      group: "School-wide",
      average: avg,
      pass_rate: avg,
      count: reports.length,
      notes: "Annual leadership snapshot generated from current academic data.",
    }];
  }

  function buildWassceRows(reports) {
    const shs3 = reports.filter(function (row) {
      return normalizeText(row.class_name).includes("shs 3");
    });

    const avg = shs3.length
      ? shs3.reduce(function (sum, row) { return sum + toNumber(row.average, 0); }, 0) / shs3.length
      : 0;

    const pass = shs3.length
      ? shs3.reduce(function (sum, row) { return sum + toNumber(row.pass_rate, 0); }, 0) / shs3.length
      : 0;

    return [{
      type: "wassce",
      type_label: "WASSCE",
      name: "WASSCE Readiness",
      group: "SHS 3",
      average: avg,
      pass_rate: pass,
      count: shs3.length,
      notes: "Readiness proxy from SHS 3 academic performance.",
    }];
  }

  function buildProgressRows(reports) {
    return reports
      .slice()
      .sort(function (a, b) {
        return toNumber(b.average, 0) - toNumber(a.average, 0);
      })
      .slice(0, 12)
      .map(function (row) {
        return {
          type: "progress",
          type_label: "Progress",
          name: row.student_name,
          group: row.class_name,
          average: row.average,
          pass_rate: row.pass_rate,
          count: 1,
          notes: "Top student progress profile.",
        };
      });
  }

  function buildTeacherRows(reports) {
    const map = new Map();

    reports.forEach(function (row) {
      const teacher = row.teacher_name || "Teacher";
      if (!map.has(teacher)) {
        map.set(teacher, {
          type: "teacher",
          type_label: "Teacher",
          name: teacher,
          group: "Teacher Performance",
          average_sum: 0,
          pass_sum: 0,
          count: 0,
          notes: "Generated report outcomes by teacher.",
        });
      }

      const item = map.get(teacher);
      item.average_sum += toNumber(row.average, 0);
      item.pass_sum += toNumber(row.pass_rate, 0);
      item.count += 1;
    });

    return Array.from(map.values()).map(function (row) {
      const count = Math.max(1, toNumber(row.count, 0));
      return {
        type: row.type,
        type_label: row.type_label,
        name: row.name,
        group: row.group,
        average: row.average_sum / count,
        pass_rate: row.pass_sum / count,
        count: row.count,
        notes: row.notes,
      };
    });
  }

  function buildAttendanceRows(attendanceRes, classes) {
    const rate = resolveAttendanceRate(attendanceRes, null);

    return [{
      type: "attendance",
      type_label: "Attendance",
      name: "School Attendance",
      group: "All Classes",
      average: rate,
      pass_rate: rate,
      count: classes.length,
      notes: "Attendance summary for active term.",
    }];
  }

  function buildEnrollmentRows(classes, programs) {
    const classRows = classes.map(function (row) {
      const count = toNumber(row.student_count, 0);
      return {
        type: "enrollment",
        type_label: "Enrollment",
        name: String(row.class_name || row.name || "Class"),
        group: "Class",
        average: 0,
        pass_rate: 0,
        count: count,
        notes: "Current enrollment count by class.",
      };
    });

    const programRows = programs.map(function (row) {
      const count = toNumber(row.student_count, 0);
      return {
        type: "enrollment",
        type_label: "Enrollment",
        name: String(row.program_name || row.name || "Program"),
        group: "Program",
        average: 0,
        pass_rate: 0,
        count: count,
        notes: "Current enrollment count by program.",
      };
    });

    return classRows.concat(programRows);
  }

  function resolveAttendanceRate(attendanceRes, dashboard) {
    const payload = attendanceRes?.data || attendanceRes || {};
    const direct = toNumber(payload?.attendance_rate, NaN);
    if (Number.isFinite(direct)) return direct;

    const directRate = toNumber(payload?.rate, NaN);
    if (Number.isFinite(directRate)) return directRate;

    const summary = payload?.summary || {};
    const fromSummary = toNumber(summary?.attendance_rate, NaN);
    if (Number.isFinite(fromSummary)) return fromSummary;

    const fromSummaryRate = toNumber(summary?.rate, NaN);
    if (Number.isFinite(fromSummaryRate)) return fromSummaryRate;

    return toNumber(dashboard?.attendance_rate, 0);
  }

  function resolveAttendanceDateRange(year, semester) {
    const semesterStart = normalizeDateString(
      semester?.start_date
      || semester?.semester_start_date
      || semester?.date_start
    );
    const semesterEnd = normalizeDateString(
      semester?.end_date
      || semester?.semester_end_date
      || semester?.date_end
    );

    if (semesterStart && semesterEnd && semesterStart <= semesterEnd) {
      return { startDate: semesterStart, endDate: semesterEnd };
    }

    const yearStart = normalizeDateString(year?.start_date || year?.year_start_date);
    const yearEnd = normalizeDateString(year?.end_date || year?.year_end_date);

    if (yearStart && yearEnd && yearStart <= yearEnd) {
      return { startDate: yearStart, endDate: yearEnd };
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      startDate: formatDateOnly(thirtyDaysAgo),
      endDate: formatDateOnly(today),
    };
  }

  function normalizeDateString(value) {
    if (!value) return "";

    const raw = String(value).trim();
    const direct = raw.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) {
      return direct;
    }

    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return formatDateOnly(d);
  }

  function formatDateOnly(dateObj) {
    const d = new Date(dateObj);
    if (Number.isNaN(d.getTime())) return "";

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function normalizeClasses(rows) {
    return toList(rows).map(function (row) {
      return {
        class_name: row?.class_name || row?.section_name || row?.name || "Class",
        program_name: row?.program_name || row?.program || "",
        student_count: row?.student_count || row?.total_students || 0,
      };
    });
  }

  function applyProgramFallback(reports, classes) {
    const programByClass = new Map();

    toList(classes).forEach(function (row) {
      const classKey = normalizeText(row?.class_name);
      const programName = String(row?.program_name || "").trim();
      if (classKey && programName) {
        programByClass.set(classKey, programName);
      }
    });

    toList(reports).forEach(function (row) {
      const currentProgram = normalizeText(row?.program_name);
      const isMissingProgram = !currentProgram || currentProgram === "unassigned program";
      if (!isMissingProgram) {
        return;
      }

      const classKey = normalizeText(row?.class_name);
      const fallbackProgram = programByClass.get(classKey);
      if (fallbackProgram) {
        row.program_name = fallbackProgram;
      }
    });
  }

  function normalizePrograms(rows) {
    return toList(rows).map(function (row) {
      return {
        program_name: row?.program_name || row?.name || "Program",
        student_count: row?.student_count || row?.total_students || 0,
      };
    });
  }

  function toTypeLabel(type) {
    const key = String(type || "").toLowerCase();
    if (key === "class") return "Class";
    if (key === "program") return "Program";
    if (key === "semester") return "Semester";
    if (key === "annual") return "Annual";
    if (key === "wassce") return "WASSCE";
    if (key === "progress") return "Progress";
    if (key === "teacher") return "Teacher";
    if (key === "attendance") return "Attendance";
    if (key === "enrollment") return "Enrollment";
    if (key === "custom") return "Custom";
    return "Report";
  }

  function unwrapSingle(response) {
    if (!response) return null;
    if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) return response.data;
    if (response.result && typeof response.result === "object" && !Array.isArray(response.result)) return response.result;
    return response;
  }

  function toList(value) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.results)) return value.results;
    return [];
  }

  function toNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : (fallback == null ? 0 : fallback);
  }

  function formatPct(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "0.00%";
    return n.toFixed(2) + "%";
  }

  function truncate(value, max) {
    const text = String(value == null ? "" : value);
    if (text.length <= max) return text;
    return text.slice(0, Math.max(max - 1, 1)) + "...";
  }

  function getProgramChartColors(count) {
    const total = Math.max(0, Number(count) || 0);
    if (!total) return [];

    const base = ["#0284c7", "#0f766e", "#7c3aed", "#f59e0b", "#dc2626", "#2563eb"];
    const colors = [];
    const goldenAngle = 137.508;

    for (let i = 0; i < total; i++) {
      if (i < base.length) {
        colors.push(base[i]);
        continue;
      }

      const hue = Math.round((i * goldenAngle) % 360);
      const saturation = 68;
      const lightness = 52;
      colors.push("hsl(" + hue + ", " + saturation + "%, " + lightness + "%)");
    }

    return colors;
  }

  function normalizeText(value) {
    return String(value == null ? "" : value).toLowerCase().trim();
  }

  function setText(el, value) {
    if (!el) return;
    const text = String(value == null ? "" : value);
    if ("value" in el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT")) {
      el.value = text;
      return;
    }
    el.textContent = text;
  }

  function getCurrentUser() {
    try {
      return typeof Auth !== "undefined" && typeof Auth.getUser === "function"
        ? Auth.getUser()
        : null;
    } catch (_) {
      return null;
    }
  }

  function showStatus(message, type) {
    if (!DOM.status) return;
    DOM.status.textContent = String(message || "");
    DOM.status.className = "adm-rpt-status show " + String(type || "info");
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch];
    });
  }
})();

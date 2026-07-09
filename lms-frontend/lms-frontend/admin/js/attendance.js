/* ============================================
   Attendance Management Page Logic
   Initialised on page:loaded event
============================================ */
(function () {
    'use strict';

    const AUTO_NOTIFY_STORAGE_PREFIX = 'lms_attendance_auto_notify_';

    const S = {
        courses: [],
        tableRows: [],
        filteredRows: [],
        absentStudents: [],
        lateStudents: [],
        loading: false,
        notifying: false,
        lastPeriodStatsKey: '',
        currentPage: 1,
        pageSize: 20,
    };

    document.addEventListener('page:loaded', function (e) {
        if (e.detail && e.detail.page === 'attendance') {
            initAttendancePage();
        }
    });

    async function initAttendancePage() {
        const tbody = document.getElementById('attendanceTableBody');
        if (!tbody) return;

        S.lastPeriodStatsKey = '';
        bindEvents();
        initNotifyMode();
        ensureDateDefaults();
        await loadAttendanceData();
    }

    function bindEvents() {
        on('attendanceDateFrom', 'change', onDateChanged);
        on('attendanceDateTo', 'change', onDateChanged);
        on('attendanceProgramFilter', 'change', onFilterChanged);
        on('attendanceGradeFilter', 'change', onFilterChanged);
        on('attendanceClassFilter', 'change', onFilterChanged);
        on('attendanceStatusFilter', 'change', onFilterChanged);
        on('attendanceNotifyMode', 'change', onNotifyModeChanged);
        on('attendanceNotifyModeSwitch', 'change', onNotifyModeChanged);
        on('attendanceExportCsvBtn', 'click', exportVisibleRowsToCsv);
        on('attendanceGeneratePdfBtn', 'click', generatePdfReport);
        on('attendanceNotifyParentsBtn', 'click', notifyParentsForAbsences);
    }

    function ensureDateDefaults() {
        const fromInput = document.getElementById('attendanceDateFrom');
        const toInput = document.getElementById('attendanceDateTo');

        if (!fromInput || !toInput) return;

        if (!fromInput.value || !toInput.value) {
            const today = new Date().toISOString().slice(0, 10);
            fromInput.value = fromInput.value || today;
            toInput.value = toInput.value || today;
        }
    }

    async function onDateChanged() {
        const fromInput = document.getElementById('attendanceDateFrom');
        const toInput = document.getElementById('attendanceDateTo');

        if (!fromInput || !toInput) return;

        if (fromInput.value && toInput.value && fromInput.value > toInput.value) {
            toast('Start date cannot be after end date.', 'warning');
            toInput.value = fromInput.value;
        }

        await loadAttendanceData();
    }

    function onFilterChanged() {
        S.currentPage = 1;
        applyFilters();
        renderInsights();
        renderAttendancePeriodStats().catch(function () {
            // Keep UI responsive even if period stats fetch fails.
        });
        renderTrendBars().catch(function () {
            // Ignore transient trend load errors to keep table responsive.
        });
    }

    async function loadAttendanceData() {
        if (S.loading) return;
        S.loading = true;

        try {
            setTableLoading();

            const selectedDate = getSelectedDate();
            const courses = await loadCoursesForInstitution();

            const enriched = await Promise.all(courses.map(async function (course) {
                const byStatus = {
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                };

                let records = [];
                try {
                    const attendanceRes = await AttendanceAPI.getByCourse(course.course_id, { date: selectedDate });
                    records = toArray(attendanceRes);
                } catch (error) {
                    records = [];
                }

                records.forEach(function (r) {
                    const key = String(r.status || '').toLowerCase();
                    if (Object.prototype.hasOwnProperty.call(byStatus, key)) {
                        byStatus[key] += 1;
                    }
                });

                const markedCount = records.length;
                const enrolled = parseIntSafe(course.enrolled_students);
                const classRoster = parseIntSafe(course.class_student_count);
                const totalStudents = Math.max(enrolled, classRoster, markedCount);
                const present = byStatus.present;
                const absent = byStatus.absent;
                const late = byStatus.late;
                const excused = byStatus.excused;
                const attendanceRate = totalStudents > 0 ? (present / totalStudents) * 100 : 0;

                return {
                    course_id: course.course_id,
                    class_uuid: course.class_uuid || course.uuid || '',
                    class_name: course.class_name || course.class_code || ('Class ' + course.class_id),
                    class_code: course.class_code || '',
                    program_name: getProgramLabel(course),
                    program_filter: getProgramFilterValue(course),
                    teacher_name: course.teacher_name || 'Unassigned',
                    grade_name: getGradeLabelFromCourse(course),
                    grade_filter: getGradeFilterFromCourse(course),
                    total_students: totalStudents,
                    present: present,
                    absent: absent,
                    late: late,
                    excused: excused,
                    attendance_rate: attendanceRate,
                    status: markedCount > 0 ? 'marked' : 'unmarked',
                    records: records,
                };
            }));

            S.courses = enriched;
            S.absentStudents = [];
            S.lateStudents = [];

            enriched.forEach(function (course) {
                const className = course.class_name || ('Class ' + course.course_id);
                course.records.forEach(function (record) {
                    const status = String(record.status || '').toLowerCase();
                    const firstName = String(record.first_name || '').trim();
                    const lastName = String(record.last_name || '').trim();
                    const fullName = (firstName + ' ' + lastName).trim() || 'Student';
                    const studentNo = String(record.student_id_number || '').trim();
                    const suffix = studentNo ? (' (' + studentNo + ')') : '';
                    const label = fullName + suffix + ' - ' + className;

                    if (status === 'absent') {
                        S.absentStudents.push({
                            course_id: course.course_id,
                            label: label,
                        });
                    }

                    if (status === 'late') {
                        S.lateStudents.push({
                            course_id: course.course_id,
                            label: label,
                        });
                    }
                });
            });

            populateFilterOptions();
            renderAttendanceRows();
            S.currentPage = 1;
            applyFilters();
            await renderAttendancePeriodStats();
            await renderTrendBars();
            await maybeTriggerAutoParentNotify();
        } catch (error) {
            setTableError(error && error.message ? error.message : 'Failed to load attendance data.');
            toast('Unable to load attendance data from API.', 'error');
        } finally {
            S.loading = false;
        }
    }

    async function loadCoursesForInstitution() {
        const user = (typeof Auth !== 'undefined' && typeof Auth.getUser === 'function') ? Auth.getUser() : null;
        const params = {
            limit: 500,
        };
        const classParams = {
            page: 1,
            limit: 1000,
        };

        if (user && user.institution_id) {
            params.institution_id = user.institution_id;
            classParams.institution_id = user.institution_id;
        }

        const [classSubjectRes, classRes] = await Promise.all([
            API.get(API_ENDPOINTS.CLASS_SUBJECTS, params),
            API.get(API_ENDPOINTS.CLASSES, classParams),
        ]);

        const classSubjects = toArray(classSubjectRes);
        const classesPayload = classRes && classRes.data ? classRes.data : classRes;
        const classRows = Array.isArray(classesPayload && classesPayload.classes)
            ? classesPayload.classes
            : toArray(classRes);

        const classMetaById = new Map();
        classRows.forEach(function (c) {
            const classId = parseIntSafe(c.class_id);
            if (classId > 0) {
                classMetaById.set(classId, {
                    student_count: parseIntSafe(c.student_count),
                    class_uuid: String(c.uuid || c.class_uuid || '').trim(),
                });
            }
        });

        return classSubjects.map(function (course) {
            const classId = parseIntSafe(course.class_id);
            const classMeta = classMetaById.get(classId) || {};
            return Object.assign({}, course, {
                class_student_count: classMeta.student_count || 0,
                class_uuid: String(course.class_uuid || classMeta.class_uuid || '').trim(),
            });
        });
    }

    function renderAttendanceRows() {
        const tbody = document.getElementById('attendanceTableBody');
        if (!tbody) return;

        if (!S.courses.length) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:1rem;color:#6b7280;">No attendance courses available.</td></tr>';
            S.tableRows = [];
            return;
        }

        tbody.innerHTML = S.courses.map(function (row) {
            const icon = pickClassIcon(row.program_name);
            const classDisplay = escapeHtml(row.class_name);
            const codeDisplay = escapeHtml(row.class_code || 'N/A');
            const programDisplay = escapeHtml(row.program_name);
            const teacherDisplay = escapeHtml(row.teacher_name);
            const statusText = row.status === 'marked' ? 'Marked' : 'Not Marked';
            const statusClass = row.status === 'marked' ? 'status-marked' : 'status-unmarked';
            const rate = Number(row.attendance_rate || 0);
            const rateClass = row.status === 'unmarked' ? 'empty' : (rate < 85 ? 'warning' : '');
            const trClass = row.status === 'unmarked' ? 'unmarked-row' : (rate < 85 ? 'low-attendance-row' : '');
            const actionBtn = row.status === 'unmarked'
                ? '<button class="btn-mark-now" title="Mark Now" type="button"><i class="fas fa-plus"></i></button>'
                : '<button class="btn-view" title="View Details" type="button"><i class="fas fa-eye"></i></button><button class="btn-edit" title="Edit Attendance" type="button"><i class="fas fa-edit"></i></button>';

            return '<tr class="' + trClass + '" data-course-id="' + escapeHtml(String(row.course_id)) + '" data-class-uuid="' + escapeHtml(String(row.class_uuid || '')) + '" data-class="' + escapeHtml(String(row.class_uuid || row.course_id || '')) + '" data-program="' + escapeHtml(row.program_filter || '') + '" data-grade="' + escapeHtml(row.grade_filter || '') + '" data-status="' + escapeHtml(row.status) + '">'
                + '<td><div class="class-cell"><div class="class-icon"><i class="' + icon + '"></i></div><div class="class-details"><span class="class-name">' + classDisplay + '</span><span class="class-code">' + codeDisplay + '</span></div></div></td>'
                + '<td>' + programDisplay + '</td>'
                + '<td>' + teacherDisplay + '</td>'
                + '<td><span class="student-total">' + row.total_students + '</span></td>'
                + '<td><span class="present-count">' + row.present + '</span></td>'
                + '<td><span class="absent-count">' + row.absent + '</span></td>'
                + '<td><span class="late-count">' + row.late + '</span></td>'
                + '<td><div class="attendance-rate"><div class="rate-bar"><div class="rate-fill ' + rateClass + '" style="width:' + Math.round(rate) + '%"></div></div><span class="rate-text ' + rateClass + '">' + (row.status === 'unmarked' ? '-' : formatPercent(rate)) + '</span></div></td>'
                + '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>'
                + '<td><div class="attendance-actions">' + actionBtn + '</div></td>'
                + '</tr>';
        }).join('');

        S.tableRows = Array.from(tbody.querySelectorAll('tr'));

        tbody.querySelectorAll('.attendance-actions button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const row = btn.closest('tr');
                const className = row ? textFrom(row, '.class-name') : 'Selected class';
                const title = (btn.getAttribute('title') || '').toLowerCase();

                if (title.includes('mark')) {
                    openAttendanceDetails(row, className, 'mark');
                    return;
                }

                if (title.includes('edit')) {
                    openAttendanceDetails(row, className, 'edit');
                    return;
                }

                openAttendanceDetails(row, className, 'view');
            });
        });
    }

    function openAttendanceDetails(row, className, mode) {
        const courseId = row ? parseIntSafe(row.getAttribute('data-course-id')) : 0;
        if (!courseId) {
            toast('Cannot open attendance details for ' + className + ' because the course id is missing.', 'warning');
            return;
        }

        const payload = {
            course_id: courseId,
            class_uuid: row ? String(row.getAttribute('data-class-uuid') || '').trim() : '',
            class_name: className,
            class_code: row ? textFrom(row, '.class-code') : '',
            program_name: row ? textFromCell(row, 1) : '',
            teacher_name: row ? textFromCell(row, 2) : '',
            selected_date: getSelectedDate(),
            mode: String(mode || 'view'),
        };

        try {
            sessionStorage.setItem('lms_attendance_details', JSON.stringify(payload));
        } catch (error) {
            // Continue navigation even if storage is blocked.
        }
        window.location.hash = '#attendance-details';
    }

    function applyFilters() {
        const programFilter = valueOf('attendanceProgramFilter');
        const gradeFilter = valueOf('attendanceGradeFilter');
        const classFilter = valueOf('attendanceClassFilter');
        const statusFilter = valueOf('attendanceStatusFilter');

        const matchingRows = [];

        S.tableRows.forEach(function (row) {
            const rowProgram = String(row.getAttribute('data-program') || '');
            const rowGrade = String(row.getAttribute('data-grade') || '');
            const rowClass = String(row.getAttribute('data-class') || '');
            const rowStatus = String(row.getAttribute('data-status') || '');

            const programMatch = !programFilter || rowProgram.includes(programFilter);
            const gradeMatch = !gradeFilter || rowGrade === gradeFilter;
            const classMatch = !classFilter || rowClass === classFilter;
            const statusMatch = !statusFilter || rowStatus === statusFilter;

            const show = programMatch && gradeMatch && classMatch && statusMatch;
            if (show) {
                matchingRows.push(row);
            }
            row.style.display = 'none';
        });

        S.filteredRows = matchingRows;

        const total = matchingRows.length;
        const totalPages = Math.max(1, Math.ceil(total / S.pageSize));
        if (S.currentPage > totalPages) S.currentPage = totalPages;
        if (S.currentPage < 1) S.currentPage = 1;

        const startIndex = total ? ((S.currentPage - 1) * S.pageSize) : 0;
        const endIndex = Math.min(startIndex + S.pageSize, total);

        for (let i = startIndex; i < endIndex; i += 1) {
            matchingRows[i].style.display = '';
        }

        renderPaginationFooter(total, startIndex, endIndex, totalPages);

        refreshStatCardsFromVisibleRows();
    }

    function renderPaginationFooter(total, startIndex, endIndex, totalPages) {
        const info = document.getElementById('attendancePaginationInfo');
        if (info) {
            if (!total) {
                info.textContent = 'Showing 0 of 0 classes';
            } else {
                info.textContent = 'Showing ' + (startIndex + 1) + '-' + endIndex + ' of ' + total + ' classes';
            }
        }

        const controls = document.getElementById('attendancePaginationControls');
        if (!controls) return;

        if (total <= S.pageSize) {
            controls.innerHTML = '';
            return;
        }

        const maxButtons = 5;
        let startPage = Math.max(1, S.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        startPage = Math.max(1, endPage - maxButtons + 1);

        const buttons = [];
        buttons.push('<button type="button" data-page="prev"' + (S.currentPage <= 1 ? ' disabled' : '') + '><i class="fas fa-chevron-left"></i></button>');

        for (let p = startPage; p <= endPage; p += 1) {
            const isActive = p === S.currentPage;
            buttons.push('<button type="button" data-page="' + p + '" class="' + (isActive ? 'active' : '') + '"' + (isActive ? ' aria-current="page"' : '') + '>' + p + '</button>');
        }

        buttons.push('<button type="button" data-page="next"' + (S.currentPage >= totalPages ? ' disabled' : '') + '><i class="fas fa-chevron-right"></i></button>');

        controls.innerHTML = buttons.join('');

        controls.querySelectorAll('button[data-page]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const value = String(btn.getAttribute('data-page') || '');
                if (!value) return;

                if (value === 'prev') {
                    if (S.currentPage > 1) S.currentPage -= 1;
                } else if (value === 'next') {
                    if (S.currentPage < totalPages) S.currentPage += 1;
                } else {
                    const nextPage = parseIntSafe(value);
                    if (nextPage > 0) S.currentPage = nextPage;
                }

                applyFilters();
                renderInsights();
                renderTrendBars().catch(function () {
                    // Keep pagination responsive even if trend fetch fails.
                });
            });
        });
    }

    function populateFilterOptions() {
        const programSel = document.getElementById('attendanceProgramFilter');
        const gradeSel = document.getElementById('attendanceGradeFilter');
        const classSel = document.getElementById('attendanceClassFilter');
        if (!programSel || !gradeSel || !classSel) return;

        const currentProgram = String(programSel.value || '');
        const currentGrade = String(gradeSel.value || '');
        const currentClass = String(classSel.value || '');

        const programs = new Map();
        const grades = new Map();
        const classes = new Map();

        S.courses.forEach(function (c) {
            const pValue = String(c.program_filter || '').trim();
            const pLabel = String(c.program_name || '').trim();
            if (pValue && pLabel && !programs.has(pValue)) {
                programs.set(pValue, pLabel);
            }

            const gValue = String(c.grade_filter || '').trim();
            const gLabel = String(c.grade_name || '').trim();
            if (gValue && gLabel && !grades.has(gValue)) {
                grades.set(gValue, gLabel);
            }

            const cValue = String(c.class_uuid || c.course_id || '').trim();
            const cLabel = String(c.class_name || '').trim();
            if (cValue && cLabel && !classes.has(cValue)) {
                classes.set(cValue, cLabel);
            }
        });

        programSel.innerHTML = '<option value="">All Programs</option>'
            + Array.from(programs.entries())
                .map(function (entry) {
                    return '<option value="' + escapeHtml(entry[0]) + '">' + escapeHtml(entry[1]) + '</option>';
                })
                .join('');

        gradeSel.innerHTML = '<option value="">All Grade Levels</option>'
            + Array.from(grades.entries())
                .map(function (entry) {
                    return '<option value="' + escapeHtml(entry[0]) + '">' + escapeHtml(entry[1]) + '</option>';
                })
                .join('');

        classSel.innerHTML = '<option value="">All Classes</option>'
            + Array.from(classes.entries())
                .map(function (entry) {
                    return '<option value="' + escapeHtml(entry[0]) + '">' + escapeHtml(entry[1]) + '</option>';
                })
                .join('');

        if (currentProgram && programs.has(currentProgram)) {
            programSel.value = currentProgram;
        }
        if (currentGrade && grades.has(currentGrade)) {
            gradeSel.value = currentGrade;
        }
        if (currentClass && classes.has(currentClass)) {
            classSel.value = currentClass;
        }
    }

    function refreshStatCardsFromVisibleRows() {
        const visibleRows = S.tableRows.filter(function (r) { return r.style.display !== 'none'; });

        let totalStudents = 0;
        let present = 0;
        let absent = 0;
        let late = 0;
        let marked = 0;

        visibleRows.forEach(function (row) {
            const total = parseIntSafe(textFrom(row, '.student-total'));
            const p = parseIntSafe(textFrom(row, '.present-count'));
            const a = parseIntSafe(textFrom(row, '.absent-count'));
            const l = parseIntSafe(textFrom(row, '.late-count'));

            totalStudents += total;
            present += p;
            absent += a;
            late += l;

            const status = textFrom(row, '.status-badge').toLowerCase();
            if (status.includes('marked')) marked += 1;
        });

        const rate = totalStudents > 0 ? ((present / totalStudents) * 100) : 0;
        const lateRate = present > 0 ? ((late / present) * 100) : 0;
        const absentRate = totalStudents > 0 ? ((absent / totalStudents) * 100) : 0;
        const completion = visibleRows.length > 0 ? ((marked / visibleRows.length) * 100) : 0;

        setText('attendanceTodayRate', formatPercent(rate));
        setText('attendanceTodaySummary', present + ' / ' + totalStudents + ' students');

        setText('attendanceLateCount', String(late));
        setText('attendanceLateSummary', formatPercent(lateRate) + ' of present students');

        setText('attendanceAbsentCount', String(absent));
        setText('attendanceAbsentSummary', formatPercent(absentRate) + ' absence rate');

        setText('attendanceClassesMarked', marked + ' / ' + visibleRows.length);
        setText('attendanceClassesSummary', formatPercent(completion) + ' completion');
    }

    function renderInsights() {
        renderAbsentAndLateLists();
    }

    async function renderAttendancePeriodStats() {
        const filteredCourseIds = S.filteredRows.length
            ? S.filteredRows.map(function (row) { return parseIntSafe(row.getAttribute('data-course-id')); })
            : S.courses.map(function (course) { return parseIntSafe(course.course_id); });

        const courseIds = Array.from(new Set(filteredCourseIds.filter(function (v) { return v > 0; })));

        if (!courseIds.length) {
            setPeriodStat('today', null, 0);
            setPeriodStat('week', null, 0);
            setPeriodStat('month', null, 0);
            return;
        }

        const now = new Date();
        const today = toDateKey(now);

        const weekStart = new Date(now);
        const day = weekStart.getDay();
        const diffToMonday = day === 0 ? 6 : (day - 1);
        weekStart.setDate(weekStart.getDate() - diffToMonday);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const cacheKey = [
            courseIds.join(','),
            today,
            toDateKey(weekStart),
            toDateKey(monthStart)
        ].join('|');

        if (cacheKey === S.lastPeriodStatsKey) {
            return;
        }

        S.lastPeriodStatsKey = cacheKey;

        const courseIdsParam = courseIds.join(',');

        const [todayStats, weekStats, monthStats] = await Promise.all([
            fetchAttendanceSummary(today, today, courseIdsParam),
            fetchAttendanceSummary(toDateKey(weekStart), today, courseIdsParam),
            fetchAttendanceSummary(toDateKey(monthStart), today, courseIdsParam),
        ]);

        setPeriodStat('today', todayStats.rate, todayStats.marked_class_days);
        setPeriodStat('week', weekStats.rate, weekStats.marked_class_days);
        setPeriodStat('month', monthStats.rate, monthStats.marked_class_days);
    }

    async function fetchAttendanceSummary(startDate, endDate, courseIdsParam) {
        const params = {
            start_date: startDate,
            end_date: endDate,
        };

        if (courseIdsParam) {
            params.course_ids = courseIdsParam;
        }

        const res = await AttendanceAPI.getSummary(params);
        return (res && res.data) ? res.data : (res || {});
    }

    function setPeriodStat(period, rate, markedCount) {
        let rateId = '';
        let metaId = '';

        if (period === 'today') {
            rateId = 'attendanceTodayPeriodRate';
            metaId = 'attendanceTodayPeriodMeta';
        } else if (period === 'week') {
            rateId = 'attendanceWeekPeriodRate';
            metaId = 'attendanceWeekPeriodMeta';
        } else {
            rateId = 'attendanceMonthPeriodRate';
            metaId = 'attendanceMonthPeriodMeta';
        }

        if (rate == null || isNaN(rate)) {
            setText(rateId, '-');
            setText(metaId, 'No marked classes');
            return;
        }

        setText(rateId, formatPercent(rate));
        setText(metaId, (markedCount || 0) + ' marked class-day record' + ((markedCount || 0) === 1 ? '' : 's'));
    }

    function toDateKey(value) {
        const d = value instanceof Date ? value : new Date(value);
        if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    function renderAbsentAndLateLists() {
        const visibleRows = S.tableRows.filter(function (r) { return r.style.display !== 'none'; });

        const visibleCourseIds = new Set(visibleRows.map(function (r) {
            return Number(r.getAttribute('data-course-id'));
        }));

        const absentItems = [];
        const lateItems = [];

        S.absentStudents.forEach(function (entry) {
            if (visibleCourseIds.has(entry.course_id)) {
                absentItems.push(entry.label);
            }
        });
        S.lateStudents.forEach(function (entry) {
            if (visibleCourseIds.has(entry.course_id)) {
                lateItems.push(entry.label);
            }
        });

        renderList('attendanceAbsentList', absentItems);
        renderList('attendanceLateList', lateItems);

        setText('attendanceAbsentTotalBadge', String(absentItems.length));
        setText('attendanceLateTotalBadge', String(lateItems.length));
    }

    async function renderTrendBars() {
        const target = document.getElementById('attendanceTrendBars');
        if (!target) return;

        const from = valueOf('attendanceDateFrom');
        const to = valueOf('attendanceDateTo');
        setText('attendanceTrendRangeLabel', from && to ? (from + ' to ' + to) : 'Current range');

        const visibleRows = S.tableRows.filter(function (r) { return r.style.display !== 'none'; });
        const courseIds = visibleRows
            .map(function (r) { return parseIntSafe(r.getAttribute('data-course-id')); })
            .filter(function (v) { return v > 0; });

        if (!courseIds.length) {
            target.innerHTML = '<div class="attendance-list-empty">No trend data in current filter.</div>';
            return;
        }

        const days = buildDateRange(from, to, 7);
        const samples = [];

        for (let i = 0; i < days.length; i += 1) {
            const day = days[i];
            const dayRates = await Promise.all(courseIds.map(async function (courseId) {
                try {
                    const res = await AttendanceAPI.getByCourse(courseId, { date: day });
                    const records = toArray(res);
                    if (!records.length) return null;
                    const present = records.filter(function (r) { return String(r.status || '').toLowerCase() === 'present'; }).length;
                    return (present / records.length) * 100;
                } catch (error) {
                    return null;
                }
            }));

            const valid = dayRates.filter(function (v) { return typeof v === 'number' && !isNaN(v); });
            const avg = valid.length ? (valid.reduce(function (a, b) { return a + b; }, 0) / valid.length) : 0;
            samples.push({
                label: day.slice(5),
                value: avg,
            });
        }

        target.innerHTML = samples.map(function (item) {
            const pct = Math.max(4, Math.round(item.value));
            return '<div class="trend-col">'
                + '<div class="trend-bar" style="height:' + pct + '%"></div>'
                + '<span class="trend-label">' + escapeHtml(item.label) + '</span>'
                + '<span class="trend-value">' + formatPercent(item.value) + '</span>'
                + '</div>';
        }).join('');
    }

    function exportVisibleRowsToCsv() {
        const rows = S.tableRows.filter(function (r) { return r.style.display !== 'none'; });
        if (!rows.length) {
            toast('No attendance rows to export.', 'warning');
            return;
        }

        const headers = ['Class', 'Program', 'Subject Teacher', 'Total Students', 'Present', 'Absent', 'Late', 'Rate', 'Status'];
        const data = rows.map(function (row) {
            return [
                textFrom(row, '.class-name'),
                textFromCell(row, 1),
                textFromCell(row, 2),
                textFrom(row, '.student-total'),
                textFrom(row, '.present-count'),
                textFrom(row, '.absent-count'),
                textFrom(row, '.late-count'),
                textFrom(row, '.rate-text'),
                textFrom(row, '.status-badge'),
            ];
        });

        const csv = [headers].concat(data)
            .map(function (line) {
                return line.map(csvEscape).join(',');
            })
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance-report.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        toast('CSV exported successfully.', 'success');
    }

    function generatePdfReport() {
        toast('Preparing PDF…', 'info');

        const programFilter = valueOf('attendanceProgramFilter');
        const gradeFilter = valueOf('attendanceGradeFilter');
        const classFilter = valueOf('attendanceClassFilter');
        const statusFilter = valueOf('attendanceStatusFilter');
        const fromDate = valueOf('attendanceDateFrom');
        const toDate = valueOf('attendanceDateTo');

        const rows = S.courses.filter(function (course) {
            const rowProgram = String(course.program_filter || '');
            const rowGrade = String(course.grade_filter || '');
            const rowClass = String(course.class_uuid || course.course_id || '');
            const rowStatus = String(course.status || '');

            const programMatch = !programFilter || rowProgram.includes(programFilter);
            const gradeMatch = !gradeFilter || rowGrade === gradeFilter;
            const classMatch = !classFilter || rowClass === classFilter;
            const statusMatch = !statusFilter || rowStatus === statusFilter;
            return programMatch && gradeMatch && classMatch && statusMatch;
        });

        if (!rows.length) {
            toast('No attendance rows to export.', 'warning');
            return;
        }

        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const e = function (v) {
            return String(v == null ? '—' : v)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        const badge = function (status) {
            const key = String(status || '').toLowerCase();
            const map = {
                marked: '#15803d;background:#dcfce7',
                unmarked: '#854d0e;background:#fef9c3',
            };
            const c = map[key] || '#64748b;background:#f1f5f9';
            return '<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;color:' + c + '">' + e(key || 'unknown') + '</span>';
        };

        const filterLabel = [
            fromDate || toDate ? ('Range: ' + (fromDate || toDate || '—') + ' to ' + (toDate || fromDate || '—')) : '',
            programFilter ? ('Program: ' + e(programFilter.replace(/-/g, ' '))) : '',
            gradeFilter ? ('Grade: ' + e(gradeFilter.replace(/-/g, ' '))) : '',
            classFilter ? ('Class: ' + e(String((S.courses.find(function (c) { return String(c.class_uuid || c.course_id || '') === classFilter; }) || {}).class_name || classFilter))) : '',
            statusFilter ? ('Status: ' + e(statusFilter)) : '',
        ].filter(Boolean).join(' | ');

        const tableRows = rows.map(function (r, i) {
            const rate = Number(r.attendance_rate || 0);
            return ''
                + '<tr style="background:' + (i % 2 === 0 ? '#fff' : '#f8fafc') + '">'
                + '<td>' + (i + 1) + '</td>'
                + '<td><strong>' + e(r.class_name) + '</strong><br><span style="color:#64748b;font-size:11px;font-family:monospace">' + e(r.class_code || 'N/A') + '</span></td>'
                + '<td>' + e(r.program_name || '—') + '</td>'
                + '<td>' + e(r.teacher_name || '—') + '</td>'
                + '<td style="text-align:center">' + e(r.total_students || 0) + '</td>'
                + '<td style="text-align:center">' + e(r.present || 0) + '</td>'
                + '<td style="text-align:center">' + e(r.absent || 0) + '</td>'
                + '<td style="text-align:center">' + e(r.late || 0) + '</td>'
                + '<td style="text-align:center">' + e(formatPercent(rate)) + '</td>'
                + '<td>' + badge(r.status) + '</td>'
                + '</tr>';
        }).join('');

        const html = '<!DOCTYPE html>'
            + '<html lang="en">'
            + '<head>'
            + '<meta charset="UTF-8">'
            + '<title>Attendance Export — ' + e(date) + '</title>'
            + '<style>'
            + '  * { box-sizing: border-box; margin: 0; padding: 0; }'
            + '  body { font-family: "Segoe UI", Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 24px; }'
            + '  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #006a3f; padding-bottom: 12px; }'
            + '  .header h1 { font-size: 18px; color: #006a3f; }'
            + '  .header .meta { text-align: right; color: #64748b; font-size: 11px; line-height: 1.6; }'
            + '  .filter-bar { font-size: 11px; color: #64748b; margin-bottom: 12px; }'
            + '  table { width: 100%; border-collapse: collapse; }'
            + '  th { background: #006a3f; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; white-space: nowrap; }'
            + '  td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }'
            + '  .footer { margin-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }'
            + '  @media print {'
            + '    body { padding: 0; }'
            + '    @page { margin: 15mm; size: A4 landscape; }'
            + '    button { display: none !important; }'
            + '  }'
            + '</style>'
            + '</head>'
            + '<body>'
            + '  <div class="header">'
            + '    <div>'
            + '      <h1>&#128197; Attendance Report</h1>'
            + '      <p style="color:#64748b;margin-top:2px">Total: <strong>' + rows.length + '</strong> class' + (rows.length !== 1 ? 'es' : '') + '</p>'
            + '    </div>'
            + '    <div class="meta">'
            + '      <div>Exported: ' + e(date) + '</div>'
            + '      <button onclick="window.print()" style="margin-top:6px;padding:4px 12px;background:#006a3f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px">&#128438; Print / Save PDF</button>'
            + '    </div>'
            + '  </div>'
            + (filterLabel ? ('<div class="filter-bar">Filters: ' + e(filterLabel) + '</div>') : '')
            + '  <table>'
            + '    <thead>'
            + '      <tr>'
            + '        <th>#</th><th>Class</th><th>Program</th><th>Teacher</th>'
            + '        <th>Total</th><th>Present</th><th>Absent</th><th>Late</th>'
            + '        <th>Rate</th><th>Status</th>'
            + '      </tr>'
            + '    </thead>'
            + '    <tbody>' + tableRows + '</tbody>'
            + '  </table>'
            + '  <div class="footer">Generated by LMS &bull; ' + e(date) + '</div>'
            + '</body>'
            + '</html>';

        const win = window.open('', '_blank', 'width=1100,height=750');
        if (!win) {
            toast('Allow pop-ups to export PDF', 'warning');
            return;
        }

        win.document.write(html);
        win.document.close();
        win.focus();
        toast('PDF ready — ' + rows.length + ' class' + (rows.length !== 1 ? 'es' : ''), 'success');
    }

    async function notifyParentsForAbsences(options) {
        const opts = options || {};
        const silent = !!opts.silent;

        if (S.notifying) return;

        const visibleCourseIds = new Set(
            S.tableRows
                .filter(function (r) { return r.style.display !== 'none'; })
                .map(function (r) { return parseIntSafe(r.getAttribute('data-course-id')); })
                .filter(function (v) { return v > 0; })
        );

        const visibleCourses = S.courses.filter(function (course) {
            return visibleCourseIds.has(parseIntSafe(course.course_id));
        });

        const absentByStudent = new Map();
        visibleCourses.forEach(function (course) {
            const className = String(course.class_name || ('Class ' + course.course_id));
            const records = Array.isArray(course.records) ? course.records : [];

            records.forEach(function (record) {
                const status = String(record.status || '').toLowerCase();
                if (status !== 'absent') return;

                const studentId = parseIntSafe(record.student_id);
                if (studentId <= 0) return;

                const firstName = String(record.first_name || '').trim();
                const lastName = String(record.last_name || '').trim();
                const studentName = (firstName + ' ' + lastName).trim() || 'Student';
                const studentNo = String(record.student_id_number || '').trim();

                if (!absentByStudent.has(studentId)) {
                    absentByStudent.set(studentId, {
                        student_id: studentId,
                        student_name: studentName,
                        student_id_number: studentNo,
                        class_names: new Set(),
                    });
                }

                absentByStudent.get(studentId).class_names.add(className);
            });
        });

        if (!absentByStudent.size) {
            if (!silent) toast('No absences found for parent notifications.', 'info');
            return { queued: 0, failed: 0 };
        }

        const user = (typeof Auth !== 'undefined' && typeof Auth.getUser === 'function') ? Auth.getUser() : null;
        const senderUserId = parseIntSafe(user && user.user_id);
        if (senderUserId <= 0) {
            if (!silent) toast('Unable to identify current user for notification sender.', 'error');
            return { queued: 0, failed: absentByStudent.size };
        }

        S.notifying = true;
        const notifyBtn = document.getElementById('attendanceNotifyParentsBtn');
        if (notifyBtn) notifyBtn.disabled = true;

        try {
            const selectedDate = getSelectedDate();
            const parentUserIdCache = new Map();
            let queued = 0;
            let failed = 0;

            for (const entry of absentByStudent.values()) {
                let parentLinks = [];

                try {
                    const parentRes = await StudentRelationAPI.getParents(entry.student_id);
                    parentLinks = toArray(parentRes);
                } catch (error) {
                    failed += 1;
                    continue;
                }

                if (!parentLinks.length) continue;

                for (let i = 0; i < parentLinks.length; i += 1) {
                    const parentId = parseIntSafe(parentLinks[i].parent_id);
                    if (parentId <= 0) continue;

                    let parentUserId = parentUserIdCache.get(parentId) || 0;
                    if (parentUserId <= 0) {
                        try {
                            const parentDetail = await API.get(API_ENDPOINTS.PARENT_BY_ID(parentId));
                            const parentData = (parentDetail && parentDetail.data && !Array.isArray(parentDetail.data))
                                ? parentDetail.data
                                : parentDetail;
                            parentUserId = parseIntSafe(parentData && parentData.user_id);
                            if (parentUserId > 0) {
                                parentUserIdCache.set(parentId, parentUserId);
                            }
                        } catch (error) {
                            parentUserId = 0;
                        }
                    }

                    if (parentUserId <= 0) {
                        failed += 1;
                        continue;
                    }

                    const classes = Array.from(entry.class_names);
                    const classText = classes.join(', ');
                    const studentLabel = entry.student_id_number
                        ? (entry.student_name + ' (' + entry.student_id_number + ')')
                        : entry.student_name;

                    const payload = {
                        sender_id: senderUserId,
                        user_id: parentUserId,
                        course_id: parseIntSafe(visibleCourses[0] && visibleCourses[0].course_id) || null,
                        notification_type: 'attendance_alert',
                        title: 'Student Absence Alert',
                        message: studentLabel + ' was marked absent on ' + selectedDate + ' in ' + classText + '.',
                        link: '#attendance',
                    };

                    try {
                        await API.post(API_ENDPOINTS.NOTIFICATIONS, payload);
                        queued += 1;
                    } catch (error) {
                        failed += 1;
                    }
                }
            }

            if (!queued && failed) {
                if (!silent) toast('Failed to queue parent notifications. Check permissions and parent links.', 'error');
                return { queued: 0, failed: failed };
            }

            if (failed) {
                if (!silent) toast('Queued ' + queued + ' notification(s) with ' + failed + ' failure(s).', 'warning');
                return { queued: queued, failed: failed };
            }

            if (!silent) toast('Queued ' + queued + ' parent notification(s) successfully.', 'success');
            return { queued: queued, failed: 0 };
        } finally {
            S.notifying = false;
            if (notifyBtn) notifyBtn.disabled = false;
        }
    }

    function initNotifyMode() {
        const modeSel = document.getElementById('attendanceNotifyMode');
        if (!modeSel) return;
        const modeSwitch = document.getElementById('attendanceNotifyModeSwitch');

        let mode = 'manual';
        try {
            const saved = localStorage.getItem('lms_attendance_notify_mode');
            if (saved === 'auto' || saved === 'manual') mode = saved;
        } catch (error) {
            mode = 'manual';
        }

        modeSel.value = mode;
        if (modeSwitch) {
            modeSwitch.checked = mode === 'auto';
        }
        updateNotifyModeUi(mode);
    }

    function onNotifyModeChanged() {
        const modeSel = document.getElementById('attendanceNotifyMode');
        const modeSwitch = document.getElementById('attendanceNotifyModeSwitch');

        let mode = valueOf('attendanceNotifyMode') || 'manual';

        if (modeSwitch) {
            mode = modeSwitch.checked ? 'auto' : 'manual';
        }

        if (modeSel) {
            modeSel.value = mode;
        }

        updateNotifyModeUi(mode);

        try {
            localStorage.setItem('lms_attendance_notify_mode', mode);
        } catch (error) {
            // Ignore storage failures.
        }

        if (mode === 'auto') {
            maybeTriggerAutoParentNotify();
        }
    }

    function isAutoNotifyEnabled() {
        return valueOf('attendanceNotifyMode') === 'auto';
    }

    function updateNotifyModeUi(mode) {
        const manualLabel = document.getElementById('attendanceNotifyManualLabel');
        const autoLabel = document.getElementById('attendanceNotifyAutoLabel');

        if (manualLabel) {
            manualLabel.classList.toggle('active', mode !== 'auto');
        }
        if (autoLabel) {
            autoLabel.classList.toggle('active', mode === 'auto');
        }
    }

    function getAutoNotifyKey() {
        const from = valueOf('attendanceDateFrom') || '';
        const to = valueOf('attendanceDateTo') || '';
        const selected = getSelectedDate();
        return AUTO_NOTIFY_STORAGE_PREFIX + selected + '_' + from + '_' + to;
    }

    async function maybeTriggerAutoParentNotify() {
        if (!isAutoNotifyEnabled()) return;

        const key = getAutoNotifyKey();
        try {
            if (sessionStorage.getItem(key) === '1') return;
        } catch (error) {
            // Continue even if storage unavailable.
        }

        const result = await notifyParentsForAbsences({ silent: true });
        if (result && result.queued > 0) {
            toast('Auto notification sent to ' + result.queued + ' parent recipient(s).', 'success');
            try {
                sessionStorage.setItem(key, '1');
            } catch (error) {
                // Ignore storage failures.
            }
        }
    }

    function renderList(id, items) {
        const el = document.getElementById(id);
        if (!el) return;

        if (!items.length) {
            el.innerHTML = '<li class="attendance-list-empty">No records in current filter.</li>';
            return;
        }

        el.innerHTML = items.slice(0, 8).map(function (item) {
            return '<li>' + escapeHtml(item) + '</li>';
        }).join('');
    }

    function formatPercent(n) {
        return (Math.round(n * 10) / 10).toFixed(1) + '%';
    }

    function parseIntSafe(v) {
        const n = parseInt(String(v || '').replace(/[^0-9-]/g, ''), 10);
        return Number.isFinite(n) ? n : 0;
    }

    function normalize(v) {
        return String(v || '').trim().toLowerCase().replace(/\s+/g, '-');
    }

    function getSelectedDate() {
        const to = valueOf('attendanceDateTo');
        const from = valueOf('attendanceDateFrom');
        return to || from || new Date().toISOString().slice(0, 10);
    }

    function getProgramLabel(course) {
        return String(
            course.program_name
            || course.program
            || course.department_name
            || course.track_name
            || 'N/A'
        ).trim();
    }

    function getProgramFilterValue(course) {
        return normalize(getProgramLabel(course));
    }

    function getGradeLabelFromCourse(course) {
        const direct = String(
            course.grade_level_name
            || course.grade_name
            || course.grade_level
            || course.level_name
            || ''
        ).trim();

        if (direct) return direct;

        const fromClass = extractGradeFromText(course.class_name || course.class_code || '');
        return fromClass || '';
    }

    function getGradeFilterFromCourse(course) {
        const label = getGradeLabelFromCourse(course);
        return label ? normalize(label) : '';
    }

    function extractGradeFromText(value) {
        const text = String(value || '').trim();
        if (!text) return '';

        const patterns = [
            /(shs\s*[1-3])/i,
            /(jhs\s*[1-3])/i,
            /(grade\s*\d{1,2})/i,
            /(form\s*\d{1,2})/i,
        ];

        for (let i = 0; i < patterns.length; i += 1) {
            const match = text.match(patterns[i]);
            if (match && match[1]) {
                return match[1].toUpperCase().replace(/\s+/g, ' ');
            }
        }

        return '';
    }

    function pickClassIcon(programName) {
        const p = normalize(programName);
        if (p.includes('science')) return 'fas fa-flask';
        if (p.includes('business')) return 'fas fa-briefcase';
        if (p.includes('art')) return 'fas fa-palette';
        return 'fas fa-book';
    }

    function setTableLoading() {
        const tbody = document.getElementById('attendanceTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:1rem;color:#6b7280;">Loading attendance...</td></tr>';
        }
    }

    function setTableError(message) {
        const tbody = document.getElementById('attendanceTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:1rem;color:#dc2626;">' + escapeHtml(message) + '</td></tr>';
        }
    }

    function toArray(apiResult) {
        if (Array.isArray(apiResult)) return apiResult;
        if (Array.isArray(apiResult && apiResult.data)) return apiResult.data;
        if (Array.isArray(apiResult && apiResult.data && apiResult.data.data)) return apiResult.data.data;
        if (Array.isArray(apiResult && apiResult.items)) return apiResult.items;
        return [];
    }

    function buildDateRange(from, to, maxDays) {
        const end = (to || from || new Date().toISOString().slice(0, 10));
        const start = (from || end);
        const startDate = new Date(start + 'T00:00:00');
        const endDate = new Date(end + 'T00:00:00');
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return [end];
        }

        const days = [];
        const cursor = new Date(startDate);
        while (cursor <= endDate) {
            days.push(cursor.toISOString().slice(0, 10));
            cursor.setDate(cursor.getDate() + 1);
            if (days.length >= maxDays) break;
        }

        if (!days.length) return [end];
        return days;
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function valueOf(id) {
        const el = document.getElementById(id);
        return el ? String(el.value || '').trim().toLowerCase() : '';
    }

    function textFrom(row, selector) {
        if (!row) return '';
        const el = row.querySelector(selector);
        return el ? String(el.textContent || '').trim() : '';
    }

    function textFromCell(row, index) {
        if (!row || !row.cells || !row.cells[index]) return '';
        return String(row.cells[index].textContent || '').trim();
    }

    function on(id, eventName, handler) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(eventName, handler);
    }

    function toast(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type || 'info');
            return;
        }
        console.log((type || 'info').toUpperCase() + ': ' + message);
    }

    function csvEscape(value) {
        const s = String(value == null ? '' : value);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();

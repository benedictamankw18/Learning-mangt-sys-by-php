/* ============================================
   Admin Grade Review Workspace
============================================ */
(function () {
    'use strict';

    const state = {
        loading: false,
        academicYears: [],
        semesters: [],
        classes: [],
        subjects: [],
        users: [],
        reports: [],
        scales: [],
        currentYearId: '',
        currentSemesterId: '',
        filters: {
            academic_year_id: '',
            semester_id: '',
            class_id: '',
            subject_id: '',
            teacher_id: '',
            status: '',
            search: '',
        },
        selectedUuids: new Set(),
        detailCache: new Map(),
        activeBands: [],
        selectedScaleCategoryKey: '',
        selectedReport: null,
        summaryChart: null,
    };

    let dom = {};

    document.addEventListener('page:loaded', function (event) {
        if (event.detail && event.detail.page === 'grades') {
            init();
        }
    });

    bootIfVisible();

    function bootIfVisible() {
        const root = document.getElementById('admGradesRoot');
        if (!root || root.dataset.bound === '1') return;
        init();
    }

    function init() {
        const root = document.getElementById('admGradesRoot');
        if (!root || root.dataset.bound === '1') return;

        root.dataset.bound = '1';
        bindDom();
        bindEvents();
        loadData();
    }

    function bindDom() {
        dom.root = document.getElementById('admGradesRoot');
        dom.compareBtn = document.getElementById('admGradesCompareBtn');
        dom.refreshBtn = document.getElementById('admGradesRefreshBtn');
        dom.exportBtn = document.getElementById('admGradesExportBtn');
        dom.clearFiltersBtn = document.getElementById('admGradesClearFiltersBtn');
        dom.bulkPublishBtn = document.getElementById('admGradesBulkPublishBtn');
        dom.bulkApproveBtn = document.getElementById('admGradesBulkApproveBtn');
        dom.bulkRejectBtn = document.getElementById('admGradesBulkRejectBtn');

        dom.kpis = {
            total: document.getElementById('admGradesKpiTotal'),
            pending: document.getElementById('admGradesKpiPending'),
            approved: document.getElementById('admGradesKpiApproved'),
            published: document.getElementById('admGradesKpiPublished'),
            rejected: document.getElementById('admGradesKpiRejected'),
            average: document.getElementById('admGradesKpiAverage'),
        };

        dom.filters = {
            academicYear: document.getElementById('admGradesAcademicYear'),
            semester: document.getElementById('admGradesSemester'),
            class: document.getElementById('admGradesClass'),
            subject: document.getElementById('admGradesSubject'),
            teacher: document.getElementById('admGradesTeacher'),
            status: document.getElementById('admGradesStatus'),
            search: document.getElementById('admGradesSearch'),
        };

        dom.selectAll = document.getElementById('admGradesSelectAll');
        dom.queueBody = document.getElementById('admGradesQueueBody');
        dom.scaleCategory = document.getElementById('admGradesScaleCategory');
        dom.scaleStatus = document.getElementById('admGradesScaleStatus');
        dom.summaryList = document.getElementById('admGradesSummaryList');
        dom.summaryCanvas = document.getElementById('admGradesSummaryChart');

        dom.drawer = {
            overlay: document.getElementById('admGradesDrawerOverlay'),
            title: document.getElementById('admGradesDrawerTitle'),
            subtitle: document.getElementById('admGradesDrawerSubtitle'),
            student: document.getElementById('admGradesDrawerStudent'),
            className: document.getElementById('admGradesDrawerClass'),
            term: document.getElementById('admGradesDrawerTerm'),
            workflow: document.getElementById('admGradesDrawerWorkflow'),
            generatedBy: document.getElementById('admGradesDrawerGeneratedBy'),
            generatedAt: document.getElementById('admGradesDrawerGeneratedAt'),
            gpa: document.getElementById('admGradesDrawerGpa'),
            attendance: document.getElementById('admGradesDrawerAttendance'),
            detailsBody: document.getElementById('admGradesDrawerDetailsBody'),
            comment: document.getElementById('admGradesDrawerComment'),
            approveBtn: document.getElementById('admGradesDrawerApproveBtn'),
            rejectBtn: document.getElementById('admGradesDrawerRejectBtn'),
            publishBtn: document.getElementById('admGradesDrawerPublishBtn'),
            closeBtn: document.getElementById('admGradesDrawerCloseBtn'),
        };
    }

    function bindEvents() {
        if (dom.compareBtn) {
            dom.compareBtn.addEventListener('click', function () {
                const url = buildComparisonUrl();
                window.location.href = url;
            });
        }

        dom.refreshBtn?.addEventListener('click', function () {
            loadData(true);
        });

        dom.exportBtn?.addEventListener('click', exportVisibleReports);
        dom.clearFiltersBtn?.addEventListener('click', clearFilters);
        dom.bulkPublishBtn?.addEventListener('click', bulkPublishSelected);
        dom.bulkApproveBtn?.addEventListener('click', bulkApproveSelected);
        dom.bulkRejectBtn?.addEventListener('click', bulkRejectSelected);
        dom.scaleCategory?.addEventListener('change', onScaleCategoryChange);

        Object.values(dom.filters).forEach(function (field) {
            field?.addEventListener('change', onFilterChange);
            field?.addEventListener('input', onFilterChange);
        });

        dom.selectAll?.addEventListener('change', function () {
            const checked = !!this.checked;
            const rows = getVisibleReports();
            if (checked) {
                rows.forEach(function (report) {
                    state.selectedUuids.add(report.uuid);
                });
            } else {
                rows.forEach(function (report) {
                    state.selectedUuids.delete(report.uuid);
                });
            }
            renderQueue();
            syncSelectAllState();
        });

        dom.queueBody?.addEventListener('click', onQueueAction);
        dom.drawer.closeBtn?.addEventListener('click', closeDrawer);
        dom.drawer.overlay?.addEventListener('click', function (event) {
            if (event.target === dom.drawer.overlay) closeDrawer();
        });
        dom.drawer.approveBtn?.addEventListener('click', approveSelectedReport);
        dom.drawer.rejectBtn?.addEventListener('click', rejectSelectedReport);
        dom.drawer.publishBtn?.addEventListener('click', publishSelectedReport);

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeDrawer();
            }
        });
    }

    async function loadData(forceReload) {
        if (state.loading && !forceReload) return;
        state.loading = true;
        showQueueLoading();

        try {
            const [yearsRes, semestersRes, classesRes, subjectsRes, usersRes, scalesRes] = await Promise.all([
                API.get('/api/academic-years', { limit: 200 }),
                API.get('/api/semesters', { limit: 200 }),
                ClassAPI.getAll ? ClassAPI.getAll({ limit: 500 }) : API.get(API_ENDPOINTS.CLASSES, { limit: 500 }),
                SubjectAPI.getAll ? SubjectAPI.getAll({ limit: 500 }) : API.get(API_ENDPOINTS.SUBJECTS, { limit: 500 }),
                UserAPI.getAll ? UserAPI.getAll({ limit: 500 }) : API.get(API_ENDPOINTS.USERS, { limit: 500 }),
                GradeScaleAPI.getAll ? GradeScaleAPI.getAll() : API.get(API_ENDPOINTS.GRADE_SCALES),
            ]);

            state.academicYears = toList(yearsRes);
            state.semesters = toList(semestersRes);
            state.classes = toList(classesRes);
            state.subjects = toList(subjectsRes);
            state.users = toList(usersRes);
            state.scales = toList(scalesRes);

            const currentYear = unwrapSingle(await API.get(API_ENDPOINTS.ACADEMIC_YEAR_CURRENT));
            const currentSemester = unwrapSingle(await API.get(API_ENDPOINTS.SEMESTER_CURRENT));

            state.currentYearId = String(currentYear?.academic_year_id || currentYear?.id || state.academicYears[0]?.academic_year_id || '');
            state.currentSemesterId = String(currentSemester?.semester_id || currentSemester?.id || state.semesters[0]?.semester_id || '');

            if (!state.filters.academic_year_id) state.filters.academic_year_id = state.currentYearId;
            if (!state.filters.semester_id) state.filters.semester_id = state.currentSemesterId;

            populateFilterOptions();
            await loadReports();
            renderAll();
        } catch (error) {
            showError(error?.message || 'Failed to load grade review data');
        } finally {
            state.loading = false;
        }
    }

    async function loadReports() {
        const params = {
            academic_year_id: state.filters.academic_year_id || state.currentYearId || '',
            semester_id: state.filters.semester_id || state.currentSemesterId || '',
            page: 1,
            limit: 60,
        };

        const [reportsRes, statsRes] = await Promise.all([
            GradeReportAPI.getAll(params),
            GradeReportAPI.getStatistics(params).catch(function () { return null; }),
        ]);

        const reports = toReportList(reportsRes);
        const stats = unwrapSingle(statsRes) || {};
        state.reports = reports;

        // Load details for the current queue so subject filters and charts can work without hardcoded values.
        await hydrateReportDetails(reports);
        state.detailCache.clear();
        reports.forEach(function (report) {
            state.detailCache.set(report.uuid, report.details || []);
        });

        state.activeBands = buildActiveBands(state.scales);
        renderStats(stats);
    }

    async function hydrateReportDetails(reports) {
        const chunkSize = 8;
        for (let index = 0; index < reports.length; index += chunkSize) {
            const chunk = reports.slice(index, index + chunkSize);
            const results = await Promise.all(chunk.map(function (report) {
                return GradeReportAPI.getById(report.uuid).then(unwrapSingle).catch(function () { return null; });
            }));

            results.forEach(function (detail, offset) {
                const report = chunk[offset];
                if (!report || !detail) return;
                report.details = Array.isArray(detail.details) ? detail.details : [];
                report.teacher_comment = detail.teacher_comment ?? report.teacher_comment;
                report.principal_comment = detail.principal_comment ?? report.principal_comment;
                report.generated_by = detail.generated_by ?? report.generated_by;
                report.generated_at = detail.generated_at ?? report.generated_at;
                report.is_published = detail.is_published ?? report.is_published;
                report.Approved = detail.Approved ?? report.Approved;
            });
        }
    }

    function renderAll() {
        populateFilterOptions();
        populateScaleCategoryOptions();
        renderScalePanel();
        renderStats();
        renderQueue();
        renderSummaryChart();
    }

    function renderStats(stats) {
        const reports = getVisibleReports();
        const summary = summarizeReports(reports);

        const gradeCounts = reports.reduce(function (acc, report) {
            const grade = getReportGrade(report);
            if (!grade || grade === '-') return acc;
            acc[grade] = (acc[grade] || 0) + 1;
            return acc;
        }, {});

        const topGradeEntry = Object.entries(gradeCounts).sort(function (a, b) {
            return b[1] - a[1];
        })[0] || null;

        const mostCommonGradeText = topGradeEntry
            ? (topGradeEntry[0] + ' (' + topGradeEntry[1] + ')')
            : '-';

        setText(dom.kpis.total, String(reports.length));
        setText(dom.kpis.pending, String(summary.pending));
        setText(dom.kpis.approved, String(summary.approved));
        setText(dom.kpis.published, String(summary.published));
        setText(dom.kpis.rejected, String(summary.rejected));
        setText(dom.kpis.average, mostCommonGradeText);
    }

    function renderScalePanel() {
        if (!dom.scaleStatus) return;

        const activeBands = state.activeBands.length ? state.activeBands : buildActiveBands(state.scales);
        if (!activeBands.length) {
            if (dom.scaleCategory) {
                dom.scaleCategory.innerHTML = '<option value="">No active categories</option>';
            }
            dom.scaleStatus.innerHTML = '<div class="adm-grades-empty-state">No active grading scale was found.</div>';
            return;
        }

        const group = getSelectedBandGroup() || activeBands[0];
        const rows = group.rows || [];

        if (dom.drawer?.subtitle) {
            const categoryLabel = group.name || 'Active scale';
            const hint = dom.drawer.subtitle.textContent || '-';
            if (!String(hint).includes('Scale:')) {
                dom.drawer.subtitle.textContent = hint + ' | Scale: ' + categoryLabel;
            }
        }

        dom.scaleStatus.innerHTML = [
            '<div class="adm-grades-summary-item"><strong>' + esc(group.name || 'Active scale') + '</strong><span class="adm-grades-chip muted">' + rows.length + ' band(s)</span></div>',
            '<div class="adm-grades-summary-list">',
            rows.map(function (row) {
                return '<div class="adm-grades-summary-item"><span>' + esc(row.grade || row.grade_letter || 'Band') + ' <span class="adm-grades-note">' + esc(formatRange(row.min_score, row.max_score)) + '</span></span><span>' + esc(row.Interpretation || row.remark || row.grade_remark || '-') + '</span></div>';
            }).join(''),
            '</div>',
        ].join('');
    }

    function renderQueue() {
        if (!dom.queueBody) return;

        const rows = getVisibleReports();
        if (!rows.length) {
            dom.queueBody.innerHTML = '<tr><td colspan="9"><div class="adm-grades-empty">No grade reports match the current filters.</div></td></tr>';
            syncSelectAllState();
            return;
        }

        dom.queueBody.innerHTML = rows.map(function (report) {
            const status = deriveStatus(report);
            const statusLabel = statusLabelFor(status);
            const checked = state.selectedUuids.has(report.uuid) ? 'checked' : '';
            const generatedBy = formatGeneratedBy(report.generated_by);
            const detailSubjects = summarizeSubjects(report);

            return [
                '<tr data-uuid="' + esc(report.uuid) + '">',
                '<td><input type="checkbox" class="adm-grades-row-select" data-uuid="' + esc(report.uuid) + '" ' + checked + ' /></td>',
                '<td>',
                '<strong>' + esc(report.student_name || 'Student') + '</strong><br />',
                '<small>' + esc(detailSubjects || report.student_number || '-') + '</small>',
                '</td>',
                '<td>' + esc(report.class_name || '-') + '</td>',
                '<td>' + esc([report.semester_name, report.academic_year].filter(Boolean).join(' / ') || '-') + '</td>',
                '<td>' + esc(getReportGrade(report)) + '</td>',
                '<td>' + esc(formatNumber(report.attendance_percentage, 1)) + '%</td>',
                '<td><span class="adm-grades-chip ' + esc(status) + '">' + esc(statusLabel) + '</span></td>',
                '<td>' + esc(generatedBy) + '<br /><small>' + esc(formatDateTime(report.generated_at)) + '</small></td>',
                '<td>',
                '<div class="adm-grades-inline-actions">',
                '<button class="adm-grades-btn small ghost" type="button" data-action="view" data-uuid="' + esc(report.uuid) + '"><i class="fas fa-eye"></i></button>',
                '<button class="adm-grades-btn small soft" type="button" data-action="approve" data-uuid="' + esc(report.uuid) + '"><i class="fas fa-circle-check"></i></button>',
                '<button class="adm-grades-btn small warn" type="button" data-action="reject" data-uuid="' + esc(report.uuid) + '"><i class="fas fa-rotate-left"></i></button>',
                '<button class="adm-grades-btn small primary" type="button" data-action="publish" data-uuid="' + esc(report.uuid) + '"><i class="fas fa-upload"></i></button>',
                '</div>',
                '</td>',
                '</tr>',
            ].join('');
        }).join('');

        syncSelectAllState();
    }

    function renderSummaryChart() {
        if (!dom.summaryCanvas) return;

        const filtered = getVisibleReports();
        const summary = summarizeReports(filtered);
        const data = [summary.pending, summary.approved, summary.published, summary.rejected];
        const labels = ['Pending', 'Approved', 'Published', 'Needs correction'];

        if (state.summaryChart) {
            state.summaryChart.destroy();
            state.summaryChart = null;
        }

        if (typeof Chart === 'undefined') return;

        state.summaryChart = new Chart(dom.summaryCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#f59e0b', '#0ea5e9', '#16a34a', '#be123c'],
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                },
            },
        });

        if (dom.summaryList) {
            const avgPercentage = filtered.length
                ? filtered.reduce(function (sum, report) { return sum + getReportAveragePercentage(report); }, 0) / filtered.length
                : 0;
            const avgAttendance = filtered.length
                ? filtered.reduce(function (sum, report) { return sum + toNumber(report.attendance_percentage); }, 0) / filtered.length
                : 0;
            const highest = filtered.reduce(function (best, report) {
                return getReportAveragePercentage(report) > getReportAveragePercentage(best) ? report : best;
            }, filtered[0] || {});
            const lowest = filtered.reduce(function (best, report) {
                return getReportAveragePercentage(report) < getReportAveragePercentage(best) ? report : best;
            }, filtered[0] || {});

            dom.summaryList.innerHTML = [
                summaryItem('Visible reports', String(filtered.length)),
                summaryItem('Lowest Grade', lowest && lowest.student_name ? lowest.student_name + ' (' + getReportGrade(lowest) + ')' : '-'),
                summaryItem('Average attendance', formatNumber(avgAttendance, 1) + '%'),
                summaryItem('Highest Grade', highest && highest.student_name ? highest.student_name + ' (' + getReportGrade(highest) + ')' : '-'),
            ].join('');
        }
    }

    function renderDrawer(report) {
        state.selectedReport = report || null;
        if (!report) return;

        const details = Array.isArray(report.details) ? report.details : [];
        const status = deriveStatus(report);
        const workflowText = statusLabelFor(status);

        setText(dom.drawer.title, report.student_name || 'Report review');
        setText(dom.drawer.subtitle, report.student_number_id || report.student_id_number || report.student_number || report.student_id || '-');
        setText(dom.drawer.student, report.student_name || '-');
        setText(dom.drawer.className, report.class_name || '-');
        setText(dom.drawer.term, [report.semester_name, report.academic_year].filter(Boolean).join(' / ') || '-');
        setText(dom.drawer.workflow, workflowText);
        setText(dom.drawer.generatedBy, formatGeneratedBy(report.generated_by));
        setText(dom.drawer.generatedAt, formatDateTime(report.generated_at));
        const avgPercentage = details.length ? details.reduce(function (sum, detail) { return sum + toNumber(detail.percentage); }, 0) / details.length : 0;
        const gradeBand = scoreToBand(avgPercentage);
        setText(dom.drawer.gpa, esc((gradeBand && (gradeBand.grade || gradeBand.grade_letter)) || '-'));
        setText(dom.drawer.attendance, formatNumber(report.attendance_percentage, 1) + '%');
        if (dom.drawer.comment) {
            dom.drawer.comment.value = String(report.principal_comment || report.teacher_comment || '');
        }

        if (!details.length) {
            dom.drawer.detailsBody.innerHTML = '<tr><td colspan="4"><div class="adm-grades-empty">This report has no subject details yet.</div></td></tr>';
        } else {
            dom.drawer.detailsBody.innerHTML = details.map(function (detail) {
                const percentage = toNumber(detail.percentage);
                const band = scoreToBand(percentage);
                return '<tr>' +
                    '<td>' + esc(detail.subject_name || detail.subject_code || 'Subject') + '</td>' +
                    '<td>' + esc(formatNumber(detail.total_score, 2)) + '</td>' +
                    '<td>' + esc(formatNumber(percentage, 1)) + '%</td>' +
                    '<td>' + esc((band && (band.grade || band.grade_letter)) || detail.grade_letter || detail.grade || '-') + '</td>' +
                    '</tr>';
            }).join('');
        }

        setButtonState(dom.drawer.approveBtn, status === 'published', status === 'published' ? 'Published' : 'Approve');
        setButtonState(dom.drawer.publishBtn, status === 'published', status === 'published' ? 'Published' : 'Publish');
        openDrawer();
    }

    async function openReport(uuid) {
        if (!uuid) return;
        let report = state.reports.find(function (row) { return String(row.uuid) === String(uuid); });
        if (!report) return;

        if (!Array.isArray(report.details) || !report.details.length) {
            try {
                const detail = await GradeReportAPI.getById(uuid).then(unwrapSingle);
                if (detail) {
                    report.details = Array.isArray(detail.details) ? detail.details : [];
                    report.teacher_comment = detail.teacher_comment ?? report.teacher_comment;
                    report.principal_comment = detail.principal_comment ?? report.principal_comment;
                    report.generated_by = detail.generated_by ?? report.generated_by;
                    report.generated_at = detail.generated_at ?? report.generated_at;
                    report.is_published = detail.is_published ?? report.is_published;
                    report.Approved = detail.Approved ?? report.Approved;
                }
            } catch (error) {
                toast(error?.message || 'Failed to load report details', 'error');
            }
        }

        renderDrawer(report);
    }

    function onQueueAction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) {
            const checkbox = event.target.closest('.adm-grades-row-select');
            if (checkbox) {
                if (checkbox.checked) state.selectedUuids.add(checkbox.dataset.uuid);
                else state.selectedUuids.delete(checkbox.dataset.uuid);
                syncSelectAllState();
            }
            return;
        }

        const uuid = button.dataset.uuid;
        const action = button.dataset.action;

        if (action === 'view') {
            openReport(uuid);
            return;
        }

        if (action === 'approve') {
            approveReport(uuid);
            return;
        }

        if (action === 'reject') {
            openReport(uuid);
            return;
        }

        if (action === 'publish') {
            publishReport(uuid, true);
        }
    }

    async function approveReport(uuid) {
        const report = state.reports.find(function (row) { return String(row.uuid) === String(uuid); });
        if (!report) return;

        if (deriveStatus(report) === 'published') {
            toast('This report is already published.', 'info');
            return;
        }

        const ok = await confirmAction('Approve report?', 'This marks the report as approved while leaving publishing as a separate step.');
        if (!ok) return;

        try {
            await API.put(API_ENDPOINTS.GRADE_REPORT_BY_UUID(uuid), {
                Approved: 1,
                is_published: 0,
                principal_comment: report.principal_comment || null,
            });
            toast('Report approved', 'success');
            await loadData(true);
            if (state.selectedReport && String(state.selectedReport.uuid) === String(uuid)) {
                await openReport(uuid);
            }
        } catch (error) {
            toast(error?.message || 'Failed to approve report', 'error');
        }
    }

    async function rejectReport(uuid, reason) {
        const report = state.reports.find(function (row) { return String(row.uuid) === String(uuid); });
        if (!report) return;

        const comment = String(reason || dom.drawer.comment?.value || '').trim();
        if (!comment) {
            toast('Add a correction note before sending the report back.', 'error');
            dom.drawer.comment?.focus();
            return;
        }

        const ok = await confirmAction('Send back for correction?', 'This clears approval, removes publish state, and records the correction note.');
        if (!ok) return;

        try {
            await API.put(API_ENDPOINTS.GRADE_REPORT_BY_UUID(uuid), {
                Approved: 0,
                is_published: 0,
                principal_comment: comment,
            });
            toast('Report sent back to teacher', 'success');
            dom.drawer.comment.value = comment;
            await loadData(true);
            if (state.selectedReport && String(state.selectedReport.uuid) === String(uuid)) {
                await openReport(uuid);
            }
        } catch (error) {
            toast(error?.message || 'Failed to send report back', 'error');
        }
    }

    async function publishReport(uuid, published) {
        const report = state.reports.find(function (row) { return String(row.uuid) === String(uuid); });
        if (!report) return;

        if (!published) {
            const ok = await confirmAction('Unpublish report?', 'The report will no longer be visible to parents and students.');
            if (!ok) return;
        } else if (deriveStatus(report) !== 'approved' && deriveStatus(report) !== 'published') {
            toast('Approve the report before publishing it.', 'error');
            return;
        }

        try {
            await GradeReportAPI.publish(uuid, !!published);
            toast(published ? 'Report published' : 'Report unpublished', 'success');
            await loadData(true);
            if (state.selectedReport && String(state.selectedReport.uuid) === String(uuid)) {
                await openReport(uuid);
            }
        } catch (error) {
            toast(error?.message || 'Failed to update publish state', 'error');
        }
    }

    async function publishSelectedReport() {
        const report = state.selectedReport;
        if (!report) return;
        await publishReport(report.uuid, true);
    }

    async function approveSelectedReport() {
        const report = state.selectedReport;
        if (!report) return;
        await approveReport(report.uuid);
    }

    async function rejectSelectedReport() {
        const report = state.selectedReport;
        if (!report) return;
        await rejectReport(report.uuid);
    }

    async function bulkPublishSelected() {
        const uuids = getSelectedUuids();
        if (!uuids.length) {
            toast('Select one or more reports first.', 'info');
            return;
        }

        const eligible = uuids.filter(function (uuid) {
            const report = state.reports.find(function (row) { return String(row.uuid) === String(uuid); });
            return report && deriveStatus(report) === 'approved';
        });

        if (!eligible.length) {
            toast('No approved reports were selected for publishing.', 'error');
            return;
        }

        const ok = await confirmAction('Publish selected reports?', 'Only approved reports will be published.');
        if (!ok) return;

        try {
            for (const uuid of eligible) {
                await GradeReportAPI.publish(uuid, true);
            }
            toast('Selected reports published', 'success');
            state.selectedUuids.clear();
            await loadData(true);
        } catch (error) {
            toast(error?.message || 'Failed to publish selected reports', 'error');
        }
    }

    async function bulkApproveSelected() {
        const uuids = getSelectedUuids();
        if (!uuids.length) {
            toast('Select one or more reports first.', 'info');
            return;
        }

        const ok = await confirmAction('Approve selected reports?', 'This marks the selected reports as approved.');
        if (!ok) return;

        try {
            for (const uuid of uuids) {
                const report = state.reports.find(function (row) { return String(row.uuid) === String(uuid); });
                if (!report || deriveStatus(report) === 'published') continue;
                await API.put(API_ENDPOINTS.GRADE_REPORT_BY_UUID(uuid), {
                    Approved: 1,
                    is_published: 0,
                    principal_comment: report.principal_comment || null,
                });
            }
            toast('Selected reports approved', 'success');
            state.selectedUuids.clear();
            await loadData(true);
        } catch (error) {
            toast(error?.message || 'Failed to approve selected reports', 'error');
        }
    }

    async function bulkRejectSelected() {
        const uuids = getSelectedUuids();
        if (!uuids.length) {
            toast('Select one or more reports first.', 'info');
            return;
        }

        const reason = String(window.prompt('Enter correction note for selected reports:', '') || '').trim();
        if (!reason) {
            toast('A correction note is required.', 'error');
            return;
        }

        const ok = await confirmAction('Send selected reports back?', 'This clears approval, removes publish state, and records the correction note.');
        if (!ok) return;

        try {
            for (const uuid of uuids) {
                await API.put(API_ENDPOINTS.GRADE_REPORT_BY_UUID(uuid), {
                    Approved: 0,
                    is_published: 0,
                    principal_comment: reason,
                });
            }
            toast('Selected reports sent back for correction', 'success');
            state.selectedUuids.clear();
            await loadData(true);
        } catch (error) {
            toast(error?.message || 'Failed to send selected reports back', 'error');
        }
    }

    function exportVisibleReports() {
        const rows = getVisibleReports();
        if (!rows.length) {
            toast('No visible reports to export.', 'info');
            return;
        }

        const headers = ['Student', 'Class', 'Term', 'Grade', 'Attendance', 'Workflow', 'Generated By', 'Generated At'];
        const csv = [headers.join(',')].concat(rows.map(function (report) {
            return [
                csvCell(report.student_name),
                csvCell(report.class_name),
                csvCell([report.semester_name, report.academic_year].filter(Boolean).join(' / ')),
                csvCell(getReportGrade(report)),
                csvCell(formatNumber(report.attendance_percentage, 1) + '%'),
                csvCell(statusLabelFor(deriveStatus(report))),
                csvCell(formatGeneratedBy(report.generated_by)),
                csvCell(formatDateTime(report.generated_at)),
            ].join(',');
        })).join('\n');

        downloadText(csv, 'admin-grade-reports.csv', 'text/csv');
    }

    function clearFilters() {
        state.filters.class_id = '';
        state.filters.subject_id = '';
        state.filters.teacher_id = '';
        state.filters.status = '';
        state.filters.search = '';
        state.filters.academic_year_id = state.currentYearId || '';
        state.filters.semester_id = state.currentSemesterId || '';
        state.selectedUuids.clear();
        populateFilterOptions();
        loadReports().then(renderAll).catch(function (error) {
            toast(error?.message || 'Failed to reload reports', 'error');
        });
    }

    function onScaleCategoryChange() {
        state.selectedScaleCategoryKey = dom.scaleCategory?.value || '';
        renderScalePanel();
        renderQueue();
        renderSummaryChart();
        // if (state.selectedReport) {
        //     renderDrawer(state.selectedReport);
        // }
    }

    function onFilterChange() {
        state.filters.academic_year_id = dom.filters.academicYear?.value || '';
        state.filters.semester_id = dom.filters.semester?.value || '';
        state.filters.class_id = dom.filters.class?.value || '';
        state.filters.subject_id = dom.filters.subject?.value || '';
        state.filters.teacher_id = dom.filters.teacher?.value || '';
        state.filters.status = dom.filters.status?.value || '';
        state.filters.search = dom.filters.search?.value || '';

        if (this === dom.filters.academicYear || this === dom.filters.semester) {
            loadReports().then(renderAll).catch(function (error) {
                toast(error?.message || 'Failed to reload reports', 'error');
            });
            return;
        }

        renderStats();
        renderQueue();
        renderSummaryChart();
    }

    function populateFilterOptions() {
        setSelectOptions(dom.filters.academicYear, state.academicYears, state.filters.academic_year_id, function (row) {
            return row.academic_year_id;
        }, function (row) {
            return row.year_name || row.name || ('Academic year ' + row.academic_year_id);
        }, 'All academic years');

        setSelectOptions(dom.filters.semester, state.semesters, state.filters.semester_id, function (row) {
            return row.semester_id;
        }, function (row) {
            return row.semester_name || row.name || ('Semester ' + row.semester_id);
        }, 'All semesters');

        setSelectOptions(dom.filters.class, state.classes, state.filters.class_id, function (row) {
            return row.class_id;
        }, function (row) {
            return row.class_name || row.class_code || ('Class ' + row.class_id);
        }, 'All classes');

        setSelectOptions(dom.filters.subject, state.subjects, state.filters.subject_id, function (row) {
            return row.subject_id;
        }, function (row) {
            return [row.subject_name, row.subject_code].filter(Boolean).join(' - ') || ('Subject ' + row.subject_id);
        }, 'All subjects');

        const reportUsers = getGeneratedUsers();
        setSelectOptions(dom.filters.teacher, reportUsers, state.filters.teacher_id, function (row) {
            return row.user_id;
        }, function (row) {
            return formatUserName(row) || ('User ' + row.user_id);
        }, 'All generated by');

        const statusOptions = ['pending', 'approved', 'published', 'rejected'];
        if (dom.filters.status) {
            const current = dom.filters.status.value;
            dom.filters.status.innerHTML = '<option value="">All statuses</option>' + statusOptions.map(function (status) {
                return '<option value="' + esc(status) + '">' + esc(statusLabelFor(status)) + '</option>';
            }).join('');
            dom.filters.status.value = current;
        } else if (dom.filters.status) {
            dom.filters.status.innerHTML = '<option value="">All statuses</option>' + statusOptions.map(function (status) {
                return '<option value="' + esc(status) + '">' + esc(statusLabelFor(status)) + '</option>';
            }).join('');
        }

        if (dom.filters.status && state.filters.status) {
            dom.filters.status.value = state.filters.status;
        }
        if (dom.filters.search) dom.filters.search.value = state.filters.search || '';
    }

    function setSelectOptions(select, items, currentValue, valueGetter, labelGetter, defaultLabel) {
        if (!select) return;
        const current = currentValue != null ? String(currentValue) : '';
        const options = ['<option value="">' + esc(defaultLabel || 'All') + '</option>'];
        (Array.isArray(items) ? items : []).forEach(function (item) {
            const value = String(valueGetter(item));
            const label = labelGetter(item);
            options.push('<option value="' + esc(value) + '">' + esc(label) + '</option>');
        });
        select.innerHTML = options.join('');
        if (current) select.value = current;
    }

    function getVisibleReports() {
        const className = getSelectedClassName();
        const subjectName = getSelectedSubjectName();
        const teacherName = getSelectedTeacherName();

        return state.reports.filter(function (report) {
            if (state.filters.search) {
                const text = [
                    report.uuid,
                    report.student_name,
                    report.class_name,
                    report.semester_name,
                    report.academic_year,
                    report.teacher_comment,
                    report.principal_comment,
                    formatGeneratedBy(report.generated_by),
                    summarizeSubjects(report),
                ].join(' ').toLowerCase();
                if (!text.includes(String(state.filters.search).trim().toLowerCase())) return false;
            }

            if (className && normalizeText(report.class_name) !== normalizeText(className)) return false;
            if (teacherName && normalizeText(formatGeneratedBy(report.generated_by)) !== normalizeText(teacherName)) return false;
            if (state.filters.status && deriveStatus(report) !== state.filters.status) return false;

            if (subjectName) {
                const subjects = summarizeSubjects(report, true);
                const subjectMatch = subjects.some(function (subject) {
                    return normalizeText(subject.name).includes(normalizeText(subjectName)) || normalizeText(subject.code).includes(normalizeText(subjectName));
                });
                if (!subjectMatch) return false;
            }

            return true;
        });
    }

    function getSelectedClassName() {
        const value = dom.filters.class?.value || '';
        if (!value) return '';
        const row = state.classes.find(function (item) { return String(item.class_id) === String(value); });
        return row ? (row.class_name || row.class_code || '') : '';
    }

    function getSelectedSubjectName() {
        const value = dom.filters.subject?.value || '';
        if (!value) return '';
        const row = state.subjects.find(function (item) { return String(item.subject_id) === String(value); });
        return row ? (row.subject_name || row.subject_code || '') : '';
    }

    function getSelectedTeacherName() {
        const value = dom.filters.teacher?.value || '';
        if (!value) return '';
        const row = state.users.find(function (item) { return String(item.user_id) === String(value); });
        return row ? formatUserName(row) : '';
    }

    function getGeneratedUsers() {
        const map = new Map();
        state.reports.forEach(function (report) {
            const id = report.generated_by;
            if (!id) return;
            const user = state.users.find(function (row) { return String(row.user_id) === String(id); });
            if (user) map.set(String(user.user_id), user);
        });
        return Array.from(map.values());
    }

    function summarizeReports(reports) {
        return reports.reduce(function (acc, report) {
            const status = deriveStatus(report);
            acc.total++;
            if (status === 'pending') acc.pending++;
            else if (status === 'approved') acc.approved++;
            else if (status === 'published') acc.published++;
            else if (status === 'rejected') acc.rejected++;
            return acc;
        }, { total: 0, pending: 0, approved: 0, published: 0, rejected: 0 });
    }

    function deriveStatus(report) {
        const published = isTruthy(report.is_published) || !!report.published_at;
        const approved = isTruthy(report.Approved);
        const rejected = !approved && !!String(report.principal_comment || '').trim();
        if (published) return 'published';
        if (approved) return 'approved';
        if (rejected) return 'rejected';
        return 'pending';
    }

    function statusLabelFor(status) {
        const value = String(status || '').toLowerCase();
        if (value === 'published') return 'Published';
        if (value === 'approved') return 'Approved';
        if (value === 'rejected') return 'Needs correction';
        if (value === 'pending') return 'Pending';
        return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Pending';
    }

    function buildActiveBands(scales) {
        const list = Array.isArray(scales) ? scales : [];
        const grouped = new Map();

        list.forEach(function (row) {
            const status = String(row.status || row.Status || row.is_active || 'active').toLowerCase();
            if (status === 'inactive' || status === '0' || status === 'false') return;
            const key = String(row.grade_categories_id || row.category_id || row.category || row.grade_category || 'default');
            if (!grouped.has(key)) {
                grouped.set(key, {
                    key: key,
                    name: row.grade_categories_name || row.category_name || row.category || row.grade_category_name || 'Active grading scale',
                    rows: [],
                });
            }
            grouped.get(key).rows.push(row);
        });

        const groups = Array.from(grouped.values()).map(function (group) {
            group.rows.sort(function (a, b) {
                return toNumber(b.max_score) - toNumber(a.max_score);
            });
            return group;
        });

        groups.sort(function (a, b) {
            return b.rows.length - a.rows.length;
        });

        return groups;
    }

    function populateScaleCategoryOptions() {
        if (!dom.scaleCategory) return;
        const groups = state.activeBands.length ? state.activeBands : buildActiveBands(state.scales);

        if (!groups.length) {
            dom.scaleCategory.innerHTML = '<option value="">No active categories</option>';
            state.selectedScaleCategoryKey = '';
            return;
        }

        if (!state.selectedScaleCategoryKey || !groups.some(function (group) { return String(group.key) === String(state.selectedScaleCategoryKey); })) {
            state.selectedScaleCategoryKey = resolveDefaultScaleCategoryKey(groups);
        }

        dom.scaleCategory.innerHTML = groups.map(function (group) {
            return '<option value="' + esc(String(group.key)) + '">' + esc(group.name || ('Category ' + group.key)) + '</option>';
        }).join('');
        dom.scaleCategory.value = String(state.selectedScaleCategoryKey);
    }

    function resolveDefaultScaleCategoryKey(groups) {
        const preferred = groups.find(function (group) {
            const name = String(group.name || '').toLowerCase();
            return name.includes('gpa') || name.includes('cgpa');
        });
        return String((preferred || groups[0]).key);
    }

    function getSelectedBandGroup() {
        if (!state.activeBands.length) return null;
        const key = String(state.selectedScaleCategoryKey || '');
        if (!key) return state.activeBands[0] || null;
        return state.activeBands.find(function (group) { return String(group.key) === key; }) || state.activeBands[0] || null;
    }

    function scoreToBand(score) {
        const group = getSelectedBandGroup();
        const bands = (group && group.rows) || [];
        const value = toNumber(score);
        if (!Number.isFinite(value)) return null;
        for (const band of bands) {
            const min = toNumber(band.min_score);
            const max = toNumber(band.max_score);
            if (Number.isFinite(min) && Number.isFinite(max) && value >= min && value <= max) {
                return band;
            }
        }
        return null;
    }

    function getReportAveragePercentage(report) {
        const details = Array.isArray(report?.details) ? report.details : [];
        if (!details.length) return 0;
        return details.reduce(function (sum, detail) {
            return sum + toNumber(detail.percentage);
        }, 0) / details.length;
    }

    function getReportGrade(report) {
        const avgPercentage = getReportAveragePercentage(report);
        const band = scoreToBand(avgPercentage);
        return (band && (band.grade || band.grade_letter)) || '-';
    }

    function summarizeSubjects(report, asObjects) {
        const details = Array.isArray(report.details) ? report.details : [];
        const subjects = details.map(function (detail) {
            return {
                name: detail.subject_name || detail.subject_code || 'Subject',
                code: detail.subject_code || '',
            };
        });
        if (asObjects) return subjects;
        return subjects.slice(0, 3).map(function (item) { return item.name; }).join(', ');
    }

    function buildComparisonUrl() {
        const params = new URLSearchParams();
        if (state.filters.academic_year_id) params.set('academic_year_id', state.filters.academic_year_id);
        if (state.filters.semester_id) params.set('semester_id', state.filters.semester_id);
        if (state.filters.class_id) params.set('class_id', state.filters.class_id);
        if (state.filters.subject_id) params.set('subject_id', state.filters.subject_id);
        if (state.filters.teacher_id) params.set('teacher_id', state.filters.teacher_id);
        if (state.filters.status) params.set('status', state.filters.status);
        return 'grade/comparison-performance.html' + (params.toString() ? '?' + params.toString() : '');
    }

    function openDrawer() {
        dom.drawer.overlay?.classList.add('show');
        dom.drawer.overlay?.setAttribute('aria-hidden', 'false');
    }

    function closeDrawer() {
        dom.drawer.overlay?.classList.remove('show');
        dom.drawer.overlay?.setAttribute('aria-hidden', 'true');
    }

    function showQueueLoading() {
        if (dom.queueBody) {
            dom.queueBody.innerHTML = '<tr><td colspan="9"><div class="adm-grades-empty">Loading grade reports...</div></td></tr>';
        }
    }

    function showError(message) {
        const safeMessage = String(message || 'Failed to load grade review data.');
        if (dom.queueBody) {
            dom.queueBody.innerHTML = '<tr><td colspan="9"><div class="adm-grades-empty">' + esc(safeMessage) + '</div></td></tr>';
        }
        if (dom.scaleStatus) {
            dom.scaleStatus.innerHTML = '<div class="adm-grades-empty-state">' + esc(safeMessage) + '</div>';
        }
        toast(safeMessage, 'error');
    }

    function syncSelectAllState() {
        if (!dom.selectAll) return;
        const visible = getVisibleReports();
        const selected = visible.filter(function (report) { return state.selectedUuids.has(report.uuid); }).length;
        dom.selectAll.checked = visible.length > 0 && selected === visible.length;
        dom.selectAll.indeterminate = selected > 0 && selected < visible.length;
    }

    function getSelectedUuids() {
        return Array.from(state.selectedUuids);
    }

    function setButtonState(button, disabled, label) {
        if (!button) return;
        button.disabled = !!disabled;
        const icon = button.querySelector('i');
        const text = button.childNodes.length ? button.childNodes[button.childNodes.length - 1] : null;
        if (icon && text) {
            if (label) {
                button.lastChild.nodeValue = ' ' + label;
            }
        }
    }

    function formatGeneratedBy(userId) {
        if (!userId) return '-';
        const user = state.users.find(function (row) { return String(row.user_id) === String(userId); });
        return user ? formatUserName(user) : ('User ' + userId);
    }

    function formatUserName(user) {
        if (!user) return '';
        return [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.username || user.email || ('User ' + user.user_id);
    }

    function isTruthy(value) {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value === 1;
        const normalized = String(value == null ? '' : value).toLowerCase().trim();
        return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'published';
    }

    function toNumber(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : NaN;
    }

    function formatNumber(value, precision) {
        const n = toNumber(value);
        if (!Number.isFinite(n)) return '0.0';
        return n.toFixed(precision == null ? 1 : precision).replace(/\.0+$/, function (m) {
            return precision === 0 ? '' : m;
        });
    }

    function formatDateTime(value) {
        if (!value) return '-';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return String(value);
        return d.toLocaleString();
    }

    function setText(element, value) {
        if (!element) return;
        element.textContent = value == null ? '' : String(value);
    }

    function formatRange(min, max) {
        const minText = min == null || min === '' ? '-' : formatNumber(min, 1);
        const maxText = max == null || max === '' ? '-' : formatNumber(max, 1);
        return minText + ' - ' + maxText;
    }

    function normalizeText(value) {
        return String(value == null ? '' : value).toLowerCase().trim();
    }

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
        });
    }

    function csvCell(value) {
        const text = String(value == null ? '' : value).replace(/"/g, '""');
        return '"' + text + '"';
    }

    function downloadText(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType || 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function summaryItem(label, value) {
        return '<div class="adm-grades-summary-item"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>';
    }

    async function confirmAction(title, message) {
        if (typeof window.showModal === 'function') {
            return new Promise(function (resolve) {
                window.showModal(title, message, function () { resolve(true); }, function () { resolve(false); });
            });
        }
        return Promise.resolve(window.confirm(title + '\n\n' + message));
    }

    function toast(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type || 'info');
            return;
        }
        console.log('[' + (type || 'info') + '] ' + message);
    }

    function unwrapSingle(response) {
        if (!response) return null;
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) return response.data;
        if (response.result && typeof response.result === 'object' && !Array.isArray(response.result)) return response.result;
        return response;
    }

    function toList(response) {
        const data = response && response.data ? response.data : response;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.data)) return data.data;
        if (data && Array.isArray(data.items)) return data.items;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
    }

    function toReportList(response) {
        const payload = response && response.data ? response.data : response;
        if (Array.isArray(payload)) return payload;
        if (payload && Array.isArray(payload.reports)) return payload.reports;
        if (payload && Array.isArray(payload.data)) return payload.data;
        if (payload && payload.pagination && Array.isArray(payload.pagination.data)) return payload.pagination.data;
        return [];
    }
})();

/* ============================================
   Promote Students Page Logic
   Uses the existing student update endpoint to move class placement
============================================ */
(function () {
    'use strict';

    const S = {
        students: [],
        classes: [],
        programs: [],
        academicYears: [],
        semesters: [],
        currentAcademicYear: null,
        currentSemester: null,
        search: '',
        status: 'active',
        academicYearId: '',
        programId: '',
        sourceClassId: '',
        targetClassId: '',
        targetAcademicYearId: '',
        targetProgramId: '',
        action: 'promote',
        selectedUuids: new Set(),
        busy: false,
        loading: false,
    };

    document.addEventListener('page:loaded', function (event) {
        if (event.detail && event.detail.page === 'promote-students') {
            initPromoteStudentsPage();
        }
    });

    function initPromoteStudentsPage() {
        resetPageState();
        bindEvents();
        loadReferenceData().then(loadStudents);
    }

    function resetPageState() {
        S.students = [];
        S.classes = [];
        S.programs = [];
        S.academicYears = [];
        S.semesters = [];
        S.currentAcademicYear = null;
        S.currentSemester = null;
        S.search = '';
        S.status = 'active';
        S.academicYearId = '';
        S.programId = '';
        S.sourceClassId = '';
        S.targetClassId = '';
        S.targetAcademicYearId = '';
        S.targetProgramId = '';
        S.action = 'promote';
        S.selectedUuids = new Set();
        S.busy = false;
        S.loading = false;
    }

    function bindEvents() {
        on('promoteBackBtn', 'click', function () { window.location.hash = '#students'; });
        on('promoteRefreshBtn', 'click', function () { loadReferenceData(true).then(loadStudents); });
        on('promoteReloadBtn', 'click', loadStudents);
        on('promoteApplyBtn', 'click', applyPromotion);
        on('promoteClearSelectionBtn', 'click', clearSelection);
        on('promoteSelectAll', 'change', function (event) { toggleSelectAll(event.target.checked); });
        on('promoteActionSelect', 'change', function (event) {
            S.action = event.target.value || 'promote';
            syncTargetFromAction();
        });
        on('promoteSearchInput', 'input', debounce(function (event) {
            S.search = (event.target.value || '').trim();
            loadStudents();
        }, 300));
        on('promoteStatusFilter', 'change', function (event) {
            S.status = event.target.value || '';
            loadStudents();
        });
        on('promoteAcademicYearSelect', 'change', function (event) {
            S.academicYearId = event.target.value || '';
            populateClassOptions();
            autoSelectTargetClass();
        });
        on('promoteProgramSelect', 'change', function (event) {
            S.programId = event.target.value || '';
            populateClassOptions();
            autoSelectTargetClass();
        });
        on('promoteSourceClassSelect', 'change', function (event) {
            S.sourceClassId = event.target.value || '';
            S.selectedUuids = new Set();
            syncTargetFromAction();
            loadStudents();
        });
        on('promoteTargetClassSelect', 'change', function (event) {
            S.targetClassId = event.target.value || '';
            updateTargetHint();
        });
        on('promoteTargetAcademicYearSelect', 'change', function (event) {
            S.targetAcademicYearId = event.target.value || '';
            populateTargetProgramSelect();
        });
        on('promoteTargetProgramSelect', 'change', function (event) {
            S.targetProgramId = event.target.value || '';
        });
        on('promoteSelectSameLevelBtn', 'click', function () {
            S.action = 'repeat';
            setSelectValue('promoteActionSelect', 'repeat');
            autoSelectTargetClass();
        });
        on('promoteSelectNextBtn', 'click', function () {
            S.action = 'promote';
            setSelectValue('promoteActionSelect', 'promote');
            autoSelectTargetClass();
        });
    }

    async function loadReferenceData(force) {
        if (S.busy && !force) return;
        S.busy = true;
        setStatus('Loading reference data…', 10);

        try {
            const [classRes, programRes, yearRes, semesterRes] = await Promise.all([
                API.get(API_ENDPOINTS.CLASSES, { limit: 500, status: 'active' }),
                API.get(API_ENDPOINTS.PROGRAMS_ACTIVE),
                API.get(API_ENDPOINTS.ACADEMIC_YEARS, { limit: 500 }),
                API.get(API_ENDPOINTS.SEMESTER_CURRENT),
            ]);

            S.classes = extractList(classRes);
            S.programs = extractList(programRes);
            S.academicYears = extractList(yearRes);
            S.currentAcademicYear = getCurrentAcademicYear(S.academicYears) || extractSingle(yearRes);
            S.currentSemester = extractSingle(semesterRes);

            if (!S.academicYears.length && S.currentAcademicYear) {
                S.academicYears = [S.currentAcademicYear];
            }
            S.semesters = S.currentSemester ? [S.currentSemester] : [];

            populateAcademicYearSelect();
            populateAcademicYearList();
            populateProgramSelect();
            populateTargetAcademicYearSelect();
            populateTargetProgramSelect();
            populateClassOptions();
            populateYearSemesterCards();
            updateTargetHint();
            syncTargetFromAction();

            if (!S.sourceClassId) {
                const firstClass = getFilteredClasses()[0];
                if (firstClass) {
                    S.sourceClassId = String(firstClass.class_id || '');
                    setSelectValue('promoteSourceClassSelect', S.sourceClassId);
                }
            }
        } catch (error) {
            console.error('Load reference data error:', error);
            setStatus(error.message || 'Failed to load promotion data', 100, true);
        } finally {
            S.busy = false;
        }
    }

    async function loadStudents() {
        if (S.loading) return;
        if (!S.sourceClassId) {
            renderEmpty('Choose a source class', 'Use the filters to pick the class whose students you want to move.');
            updateCounters();
            return;
        }

        S.loading = true;
        setStatus('Loading students…', 35);

        try {
            const params = { limit: 200, class_id: S.sourceClassId };
            if (S.programId) params.program_id = S.programId;
            if (S.status) params.status = S.status;
            if (S.search) params.search = S.search;

            const response = await API.get(API_ENDPOINTS.STUDENTS, params);
            const list = extractList(response);
            S.students = Array.isArray(list) ? list : [];
            S.selectedUuids = new Set([...S.selectedUuids].filter(function (uuid) {
                return S.students.some(function (student) { return student.uuid === uuid; });
            }));
            renderStudents();
            updateCounters();
            updateTargetHint();
            setStatus(S.students.length ? 'Ready to promote' : 'No students found', 100, false);
        } catch (error) {
            console.error('Load students error:', error);
            renderEmpty('Failed to load students', error.message || 'Please try again.');
            setStatus('Failed to load students', 100, true);
        } finally {
            S.loading = false;
        }
    }

    function renderStudents() {
        const tbody = document.getElementById('promoteStudentsBody');
        if (!tbody) return;

        if (!S.students.length) {
            renderEmpty('No students found', 'Try changing the source class, program, or search filter.');
            return;
        }

        tbody.innerHTML = S.students.map(function (student) {
            const initials = initialsFor(student.first_name, student.last_name);
            const fullName = [student.first_name, student.last_name].filter(Boolean).join(' ').trim();
            const badgeClass = student.status === 'active' ? 'badge-active' : student.status === 'withdrawn' ? 'badge-withdrawn' : 'badge-inactive';
            const checked = S.selectedUuids.has(student.uuid) ? 'checked' : '';

            return '<tr>' +
                '<td><input type="checkbox" class="promote-row-check" data-uuid="' + esc(student.uuid) + '" ' + checked + '></td>' +
                '<td><div class="student-cell"><div class="student-avatar">' + esc(initials) + '</div><div><div class="student-name">' + esc(fullName || '—') + '</div><div class="student-meta">' + esc(student.email || '') + '</div></div></div></td>' +
                '<td><code style="font-size:.8rem;background:#f1f5f9;padding:.15rem .4rem;border-radius:4px">' + esc(student.student_id_number || '—') + '</code></td>' +
                '<td>' + esc(student.class_name || '—') + '</td>' +
                '<td>' + esc(student.program_name || '—') + '</td>' +
                '<td><span class="students-badge ' + badgeClass + '">' + esc(capitalize(student.status || 'unknown')) + '</span></td>' +
            '</tr>';
        }).join('');

        tbody.querySelectorAll('.promote-row-check').forEach(function (checkbox) {
            checkbox.addEventListener('change', function (event) {
                const uuid = event.target.dataset.uuid;
                if (event.target.checked) S.selectedUuids.add(uuid);
                else S.selectedUuids.delete(uuid);
                updateCounters();
                updateSelectAll();
            });
        });

        updateSelectAll();
    }

    function renderEmpty(title, description) {
        const tbody = document.getElementById('promoteStudentsBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="6"><div class="promote-empty"><i class="fas fa-user-graduate"></i><h4 style="margin:0 0 .35rem">' + esc(title) + '</h4><p style="margin:0">' + esc(description) + '</p></div></td></tr>';
    }

    async function applyPromotion() {
        if (!S.selectedUuids.size) {
            toast('Select one or more students first.', 'warning');
            return;
        }

        if (!S.currentAcademicYear || !S.currentSemester) {
            toast('Set the current academic year and semester before promoting students.', 'error');
            return;
        }

        const sourceClass = getClassById(S.sourceClassId);
        const targetClass = getClassById(S.targetClassId);

        if (!sourceClass || !targetClass) {
            toast('Choose both a source class and a target class.', 'warning');
            return;
        }

        const validationMessage = validateMove(sourceClass, targetClass, S.action);
        if (validationMessage) {
            toast(validationMessage, 'error');
            return;
        }

        const actionLabel = S.action === 'repeat' ? 'repeat' : S.action === 'move' ? 'move' : 'promote';
        const count = S.selectedUuids.size;

        const confirmed = await showPromotionConfirmPopup({
            title: 'Confirm Promotion',
            message: 'Apply this ' + actionLabel + ' action to ' + count + ' student' + (count === 1 ? '' : 's') + '?',
            details: [
                'Source: ' + (sourceClass.class_name || 'selected class'),
                'Target: ' + (targetClass.class_name || 'selected class')
            ]
        });

        if (!confirmed) return;

        setBusy(true);
        setStatus('Updating student placements…', 20);

        let success = 0;
        let failed = 0;
        const targetClassId = Number(targetClass.class_id);

        for (const uuid of S.selectedUuids) {
            try {
                const response = await API.put(API_ENDPOINTS.STUDENT_BY_UUID(uuid), { class_id: targetClassId });
                if (response && response.success) {
                    success += 1;
                } else {
                    failed += 1;
                }
                updateProgress(success + failed, count);
            } catch (error) {
                failed += 1;
                console.error('Promotion update failed for', uuid, error);
                updateProgress(success + failed, count);
            }
        }

        toast(success + ' student' + (success === 1 ? '' : 's') + ' updated successfully' + (failed ? ' · ' + failed + ' failed' : ''), failed ? 'warning' : 'success');
        setBusy(false);
        clearSelection();
        loadStudents();
    }

    function validateMove(sourceClass, targetClass, action) {
        if (String(sourceClass.class_id) === String(targetClass.class_id)) {
            return action === 'repeat'
                ? null
                : 'The target class is the same as the source class. Choose a different target for promotion or move.';
        }

        if (action === 'promote') {
            if (String(sourceClass.program_id || '') !== String(targetClass.program_id || '')) {
                return 'Promotion should stay within the same program.';
            }
            if (Number(targetClass.level_order || 0) <= Number(sourceClass.level_order || 0)) {
                return 'Promotion target must be a higher grade level.';
            }
        }

        if (action === 'repeat') {
            if (String(sourceClass.program_id || '') !== String(targetClass.program_id || '')) {
                return 'Repeating should stay within the same program.';
            }
            if (Number(targetClass.level_order || 0) !== Number(sourceClass.level_order || 0)) {
                return 'Repeat target must remain in the same grade level.';
            }
        }

        return null;
    }

    function syncTargetFromAction() {
        const sourceClass = getClassById(S.sourceClassId);
        if (!sourceClass) {
            updateTargetHint();
            return;
        }

        if (S.action === 'repeat') {
            S.targetClassId = String(sourceClass.class_id || '');
            setSelectValue('promoteTargetClassSelect', S.targetClassId);
        } else if (S.action === 'promote') {
            const next = getSuggestedNextClass(sourceClass);
            if (next) {
                S.targetClassId = String(next.class_id || '');
                setSelectValue('promoteTargetClassSelect', S.targetClassId);
            }
        }

        updateTargetHint();
    }

    function autoSelectTargetClass() {
        const sourceClass = getClassById(S.sourceClassId);
        if (!sourceClass) return;
        if (S.action === 'repeat') {
            S.targetClassId = String(sourceClass.class_id || '');
        } else if (S.action === 'promote') {
            const next = getSuggestedNextClass(sourceClass);
            if (next) S.targetClassId = String(next.class_id || '');
        }
        setSelectValue('promoteTargetClassSelect', S.targetClassId);
        updateTargetHint();
    }

    function getSuggestedNextClass(sourceClass) {
        const candidates = getFilteredClasses().filter(function (item) {
            return String(item.program_id || '') === String(sourceClass.program_id || '') &&
                Number(item.level_order || 0) > Number(sourceClass.level_order || 0);
        }).sort(function (a, b) {
            return Number(a.level_order || 0) - Number(b.level_order || 0);
        });

        return candidates[0] || null;
    }

    function updateTargetHint() {
        const sourceClass = getClassById(S.sourceClassId);
        const targetClass = getClassById(S.targetClassId);
        const hint = document.getElementById('promoteTargetHint');
        const sourceLabel = document.getElementById('promoteSourceLabel');

        if (sourceLabel) {
            sourceLabel.textContent = sourceClass ? (sourceClass.class_name || sourceClass.class_code || 'Selected source') : 'No class selected';
        }

        if (!hint) return;

        if (!sourceClass) {
            hint.textContent = 'Select a source class to auto-suggest a target class.';
            return;
        }

        if (S.action === 'repeat') {
            hint.textContent = 'Repeat keeps students in the same grade level. Pick a target class that matches the source level.';
        } else if (S.action === 'promote') {
            const next = getSuggestedNextClass(sourceClass);
            hint.textContent = next
                ? 'Suggested next class: ' + (next.class_name || next.class_code || 'next class') + '.'
                : 'No higher class was found for this program. Choose a different target or create the next level first.';
        } else {
            hint.textContent = targetClass
                ? 'Move selected students into ' + (targetClass.class_name || targetClass.class_code || 'the chosen class') + '.'
                : 'Select any active target class for the bulk move.';
        }
    }

    function populateAcademicYearSelect() {
        const select = document.getElementById('promoteAcademicYearSelect');
        if (!select) return;

        const items = getVisibleAcademicYears();
        const options = ['<option value="">All academic years</option>'].concat(items.map(function (year) {
            return '<option value="' + esc(String(year.academic_year_id || '')) + '">' + esc(year.year_name || 'Academic Year') + '</option>';
        }));

        select.innerHTML = options.join('');
        if (S.academicYearId && items.some(function (year) {
            return String(year.academic_year_id || '') === String(S.academicYearId);
        })) {
            select.value = S.academicYearId;
            return;
        }

        if (S.currentAcademicYear && S.currentAcademicYear.academic_year_id && items.some(function (year) {
            return String(year.academic_year_id || '') === String(S.currentAcademicYear.academic_year_id);
        })) {
            S.academicYearId = String(S.currentAcademicYear.academic_year_id);
            select.value = S.academicYearId;
        } else {
            S.academicYearId = '';
            select.value = '';
        }
    }

    function populateAcademicYearList() {
        const container = document.getElementById('promoteAcademicYearsList');
        const title = document.getElementById('promoteAcademicYearsTitle');
        const note = document.getElementById('promoteAcademicYearsNote');
        if (!container) return;

        const items = getVisibleAcademicYears();
        const singular = items.length === 1;
        const userInstitutionId = getCurrentUserInstitutionId();

        if (title) {
            title.textContent = singular ? 'Academic Year' : 'Academic Years';
        }

        if (note) {
            if (!items.length) {
                note.textContent = userInstitutionId
                    ? 'Academic years for this institution are hidden from this view.'
                    : 'No academic years found.';
            } else {
                note.textContent = singular
                    ? 'One academic year is visible in this view.'
                    : 'Visible academic years are listed below.';
            }
        }

        if (!items.length) {
            container.innerHTML = '<div class="promote-empty" style="padding:1rem"><p style="margin:0">No academic years to display.</p></div>';
            return;
        }

        if (singular) {
            container.innerHTML = '<div class="promote-year-item current">' +
                '<div class="promote-year-main">' +
                    '<div class="promote-year-name">' + esc(items[0].year_name || 'Academic Year') + '</div>' +
                    '<div class="promote-year-dates">' + esc(formatYearRange(items[0].start_date, items[0].end_date)) + '</div>' +
                '</div>' +
                '<span class="students-badge badge-active">Only year</span>' +
            '</div>';
            return;
        }

        container.innerHTML = items.map(function (year) {
            const isCurrent = String(year.academic_year_id || '') === String(S.currentAcademicYear?.academic_year_id || '');
            const badgeClass = isCurrent ? 'badge-active' : 'badge-inactive';
            return '<div class="promote-year-item' + (isCurrent ? ' current' : '') + '">' +
                '<div class="promote-year-main">' +
                    '<div class="promote-year-name">' + esc(year.year_name || 'Academic Year') + '</div>' +
                    '<div class="promote-year-dates">' + esc(formatYearRange(year.start_date, year.end_date)) + '</div>' +
                '</div>' +
                '<span class="students-badge ' + badgeClass + '">' + (isCurrent ? 'Current' : 'Archived') + '</span>' +
            '</div>';
        }).join('');
    }

    function getVisibleAcademicYears() {
        const userInstitutionId = getCurrentUserInstitutionId();
        const items = Array.isArray(S.academicYears) ? S.academicYears.slice() : [];

        return items.filter(function (year) {
            if (!userInstitutionId) return true;
            return String(year.institution_id || '') === String(userInstitutionId);
        }).sort(function (a, b) {
            return String(b.start_date || '').localeCompare(String(a.start_date || '')) ||
                String(b.year_name || '').localeCompare(String(a.year_name || ''));
        });
    }

    function getCurrentUserInstitutionId() {
        if (typeof Auth === 'undefined' || typeof Auth.getUser !== 'function') return '';
        const user = Auth.getUser();
        return user && user.institution_id ? String(user.institution_id) : '';
    }

    function populateProgramSelect() {
        const select = document.getElementById('promoteProgramSelect');
        if (!select) return;

        const options = ['<option value="">All programs</option>'].concat(S.programs.map(function (program) {
            return '<option value="' + esc(String(program.program_id || '')) + '">' + esc(program.program_name || 'Program') + '</option>';
        }));

        select.innerHTML = options.join('');
    }

    function populateTargetAcademicYearSelect() {
        const select = document.getElementById('promoteTargetAcademicYearSelect');
        if (!select) return;

        const items = getVisibleAcademicYears();
        const options = ['<option value="">Any academic year</option>'].concat(items.map(function (year) {
            return '<option value="' + esc(String(year.academic_year_id || '')) + '">' + esc(year.year_name || 'Academic Year') + '</option>';
        }));

        select.innerHTML = options.join('');
    }

    function populateTargetProgramSelect() {
        const select = document.getElementById('promoteTargetProgramSelect');
        if (!select) return;

        let programs = S.programs;

        if (S.targetAcademicYearId) {
            const targetYear = (Array.isArray(S.academicYears) ? S.academicYears : []).find(function (year) {
                return String(year.academic_year_id || '') === String(S.targetAcademicYearId);
            });

            if (targetYear) {
                programs = programs.filter(function (program) {
                    return String(program.academic_year_id || '') === String(S.targetAcademicYearId);
                });
            }
        }

        const options = ['<option value="">Any program</option>'].concat(programs.map(function (program) {
            return '<option value="' + esc(String(program.program_id || '')) + '">' + esc(program.program_name || 'Program') + '</option>';
        }));

        select.innerHTML = options.join('');
        S.targetProgramId = '';
    }

    function populateClassOptions() {
        const sourceSelect = document.getElementById('promoteSourceClassSelect');
        const targetSelect = document.getElementById('promoteTargetClassSelect');
        if (!sourceSelect || !targetSelect) return;

        const classes = getFilteredClasses();
        const currentSource = String(S.sourceClassId || sourceSelect.value || '');
        const currentTarget = String(S.targetClassId || targetSelect.value || '');

        const options = classes.map(function (item) {
            const label = (item.class_name || item.class_code || 'Class') + ' · ' + (item.program_name || 'Program') + ' · ' + (item.year_name || 'Year');
            return '<option value="' + esc(String(item.class_id || '')) + '">' + esc(label) + '</option>';
        });

        sourceSelect.innerHTML = '<option value="">Select source class</option>' + options.join('');
        targetSelect.innerHTML = '<option value="">Select target class</option>' + options.join('');

        if (currentSource) sourceSelect.value = currentSource;
        if (currentTarget) targetSelect.value = currentTarget;

        if (!sourceSelect.value && classes.length) {
            sourceSelect.value = String(classes[0].class_id || '');
            S.sourceClassId = sourceSelect.value;
        }
    }

    function populateYearSemesterCards() {
        const year = S.currentAcademicYear;
        const semester = S.currentSemester;

        setText('promoteAcademicYear', year ? (year.year_name || 'Current year') : 'Not set');
        setText('promoteAcademicYearMeta', year ? 'Academic year is active' : 'No current academic year found');
        setText('promoteSemester', semester ? (semester.semester_name || 'Current semester') : 'Not set');
        setText('promoteSemesterMeta', semester ? 'Semester is active' : 'No current semester found');
    }

    function getFilteredClasses() {
        return (Array.isArray(S.classes) ? S.classes : []).filter(function (item) {
            if (S.academicYearId && String(item.academic_year_id || '') !== String(S.academicYearId)) return false;
            if (S.programId && String(item.program_id || '') !== String(S.programId)) return false;
            return true;
        }).sort(function (a, b) {
            return Number(a.level_order || 0) - Number(b.level_order || 0) || String(a.class_name || '').localeCompare(String(b.class_name || ''));
        });
    }

    function getClassById(classId) {
        if (!classId) return null;
        return (Array.isArray(S.classes) ? S.classes : []).find(function (item) {
            return String(item.class_id || '') === String(classId);
        }) || null;
    }

    function getCurrentAcademicYear(years) {
        return (Array.isArray(years) ? years : []).find(function (year) {
            return Number(year.is_current) === 1;
        }) || null;
    }

    function formatYearRange(startDate, endDate) {
        if (!startDate && !endDate) return 'No dates set';
        const start = startDate ? String(startDate).slice(0, 10) : '—';
        const end = endDate ? String(endDate).slice(0, 10) : '—';
        return start + ' to ' + end;
    }

    function toggleSelectAll(checked) {
        const rows = document.querySelectorAll('.promote-row-check');
        rows.forEach(function (checkbox) {
            checkbox.checked = checked;
            if (checked) S.selectedUuids.add(checkbox.dataset.uuid);
            else S.selectedUuids.delete(checkbox.dataset.uuid);
        });
        updateCounters();
    }

    function updateSelectAll() {
        const checkbox = document.getElementById('promoteSelectAll');
        if (!checkbox) return;
        const items = document.querySelectorAll('.promote-row-check');
        const checkedCount = document.querySelectorAll('.promote-row-check:checked').length;
        checkbox.indeterminate = checkedCount > 0 && checkedCount < items.length;
        checkbox.checked = items.length > 0 && checkedCount === items.length;
    }

    function clearSelection() {
        S.selectedUuids = new Set();
        document.querySelectorAll('.promote-row-check').forEach(function (checkbox) { checkbox.checked = false; });
        const all = document.getElementById('promoteSelectAll');
        if (all) all.checked = false;
        updateCounters();
    }

    function updateCounters() {
        setText('promoteLoadedCount', String(S.students.length));
        setText('promoteSelectedCount', String(S.selectedUuids.size));
        const selectedMeta = document.getElementById('promoteSelectedMeta');
        if (selectedMeta) {
            selectedMeta.textContent = S.selectedUuids.size
                ? 'Ready to move ' + S.selectedUuids.size + ' student' + (S.selectedUuids.size === 1 ? '' : 's')
                : 'Choose one or more students to continue';
        }
        updateSelectAll();
    }

    function updateProgress(done, total) {
        const progressText = document.getElementById('promoteProgressText');
        const progressBar = document.getElementById('promoteProgressBar');
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        if (progressText) {
            progressText.textContent = total > 0 ? done + ' / ' + total + ' updated' : 'Idle';
        }
        if (progressBar) {
            progressBar.style.width = Math.max(0, Math.min(100, percent)) + '%';
        }
    }

    function showPromotionConfirmPopup(config) {
        return new Promise(function (resolve) {
            const existing = document.getElementById('promoteConfirmOverlay');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'promoteConfirmOverlay';
            overlay.style.cssText = [
                'position:fixed',
                'inset:0',
                'background:rgba(2,6,23,0.55)',
                'display:flex',
                'align-items:center',
                'justify-content:center',
                'padding:1rem',
                'z-index:2600'
            ].join(';');

            const details = Array.isArray(config.details) ? config.details : [];
            overlay.innerHTML = ''
                + '<div role="dialog" aria-modal="true" aria-labelledby="promoteConfirmTitle" style="width:min(460px,100%);background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(2,6,23,0.28);overflow:hidden;">'
                + '  <div style="padding:0.95rem 1rem;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-start;gap:0.75rem;">'
                + '    <div>'
                + '      <h3 id="promoteConfirmTitle" style="margin:0;font-size:1rem;color:#0f172a;">' + esc(config.title || 'Confirm Action') + '</h3>'
                + '      <p style="margin:0.25rem 0 0;font-size:0.86rem;color:#64748b;">Please review the action before continuing.</p>'
                + '    </div>'
                + '    <button type="button" data-role="close" aria-label="Close" style="border:none;background:#f1f5f9;color:#475569;border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:1rem;line-height:1;">&times;</button>'
                + '  </div>'
                + '  <div style="padding:1rem;color:#334155;font-size:0.92rem;line-height:1.6;">'
                + '    <div style="margin-bottom:0.75rem;">' + esc(config.message || 'Are you sure?') + '</div>'
                + (details.length ? '<div style="display:grid;gap:0.4rem;padding:0.75rem 0.8rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">' + details.map(function (item) {
                    return '<div>' + esc(item) + '</div>';
                }).join('') + '</div>' : '')
                + '  </div>'
                + '  <div style="padding:0.95rem 1rem;border-top:1px solid #e2e8f0;background:#f8fafc;display:flex;justify-content:flex-end;gap:0.5rem;">'
                + '    <button type="button" data-role="cancel" class="btn btn-outline btn-sm">Cancel</button>'
                + '    <button type="button" data-role="confirm" class="btn btn-primary btn-sm">Confirm</button>'
                + '  </div>'
                + '</div>';

            function finish(result) {
                overlay.remove();
                document.removeEventListener('keydown', handleKeydown, true);
                resolve(Boolean(result));
            }

            function handleKeydown(event) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    finish(false);
                }
            }

            overlay.addEventListener('click', function (event) {
                if (event.target === overlay) finish(false);
            });

            overlay.querySelector('[data-role="close"]').addEventListener('click', function () {
                finish(false);
            });
            overlay.querySelector('[data-role="cancel"]').addEventListener('click', function () {
                finish(false);
            });
            overlay.querySelector('[data-role="confirm"]').addEventListener('click', function () {
                finish(true);
            });

            document.addEventListener('keydown', handleKeydown, true);
            document.body.appendChild(overlay);
        });
    }

    function setStatus(text, percent, isError) {
        const status = document.getElementById('promoteLoadedMeta');
        const alert = document.getElementById('promoteAlert');
        if (status) status.textContent = text;
        if (alert && typeof isError === 'boolean') {
            alert.style.borderColor = isError ? '#fecaca' : '#bfdbfe';
            alert.style.background = isError ? '#fef2f2' : 'linear-gradient(135deg, #eff6ff, #f8fafc)';
            alert.style.color = isError ? '#b91c1c' : '#1d4ed8';
        }
        updateProgress(percent || 0, 100);
    }

    function setBusy(isBusy) {
        const button = document.getElementById('promoteApplyBtn');
        if (button) button.disabled = isBusy;
    }

    function extractList(response) {
        const data = response && response.data ? response.data : response;
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.classes)) return data.classes;
        if (Array.isArray(data?.programs)) return data.programs;
        if (Array.isArray(data?.academic_years)) return data.academic_years;
        if (Array.isArray(data?.semesters)) return data.semesters;
        return [];
    }

    function extractSingle(response) {
        if (!response) return null;
        if (response.success && response.data) return response.data;
        if (response.data && !Array.isArray(response.data) && typeof response.data === 'object') return response.data;
        if (typeof response === 'object' && !Array.isArray(response)) return response;
        return null;
    }

    function initialsFor(firstName, lastName) {
        const first = String(firstName || '').trim();
        const last = String(lastName || '').trim();
        return ((first.charAt(0) + last.charAt(0)) || '?').toUpperCase();
    }

    function capitalize(value) {
        const text = String(value || '');
        return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
    }

    function esc(value) {
        return String(value ?? '').replace(/[&<>"']/g, function (char) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
        });
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function setSelectValue(id, value) {
        const element = document.getElementById(id);
        if (element) element.value = String(value || '');
    }

    function on(id, eventName, handler) {
        const element = document.getElementById(id);
        if (element) element.addEventListener(eventName, handler);
    }

    function debounce(fn, wait) {
        let timeoutId = null;
        return function () {
            const args = arguments;
            const context = this;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(function () {
                fn.apply(context, args);
            }, wait);
        };
    }

    function toast(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log('[' + type + '] ' + message);
        }
    }

})();
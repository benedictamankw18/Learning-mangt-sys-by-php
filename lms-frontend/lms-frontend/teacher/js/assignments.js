/**
 * Teacher Assignments Module
 * Handles assignment CRUD operations, filtering, and display
 */

const Assignments = (() => {
    // Configuration
    const CONFIG = {
        pageSize: 20,
        searchDebounceMs: 400
    };

    // State
    let state = {
        assignments: [],
        classes: [],
        sectionsByCourse: new Map(),
        currentPage: 1,
        filters: {
            courseId: '',
            status: '',
            keyword: ''
        },
        editingAssignmentUuid: null,
        existingFilePath: null
    };

    let listenersBoundTo = null;
    let searchDebounceTimer = null;

    // DOM Elements
    let elements = {};

    const cacheElements = () => {
        elements = {
            createBtn: document.getElementById('createAssignmentBtn'),
            modal: document.getElementById('assignmentModal'),
            modalTitle: document.getElementById('modalTitle'),
            modalCloseBtn: document.getElementById('modalCloseBtn'),
            modalCancelBtn: document.getElementById('modalCancelBtn'),
            form: document.getElementById('assignmentForm'),
            assignmentsList: document.getElementById('assignmentsList'),
            filterClass: document.getElementById('filterClass'),
            filterStatus: document.getElementById('filterStatus'),
            searchKeyword: document.getElementById('searchKeyword'),
            applyFiltersBtn: document.getElementById('applyFiltersBtn'),
            resetFiltersBtn: document.getElementById('resetFiltersBtn'),
            totalAssignments: document.getElementById('totalAssignments'),
            activeAssignments: document.getElementById('activeAssignments'),
            draftAssignments: document.getElementById('draftAssignments'),
            pendingSubmissions: document.getElementById('pendingSubmissions'),
            // Form fields
            assignmentTitle: document.getElementById('assignmentTitle'),
            assignmentClass: document.getElementById('assignmentClass'),
            assignmentSection: document.getElementById('assignmentSection'),
            assignmentDescription: document.getElementById('assignmentDescription'),
            assignmentRubric: document.getElementById('assignmentRubric'),
            assignmentDueDate: document.getElementById('assignmentDueDate'),
            assignmentMaxScore: document.getElementById('assignmentMaxScore'),
            assignmentPassingScore: document.getElementById('assignmentPassingScore'),
            assignmentSubmissionType: document.getElementById('assignmentSubmissionType'),
            assignmentInstructionFile: document.getElementById('assignmentInstructionFile'),
            assignmentInstructionFileHelp: document.getElementById('assignmentInstructionFileHelp'),
            assignmentStatus: document.getElementById('assignmentStatus'),
            formSuccess: document.getElementById('formSuccess')
        };
    };

    const setInstructionFileHelp = (filePath) => {
        if (!elements.assignmentInstructionFileHelp) {
            return;
        }

        if (filePath) {
            elements.assignmentInstructionFileHelp.textContent = `Current file: ${filePath}`;
            return;
        }

        elements.assignmentInstructionFileHelp.textContent = 'Upload a PDF to share assignment instructions with students.';
    };

    const setStatText = (id, value) => {
        // In SPA transitions there can be duplicate fragments temporarily; update all matches.
        const nodes = document.querySelectorAll(`[id="${id}"]`);
        if (nodes.length === 0) {
            return;
        }

        nodes.forEach((node) => {
            node.textContent = String(value);
        });
    };

    const setAssignmentsLoading = (isLoading) => {
        if (!elements.assignmentsList) {
            return;
        }

        if (isLoading) {
            elements.assignmentsList.innerHTML = `
                <div class="loading" aria-live="polite" aria-busy="true">
                    <div class="spinner"></div>
                </div>
            `;
        }
    };

    /**
     * Initialize module
     */
    const init = async () => {
        cacheElements();

        // Check authentication
        if (!Auth.isAuthenticated()) {
            window.location.href = '/auth/login.html';
            return;
        }

        // This script can be loaded before the page fragment is mounted.
        // Exit safely when required nodes are missing.
        if (!elements.filterClass || !elements.assignmentClass || !elements.assignmentsList) {
            return;
        }

        // Load initial data
        await loadClasses();
        await loadAssignments();

        // Attach event listeners
        attachEventListeners();
    };

    /**
     * Load teacher's classes/subjects
     */
    const loadClasses = async () => {
        try {
            const user = Auth.getUser();
            const teacherUuid = user?.teacher_uuid || null;

            let classes = [];

            // Primary source: teacher courses endpoint using teacher UUID.
            if (teacherUuid) {
                try {
                    const data = await TeacherAPI.getCourses(teacherUuid, { limit: 500 });
                    classes = data?.courses || data?.data || [];
                } catch (err) {
                    console.warn('Teacher courses endpoint failed; will try dashboard fallback.', err);
                }
            }

            // Fallback source: dashboard teacher stats already resolves teacher by logged-in user_id.
            if (!Array.isArray(classes) || classes.length === 0) {
                const stats = await DashboardAPI.getTeacherStats();
                classes = stats?.data?.courses || stats?.courses || [];
            }

            state.classes = Array.isArray(classes) ? classes : [];

            // Populate class dropdown in filter
            populateClassDropdown(elements.filterClass);
            // Populate class dropdown in form
            populateClassDropdown(elements.assignmentClass);
        } catch (error) {
            console.error('Error loading classes:', error);
            showError(error?.message || 'Failed to load classes');
        }
    };

    /**
     * Populate class dropdown
     */
    const populateClassDropdown = (selectElement) => {
        if (!selectElement) {
            return;
        }

        const currentValue = selectElement.value;
        const baseOption = document.createElement('option');
        baseOption.value = '';
        baseOption.textContent = selectElement.id === 'filterClass' ? 'All Classes' : 'Select Class/Subject';

        selectElement.innerHTML = '';
        selectElement.appendChild(baseOption);

        state.classes.forEach(course => {
            const option = document.createElement('option');
            option.value = String(course.course_id || course.id);
            const subjectName = course.subject_name || course.subject_code || course.subject || course.name || 'Subject';
            const className = course.class_name || (course.class_id ? `Class ${course.class_id}` : 'Class');
            option.textContent = `${subjectName} (${className})`;
            selectElement.appendChild(option);
        });

        // Restore previous value if it still exists
        if (selectElement.querySelector(`option[value="${currentValue}"]`)) {
            selectElement.value = currentValue;
        }
    };

    /**
     * Load and cache sections for a course
     */
    const loadSectionsForCourse = async (courseId) => {
        const id = Number(courseId || 0);
        if (!id) {
            return [];
        }

        if (state.sectionsByCourse.has(id)) {
            return state.sectionsByCourse.get(id);
        }

        const response = await CourseContentAPI.getSections(id);
        const rows = Array.isArray(response?.data?.sections)
            ? response.data.sections
            : Array.isArray(response?.sections)
                ? response.sections
                : Array.isArray(response?.data)
                    ? response.data
                    : (Array.isArray(response) ? response : []);

        const sections = rows
            .map((row) => ({
                section_id: Number(row.course_sections_id || row.section_id || row.id || 0),
                section_name: row.section_name || row.name || `Section ${row.course_sections_id || row.section_id || row.id || ''}`,
                order_index: Number(row.order_index || 0) || 0,
                is_active: Number(row.is_active ?? 1) === 1
            }))
            .filter((row) => Number.isInteger(row.section_id) && row.section_id > 0)
            .sort((a, b) => a.order_index - b.order_index);

        state.sectionsByCourse.set(id, sections);
        return sections;
    };

    /**
     * Populate section dropdown based on selected course
     */
    const populateSectionDropdown = async (courseId, selectedSectionId = '') => {
        if (!elements.assignmentSection) {
            return;
        }

        const select = elements.assignmentSection;
        const selectedValue = String(selectedSectionId || '');
        const id = Number(courseId || 0);

        if (!id) {
            select.innerHTML = '<option value="">Select Class/Subject first</option>';
            select.disabled = true;
            return;
        }

        select.disabled = true;
        select.innerHTML = '<option value="">Loading sections...</option>';

        try {
            const sections = await loadSectionsForCourse(id);
            select.innerHTML = '';

            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = sections.length ? 'No Section (Optional)' : 'No sections available';
            select.appendChild(emptyOption);

            sections
                .filter((section) => section.is_active)
                .forEach((section) => {
                    const option = document.createElement('option');
                    option.value = String(section.section_id);
                    option.textContent = section.section_name;
                    select.appendChild(option);
                });

            if (selectedValue && select.querySelector(`option[value="${selectedValue}"]`)) {
                select.value = selectedValue;
            } else {
                select.value = '';
            }
        } catch (error) {
            console.error('Error loading sections:', error);
            select.innerHTML = '<option value="">Unable to load sections</option>';
        } finally {
            select.disabled = false;
        }
    };

    /**
     * Load assignments
     */
    const loadAssignments = async () => {
        setAssignmentsLoading(true);

        try {
            const selectedCourseId = String(state.filters.courseId || '').trim();
            const courseIds = selectedCourseId
                ? [selectedCourseId]
                : state.classes
                    .map((course) => String(course.course_id || course.id || '').trim())
                    .filter(Boolean);

            if (courseIds.length === 0) {
                state.assignments = [];
                renderAssignments();
                updateStatistics();
                return;
            }

            const results = await Promise.allSettled(
                courseIds.map((courseId) => AssignmentAPI.getByCourse(courseId))
            );

            let mergedAssignments = [];
            results.forEach((result) => {
                if (result.status !== 'fulfilled') {
                    return;
                }

                const payload = result.value || {};
                const items = payload.assignments || payload?.data?.assignments || payload.data || [];
                if (Array.isArray(items)) {
                    mergedAssignments = mergedAssignments.concat(items);
                }
            });

            const byUuid = new Map();
            mergedAssignments.forEach((assignment) => {
                const key = assignment.uuid || `${assignment.course_id}:${assignment.assignment_id}`;
                byUuid.set(key, assignment);
            });

            state.assignments = Array.from(byUuid.values());

            if (state.filters.status) {
                state.assignments = state.assignments.filter(
                    (a) => statusBucket(a.status) === statusBucket(state.filters.status)
                );
            }

            if (state.filters.keyword) {
                const q = String(state.filters.keyword).toLowerCase();
                state.assignments = state.assignments.filter((a) => {
                    const title = String(a.title || '').toLowerCase();
                    const description = String(a.description || '').toLowerCase();
                    return title.includes(q) || description.includes(q);
                });
            }

            state.assignments.sort((a, b) => {
                const da = new Date(a.due_date || a.created_at || 0).getTime();
                const db = new Date(b.due_date || b.created_at || 0).getTime();
                return db - da;
            });

            // Render assignments list
            renderAssignments();
            // Update statistics
            updateStatistics();
        } catch (error) {
            console.error('Error loading assignments:', error);
            showError('Failed to load assignments');
            elements.assignmentsList.innerHTML = `
                <div class="empty-state">
                    <div><i class="fas fa-exclamation-triangle"></i></div>
                    <p>Unable to load assignments. Please try again.</p>
                </div>
            `;
        }
    };

    /**
     * Render assignments list
     */
    const renderAssignments = () => {
        if (!state.assignments || state.assignments.length === 0) {
            elements.assignmentsList.innerHTML = `
                <div class="empty-state">
                    <div><i class="fas fa-inbox"></i></div>
                    <p>No assignments created yet. Create your first assignment to get started.</p>
                </div>
            `;
            return;
        }

        elements.assignmentsList.innerHTML = state.assignments.map(assignment => {
            const dueDate = new Date(assignment.due_date);
            const status = statusBucket(assignment.status);
            const isOverdue = dueDate < new Date() && status === 'active';

            return `
                <div class="ta-row">
                    <div class="ta-title">
                        <strong>${escapeHtml(assignment.title)}</strong>
                        <span>${getCourseName(assignment.course_id)}</span>
                    </div>
                    <div>${getCourseName(assignment.course_id).split('(')[0].trim()}</div>
                    <div>${formatDate(assignment.due_date)}</div>
                    <div>${assignment.max_score || 100}</div>
                    <div>
                        <span class="ta-chip ${status}">
                            ${capitalizeFirst(status || 'draft')}
                            ${isOverdue ? ' (Overdue)' : ''}
                        </span>
                    </div>
                    <div class="ta-actions">
                        <button class="ta-btn" title="View Details" onclick="Assignments.viewAssignment('${assignment.uuid}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="ta-btn" title="Edit" onclick="Assignments.editAssignment('${assignment.uuid}')">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="ta-btn" title="Submissions" onclick="Assignments.viewSubmissions('${assignment.uuid}')">
                            <i class="fas fa-list"></i>
                        </button>
                        <button class="ta-btn danger" title="Delete" onclick="Assignments.deleteAssignment('${assignment.uuid}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };

    /**
     * Update statistics
     */
    const updateStatistics = async () => {
        try {
            const total = state.assignments.length;
            const active = state.assignments.filter((a) => statusBucket(a.status) === 'active').length;
            const draft = state.assignments.filter((a) => statusBucket(a.status) === 'draft').length;

            setStatText('totalAssignments', total);
            setStatText('activeAssignments', active);
            setStatText('draftAssignments', draft);
            setStatText('pendingSubmissions', '...');

            // Get pending submissions count
            let pendingCount = 0;
            for (const assignment of state.assignments) {
                try {
                    const data = await AssignmentAPI.getSubmissions(assignment.uuid);
                    const submissions = Array.isArray(data?.submissions)
                        ? data.submissions
                        : Array.isArray(data?.data?.submissions)
                            ? data.data.submissions
                            : Array.isArray(data?.data)
                                ? data.data
                                : [];
                    pendingCount += submissions.filter((s) => s.status === 'submitted' || s.status === 'pending').length;
                } catch (error) {
                    console.error('Error fetching submissions count:', error);
                }
            }
            setStatText('pendingSubmissions', pendingCount);
        } catch (error) {
            console.error('Error updating statistics:', error);
            setStatText('pendingSubmissions', 0);
        }
    };

    /**
     * Get course name by ID
     */
    const getCourseName = (courseId) => {
        const course = state.classes.find(c => String(c.course_id || c.id) === String(courseId));
        if (!course) {
            return 'Unknown Course';
        }

        const subjectName = course.subject_name || course.subject_code || course.subject || course.name || 'Subject';
        const className = course.class_name || (course.class_id ? `Class ${course.class_id}` : 'Class');
        return `${subjectName} (${className})`;
    };

    /**
     * Open create assignment modal
     */
    const openCreateModal = () => {
        state.editingAssignmentUuid = null;
        elements.modalTitle.textContent = 'Create Assignment';
        elements.form.reset();
        clearFormErrors();
        elements.formSuccess.style.display = 'none';
        
        // Set default values
        const now = new Date();
        now.setDate(now.getDate() + 7);
        elements.assignmentDueDate.value = now.toISOString().slice(0, 16);
        elements.assignmentMaxScore.value = 100;
        elements.assignmentPassingScore.value = 60;
        elements.assignmentSubmissionType.value = 'both';
        elements.assignmentStatus.value = 'draft';
        state.existingFilePath = null;
        if (elements.assignmentInstructionFile) {
            elements.assignmentInstructionFile.value = '';
        }
        setInstructionFileHelp(null);

        populateSectionDropdown(elements.assignmentClass.value);
        
        openModal();
    };

    /**
     * Edit assignment
     */
    const editAssignment = async (uuid) => {
        try {
            const data = await AssignmentAPI.getById(uuid);
            const assignment = data.data || data;

            // Populate form with assignment data
            state.editingAssignmentUuid = uuid;
            elements.modalTitle.textContent = 'Edit Assignment';
            elements.assignmentTitle.value = assignment.title || '';
            elements.assignmentClass.value = assignment.course_id || '';
            await populateSectionDropdown(assignment.course_id, assignment.section_id || '');
            elements.assignmentDescription.value = assignment.description || '';
            elements.assignmentRubric.value = assignment.rubric || '';
            elements.assignmentDueDate.value = new Date(assignment.due_date).toISOString().slice(0, 16);
            elements.assignmentMaxScore.value = assignment.max_score || 100;
            elements.assignmentPassingScore.value = assignment.passing_score || 60;
            elements.assignmentSubmissionType.value = assignment.submission_type || 'both';
            elements.assignmentStatus.value = statusBucket(assignment.status);
            state.existingFilePath = assignment.file_path || null;
            if (elements.assignmentInstructionFile) {
                elements.assignmentInstructionFile.value = '';
            }
            setInstructionFileHelp(state.existingFilePath);

            clearFormErrors();
            elements.formSuccess.style.display = 'none';
            openModal();
        } catch (error) {
            console.error('Error loading assignment:', error);
            showError('Failed to load assignment details');
        }
    };

    /**
     * Confirm popup dialog
     */
    const confirmPopup = (message, title) => {
        return new Promise((resolve) => {
            const existing = document.getElementById('_asgnConfirmOverlay');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = '_asgnConfirmOverlay';
            overlay.style.cssText = [
                'position:fixed',
                'inset:0',
                'background:rgba(2,6,23,0.55)',
                'display:flex',
                'align-items:center',
                'justify-content:center',
                'padding:1rem',
                'z-index:2600',
            ].join(';');

            overlay.innerHTML = ''
                + '<div role="dialog" aria-modal="true" style="width:min(420px,100%);background:#fff;border-radius:12px;box-shadow:0 24px 60px rgba(2,6,23,0.28);overflow:hidden;">'
                + '  <div style="padding:0.9rem 1rem;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;gap:0.6rem;">'
                + '    <h3 style="margin:0;font-size:1rem;color:#0f172a;">' + escapeHtml(title || 'Confirm Action') + '</h3>'
                + '    <button type="button" data-role="close" style="border:none;background:#f1f5f9;color:#475569;border-radius:8px;width:30px;height:30px;cursor:pointer;">&times;</button>'
                + '  </div>'
                + '  <div style="padding:1rem;color:#334155;font-size:0.9rem;line-height:1.5;">' + escapeHtml(message || 'Are you sure?') + '</div>'
                + '  <div style="padding:0.9rem 1rem;border-top:1px solid #e2e8f0;background:#f8fafc;display:flex;justify-content:flex-end;gap:0.5rem;">'
                + '    <button type="button" data-role="cancel" class="btn btn-outline btn-sm">Cancel</button>'
                + '    <button type="button" data-role="confirm" class="btn btn-primary btn-sm">Confirm</button>'
                + '  </div>'
                + '</div>';

            function finish(result) {
                overlay.remove();
                resolve(Boolean(result));
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

            document.body.appendChild(overlay);
        });
    };

    /**
     * Delete assignment
     */
    const deleteAssignment = async (uuid) => {
        const confirmed = await confirmPopup('Are you sure you want to delete this assignment? This action cannot be undone.', 'Confirm Delete');
        if (!confirmed) {
            return;
        }

        try {
            await AssignmentAPI.delete(uuid);

            showSuccess('Assignment deleted successfully');
            await loadAssignments();
        } catch (error) {
            console.error('Error deleting assignment:', error);
            showError('Failed to delete assignment');
        }
    };

    /**
     * View assignment details
     */
    const viewAssignment = (uuid) => {
        window.location.hash = `#assignment-detail?id=${uuid}`;
    };

    /**
     * View assignment submissions
     */
    const viewSubmissions = (uuid) => {
        window.location.hash = `#submissions?assignment=${uuid}`;
    };

    /**
     * Handle form submission
     */
    const handleFormSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Get form data
        const formData = new FormData(elements.form);
        const data = {
            title: formData.get('title'),
            course_id: parseInt(formData.get('course_id')),
            section_id: formData.get('section_id') ? parseInt(formData.get('section_id')) : null,
            description: formData.get('description') || null,
            rubric: formData.get('rubric') || null,
            due_date: new Date(formData.get('due_date')).toISOString(),
            max_score: parseFloat(formData.get('max_score')),
            passing_score: formData.get('passing_score') ? parseFloat(formData.get('passing_score')) : null,
            submission_type: formData.get('submission_type'),
            file_path: state.existingFilePath || null,
            status: formData.get('status')
        };

        try {
            const selectedFile = elements.assignmentInstructionFile?.files?.[0] || null;
            if (selectedFile) {
                const fileName = selectedFile.name || '';
                const isPdf = selectedFile.type === 'application/pdf' || /\.pdf$/i.test(fileName);
                if (!isPdf) {
                    showFieldError('filePathError', 'Only PDF files are allowed');
                    return;
                }

                const uploadData = new FormData();
                uploadData.append('file', selectedFile);
                uploadData.append('category', 'assignments');

                const uploadRes = await FileAPI.upload(uploadData);
                const uploadedPath = uploadRes?.data?.path || uploadRes?.path || null;
                if (!uploadedPath) {
                    showFieldError('filePathError', 'File uploaded but path was not returned');
                    return;
                }

                data.file_path = uploadedPath;
            }

            if (state.editingAssignmentUuid) {
                await AssignmentAPI.update(state.editingAssignmentUuid, data);
            } else {
                await AssignmentAPI.create(data);
            }

            const message = state.editingAssignmentUuid
                ? 'Assignment updated successfully'
                : 'Assignment created successfully';

            showFormSuccess(message);
            setTimeout(() => {
                closeModal();
                loadAssignments();
            }, 1500);
        } catch (error) {
            console.error('Error saving assignment:', error);
            if (error && error.body && error.body.errors) {
                displayFormErrors(error.body.errors);
                return;
            }
            showError('Failed to save assignment');
        }
    };

    /**
     * Validate form
     */
    const validateForm = () => {
        let isValid = true;
        clearFormErrors();

        // Title validation
        if (!elements.assignmentTitle.value.trim()) {
            showFieldError('titleError', 'Title is required');
            isValid = false;
        }

        // Class validation
        if (!elements.assignmentClass.value) {
            showFieldError('classError', 'Class/Subject is required');
            isValid = false;
        }

        // Due date validation
        if (!elements.assignmentDueDate.value) {
            showFieldError('dueDateError', 'Due date is required');
            isValid = false;
        }

        // Max score validation
        if (!elements.assignmentMaxScore.value || parseInt(elements.assignmentMaxScore.value) < 1) {
            showFieldError('maxScoreError', 'Total marks must be at least 1');
            isValid = false;
        }

        // Submission type validation
        if (!elements.assignmentSubmissionType.value) {
            showFieldError('submissionTypeError', 'Submission type is required');
            isValid = false;
        }

        // Status validation
        if (!elements.assignmentStatus.value) {
            showFieldError('statusError', 'Status is required');
            isValid = false;
        }

        return isValid;
    };

    /**
     * Display form errors
     */
    const displayFormErrors = (errors) => {
        Object.keys(errors).forEach(field => {
            const errorId = `${field}Error`;
            const errorElement = document.getElementById(errorId);
            if (errorElement) {
                const message = Array.isArray(errors[field]) 
                    ? errors[field][0] 
                    : errors[field];
                showFieldError(errorId, message);
            }
        });
    };

    /**
     * Show field error
     */
    const showFieldError = (errorId, message) => {
        const errorElement = document.getElementById(errorId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    };

    /**
     * Clear form errors
     */
    const clearFormErrors = () => {
        document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });
    };

    /**
     * Show form success message
     */
    const showFormSuccess = (message, type) => {
        elements.formSuccess.textContent = message;
        elements.formSuccess.style.display = 'block';
        if (typeof showToast === 'function') {
      showToast(message, type || 'info');
      return;
    }
    console.log((type || 'info').toUpperCase() + ': ' + message);
    };

    /**
     * Apply filters
     */
    const applyFilters = () => {
        state.filters.courseId = elements.filterClass.value;
        state.filters.status = elements.filterStatus.value;
        state.filters.keyword = elements.searchKeyword.value;
        state.currentPage = 1;
        loadAssignments();
    };

    /**
     * Reset filters
     */
    const resetFilters = () => {
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = null;
        }

        elements.filterClass.value = '';
        elements.filterStatus.value = '';
        elements.searchKeyword.value = '';
        state.filters = { courseId: '', status: '', keyword: '' };
        state.currentPage = 1;
        loadAssignments();
    };

    /**
     * Open/close modal
     */
    const openModal = () => {
        if (!elements.modal) {
            return;
        }

        elements.modal.classList.add('open');
    };

    const closeModal = () => {
        if (!elements.modal) {
            return;
        }

        elements.modal.classList.remove('open');
        if (elements.form) {
            elements.form.reset();
        }
        state.existingFilePath = null;
        setInstructionFileHelp(null);
        clearFormErrors();
    };

    /**
     * Attach event listeners
     */
    const attachEventListeners = () => {
        // Prevent duplicate bindings on the same mounted fragment.
        if (listenersBoundTo === elements.assignmentsList) {
            return;
        }

        elements.createBtn.addEventListener('click', openCreateModal);
        elements.modalCloseBtn.addEventListener('click', closeModal);
        elements.modalCancelBtn.addEventListener('click', closeModal);
        elements.form.addEventListener('submit', handleFormSubmit);
        elements.applyFiltersBtn.addEventListener('click', applyFilters);
        elements.resetFiltersBtn.addEventListener('click', resetFilters);

        elements.assignmentClass.addEventListener('change', async () => {
            clearFormErrors();
            await populateSectionDropdown(elements.assignmentClass.value);
        });

        // Close modal when clicking outside
        elements.modal.addEventListener('click', (e) => {
            if (e.target === elements.modal) {
                closeModal();
            }
        });

        // Debounced search while typing.
        elements.searchKeyword.addEventListener('input', () => {
            if (searchDebounceTimer) {
                clearTimeout(searchDebounceTimer);
            }

            searchDebounceTimer = setTimeout(() => {
                applyFilters();
            }, CONFIG.searchDebounceMs);
        });

        // Enter applies immediately.
        elements.searchKeyword.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (searchDebounceTimer) {
                    clearTimeout(searchDebounceTimer);
                    searchDebounceTimer = null;
                }
                applyFilters();
            }
        });

        listenersBoundTo = elements.assignmentsList;
    };

    /**
     * Show error message (toast)
     */
    const showError = (message, type) => {
         if (typeof showToast === 'function') {
      showToast(message, type || 'error');
      return;
    }
    console.error((type || 'error').toUpperCase() + ': ' + message);
        
    };

    /**
     * Show success message (toast)
     */
    const showSuccess = (message, type) => {
         if (typeof showToast === 'function') {
      showToast(message, type || 'success');
      return;
    }
    console.log((type || 'success').toUpperCase() + ': ' + message);
        
    };

    /**
     * Format date
     */
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    /**
     * Capitalize first letter
     */
    const capitalizeFirst = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    /**
     * Normalize status for resilient comparisons (DB/API can vary in casing/whitespace)
     */
    const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

    /**
     * Canonicalize status values returned by API/DB.
     */
    const canonicalStatus = (value) => {
        const normalized = normalizeStatus(value);

        if (!normalized) {
            return 'draft';
        }

        if (normalized.includes('active') || normalized === '1') {
            return 'active';
        }

        if (normalized.includes('draft') || normalized === '0') {
            return 'draft';
        }

        if (normalized.includes('archiv')) {
            return 'archived';
        }

        return normalized;
    };

    /**
     * Bucket status into UI-supported groups.
     * Any unknown status is treated as active so cards stay consistent.
     */
    const statusBucket = (value) => {
        const s = canonicalStatus(value);
        if (s === 'draft' || s === 'archived' || s === 'active') {
            return s;
        }
        return 'active';
    };

    /**
     * Escape HTML to prevent XSS
     */
    const escapeHtml = (text) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    };

    // Public API
    return {
        init,
        editAssignment,
        deleteAssignment,
        viewAssignment,
        viewSubmissions,
        applyFilters,
        resetFilters
    };
})();

// Initialize on teacher SPA fragment load, with a fallback for direct page load.
document.addEventListener('page:loaded', (event) => {
    if (event.detail && event.detail.page === 'assignments') {
        Assignments.init();
    }
});

const bootAssignmentsIfPresent = () => {
    if (document.getElementById('assignmentsList')) {
        Assignments.init();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootAssignmentsIfPresent);
} else {
    bootAssignmentsIfPresent();
}

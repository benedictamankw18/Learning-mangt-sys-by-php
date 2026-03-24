(function () {
    'use strict';

    const state = {
        courses: [],
        quizzes: [],
        sectionsByCourse: new Map(),
        selectedCourseId: null,
        selectedQuizId: null,
        selectedQuizTitle: '',
        selectedQuestionId: null,
        currentQuestionRows: [],
        deleteConfirmResolve: null
    };

    let elements = {};

    function hasPageRoot() {
        return !!document.getElementById('teacherQuizRoot');
    }

    function cacheElements() {
        elements = {
            root: document.getElementById('teacherQuizRoot'),
            notice: document.getElementById('quizNotice'),
            filterCourse: document.getElementById('quizFilterCourse'),
            refreshBtn: document.getElementById('refreshQuizListBtn'),
            createBtn: document.getElementById('createQuizBtn'),
            listBody: document.getElementById('quizListBody'),
            totalCount: document.getElementById('quizTotalCount'),
            activeCount: document.getElementById('quizActiveCount'),
            draftCount: document.getElementById('quizDraftCount'),
            archivedCount: document.getElementById('quizArchivedCount'),

            quizModal: document.getElementById('quizModal'),
            quizModalTitle: document.getElementById('quizModalTitle'),
            quizModalCloseBtn: document.getElementById('quizModalCloseBtn'),
            quizModalCancelBtn: document.getElementById('quizModalCancelBtn'),
            quizForm: document.getElementById('quizForm'),
            quizFormSubmitBtn: document.getElementById('quizFormSubmitBtn'),
            quizId: document.getElementById('quizId'),
            quizTitle: document.getElementById('quizTitle'),
            quizDescription: document.getElementById('quizDescription'),
            quizCourseId: document.getElementById('quizCourseId'),
            quizSectionId: document.getElementById('quizSectionId'),
            quizDurationMinutes: document.getElementById('quizDurationMinutes'),
            quizMaxAttempts: document.getElementById('quizMaxAttempts'),
            quizTotalPoints: document.getElementById('quizTotalPoints'),
            quizType: document.getElementById('quizType'),
            quizStatus: document.getElementById('quizStatus'),
            quizShowResults: document.getElementById('quizShowResults'),
            quizRandomizeQuestions: document.getElementById('quizRandomizeQuestions'),
            quizIsActivated: document.getElementById('quizIsActivated'),
            quizStartDate: document.getElementById('quizStartDate'),
            quizEndDate: document.getElementById('quizEndDate'),

            questionModal: document.getElementById('quizQuestionModal'),
            questionModalTitle: document.getElementById('questionModalTitle'),
            questionModalCloseBtn: document.getElementById('questionModalCloseBtn'),
            questionQuizTitle: document.getElementById('questionQuizTitle'),
            questionListBody: document.getElementById('questionListBody'),
            questionForm: document.getElementById('questionForm'),
            questionFormSubmitBtn: document.getElementById('questionFormSubmitBtn'),
            questionFormResetBtn: document.getElementById('questionFormResetBtn'),
            questionId: document.getElementById('questionId'),
            questionText: document.getElementById('questionText'),
            questionType: document.getElementById('questionType'),
            questionPoints: document.getElementById('questionPoints'),
            questionDifficulty: document.getElementById('questionDifficulty'),
            questionOptionsBlock: document.getElementById('questionOptionsBlock'),
            questionOptionA: document.getElementById('questionOptionA'),
            questionOptionB: document.getElementById('questionOptionB'),
            questionOptionC: document.getElementById('questionOptionC'),
            questionOptionD: document.getElementById('questionOptionD'),
            questionCorrectOption: document.getElementById('questionCorrectOption'),
            questionCorrectAnswer: document.getElementById('questionCorrectAnswer'),
            questionExplanation: document.getElementById('questionExplanation'),
            questionPreviewQuizBtn: document.getElementById('questionPreviewQuizBtn'),
            questionPublishQuizBtn: document.getElementById('questionPublishQuizBtn'),
            questionViewResultsBtn: document.getElementById('questionViewResultsBtn'),
            questionExportResultsBtn: document.getElementById('questionExportResultsBtn'),

            deleteConfirmModal: document.getElementById('deleteConfirmModal'),
            deleteConfirmText: document.getElementById('deleteConfirmText'),
            deleteConfirmCloseBtn: document.getElementById('deleteConfirmCloseBtn'),
            deleteConfirmCancelBtn: document.getElementById('deleteConfirmCancelBtn'),
            deleteConfirmOkBtn: document.getElementById('deleteConfirmOkBtn')
        };
    }

    function showNotice(message, type) {
        if (!elements.notice) {
            return;
        }

        if (!message) {
            elements.notice.className = 'tq-note';
            elements.notice.textContent = '';
            return;
        }

        elements.notice.className = `tq-note show ${type === 'error' ? 'error' : 'success'}`;
        elements.notice.textContent = message;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatDateTime(value) {
        if (!value) {
            return '-';
        }

        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) {
            return '-';
        }

        return dt.toLocaleString();
    }

    function toDateTimeLocal(value) {
        if (!value) {
            return '';
        }

        const dt = new Date(value);
        if (Number.isNaN(dt.getTime())) {
            return '';
        }

        const pad = (n) => String(n).padStart(2, '0');
        const y = dt.getFullYear();
        const m = pad(dt.getMonth() + 1);
        const d = pad(dt.getDate());
        const hh = pad(dt.getHours());
        const mm = pad(dt.getMinutes());

        return `${y}-${m}-${d}T${hh}:${mm}`;
    }

    function normalizeQuestionType(value) {
        const t = String(value || '').trim().toLowerCase();
        if (!t) {
            return 'multiple_choice';
        }
        return t;
    }

    function syncQuestionTypeFields() {
        if (!elements.questionType) {
            return;
        }

        const type = normalizeQuestionType(elements.questionType.value);
        const isMultipleChoice = type === 'multiple_choice';

        if (elements.questionOptionsBlock) {
            elements.questionOptionsBlock.style.display = isMultipleChoice ? 'grid' : 'none';
        }

        if (elements.questionCorrectAnswer) {
            elements.questionCorrectAnswer.placeholder = isMultipleChoice
                ? 'Used for non-multiple-choice only'
                : 'Correct answer (optional for essay)';
        }
    }

    function resetQuestionForm() {
        state.selectedQuestionId = null;

        if (elements.questionForm) {
            elements.questionForm.reset();
        }

        if (elements.questionId) {
            elements.questionId.value = '';
        }

        if (elements.questionDifficulty) {
            elements.questionDifficulty.value = 'medium';
        }

        if (elements.questionPoints) {
            elements.questionPoints.value = '1';
        }

        if (elements.questionType) {
            elements.questionType.value = 'multiple_choice';
        }

        if (elements.questionFormSubmitBtn) {
            elements.questionFormSubmitBtn.textContent = 'Add Question';
        }

        syncQuestionTypeFields();
    }

    function startEditQuestion(questionId) {
        const question = state.currentQuestionRows.find((row) => Number(row.question_id || 0) === Number(questionId || 0));
        if (!question) {
            showNotice('Unable to find that question for editing.', 'error');
            return;
        }

        state.selectedQuestionId = Number(question.question_id || 0);
        if (elements.questionId) {
            elements.questionId.value = String(state.selectedQuestionId);
        }

        if (elements.questionText) elements.questionText.value = question.question_text || '';
        if (elements.questionType) elements.questionType.value = normalizeQuestionType(question.question_type);
        if (elements.questionPoints) elements.questionPoints.value = String(Number(question.points || 1));
        if (elements.questionDifficulty) elements.questionDifficulty.value = question.difficulty || 'medium';
        if (elements.questionCorrectAnswer) elements.questionCorrectAnswer.value = question.correct_answer || '';
        if (elements.questionExplanation) elements.questionExplanation.value = question.explanation || '';

        const options = Array.isArray(question.options) ? question.options : [];
        const byLabel = new Map(options.map((opt) => [String(opt.option_label || '').toUpperCase(), opt]));

        if (elements.questionOptionA) elements.questionOptionA.value = byLabel.get('A') ? (byLabel.get('A').option_text || '') : '';
        if (elements.questionOptionB) elements.questionOptionB.value = byLabel.get('B') ? (byLabel.get('B').option_text || '') : '';
        if (elements.questionOptionC) elements.questionOptionC.value = byLabel.get('C') ? (byLabel.get('C').option_text || '') : '';
        if (elements.questionOptionD) elements.questionOptionD.value = byLabel.get('D') ? (byLabel.get('D').option_text || '') : '';

        const correctOption = options.find((opt) => Number(opt.is_correct || 0) === 1);
        if (elements.questionCorrectOption) {
            elements.questionCorrectOption.value = correctOption ? String(correctOption.option_label || '').toUpperCase() : '';
        }

        if (elements.questionFormSubmitBtn) {
            elements.questionFormSubmitBtn.textContent = 'Update Question';
        }

        syncQuestionTypeFields();
        if (elements.questionText) {
            elements.questionText.focus();
        }
    }

    function normalizeRows(payload, key) {
        const data = payload && payload.data ? payload.data : payload;

        if (Array.isArray(data && data[key])) {
            return data[key];
        }

        if (Array.isArray(data)) {
            return data;
        }

        return [];
    }

    function findCourseName(courseId) {
        const id = Number(courseId || 0);
        const course = state.courses.find((item) => Number(item.course_id || item.id || 0) === id);
        if (!course) {
            return `Course ${id}`;
        }

        const subject = course.subject_name || course.subject_code || course.subject || course.name || 'Subject';
        const className = course.class_name || (course.class_id ? `Class ${course.class_id}` : 'Class');
        return `${subject} (${className})`;
    }

    async function init() {
        cacheElements();

        if (!elements.root) {
            return;
        }

        if (elements.root.dataset.initialized === '1') {
            return;
        }

        elements.root.dataset.initialized = '1';

        bindEvents();
        syncQuestionTypeFields();
        await loadCourses();

        if (state.selectedCourseId) {
            await loadQuizzes(state.selectedCourseId);
        } else {
            renderList([]);
            updateStats([]);
        }
    }

    function bindEvents() {
        if (elements.filterCourse) {
            elements.filterCourse.addEventListener('change', async () => {
                const value = Number(elements.filterCourse.value || 0);
                state.selectedCourseId = value > 0 ? value : null;
                if (!state.selectedCourseId) {
                    state.quizzes = [];
                    renderList([]);
                    updateStats([]);
                    return;
                }

                await loadQuizzes(state.selectedCourseId);
            });
        }

        if (elements.refreshBtn) {
            elements.refreshBtn.addEventListener('click', async () => {
                if (!state.selectedCourseId) {
                    showNotice('Select a course first to load quizzes.', 'error');
                    return;
                }

                await loadQuizzes(state.selectedCourseId);
                showNotice('Quiz list refreshed.', 'success');
            });
        }

        if (elements.createBtn) {
            elements.createBtn.addEventListener('click', () => openQuizModal());
        }

        if (elements.quizModalCloseBtn) {
            elements.quizModalCloseBtn.addEventListener('click', closeQuizModal);
        }

        if (elements.quizModalCancelBtn) {
            elements.quizModalCancelBtn.addEventListener('click', closeQuizModal);
        }

        if (elements.quizForm) {
            elements.quizForm.addEventListener('submit', onSubmitQuizForm);
        }

        if (elements.quizCourseId) {
            elements.quizCourseId.addEventListener('change', async () => {
                const courseId = Number(elements.quizCourseId.value || 0);
                await populateSectionSelect(courseId);
            });
        }

        if (elements.questionModalCloseBtn) {
            elements.questionModalCloseBtn.addEventListener('click', closeQuestionModal);
        }

        if (elements.questionForm) {
            elements.questionForm.addEventListener('submit', onSubmitQuestionForm);
        }

        if (elements.questionFormResetBtn) {
            elements.questionFormResetBtn.addEventListener('click', resetQuestionForm);
        }

        if (elements.questionType) {
            elements.questionType.addEventListener('change', syncQuestionTypeFields);
        }

        if (elements.questionListBody) {
            elements.questionListBody.addEventListener('click', onQuestionListActionClick);
        }

        if (elements.questionPreviewQuizBtn) {
            elements.questionPreviewQuizBtn.addEventListener('click', () => {
                if (!state.selectedQuizId) {
                    return;
                }
                window.location.hash = `#quiz-details?id=${state.selectedQuizId}`;
            });
        }

        if (elements.questionViewResultsBtn) {
            elements.questionViewResultsBtn.addEventListener('click', () => {
                if (!state.selectedQuizId) {
                    return;
                }
                window.location.hash = `#quiz-details?id=${state.selectedQuizId}`;
            });
        }

        if (elements.questionExportResultsBtn) {
            elements.questionExportResultsBtn.addEventListener('click', () => {
                if (!state.selectedQuizId) {
                    return;
                }
                window.location.hash = `#quiz-details?id=${state.selectedQuizId}`;
            });
        }

        if (elements.questionPublishQuizBtn) {
            elements.questionPublishQuizBtn.addEventListener('click', async () => {
                if (!state.selectedQuizId) {
                    return;
                }

                const quiz = state.quizzes.find((item) => Number(item.quiz_id || 0) === Number(state.selectedQuizId || 0));
                if (!quiz) {
                    showNotice('Unable to find quiz details for publish action.', 'error');
                    return;
                }

                await togglePublish(quiz);
                const refreshed = state.quizzes.find((item) => Number(item.quiz_id || 0) === Number(state.selectedQuizId || 0));
                const isPublished = String((refreshed || quiz).status || '').toLowerCase() === 'active';
                elements.questionPublishQuizBtn.innerHTML = isPublished
                    ? '<i class="fas fa-eye-slash"></i> Unpublish Quiz'
                    : '<i class="fas fa-paper-plane"></i> Publish Quiz';
            });
        }

        if (elements.deleteConfirmCloseBtn) {
            elements.deleteConfirmCloseBtn.addEventListener('click', () => closeDeleteConfirmModal(false));
        }

        if (elements.deleteConfirmCancelBtn) {
            elements.deleteConfirmCancelBtn.addEventListener('click', () => closeDeleteConfirmModal(false));
        }

        if (elements.deleteConfirmOkBtn) {
            elements.deleteConfirmOkBtn.addEventListener('click', () => closeDeleteConfirmModal(true));
        }

        if (elements.listBody) {
            elements.listBody.addEventListener('click', onListActionClick);
        }

        if (elements.quizModal) {
            elements.quizModal.addEventListener('click', (event) => {
                if (event.target === elements.quizModal) {
                    closeQuizModal();
                }
            });
        }

        if (elements.questionModal) {
            elements.questionModal.addEventListener('click', (event) => {
                if (event.target === elements.questionModal) {
                    closeQuestionModal();
                }
            });
        }

        if (elements.deleteConfirmModal) {
            elements.deleteConfirmModal.addEventListener('click', (event) => {
                if (event.target === elements.deleteConfirmModal) {
                    closeDeleteConfirmModal(false);
                }
            });
        }
    }

    async function loadCourses() {
        try {
            showNotice('', 'success');
            const user = Auth.getUser ? Auth.getUser() : null;
            const teacherUuid = user && user.teacher_uuid ? user.teacher_uuid : null;

            let courses = [];
            if (teacherUuid) {
                try {
                    const response = await TeacherAPI.getCourses(teacherUuid, { limit: 500 });
                    courses = normalizeRows(response, 'courses');
                } catch (error) {
                    console.warn('Teacher courses endpoint failed; trying dashboard fallback.', error);
                }
            }

            if (!Array.isArray(courses) || courses.length === 0) {
                const stats = await DashboardAPI.getTeacherStats();
                courses = normalizeRows(stats, 'courses');
            }

            state.courses = Array.isArray(courses) ? courses : [];
            populateCourseSelects();
        } catch (error) {
            console.error('Failed to load courses for quizzes:', error);
            showNotice(error.message || 'Failed to load courses.', 'error');
        }
    }

    function populateCourseSelects() {
        const options = state.courses.map((course) => {
            const id = Number(course.course_id || course.id || 0);
            const label = findCourseName(id);
            return `<option value="${id}">${escapeHtml(label)}</option>`;
        });

        if (elements.filterCourse) {
            elements.filterCourse.innerHTML = '<option value="">Select a course</option>' + options.join('');
        }

        if (elements.quizCourseId) {
            elements.quizCourseId.innerHTML = '<option value="">Select course</option>' + options.join('');
        }

        if (!state.selectedCourseId && state.courses.length > 0) {
            const firstCourseId = Number(state.courses[0].course_id || state.courses[0].id || 0);
            state.selectedCourseId = firstCourseId || null;
        }

        if (state.selectedCourseId) {
            if (elements.filterCourse) {
                elements.filterCourse.value = String(state.selectedCourseId);
            }
            if (elements.quizCourseId) {
                elements.quizCourseId.value = String(state.selectedCourseId);
            }
        }
    }

    function normalizeSections(payload) {
        const data = payload && payload.data ? payload.data : payload;
        const rows = Array.isArray(data && data.sections)
            ? data.sections
            : Array.isArray(data)
                ? data
                : [];

        return rows
            .map((row) => ({
                section_id: Number(row.course_sections_id || row.section_id || row.id || 0),
                section_name: row.section_name || row.name || 'Section',
                order_index: Number(row.order_index || 0) || 0,
                is_active: Number(row.is_active ?? 1) === 1
            }))
            .filter((row) => Number.isInteger(row.section_id) && row.section_id > 0)
            .sort((a, b) => a.order_index - b.order_index);
    }

    async function loadSectionsForCourse(courseId) {
        const id = Number(courseId || 0);
        if (!id) {
            return [];
        }

        if (state.sectionsByCourse.has(id)) {
            return state.sectionsByCourse.get(id);
        }

        const response = await CourseContentAPI.getSections(id);
        const sections = normalizeSections(response);
        state.sectionsByCourse.set(id, sections);
        return sections;
    }

    async function populateSectionSelect(courseId, selectedSectionId) {
        if (!elements.quizSectionId) {
            return;
        }

        const id = Number(courseId || 0);
        const selected = Number(selectedSectionId || 0);

        if (!id) {
            elements.quizSectionId.innerHTML = '<option value="">All sections</option>';
            elements.quizSectionId.value = '';
            return;
        }

        elements.quizSectionId.innerHTML = '<option value="">Loading sections...</option>';

        try {
            const sections = await loadSectionsForCourse(id);
            const options = sections
                .map((section) => `<option value="${section.section_id}">${escapeHtml(section.section_name)}</option>`)
                .join('');
            elements.quizSectionId.innerHTML = '<option value="">All sections</option>' + options;

            if (selected > 0) {
                elements.quizSectionId.value = String(selected);
            } else {
                elements.quizSectionId.value = '';
            }
        } catch (error) {
            console.warn('Failed to load course sections for quiz form:', error);
            elements.quizSectionId.innerHTML = '<option value="">All sections</option>';
            elements.quizSectionId.value = '';
        }
    }

    async function loadQuizzes(courseId) {
        if (!courseId) {
            renderList([]);
            updateStats([]);
            return;
        }

        elements.listBody.innerHTML = '<div class="tq-loading">Loading quizzes...</div>';

        try {
            const response = await QuizAPI.getByCourse(courseId);
            state.quizzes = normalizeRows(response, 'quizzes');
            renderList(state.quizzes);
            updateStats(state.quizzes);
        } catch (error) {
            console.error('Failed to load quizzes:', error);
            elements.listBody.innerHTML = `<div class="tq-error">${escapeHtml(error.message || 'Failed to load quizzes.')}</div>`;
            updateStats([]);
        }
    }

    function updateStats(quizzes) {
        const rows = Array.isArray(quizzes) ? quizzes : [];
        const total = rows.length;
        const active = rows.filter((q) => String(q.status || '').toLowerCase() === 'active').length;
        const draft = rows.filter((q) => String(q.status || '').toLowerCase() === 'draft').length;
        const archived = rows.filter((q) => String(q.status || '').toLowerCase() === 'archived').length;

        if (elements.totalCount) elements.totalCount.textContent = String(total);
        if (elements.activeCount) elements.activeCount.textContent = String(active);
        if (elements.draftCount) elements.draftCount.textContent = String(draft);
        if (elements.archivedCount) elements.archivedCount.textContent = String(archived);
    }

    function renderList(quizzes) {
        const rows = Array.isArray(quizzes) ? quizzes : [];

        if (!rows.length) {
            elements.listBody.innerHTML = '<div class="tq-empty">No quizzes found for the selected course.</div>';
            return;
        }

        elements.listBody.innerHTML = rows
            .map((quiz) => {
                const id = Number(quiz.quiz_id || 0);
                const title = quiz.title || `Quiz ${id}`;
                const description = quiz.description || 'No description';
                const type = String(quiz.quiz_type || 'graded');
                const status = String(quiz.status || 'draft');
                const duration = Number(quiz.duration_minutes || 0);
                const maxAttempts = Number(quiz.max_attempts || 1);
                const totalPoints = Number(quiz.total_points || 0);
                const sectionName = quiz.section_name ? String(quiz.section_name) : 'All sections';
                const startDate = formatDateTime(quiz.start_date);
                const endDate = formatDateTime(quiz.end_date);
                const published = status === 'active';

                return `
                    <div class="tq-row">
                        <div class="tq-title">
                            <strong>${escapeHtml(title)}</strong>
                            <span>${escapeHtml(description)}</span>
                        </div>
                        <div>${escapeHtml(type)}</div>
                        <div>${escapeHtml(sectionName)}</div>
                        <div>${escapeHtml(totalPoints)}</div>
                        <div>${duration > 0 ? `${duration} min` : '-'}</div>
                        <div>${maxAttempts}</div>
                        <div><span class="tq-chip ${escapeHtml(status)}">${escapeHtml(status)}</span></div>
                        <div>${escapeHtml(startDate)}</div>
                        <div>${escapeHtml(endDate)}</div>
                        <div class="tq-actions">
                            <button type="button" class="tq-btn-icon" data-action="view" data-id="${id}" title="View" aria-label="View">
                                <i class="fas fa-eye" aria-hidden="true"></i>
                            </button>
                            <button type="button" class="tq-btn-icon" data-action="questions" data-id="${id}" data-title="${escapeHtml(title)}" title="Questions" aria-label="Questions">
                                <i class="fas fa-list-check" aria-hidden="true"></i>
                            </button>
                            <button type="button" class="tq-btn-icon" data-action="edit" data-id="${id}" title="Edit" aria-label="Edit">
                                <i class="fas fa-pen-to-square" aria-hidden="true"></i>
                            </button>
                            <button type="button" class="tq-btn-icon" data-action="toggle-publish" data-id="${id}" title="${published ? 'Unpublish' : 'Publish'}" aria-label="${published ? 'Unpublish' : 'Publish'}">
                                <i class="fas ${published ? 'fa-eye-slash' : 'fa-paper-plane'}" aria-hidden="true"></i>
                            </button>
                            <button type="button" class="tq-btn-icon danger" data-action="delete" data-id="${id}" title="Delete" aria-label="Delete">
                                <i class="fas fa-trash" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    async function openQuizModal(quiz) {
        if (!elements.quizModal || !elements.quizForm) {
            return;
        }

        elements.quizForm.reset();
        elements.quizId.value = '';
        elements.quizModalTitle.textContent = quiz ? 'Edit Quiz' : 'Create Quiz';
        elements.quizFormSubmitBtn.textContent = quiz ? 'Update Quiz' : 'Save Quiz';

        const defaultCourseId = quiz ? Number(quiz.course_id || 0) : Number(state.selectedCourseId || 0);
        if (defaultCourseId && elements.quizCourseId) {
            elements.quizCourseId.value = String(defaultCourseId);
        }

        await populateSectionSelect(defaultCourseId, quiz ? Number(quiz.section_id || 0) : 0);

        if (quiz) {
            elements.quizId.value = String(quiz.quiz_id || '');
            elements.quizTitle.value = quiz.title || '';
            elements.quizDescription.value = quiz.description || '';
            elements.quizDurationMinutes.value = String(quiz.duration_minutes || 30);
            elements.quizMaxAttempts.value = String(quiz.max_attempts || 1);
            elements.quizTotalPoints.value = String(Number(quiz.total_points || 0));
            elements.quizType.value = quiz.quiz_type || 'graded';
            elements.quizStatus.value = quiz.status || 'draft';
            elements.quizShowResults.value = quiz.show_results || 'after_end';
            elements.quizRandomizeQuestions.value = String(Number(quiz.randomize_questions || 0));
            elements.quizIsActivated.value = String(Number(quiz.is_activated || 0));
            elements.quizStartDate.value = toDateTimeLocal(quiz.start_date);
            elements.quizEndDate.value = toDateTimeLocal(quiz.end_date);
        } else {
            elements.quizTotalPoints.value = '0';
            elements.quizStatus.value = 'draft';
            elements.quizShowResults.value = 'after_end';
            elements.quizRandomizeQuestions.value = '0';
            elements.quizIsActivated.value = '0';
        }

        elements.quizModal.classList.add('open');
        elements.quizModal.setAttribute('aria-hidden', 'false');
    }

    function closeQuizModal() {
        if (!elements.quizModal) {
            return;
        }

        elements.quizModal.classList.remove('open');
        elements.quizModal.setAttribute('aria-hidden', 'true');
    }

    async function onSubmitQuizForm(event) {
        event.preventDefault();

        const quizId = Number(elements.quizId.value || 0);
        const courseId = Number(elements.quizCourseId.value || 0);
        const duration = Number(elements.quizDurationMinutes.value || 0);

        if (!courseId) {
            showNotice('Please select a course for this quiz.', 'error');
            return;
        }

        if (!duration || duration < 1) {
            showNotice('Duration must be at least 1 minute.', 'error');
            return;
        }

        const payload = {
            course_id: courseId,
            section_id: elements.quizSectionId && elements.quizSectionId.value ? Number(elements.quizSectionId.value) : null,
            title: String(elements.quizTitle.value || '').trim(),
            description: String(elements.quizDescription.value || '').trim() || null,
            duration_minutes: duration,
            max_attempts: Number(elements.quizMaxAttempts.value || 1),
            status: elements.quizStatus.value || 'draft',
            quiz_type: elements.quizType.value || 'graded',
            is_activated: Number(elements.quizIsActivated.value || 0),
            show_results: elements.quizShowResults.value || 'after_end',
            randomize_questions: Number(elements.quizRandomizeQuestions.value || 0),
            start_date: elements.quizStartDate.value ? new Date(elements.quizStartDate.value).toISOString() : null,
            end_date: elements.quizEndDate.value ? new Date(elements.quizEndDate.value).toISOString() : null
        };

        if (!payload.title) {
            showNotice('Quiz title is required.', 'error');
            return;
        }

        const originalLabel = elements.quizFormSubmitBtn.textContent;
        elements.quizFormSubmitBtn.disabled = true;
        elements.quizFormSubmitBtn.textContent = quizId ? 'Updating...' : 'Saving...';

        try {
            if (quizId > 0) {
                await QuizAPI.update(quizId, payload);
                showNotice('Quiz updated successfully.', 'success');
            } else {
                await QuizAPI.create(payload);
                showNotice('Quiz created successfully.', 'success');
            }

            state.selectedCourseId = courseId;
            if (elements.filterCourse) {
                elements.filterCourse.value = String(courseId);
            }

            await loadQuizzes(courseId);
            closeQuizModal();
        } catch (error) {
            console.error('Failed to save quiz:', error);
            showNotice(error.message || 'Failed to save quiz.', 'error');
        } finally {
            elements.quizFormSubmitBtn.disabled = false;
            elements.quizFormSubmitBtn.textContent = originalLabel;
        }
    }

    async function onListActionClick(event) {
        const button = event.target.closest('[data-action]');
        if (!button) {
            return;
        }

        const action = button.dataset.action;
        const quizId = Number(button.dataset.id || 0);
        if (!quizId) {
            return;
        }

        const quiz = state.quizzes.find((item) => Number(item.quiz_id || 0) === quizId);

        if (action === 'view') {
            window.location.hash = `#quiz-details?id=${quizId}`;
            return;
        }

        if (action === 'edit') {
            if (quiz) {
                openQuizModal(quiz);
            }
            return;
        }

        if (action === 'delete') {
            await deleteQuiz(quizId, quiz ? quiz.title : `Quiz ${quizId}`);
            return;
        }

        if (action === 'toggle-publish') {
            if (quiz) {
                await togglePublish(quiz);
            }
            return;
        }

        if (action === 'questions') {
            window.location.hash = `#quiz-questions?id=${quizId}`;
            return;
        }
    }

    async function deleteQuiz(quizId, quizTitle) {
        const ok = await confirmDeleteQuiz(quizTitle);
        if (!ok) {
            return;
        }

        try {
            await QuizAPI.delete(quizId);
            showNotice('Quiz deleted successfully.', 'success');
            await loadQuizzes(state.selectedCourseId);
        } catch (error) {
            console.error('Failed to delete quiz:', error);
            showNotice(error.message || 'Failed to delete quiz.', 'error');
        }
    }

    function confirmDeleteQuiz(quizTitle) {
        if (!elements.deleteConfirmModal) {
            return Promise.resolve(false);
        }

        if (elements.deleteConfirmText) {
            const safeTitle = escapeHtml(quizTitle || 'this quiz');
            elements.deleteConfirmText.innerHTML = `Delete <strong>${safeTitle}</strong>? This cannot be undone.`;
        }

        elements.deleteConfirmModal.classList.add('open');
        elements.deleteConfirmModal.setAttribute('aria-hidden', 'false');

        return new Promise((resolve) => {
            state.deleteConfirmResolve = resolve;
        });
    }

    function closeDeleteConfirmModal(confirmed) {
        if (elements.deleteConfirmModal) {
            elements.deleteConfirmModal.classList.remove('open');
            elements.deleteConfirmModal.setAttribute('aria-hidden', 'true');
        }

        if (typeof state.deleteConfirmResolve === 'function') {
            const resolver = state.deleteConfirmResolve;
            state.deleteConfirmResolve = null;
            resolver(!!confirmed);
        }
    }

    async function togglePublish(quiz) {
        const isActive = String(quiz.status || '').toLowerCase() === 'active';

        const payload = {
            status: isActive ? 'draft' : 'active',
            is_activated: isActive ? 0 : 1
        };

        try {
            await QuizAPI.update(Number(quiz.quiz_id), payload);
            showNotice(isActive ? 'Quiz moved to draft.' : 'Quiz published successfully.', 'success');
            await loadQuizzes(state.selectedCourseId);
        } catch (error) {
            console.error('Failed to change quiz publish state:', error);
            showNotice(error.message || 'Failed to update quiz status.', 'error');
        }
    }

    async function openQuestionModal(quizId, quizTitle) {
        state.selectedQuizId = quizId;
        state.selectedQuizTitle = quizTitle || `Quiz ${quizId}`;
        state.currentQuestionRows = [];

        if (elements.questionQuizTitle) {
            elements.questionQuizTitle.textContent = state.selectedQuizTitle;
        }

        resetQuestionForm();

        const quiz = state.quizzes.find((item) => Number(item.quiz_id || 0) === Number(quizId || 0));
        if (elements.questionPublishQuizBtn && quiz) {
            const isPublished = String(quiz.status || '').toLowerCase() === 'active';
            elements.questionPublishQuizBtn.innerHTML = isPublished
                ? '<i class="fas fa-eye-slash"></i> Unpublish Quiz'
                : '<i class="fas fa-paper-plane"></i> Publish Quiz';
        }

        elements.questionModal.classList.add('open');
        elements.questionModal.setAttribute('aria-hidden', 'false');
        await loadQuestions(quizId);
    }

    function closeQuestionModal() {
        if (!elements.questionModal) {
            return;
        }

        elements.questionModal.classList.remove('open');
        elements.questionModal.setAttribute('aria-hidden', 'true');
        state.selectedQuizId = null;
        state.selectedQuizTitle = '';
        state.currentQuestionRows = [];
        resetQuestionForm();
    }

    async function loadQuestions(quizId) {
        if (!quizId || !elements.questionListBody) {
            return;
        }

        elements.questionListBody.innerHTML = '<div class="tq-loading">Loading questions...</div>';

        try {
            const response = await QuizAPI.getQuestions(quizId);
            const questions = normalizeRows(response, 'questions');
            state.currentQuestionRows = Array.isArray(questions) ? questions : [];

            if (!questions.length) {
                elements.questionListBody.innerHTML = '<div class="tq-empty">No questions added yet.</div>';
                return;
            }

            elements.questionListBody.innerHTML = questions
                .map((question, index) => {
                    const questionId = Number(question.question_id || 0);
                    const text = question.question_text || `Question ${index + 1}`;
                    const type = String(question.question_type || 'unknown').replace(/_/g, ' ');
                    const points = Number(question.points || 0);
                    const difficulty = question.difficulty || 'medium';
                    const options = Array.isArray(question.options) ? question.options : [];
                    const optionPreview = options.length
                        ? options
                            .map((opt) => `${opt.option_label}: ${opt.option_text}`)
                            .join(' | ')
                        : '';
                    return `
                        <div class="tq-row tq-question-list-row">
                            <div class="tq-title">
                                <strong>Q${index + 1}</strong>
                                <span>${escapeHtml(text)}</span>
                                ${optionPreview ? `<span>${escapeHtml(optionPreview)}</span>` : ''}
                            </div>
                            <div>${escapeHtml(type)}</div>
                            <div>${points}</div>
                            <div>${escapeHtml(difficulty)}</div>
                            <div class="tq-actions">
                                <button type="button" class="tq-btn-icon" data-q-action="edit" data-qid="${questionId}" title="Edit Question" aria-label="Edit Question">
                                    <i class="fas fa-pen-to-square" aria-hidden="true"></i>
                                </button>
                                <button type="button" class="tq-btn-icon danger" data-q-action="delete" data-qid="${questionId}" title="Delete Question" aria-label="Delete Question">
                                    <i class="fas fa-trash" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    `;
                })
                .join('');
        } catch (error) {
            console.error('Failed to load quiz questions:', error);
            elements.questionListBody.innerHTML = `<div class="tq-error">${escapeHtml(error.message || 'Failed to load questions.')}</div>`;
            state.currentQuestionRows = [];
        }
    }

    async function onQuestionListActionClick(event) {
        const button = event.target.closest('[data-q-action]');
        if (!button) {
            return;
        }

        const action = button.dataset.qAction;
        const questionId = Number(button.dataset.qid || 0);
        if (!questionId) {
            return;
        }

        if (action === 'edit') {
            startEditQuestion(questionId);
            return;
        }

        if (action === 'delete') {
            try {
                await QuizAPI.deleteQuestion(questionId);
                showNotice('Question deleted successfully.', 'success');
                resetQuestionForm();
                await loadQuestions(state.selectedQuizId);
            } catch (error) {
                console.error('Failed to delete quiz question:', error);
                showNotice(error.message || 'Failed to delete question.', 'error');
            }
        }
    }

    async function onSubmitQuestionForm(event) {
        event.preventDefault();

        const quizId = Number(state.selectedQuizId || 0);
        const questionId = Number(elements.questionId && elements.questionId.value ? elements.questionId.value : 0);
        if (!quizId) {
            showNotice('No quiz selected for question creation.', 'error');
            return;
        }

        const type = normalizeQuestionType(elements.questionType.value || 'multiple_choice');

        let options = [];
        let correctAnswer = String(elements.questionCorrectAnswer.value || '').trim() || null;

        if (type === 'multiple_choice') {
            const optionA = String(elements.questionOptionA.value || '').trim();
            const optionB = String(elements.questionOptionB.value || '').trim();
            const optionC = String(elements.questionOptionC.value || '').trim();
            const optionD = String(elements.questionOptionD.value || '').trim();
            const correctOption = String(elements.questionCorrectOption.value || '').trim().toUpperCase();

            if (!optionA || !optionB || !optionC || !optionD) {
                showNotice('Please provide all options A-D for multiple choice questions.', 'error');
                return;
            }

            if (!correctOption || !['A', 'B', 'C', 'D'].includes(correctOption)) {
                showNotice('Please select the correct option for this multiple choice question.', 'error');
                return;
            }

            options = [
                { label: 'A', text: optionA, is_correct: correctOption === 'A' ? 1 : 0 },
                { label: 'B', text: optionB, is_correct: correctOption === 'B' ? 1 : 0 },
                { label: 'C', text: optionC, is_correct: correctOption === 'C' ? 1 : 0 },
                { label: 'D', text: optionD, is_correct: correctOption === 'D' ? 1 : 0 }
            ];

            correctAnswer = correctOption;
        }

        const payload = {
            question_text: String(elements.questionText.value || '').trim(),
            question_type: type,
            points: Number(elements.questionPoints.value || 1),
            difficulty: elements.questionDifficulty.value || 'medium',
            correct_answer: correctAnswer,
            explanation: String(elements.questionExplanation.value || '').trim() || null
        };

        if (options.length > 0) {
            payload.options = options;
        }

        if (!payload.question_text) {
            showNotice('Question text is required.', 'error');
            return;
        }

        const original = elements.questionFormSubmitBtn.textContent;
        elements.questionFormSubmitBtn.disabled = true;
        elements.questionFormSubmitBtn.textContent = questionId ? 'Updating...' : 'Adding...';

        try {
            if (questionId > 0) {
                await QuizAPI.updateQuestion(questionId, payload);
                showNotice('Question updated successfully.', 'success');
            } else {
                await QuizAPI.addQuestion(quizId, payload);
                showNotice('Question added successfully.', 'success');
            }

            resetQuestionForm();
            await loadQuestions(quizId);
        } catch (error) {
            console.error('Failed to add quiz question:', error);
            showNotice(error.message || 'Failed to save question.', 'error');
        } finally {
            elements.questionFormSubmitBtn.disabled = false;
            if (questionId > 0 && state.selectedQuestionId === questionId) {
                elements.questionFormSubmitBtn.textContent = original;
            } else {
                elements.questionFormSubmitBtn.textContent = 'Add Question';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', init);
    document.addEventListener('page:loaded', function (event) {
        const page = event && event.detail ? event.detail.page : '';
        if (!page || page === 'quizzes') {
            init();
            return;
        }

        if (hasPageRoot()) {
            init();
        }
    });
})();

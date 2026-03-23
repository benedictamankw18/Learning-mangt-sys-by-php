// Teacher Assessment Management JavaScript
(function () {
    'use strict';

let state = {
    classesSubjects: [],
    categories: [],
    students: [],
    existingAssessments: {},
    selectedClassSubject: null,
    selectedCategories: [],
    originalScores: {},
    changedScores: {},
    categoryMaxScores: {},
    autoFillStudentId: null,
    autoFillCategoryId: null,
    autoFillItems: [],
    autoFillGroups: []
};

function hasPageRoot() {
    return !!document.getElementById('assessmentPageRoot');
}

async function init() {
    const root = document.getElementById('assessmentPageRoot');
    if (!root) {
        return;
    }

    if (root.dataset.initialized === '1') {
        return;
    }

    root.dataset.initialized = '1';

    setupEventListeners();
    await loadInitialData();
}

/**
 * Load classes, subjects, and categories
 */
async function loadInitialData() {
    try {
        showLoading(true);

        await loadCurrentSemester();
        await loadCurrentAcademicYear();
        await loadInstitutionLogo();

        // Load classes and subjects
        const classesResponse = await TeacherAssessmentAPI.getClassesSubjects();
        if (classesResponse.success) {
            state.classesSubjects = classesResponse.data.classes_subjects || [];
            populateClassSubjectSelect();
        } else {
            showError('Failed to load classes and subjects');
        }

        // Load assessment categories
        const categoriesResponse = await TeacherAssessmentAPI.getCategories();
        if (categoriesResponse.success) {
            state.categories = categoriesResponse.data.categories || [];
            populateCategoryMultiselect();
        } else {
            showError('Failed to load assessment categories');
        }

        showLoading(false);
    } catch (error) {
        console.error('Error loading initial data:', error);
        showError('Failed to load page data. Please refresh.');
        showLoading(false);
    }
}

async function loadCurrentSemester() {
    const semesterValueEl = document.getElementById('semesterValue');
    if (!semesterValueEl) {
        return;
    }

    semesterValueEl.textContent = 'Not set';

    try {
        if (typeof API === 'undefined' || typeof API.get !== 'function') {
            return;
        }

        const response = await API.get(API_ENDPOINTS.SEMESTER_CURRENT);
        const semester = response && response.data ? response.data : null;
        const label = semester && (semester.semester_name || semester.name)
            ? (semester.semester_name || semester.name)
            : '';

        if (label) {
            semesterValueEl.textContent = label;
        }
    } catch (error) {
        console.warn('Failed to load current semester for assessment page.', error);
    }
}

async function loadCurrentAcademicYear() {
    const yearValueEl = document.getElementById('academicYearValue');
    if (!yearValueEl) {
        return;
    }

    yearValueEl.textContent = 'Not set';

    try {
        if (typeof API === 'undefined' || typeof API.get !== 'function') {
            return;
        }

        const response = await API.get(API_ENDPOINTS.ACADEMIC_YEAR_CURRENT);
        const year = response && response.data ? response.data : null;
        const label = year && (year.year_name || year.name) ? (year.year_name || year.name) : '';

        if (label) {
            yearValueEl.textContent = label;
        }
    } catch (error) {
        console.warn('Failed to load current academic year for assessment page.', error);
    }
}

async function loadInstitutionLogo() {
    const logoImg = document.getElementById('institutionLogoImage');
    if (!logoImg) {
        return;
    }

    const fallbackLogo = '../assets/img/logo.png';
    let logoPath = '';

    try {
        const user = typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
        const institutionUuid = String(
            user?.institution_uuid || user?.institution?.uuid || ''
        ).trim();

        if (institutionUuid && typeof API !== 'undefined' && typeof API.get === 'function') {
            const response = await API.get(`/api/institutions/${encodeURIComponent(institutionUuid)}/settings`);
            const settings = response?.data?.data || response?.data || {};
            logoPath = String(settings.logo_url || '').trim();
        }
    } catch (error) {
        console.warn('Failed to load institution logo from settings, using fallback.', error);
    }

    logoImg.src = resolveLogoUrl(logoPath, fallbackLogo);
    logoImg.onerror = () => {
        logoImg.onerror = null;
        logoImg.src = fallbackLogo;
    };
}

function resolveLogoUrl(logoPath, fallbackLogo) {
    if (!logoPath) {
        return fallbackLogo;
    }

    if (/^(https?:)?\/\//i.test(logoPath) || logoPath.startsWith('data:') || logoPath.startsWith('blob:')) {
        return logoPath;
    }

    const normalizedPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
    const base = typeof API_BASE_URL === 'string' ? API_BASE_URL.replace(/\/$/, '') : '';

    return base ? `${base}${normalizedPath}` : normalizedPath;
}

/**
 * Populate class/subject dropdown
 */
function populateClassSubjectSelect() {
    const select = document.getElementById('classSubjectSelect');
    select.innerHTML = '<option value="">-- Select Class and Subject --</option>';

    state.classesSubjects.forEach(cs => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = cs.class_name;

        cs.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = JSON.stringify({
                class_id: cs.class_id,
                class_subject_id: subject.class_subject_id,
                class_name: cs.class_name,
                subject_name: subject.subject_name
            });
            option.textContent = subject.subject_name;
            optgroup.appendChild(option);
        });

        select.appendChild(optgroup);
    });
}

/**
 * Populate category checkboxes
 */
function populateCategoryMultiselect() {
    const container = document.getElementById('categoryMultiselect');
    container.innerHTML = '';

    state.categories.forEach(cat => {
        const div = document.createElement('label');
        div.className = 'option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `cat_${cat.category_id}`;
        checkbox.value = cat.category_id;
        checkbox.dataset.label = `${cat.category_name} (${cat.weight_percentage}%)`;
        checkbox.addEventListener('change', updateCategoryComboDisplay);

        div.appendChild(checkbox);
        div.appendChild(document.createTextNode(` ${cat.category_name} (${cat.weight_percentage}%)`));
        container.appendChild(div);
    });

    updateCategoryComboDisplay();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    document.getElementById('submitFilterBtn').addEventListener('click', submitFilter);
    document.getElementById('clearFilterBtn').addEventListener('click', clearFilter);
    document.getElementById('saveAllBtn').addEventListener('click', saveAllScores);
    document.getElementById('publishBtn').addEventListener('click', publishAllScores);
    document.getElementById('resetScoresBtn').addEventListener('click', resetChanges);
    document.getElementById('autoFillConfirmBtn').addEventListener('click', confirmAutoFill);
    document.getElementById('autoFillCancelBtn').addEventListener('click', closeAutoFillModal);
    const scoresSearch = document.getElementById('scoresSearch');
    if (scoresSearch) {
        scoresSearch.addEventListener('input', (e) => {
            filterScoresTable(e.target.value || '');
        });
    }
    const autoFillModal = document.getElementById('autoFillModal');
    if (autoFillModal) {
        autoFillModal.addEventListener('click', (e) => {
            // Close only when clicking the faded backdrop, not modal content.
            if (e.target === autoFillModal) {
                closeAutoFillModal();
            }
        });
    }
    setupCategoryComboBox();
}

function setupCategoryComboBox() {
    const display = document.getElementById('display');
    const dropdown = document.getElementById('dropdown');
    const comboBox = document.getElementById('comboBox');
    const search = document.getElementById('search');
    const selectAll = document.getElementById('selectAll');

    if (!display || !dropdown || !comboBox || !search || !selectAll) {
        return;
    }

    display.addEventListener('click', () => {
        dropdown.classList.toggle('show');
    });

    selectAll.addEventListener('change', () => {
        document.querySelectorAll('#categoryMultiselect input[type="checkbox"]').forEach(cb => {
            cb.checked = selectAll.checked;
        });
        updateCategoryComboDisplay();
    });

    search.addEventListener('input', () => {
        const filter = search.value.toLowerCase();
        document.querySelectorAll('#categoryMultiselect .option').forEach(label => {
            const text = label.textContent.toLowerCase();
            label.style.display = text.includes(filter) ? 'block' : 'none';
        });
    });

    document.addEventListener('click', (e) => {
        if (!comboBox.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

function updateCategoryComboDisplay() {
    const display = document.getElementById('display');
    const selectAll = document.getElementById('selectAll');
    const checkboxes = Array.from(document.querySelectorAll('#categoryMultiselect input[type="checkbox"]'));
    const selected = checkboxes.filter(cb => cb.checked).map(cb => cb.dataset.label || cb.value);

    if (display) {
        display.textContent = selected.length ? selected.join(', ') : 'Select options';
    }

    if (selectAll) {
        selectAll.checked = checkboxes.length > 0 && selected.length === checkboxes.length;
    }
}

/**
 * Submit filter to load students and scores
 */
async function submitFilter() {
    try {
        // Validate selections
        const classSubjectValue = document.getElementById('classSubjectSelect').value;
        if (!classSubjectValue) {
            showError('Please select a class and subject');
            return;
        }

        state.selectedClassSubject = JSON.parse(classSubjectValue);
        
        const selectedCategoryCheckboxes = document.querySelectorAll('#categoryMultiselect input[type="checkbox"]:checked');
        if (selectedCategoryCheckboxes.length === 0) {
            showError('Please select at least one assessment category');
            return;
        }

        state.selectedCategories = Array.from(selectedCategoryCheckboxes).map(cb => ({
            category_id: parseInt(cb.value),
            category_name: cb.parentElement.textContent.trim()
        }));

        showLoading(true);
        
        // Load students for the class
        const studentsResponse = await TeacherAssessmentAPI.getStudents({
            class_id: state.selectedClassSubject.class_id,
            class_subject_id: state.selectedClassSubject.class_subject_id
        });

        if (!studentsResponse.success) {
            showError('Failed to load students');
            showLoading(false);
            return;
        }

        state.students = studentsResponse.data.students || [];

        // Load existing assessment scores
        const scoresResponse = await TeacherAssessmentAPI.getExistingAssessments({
            class_id: state.selectedClassSubject.class_id,
            class_subject_id: state.selectedClassSubject.class_subject_id
        });

        if (scoresResponse.success) {
            state.existingAssessments = scoresResponse.data.assessments || [];
        }

        // Clear previous state
        state.originalScores = {};
        state.changedScores = {};
        state.categoryMaxScores = deriveExistingCategoryMaxScores();

        // Render the scores table
        renderScoresTable();

        // Hide the empty state and show scores section
        document.getElementById('logoContainer').style.display = 'none';
        document.getElementById('scoresSection').style.display = 'block';

        const subtitle = document.getElementById('scoresSubtitle');
        subtitle.textContent = `${state.selectedClassSubject.class_name} - ${state.selectedClassSubject.subject_name} (${state.students.length} students)`;

        const scoresSearch = document.getElementById('scoresSearch');
        if (scoresSearch) {
            scoresSearch.value = '';
            filterScoresTable('');
        }

        showLoading(false);
    } catch (error) {
        console.error('Error submitting filter:', error);
        showError('Failed to load data. Please try again.');
        showLoading(false);
    }
}

/**
 * Render the scores table with dynamic columns
 */
function renderScoresTable() {
    const thead = document.querySelector('#scoresTable thead tr');
    const tbody = document.getElementById('scoresTableBody');

    // Clear and rebuild headers
    thead.innerHTML = '<th>Student Name</th>';

    // Add category columns
    state.selectedCategories.forEach(cat => {
        const th = document.createElement('th');
        th.innerHTML = `
            <div class="as-cat-head">
                <div class="as-cat-row">
                    <div class="as-cat-name">${cat.category_name}</div>
                    <button class="as-head-btn as-head-btn-icon auto-fill-btn"
                        data-category-id="${cat.category_id}" title="Auto Assessment">
                        <i class="fas fa-wand-magic-sparkles"></i>
                    </button>
                </div>
                <input type="number" class="as-max-input max-score-input"
                   placeholder="Max Score" data-category-id="${cat.category_id}"
                   min="0.01" step="0.01" value="${state.categoryMaxScores[cat.category_id] || ''}">
            </div>
        `;
        thead.appendChild(th);
    });

    // Build rows
    tbody.innerHTML = '';

    state.students.forEach(student => {
        const tr = document.createElement('tr');

        // Student name cell
        const nameTd = document.createElement('td');
        nameTd.style.fontWeight = '600';
        nameTd.style.color = '#0f172a';
        nameTd.textContent = `${student.first_name} ${student.last_name}`;
        tr.appendChild(nameTd);

        // Score cells for each category
        state.selectedCategories.forEach(cat => {
            const td = document.createElement('td');
            td.style.textAlign = 'center';

            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'as-score-input score-input';
            input.dataset.studentId = student.student_id;
            input.dataset.categoryId = cat.category_id;
            input.min = '0';
            input.step = '0.01';

            // Load existing score if available
            const existingScore = findExistingScore(student.student_id, cat.category_id);
            if (existingScore) {
                input.value = existingScore.score;
                state.originalScores[`${student.student_id}_${cat.category_id}`] = existingScore.score;
            }

            // Real-time validation
            input.addEventListener('change', (e) => {
                validateScoreInput(e.target);
                trackScoreChange(student.student_id, cat.category_id, parseFloat(e.target.value));
            });

            input.addEventListener('input', (e) => {
                validateScoreInput(e.target, false); // Don't show error immediately
            });

            input.addEventListener('blur', () => {
                autoSaveInput(input);
            });

            td.appendChild(input);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    // Add event listeners for max-score inputs and auto-fill buttons
    document.querySelectorAll('.max-score-input').forEach(input => {
        input.addEventListener('change', restrictScoreInputs);
    });

    document.querySelectorAll('.auto-fill-btn').forEach(btn => {
        btn.addEventListener('click', showAutoFillModal);
    });

    enforceAllCategoryLocks();
}

/**
 * Find existing score for student and category
 */
function findExistingScore(studentId, categoryId) {
    for (const assessment of state.existingAssessments) {
        if (Number(assessment.category_id) === Number(categoryId)) {
            const score = assessment.scores.find(s => Number(s.student_id) === Number(studentId));
            if (score) return score;
        }
    }
    return null;
}

/**
 * Validate score input
 */
function validateScoreInput(input, shouldNotify = true) {
    const categoryId = parseInt(input.dataset.categoryId);
    const maxScoreInput = document.querySelector(`.max-score-input[data-category-id="${categoryId}"]`);
    const maxScore = maxScoreInput && maxScoreInput.value ? parseFloat(maxScoreInput.value) : NaN;

    const score = parseFloat(input.value);

    if (!input.value) {
        input.classList.remove('invalid');
        return true;
    }

    if (isNaN(maxScore) || maxScore <= 0) {
        if (shouldNotify) {
            input.classList.add('invalid');
            showErrorMessage('Set a valid max score before entering student scores');
        }
        return false;
    }

    if (isNaN(score) || score < 0 || score > maxScore) {
        if (shouldNotify) {
            input.classList.add('invalid');
            showErrorMessage(`Score must be between 0 and ${maxScore}`);
        }
        return false;
    }

    input.classList.remove('invalid');
    return true;
}

/**
 * Restrict score inputs based on max score
 */
function restrictScoreInputs(e) {
    const categoryId = parseInt(e.target.dataset.categoryId);
    const maxScore = parseFloat(e.target.value);

    if (isNaN(maxScore) || maxScore <= 0) {
        e.target.value = '';
        state.categoryMaxScores[categoryId] = '';
        setCategoryInputsEnabled(categoryId, false);
        return;
    }

    state.categoryMaxScores[categoryId] = maxScore;
    setCategoryInputsEnabled(categoryId, true);

    // Validate all inputs for this category
    document.querySelectorAll(`.score-input[data-category-id="${categoryId}"]`).forEach(input => {
        if (input.value) {
            validateScoreInput(input);
        }
    });
}

/**
 * Track score changes
 */
function trackScoreChange(studentId, categoryId, value) {
    const key = `${studentId}_${categoryId}`;
    const originalValue = state.originalScores[key];
    const numericValue = Number.isFinite(value) ? value : null;
    const numericOriginal = originalValue !== undefined && originalValue !== null && originalValue !== ''
        ? parseFloat(originalValue)
        : null;

    if (numericValue === null) {
        delete state.changedScores[key];
        return;
    }

    if (numericOriginal !== null && numericValue === numericOriginal) {
        delete state.changedScores[key];
    } else {
        state.changedScores[key] = numericValue;
    }
}

async function autoSaveInput(input) {
    if (!state.selectedClassSubject || !input.value) {
        return;
    }

    if (!validateScoreInput(input, false)) {
        return;
    }

    if (input.dataset.saving === '1') {
        return;
    }

    const studentId = parseInt(input.dataset.studentId);
    const categoryId = parseInt(input.dataset.categoryId);
    const score = parseFloat(input.value);
    const maxScore = getCategoryMaxScore(categoryId);

    if (!Number.isFinite(studentId) || !Number.isFinite(categoryId) || !Number.isFinite(score) || !Number.isFinite(maxScore)) {
        return;
    }

    const key = `${studentId}_${categoryId}`;
    if (state.originalScores[key] !== undefined && parseFloat(state.originalScores[key]) === score) {
        return;
    }

    input.dataset.saving = '1';
    try {
        const response = await TeacherAssessmentAPI.saveAssessments({
            class_subject_id: state.selectedClassSubject.class_subject_id,
            assessments: [{
                class_subject_id: state.selectedClassSubject.class_subject_id,
                student_id: studentId,
                category_id: categoryId,
                score: score,
                max_score: maxScore
            }]
        });

        if (response.success) {
            state.originalScores[key] = score;
            delete state.changedScores[key];
            showSuccess('Auto-saved', 'info');
        } else {
            showError(response.message || 'Auto-save failed');
        }
    } catch (error) {
        console.error('Auto-save failed:', error);
        showError('Auto-save failed');
    } finally {
        input.dataset.saving = '0';
    }
}

/**
 * Save all scores (draft mode)
 */
async function saveAllScores() {
    if (!validateAllScores()) {
        return;
    }

    try {
        showLoading(true);

        const assessments = buildAssessmentPayload();
        const response = await TeacherAssessmentAPI.saveAssessments({
            class_subject_id: state.selectedClassSubject.class_subject_id,
            assessments: assessments
        });

        showLoading(false);

        if (response.success) {
            showSuccess(`${response.data.saved} assessments saved successfully`);
            state.changedScores = {}; // Clear change tracking
        } else {
            showError(response.message || 'Failed to save assessments');
        }
    } catch (error) {
        console.error('Error saving assessments:', error);
        showError('Failed to save assessments');
        showLoading(false);
    }
}

/**
 * Publish all scores (final mode)
 */
async function publishAllScores() {
    if (!confirmPublish()) {
        return;
    }

    if (!validateAllScores()) {
        return;
    }

    try {
        showLoading(true);

        const assessments = buildAssessmentPayload();
        const response = await TeacherAssessmentAPI.publishAssessments({
            class_subject_id: state.selectedClassSubject.class_subject_id,
            assessments: assessments
        });

        showLoading(false);

        if (response.success) {
            showSuccess(`${response.data.published} assessments published successfully`, 'success');
            state.changedScores = {};
            // Optionally reload to show published status
            setTimeout(() => location.reload(), 2000);
        } else {
            showError(response.message || 'Failed to publish assessments');
        }
    } catch (error) {
        console.error('Error publishing assessments:', error);
        showError('Failed to publish assessments');
        showLoading(false);
    }
}

/**
 * Build assessment payload for API
 */
function buildAssessmentPayload() {
    const assessments = [];

    document.querySelectorAll('.score-input').forEach(input => {
        if (!input.value) return; // Skip empty inputs

        const studentId = parseInt(input.dataset.studentId);
        const categoryId = parseInt(input.dataset.categoryId);
        const maxScoreInput = document.querySelector(`.max-score-input[data-category-id="${categoryId}"]`);
        const maxScore = parseFloat(maxScoreInput?.value) || 100;
        const score = parseFloat(input.value);

        assessments.push({
            class_subject_id: state.selectedClassSubject.class_subject_id,
            student_id: studentId,
            category_id: categoryId,
            score: score,
            max_score: maxScore
        });
    });

    return assessments;
}

/**
 * Validate all scores before save/publish
 */
function validateAllScores() {
    let hasErrors = false;
    const errors = [];

    state.selectedCategories.forEach(category => {
        const maxScore = getCategoryMaxScore(category.category_id);
        if (!Number.isFinite(maxScore) || maxScore <= 0) {
            hasErrors = true;
            errors.push(`${category.category_name}: max score is required`);
        }
    });

    document.querySelectorAll('.score-input').forEach(input => {
        if (input.value && !validateScoreInput(input, false)) {
            hasErrors = true;
            const studentId = input.dataset.studentId;
            const categoryId = parseInt(input.dataset.categoryId);
            const student = state.students.find(s => s.student_id == studentId);
            const category = state.selectedCategories.find(c => c.category_id == categoryId);
            errors.push(`${student?.first_name} ${student?.last_name} - ${category?.category_name}`);
        }
    });

    if (hasErrors) {
        showError('Validation failed:\n' + errors.join('\n'));
        return false;
    }

    return true;
}

/**
 * Reset changes
 */
function resetChanges() {
    if (!confirm('Are you sure? This will discard all changes.')) {
        return;
    }

    document.querySelectorAll('.score-input').forEach(input => {
        const studentId = input.dataset.studentId;
        const categoryId = input.dataset.categoryId;
        const originalValue = state.originalScores[`${studentId}_${categoryId}`];
        input.value = originalValue || '';
        input.classList.remove('invalid');
    });

    state.changedScores = {};
    hideStatusMessage();
}

/**
 * Clear filter and go back
 */
function clearFilter() {
    state.selectedClassSubject = null;
    state.selectedCategories = [];
    state.students = [];
    state.existingAssessments = {};
    state.changedScores = {};
    state.categoryMaxScores = {};

    document.getElementById('filterSection').style.display = 'grid';
    document.getElementById('logoContainer').style.display = 'grid';
    document.getElementById('scoresSection').style.display = 'none';

    document.getElementById('classSubjectSelect').value = '';
    document.querySelectorAll('#categoryMultiselect input[type="checkbox"]').forEach(cb => cb.checked = false);
    const scoresSearch = document.getElementById('scoresSearch');
    if (scoresSearch) {
        scoresSearch.value = '';
    }
    const search = document.getElementById('search');
    if (search) {
        search.value = '';
        search.dispatchEvent(new Event('input'));
    }
    updateCategoryComboDisplay();
}

function filterScoresTable(query) {
    const normalized = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#scoresTableBody tr');

    rows.forEach(row => {
        const firstCell = row.querySelector('td');
        const name = (firstCell ? firstCell.textContent : '').toLowerCase();
        row.style.display = !normalized || name.includes(normalized) ? '' : 'none';
    });
}

/**
 * Show auto-fill modal
 */
async function showAutoFillModal(e) {
    try {
        const trigger = e.target.closest('.auto-fill-btn');
        const categoryId = parseInt(trigger?.dataset.categoryId);
        if (!Number.isFinite(categoryId)) {
            showError('Invalid category selected for auto-fill');
            return;
        }
        state.autoFillCategoryId = categoryId;

        // Get graded items
        const response = await TeacherAssessmentAPI.getAssignmentsAndQuizzes({
            class_subject_id: state.selectedClassSubject.class_subject_id
        });

        if (!response.success || !response.data.items.length) {
            showError('No graded assignments or quizzes found');
            return;
        }

        state.autoFillItems = response.data.items;
        state.autoFillGroups = groupAutoFillItems(state.autoFillItems);

        if (!state.autoFillGroups.length) {
            showError('No graded assignments or quizzes found');
            return;
        }

        // Populate modal options
        const optionsContainer = document.getElementById('autoFillOptions');
        optionsContainer.innerHTML = '';

        state.autoFillGroups.forEach((group, idx) => {
            const div = document.createElement('div');
            div.className = 'as-option';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'autoFillItem';
            radio.value = idx;
            radio.className = 'as-option-radio';

            const label = document.createElement('label');
            label.className = 'as-option-body';
            const typeIcon = group.type === 'assignment' ? 'fa-file-lines' : 'fa-list-check';
            label.innerHTML = `
                <span class="as-option-icon"><i class="fas ${typeIcon}"></i></span>
                <div class="as-option-title">${group.name}</div>
                <div class="as-option-meta">${group.type === 'assignment' ? 'Assignment' : 'Quiz'} - ${group.studentCount} graded students</div>
                <div class="as-option-desc">${group.description || 'No description provided.'}</div>
            `;

            div.appendChild(radio);
            div.appendChild(label);
            div.addEventListener('click', () => radio.checked = true);
            optionsContainer.appendChild(div);
        });

        const modal = document.getElementById('autoFillModal');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    } catch (error) {
        console.error('Error showing auto-fill modal:', error);
        showError('Failed to load graded items');
    }
}

/**
 * Confirm auto-fill and populate scores
 */
function confirmAutoFill() {
    const selectedRadio = document.querySelector('input[name="autoFillItem"]:checked');
    if (!selectedRadio) {
        showError('Please select an item');
        return;
    }

    const item = state.autoFillGroups[parseInt(selectedRadio.value)];
    const categoryId = state.autoFillCategoryId;

    if (!item) {
        showError('Invalid auto-fill selection');
        return;
    }

    const maxInput = document.querySelector(`.max-score-input[data-category-id="${categoryId}"]`);
    if (maxInput && !maxInput.value) {
        maxInput.value = item.max_score || '';
        restrictScoreInputs({ target: maxInput });
    }

    const byStudent = item.byStudent || {};
    let updated = 0;

    document.querySelectorAll(`.score-input[data-category-id="${categoryId}"]`).forEach(input => {
        const studentId = parseInt(input.dataset.studentId);
        if (!Object.prototype.hasOwnProperty.call(byStudent, studentId)) {
            return;
        }

        const score = parseFloat(byStudent[studentId]);
        if (!Number.isFinite(score)) {
            return;
        }

        input.value = score;
        validateScoreInput(input, false);
        trackScoreChange(studentId, categoryId, score);
        updated += 1;
    });

    closeAutoFillModal();
    showSuccess(`Auto-fill completed (${updated} students updated)`);
}

/**
 * Close auto-fill modal
 */
function closeAutoFillModal() {
    const modal = document.getElementById('autoFillModal');
    if (!modal) {
        return;
    }
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
}

/**
 * Utility: Show loading indicator
 */
function showLoading(show) {
    const indicator = document.getElementById('loadingIndicator');
    if (!indicator) {
        return;
    }
    indicator.classList.toggle('show', !!show);
}

/**
 * Utility: Show error message
 */
function showErrorMessage(message) {
    const msgDiv = document.getElementById('statusMessage');
    if (!msgDiv) {
        return;
    }
    msgDiv.textContent = message;
    msgDiv.className = 'as-status show error';

    if (typeof showToast === 'function') {
      showToast(message, type || 'error');
      return;
    }
    console.error((type || 'error').toUpperCase() + ': ' + message);
}

/**
 * Utility: Show success message
 */
function showSuccess(message, type = 'info') {
    const msgDiv = document.getElementById('statusMessage');
    if (!msgDiv) {
        return;
    }
    msgDiv.textContent = message;
    msgDiv.className = `as-status show ${type === 'success' ? 'success' : 'info'}`;
    
    if (typeof showToast === 'function') {
      showToast(message, type || 'info');
      return;
    }
    console.log((type || 'info').toUpperCase() + ': ' + message);
}

/**
 * Utility: Hide status message
 */
function hideStatusMessage() {
    const msgDiv = document.getElementById('statusMessage');
    if (!msgDiv) {
        return;
    }
    msgDiv.className = 'as-status';
}

/**
 * Utility: Confirm publish action
 */
function confirmPublish() {
    return confirm('Are you sure you want to publish these scores? This action cannot be undone.');
}

function showError(message) {
    showErrorMessage(message);
}

function deriveExistingCategoryMaxScores() {
    const map = {};

    (state.existingAssessments || []).forEach(group => {
        const categoryId = parseInt(group.category_id);
        if (!Number.isFinite(categoryId)) {
            return;
        }

        if (map[categoryId]) {
            return;
        }

        if (Array.isArray(group.scores) && group.scores.length > 0) {
            const maxScore = parseFloat(group.scores[0].max_score);
            if (Number.isFinite(maxScore) && maxScore > 0) {
                map[categoryId] = maxScore;
            }
        }
    });

    return map;
}

function getCategoryMaxScore(categoryId) {
    const input = document.querySelector(`.max-score-input[data-category-id="${categoryId}"]`);
    if (!input || !input.value) {
        return NaN;
    }
    return parseFloat(input.value);
}

function setCategoryInputsEnabled(categoryId, enabled) {
    document.querySelectorAll(`.score-input[data-category-id="${categoryId}"]`).forEach(input => {
        input.disabled = !enabled;
        if (!enabled) {
            input.classList.remove('invalid');
        }
    });
}

function enforceAllCategoryLocks() {
    state.selectedCategories.forEach(category => {
        const maxScore = getCategoryMaxScore(category.category_id);
        const enabled = Number.isFinite(maxScore) && maxScore > 0;
        setCategoryInputsEnabled(category.category_id, enabled);
    });
}

function groupAutoFillItems(items) {
    const groups = {};

    (items || []).forEach(item => {
        const type = item.type || 'assignment';
        const id = parseInt(item.id);
        const studentId = parseInt(item.student_id);
        const score = parseFloat(item.score);
        const maxScore = parseFloat(item.max_score);
        if (!Number.isFinite(id) || !Number.isFinite(studentId) || !Number.isFinite(score)) {
            return;
        }

        const key = `${type}_${id}`;
        if (!groups[key]) {
            groups[key] = {
                key,
                id,
                type,
                name: item.name || `${type} ${id}`,
                description: item.description || '',
                max_score: Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 100,
                byStudent: {},
                studentCount: 0
            };
        }

        if (!Object.prototype.hasOwnProperty.call(groups[key].byStudent, studentId)) {
            groups[key].studentCount += 1;
        }
        groups[key].byStudent[studentId] = score;
    });

    return Object.values(groups);
}

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('page:loaded', function (event) {
    const page = event && event.detail ? event.detail.page : '';
    if (!page || page === 'assessments') {
        init();
        return;
    }

    if (hasPageRoot()) {
        init();
    }
});

})();

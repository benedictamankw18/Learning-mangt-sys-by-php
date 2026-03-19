(function () {
  'use strict';

  const S = {
    teacherUuid: null,
    courses: [],
    sectionsByCourse: new Map(),
    lessonPlans: [],
    view: [],
    currentEditId: null,
    editingSectionId: null,
    sectionManagerCourseId: null,
  };

  function el(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    if (typeof escHtml === 'function') return escHtml(String(value ?? ''));
    return String(value ?? '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function toast(message, type) {
    if (typeof showToast === 'function') {
      showToast(message, type || 'info');
      return;
    }
    console.log((type || 'info').toUpperCase() + ': ' + message);
  }

  function getUser() {
    return typeof Auth !== 'undefined' && typeof Auth.getUser === 'function' ? Auth.getUser() : null;
  }

  function getTeacherUuid() {
    const user = getUser();
    return user && (user.teacher_uuid || user.uuid) ? (user.teacher_uuid || user.uuid) : null;
  }

  function asArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.data)) return payload.data.data;
    if (Array.isArray(payload?.sections)) return payload.sections;
    if (Array.isArray(payload?.data?.sections)) return payload.data.sections;
    return [];
  }

  function getCourseLabel(course) {
    const subject = course.subject_name || 'Subject';
    const className = course.class_name || '';
    return className ? (subject + ' - ' + className) : subject;
  }

  function getMaterialCount(lessonPlan) {
    if (Array.isArray(lessonPlan?.materials)) {
      return lessonPlan.materials.length;
    }
    return Number(lessonPlan?.material_count || 0) || 0;
  }

  function getTeacherCoursesEndpoint(uuid) {
    if (typeof API_ENDPOINTS !== 'undefined' && typeof API_ENDPOINTS.TEACHER_COURSES === 'function') {
      return API_ENDPOINTS.TEACHER_COURSES(uuid);
    }
    return '/teachers/' + uuid + '/courses';
  }

  function setCourseDependentUiState(hasCourses) {
    const createBtn = el('lpCreateBtn');
    const manageSectionsBtn = el('lpManageSectionsBtn');
    const courseFilter = el('lpCourseFilter');
    const sectionFilter = el('lpSectionFilter');
    const statusFilter = el('lpStatusFilter');

    if (createBtn) createBtn.disabled = !hasCourses;
    if (manageSectionsBtn) manageSectionsBtn.disabled = !hasCourses;
    if (courseFilter) courseFilter.disabled = !hasCourses;
    if (sectionFilter) sectionFilter.disabled = !hasCourses;
    if (statusFilter) statusFilter.disabled = !hasCourses;
  }

  function renderNoCoursesState() {
    const listContainer = el('lpListContainer');
    if (listContainer) {
      listContainer.innerHTML =
        '<div class="lp-empty"><i class="fas fa-book"></i><p>No active courses found. Activate or assign a course to start creating lesson plans.</p></div>';
    }

    if (el('totalPlans')) el('totalPlans').textContent = '0';
    if (el('activePlans')) el('activePlans').textContent = '0';
    if (el('withMaterials')) el('withMaterials').textContent = '0';
    if (el('selectedCourse')) el('selectedCourse').textContent = '-';
  }

  async function fetchSectionsByCourse(courseId) {
    try {
      const res = await API.get('/courses/' + courseId + '/sections');
      return asArray(res?.data || res);
    } catch (_) {
      const fallback = await API.get('/api/courses/' + courseId + '/sections');
      return asArray(fallback?.data || fallback);
    }
  }

  function bindEvents() {
    const createBtn = el('lpCreateBtn');
    const manageSectionsBtn = el('lpManageSectionsBtn');
    const form = el('lpForm');
    const listContainer = el('lpListContainer');

    if (createBtn) createBtn.addEventListener('click', openCreateModal);
    if (manageSectionsBtn) {
      manageSectionsBtn.addEventListener('click', function () {
        const courseId = Number(el('lpCourseFilter')?.value || S.courses?.[0]?.course_id || 0);
        openSectionManager(courseId);
      });
    }
    if (form) form.addEventListener('submit', handleFormSubmit);

    const courseFilter = el('lpCourseFilter');
    const sectionFilter = el('lpSectionFilter');
    const statusFilter = el('lpStatusFilter');
    const modalCourse = el('lpCourse');

    if (courseFilter) {
      courseFilter.addEventListener('change', function () {
        loadLessonPlans();
      });
    }
    if (sectionFilter) sectionFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    if (modalCourse) {
      modalCourse.addEventListener('change', async function (event) {
        const id = Number(event.target.value || 0);
        if (!id) return;
        await populateEditSections(id, null);
        await loadCourseMaterials(id);
      });
    }

    if (listContainer) {
      listContainer.addEventListener('click', async function (event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const id = Number(button.getAttribute('data-id') || 0);
        if (!id) return;

        const action = button.getAttribute('data-action');
        if (action === 'edit') await openEditModal(id);
        if (action === 'delete') await deleteLessonPlan(id);
      });
    }

    const modalClose = el('lpModalClose');
    const formCancel = el('lpFormCancelBtn');
    if (modalClose) modalClose.addEventListener('click', closeLpModal);
    if (formCancel) formCancel.addEventListener('click', closeLpModal);

    const modalOverlay = el('lpModal');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', function (event) {
        if (event.target === modalOverlay) closeLpModal();
      });
    }

    const sectionClose = el('lpSectionClose');
    const sectionDone = el('lpSectionDoneBtn');
    const sectionSave = el('lpSectionFormSaveBtn');
    const sectionReset = el('lpSectionFormResetBtn');
    const sectionCourse = el('lpSectionCourseSelect');
    const sectionList = el('lpSectionListBody');
    const sectionOverlay = el('lpSectionOverlay');

    if (sectionClose) sectionClose.addEventListener('click', closeSectionManager);
    if (sectionDone) sectionDone.addEventListener('click', closeSectionManager);
    if (sectionSave) sectionSave.addEventListener('click', saveSectionManager);
    if (sectionReset) sectionReset.addEventListener('click', resetSectionForm);

    if (sectionCourse) {
      sectionCourse.addEventListener('change', async function (event) {
        const courseId = Number(event.target.value || 0);
        S.sectionManagerCourseId = courseId;
        resetSectionForm();
        await renderSectionManagerList(courseId);
      });
    }

    if (sectionList) {
      sectionList.addEventListener('click', async function (event) {
        const button = event.target.closest('button[data-sec-action]');
        if (!button) return;
        const sectionId = Number(button.getAttribute('data-sec-id') || 0);
        if (!sectionId) return;

        const action = button.getAttribute('data-sec-action');
        if (action === 'edit') startSectionEdit(sectionId);
        if (action === 'delete') await deleteSectionManager(sectionId);
      });
    }

    if (sectionOverlay) {
      sectionOverlay.addEventListener('click', function (event) {
        if (event.target === sectionOverlay) closeSectionManager();
      });
    }
  }

  async function loadCourses() {
    if (!S.teacherUuid) throw new Error('Teacher profile is missing UUID. Please log in again.');

    const response = await API.get(getTeacherCoursesEndpoint(S.teacherUuid));
    const rows = asArray(response?.data || response);

    S.courses = rows
      .map(function (row) {
        return {
          course_id: Number(row.course_id || row.id || 0),
          subject_name: row.subject_name || row.subject || 'Subject',
          class_name: row.class_name || row.class || '',
          status: row.status || (Number(row.is_active || 1) === 1 ? 'active' : 'inactive'),
        };
      })
      .filter(function (row) {
        return Number.isInteger(row.course_id) && row.course_id > 0 && String(row.status).toLowerCase() === 'active';
      })
      .sort(function (a, b) {
        return getCourseLabel(a).localeCompare(getCourseLabel(b));
      });
  }

  async function loadSectionsForCourse(courseId) {
    const id = Number(courseId || 0);
    if (!id) return [];
    if (S.sectionsByCourse.has(id)) return S.sectionsByCourse.get(id);

    const rows = await fetchSectionsByCourse(id);
    const sections = rows
      .map(function (row) {
        return {
          section_id: Number(row.course_sections_id || row.section_id || row.id || 0),
          section_name: row.section_name || row.name || 'Topic',
          description: row.description || '',
          order_index: Number(row.order_index || 0) || 0,
          is_active: Number(row.is_active ?? 1) === 1,
        };
      })
      .filter(function (row) {
        return Number.isInteger(row.section_id) && row.section_id > 0;
      });

    S.sectionsByCourse.set(id, sections);
    return sections;
  }

  async function refreshSectionsForCourse(courseId) {
    const id = Number(courseId || 0);
    if (!id) return [];
    S.sectionsByCourse.delete(id);
    return loadSectionsForCourse(id);
  }

  function populateCourseSelectors() {
    const courseFilter = el('lpCourseFilter');
    const courseEdit = el('lpCourse');
    const sectionCourse = el('lpSectionCourseSelect');
    const selected = Number(courseFilter?.value || S.courses?.[0]?.course_id || 0);

    const filterOptions = ['<option value="">All Courses</option>']
      .concat(S.courses.map(function (course) {
        const isSelected = Number(course.course_id) === selected ? ' selected' : '';
        return '<option value="' + course.course_id + '"' + isSelected + '>' + esc(getCourseLabel(course)) + '</option>';
      }))
      .join('');

    if (courseFilter) courseFilter.innerHTML = filterOptions;

    const editOptions = S.courses.length
      ? S.courses.map(function (course) {
          return '<option value="' + course.course_id + '">' + esc(getCourseLabel(course)) + '</option>';
        }).join('')
      : '<option value="">No active courses</option>';

    if (courseEdit) courseEdit.innerHTML = editOptions;
    if (sectionCourse) sectionCourse.innerHTML = editOptions;
  }

  async function populateSectionFilter(courseId) {
    const target = el('lpSectionFilter');
    if (!target) return;

    const currentValue = String(target.value || '');
    const sections = await loadSectionsForCourse(Number(courseId));
    target.innerHTML = ['<option value="">All Topic / Unit / Week</option>']
      .concat(sections.map(function (section) {
        return '<option value="' + section.section_id + '">' + esc(section.section_name) + '</option>';
      }))
      .join('');

    const hasCurrent = sections.some(function (section) {
      return String(section.section_id) === currentValue;
    });
    target.value = hasCurrent ? currentValue : '';
  }

  async function populateEditSections(courseId, selectedSectionId) {
    const sectionSelect = el('lpSection');
    if (!sectionSelect) return;

    const sections = await loadSectionsForCourse(Number(courseId));
    sectionSelect.innerHTML = ['<option value="">Select Topic / Unit / Week (Optional)</option>']
      .concat(sections.map(function (section) {
        return '<option value="' + section.section_id + '">' + esc(section.section_name) + '</option>';
      }))
      .join('');

    if (selectedSectionId) sectionSelect.value = String(selectedSectionId);
  }

  async function loadCourseMaterials(courseId) {
    const materialsSelect = el('lpMaterials');
    if (!materialsSelect) return;

    try {
      const res = await API.get('/class-subjects/' + courseId + '/materials');
      const materials = asArray(res?.data || res);
      materialsSelect.innerHTML = '';

      if (!materials.length) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.text = 'No materials available';
        opt.disabled = true;
        materialsSelect.appendChild(opt);
        return;
      }

      materials.forEach(function (material) {
        const opt = document.createElement('option');
        opt.value = material.material_id;
        opt.text = material.title || 'Untitled Material';
        materialsSelect.appendChild(opt);
      });
    } catch (error) {
      console.error('Error loading materials:', error);
    }
  }

  async function loadLessonPlans() {
    const courseFilter = el('lpCourseFilter');
    const listContainer = el('lpListContainer');
    if (!courseFilter || !listContainer) return;

    const courseId = Number(courseFilter.value || S.courses?.[0]?.course_id || 0);
    if (!courseId) {
      if (!S.courses.length) {
        renderNoCoursesState();
      } else {
        listContainer.innerHTML = '<div class="lp-empty"><p>Please select a course first</p></div>';
      }
      return;
    }

    const res = await API.get('/courses/' + courseId + '/lesson-plans', { course_id: courseId });
    S.lessonPlans = asArray(res?.data || res);

    await populateSectionFilter(courseId);
    await populateEditSections(courseId, null);
    await loadCourseMaterials(courseId);
    applyFilters();
  }

  function updateStats() {
    const total = S.view.length;
    const active = S.view.filter(function (lp) { return Number(lp.is_active) === 1; }).length;
    const withMaterials = S.view.filter(function (lp) { return getMaterialCount(lp) > 0; }).length;

    if (el('totalPlans')) el('totalPlans').textContent = String(total);
    if (el('activePlans')) el('activePlans').textContent = String(active);
    if (el('withMaterials')) el('withMaterials').textContent = String(withMaterials);

    const courseId = Number(el('lpCourseFilter')?.value || 0);
    const course = S.courses.find(function (item) {
      return Number(item.course_id) === courseId;
    });
    if (el('selectedCourse')) el('selectedCourse').textContent = course ? (course.subject_name || 'Unknown') : '-';
  }

  function applyFilters() {
    const courseId = Number(el('lpCourseFilter')?.value || 0);
    const sectionId = Number(el('lpSectionFilter')?.value || 0);
    const status = String(el('lpStatusFilter')?.value || '');

    S.view = S.lessonPlans.filter(function (lp) {
      if (courseId && Number(lp.course_id) !== courseId) return false;
      if (sectionId && Number(lp.section_id) !== sectionId) return false;
      if (status !== '' && String(lp.is_active) !== status) return false;
      return true;
    });

    updateStats();
    renderLessonPlans();
  }

  function renderLessonPlans() {
    const container = el('lpListContainer');
    if (!container) return;

    if (!S.view.length) {
      container.innerHTML = '<div class="lp-empty"><i class="fas fa-inbox"></i><p>No lesson plans found</p></div>';
      return;
    }

    container.innerHTML = S.view.map(function (lp) {
      const grouping = lp.section_name || (lp.week_number ? ('Week ' + lp.week_number) : '-');
      const statusBadge = Number(lp.is_active) === 1
        ? '<span class="lp-badge" style="background:#dcfce7;color:#166534;">Active</span>'
        : '<span class="lp-badge" style="background:#ffedd5;color:#9a3412;">Inactive</span>';

      return '' +
        '<div class="lp-row">' +
        '  <div>' +
        '    <strong>' + esc(lp.title || 'Untitled') + '</strong>' +
        '    <div style="font-size:0.75rem;color:#64748b;margin-top:0.2rem;">' + statusBadge + '</div>' +
        '  </div>' +
        '  <div style="font-size:0.85rem;color:#64748b;">' + esc(grouping) + '</div>' +
        '  <div><span class="lp-badge">' + esc(String(getMaterialCount(lp))) + '</span></div>' +
        '  <div style="display:flex;gap:0.3rem;justify-content:center;">' +
        '    <button class="btn-icon" data-action="edit" data-id="' + Number(lp.lesson_plan_id || 0) + '" title="Edit"><i class="fas fa-pen-to-square"></i></button>' +
        '    <button class="btn-icon" data-action="delete" data-id="' + Number(lp.lesson_plan_id || 0) + '" title="Delete"><i class="fas fa-trash"></i></button>' +
        '  </div>' +
        '</div>';
    }).join('');
  }

  async function openCreateModal() {
    if (!S.courses.length) {
      toast('No active courses available. Please activate a course first.', 'error');
      return;
    }

    S.currentEditId = null;
    if (el('lpModalTitle')) el('lpModalTitle').textContent = 'New Lesson Plan';
    if (el('lpForm')) el('lpForm').reset();

    const selectedCourse = Number(el('lpCourseFilter')?.value || S.courses?.[0]?.course_id || 0);
    if (selectedCourse && el('lpCourse')) {
      el('lpCourse').value = String(selectedCourse);
      await populateEditSections(selectedCourse, null);
      await loadCourseMaterials(selectedCourse);
    }
    showModal();
  }

  async function openEditModal(id) {
    const res = await API.get('/lesson-plans/' + id);
    const lp = res?.data || res;
    if (!lp || !lp.lesson_plan_id) {
      toast('Failed to load lesson plan.', 'error');
      return;
    }

    S.currentEditId = Number(id);
    if (el('lpModalTitle')) el('lpModalTitle').textContent = 'Edit Lesson Plan';
    if (el('lpCourse')) el('lpCourse').value = String(lp.course_id || '');
    if (el('lpTitle')) el('lpTitle').value = lp.title || '';
    if (el('lpDescription')) el('lpDescription').value = lp.description || '';
    if (el('lpObjectives')) el('lpObjectives').value = lp.learning_objectives || '';
    if (el('lpActivities')) el('lpActivities').value = lp.activities || '';
    if (el('lpAssessment')) el('lpAssessment').value = lp.assessment_methods || '';
    if (el('lpNotes')) el('lpNotes').value = lp.notes || '';
    if (el('lpActive')) el('lpActive').value = String(lp.is_active ?? 1);

    await populateEditSections(Number(lp.course_id || 0), Number(lp.section_id || 0));
    await loadCourseMaterials(Number(lp.course_id || 0));

    const materialsSelect = el('lpMaterials');
    if (materialsSelect && Array.isArray(lp.materials)) {
      const selectedIds = lp.materials.map(function (m) { return String(m.material_id); });
      Array.from(materialsSelect.options).forEach(function (option) {
        option.selected = selectedIds.includes(option.value);
      });
    }

    showModal();
  }

  function closeLpModal() {
    if (el('lpModal')) el('lpModal').classList.remove('open');
    S.currentEditId = null;
    if (el('lpForm')) el('lpForm').reset();
  }

  function showModal() {
    if (el('lpModal')) el('lpModal').classList.add('open');
  }

  async function handleFormSubmit(event) {
    event.preventDefault();

    const courseId = Number(el('lpCourse')?.value || 0);
    const title = String(el('lpTitle')?.value || '').trim();
    const sectionId = Number(el('lpSection')?.value || 0) || null;
    if (!courseId || !title) {
      toast('Course and title are required.', 'error');
      return;
    }

    const materialIds = Array.from(el('lpMaterials')?.selectedOptions || [])
      .map(function (opt) { return Number(opt.value || 0); })
      .filter(function (id) { return Number.isInteger(id) && id > 0; });

    const payload = {
      course_id: courseId,
      title: title,
      description: String(el('lpDescription')?.value || '').trim(),
      learning_objectives: String(el('lpObjectives')?.value || '').trim(),
      activities: String(el('lpActivities')?.value || '').trim(),
      assessment_methods: String(el('lpAssessment')?.value || '').trim(),
      notes: String(el('lpNotes')?.value || '').trim(),
      week_number: null,
      section_id: sectionId,
      is_active: Number(el('lpActive')?.value || 1),
      material_ids: materialIds,
    };

    if (S.currentEditId) {
      await API.put('/lesson-plans/' + S.currentEditId, payload);
      toast('Lesson plan updated successfully.', 'success');
    } else {
      await API.post('/lesson-plans', payload);
      toast('Lesson plan created successfully.', 'success');
    }

    closeLpModal();
    await loadLessonPlans();
  }

  async function deleteLessonPlan(id) {
    const ok = window.confirm('Are you sure you want to delete this lesson plan?');
    if (!ok) return;

    await API.delete('/lesson-plans/' + id);
    toast('Lesson plan deleted successfully.', 'success');
    await loadLessonPlans();
  }

  function resetSectionForm() {
    S.editingSectionId = null;
    if (el('lpSectionNameInput')) el('lpSectionNameInput').value = '';
    if (el('lpSectionDescInput')) el('lpSectionDescInput').value = '';
    if (el('lpSectionOrderInput')) el('lpSectionOrderInput').value = '0';
    if (el('lpSectionIsActiveInput')) el('lpSectionIsActiveInput').checked = true;
    if (el('lpSectionFormSaveText')) el('lpSectionFormSaveText').textContent = 'Save Topic';
  }

  function openSectionManager(courseId) {
    const id = Number(courseId || el('lpCourseFilter')?.value || S.courses?.[0]?.course_id || 0);
    if (!id) {
      toast('Select a course first.', 'error');
      return;
    }

    S.sectionManagerCourseId = id;
    if (el('lpSectionCourseSelect')) el('lpSectionCourseSelect').value = String(id);
    resetSectionForm();
    renderSectionManagerList(id);

    if (el('lpSectionOverlay')) {
      el('lpSectionOverlay').classList.add('open');
      el('lpSectionOverlay').setAttribute('aria-hidden', 'false');
    }
  }

  function closeSectionManager() {
    if (el('lpSectionOverlay')) {
      el('lpSectionOverlay').classList.remove('open');
      el('lpSectionOverlay').setAttribute('aria-hidden', 'true');
    }
    resetSectionForm();
  }

  async function renderSectionManagerList(courseId) {
    const body = el('lpSectionListBody');
    if (!body) return;

    const sections = await loadSectionsForCourse(Number(courseId));
    if (!sections.length) {
      body.innerHTML = '<div class="lp-section-row"><div style="grid-column:1/-1;color:#64748b;">No topics/units/weeks yet.</div></div>';
      return;
    }

    body.innerHTML = sections.map(function (section) {
      const badge = section.is_active
        ? '<span class="lp-status-badge active">Active</span>'
        : '<span class="lp-status-badge inactive">Inactive</span>';

      return '' +
        '<div class="lp-section-row">' +
        '  <div>' + esc(section.section_name) + '</div>' +
        '  <div>' + esc(section.description || '-') + '</div>' +
        '  <div>' + esc(String(section.order_index || 0)) + '</div>' +
        '  <div>' + badge + '</div>' +
        '  <div class="lp-section-actions">' +
        '    <button type="button" class="btn btn-outline btn-sm" data-sec-action="edit" data-sec-id="' + section.section_id + '">Edit</button>' +
        '    <button type="button" class="btn btn-outline btn-sm" data-sec-action="delete" data-sec-id="' + section.section_id + '">Delete</button>' +
        '  </div>' +
        '</div>';
    }).join('');
  }

  function startSectionEdit(sectionId) {
    const courseId = Number(S.sectionManagerCourseId || 0);
    const sections = S.sectionsByCourse.get(courseId) || [];
    const match = sections.find(function (item) {
      return Number(item.section_id) === Number(sectionId);
    });
    if (!match) return;

    S.editingSectionId = Number(match.section_id);
    if (el('lpSectionNameInput')) el('lpSectionNameInput').value = match.section_name || '';
    if (el('lpSectionDescInput')) el('lpSectionDescInput').value = match.description || '';
    if (el('lpSectionOrderInput')) el('lpSectionOrderInput').value = String(match.order_index || 0);
    if (el('lpSectionIsActiveInput')) el('lpSectionIsActiveInput').checked = !!match.is_active;
    if (el('lpSectionFormSaveText')) el('lpSectionFormSaveText').textContent = 'Update Topic';
  }

  async function saveSectionManager() {
    const courseId = Number(el('lpSectionCourseSelect')?.value || S.sectionManagerCourseId || 0);
    const sectionName = String(el('lpSectionNameInput')?.value || '').trim();
    const description = String(el('lpSectionDescInput')?.value || '').trim();
    const orderIndex = Number(el('lpSectionOrderInput')?.value || 0);
    const isActive = el('lpSectionIsActiveInput')?.checked ? 1 : 0;

    if (!courseId) {
      toast('Select a course first.', 'error');
      return;
    }
    if (!sectionName) {
      toast('Topic / Unit / Week name is required.', 'error');
      return;
    }

    const payload = {
      section_name: sectionName,
      description: description || null,
      order_index: Number.isFinite(orderIndex) && orderIndex >= 0 ? Math.floor(orderIndex) : 0,
      is_active: isActive,
    };

    if (S.editingSectionId) {
      await API.put('/courses/' + courseId + '/sections/' + S.editingSectionId, payload);
      toast('Topic updated successfully.', 'success');
    } else {
      await API.post('/courses/' + courseId + '/sections', payload);
      toast('Topic created successfully.', 'success');
    }

    await refreshSectionsForCourse(courseId);
    await renderSectionManagerList(courseId);
    await populateSectionFilter(Number(el('lpCourseFilter')?.value || courseId));
    await populateEditSections(Number(el('lpCourse')?.value || courseId), Number(el('lpSection')?.value || 0));
    resetSectionForm();
  }

  async function deleteSectionManager(sectionId) {
    const courseId = Number(el('lpSectionCourseSelect')?.value || S.sectionManagerCourseId || 0);
    if (!courseId || !sectionId) return;

    const ok = window.confirm('Delete this Topic / Unit / Week?');
    if (!ok) return;

    await API.delete('/courses/' + courseId + '/sections/' + sectionId);
    toast('Topic deleted successfully.', 'success');

    await refreshSectionsForCourse(courseId);
    await renderSectionManagerList(courseId);
    await populateSectionFilter(Number(el('lpCourseFilter')?.value || courseId));
    await populateEditSections(Number(el('lpCourse')?.value || courseId), Number(el('lpSection')?.value || 0));
  }

  async function init() {
    const root = el('lessonPlansPageRoot');
    if (!root) return;
    if (root.dataset.initialized === '1') return;

    if (typeof Auth !== 'undefined' && typeof Auth.requireAuth === 'function') {
      if (!Auth.requireAuth(['teacher'])) return;
    }

    root.dataset.initialized = '1';

    S.teacherUuid = getTeacherUuid();
    S.courses = [];
    S.sectionsByCourse.clear();
    S.lessonPlans = [];
    S.view = [];
    S.currentEditId = null;
    S.editingSectionId = null;
    S.sectionManagerCourseId = null;

    try {
      bindEvents();
      await loadCourses();
      populateCourseSelectors();
      setCourseDependentUiState(S.courses.length > 0);

      if (!S.courses.length) {
        renderNoCoursesState();
        return;
      }

      const defaultCourse = Number(el('lpCourseFilter')?.value || S.courses?.[0]?.course_id || 0);
      if (el('lpCourseFilter')) el('lpCourseFilter').value = String(defaultCourse || '');
      if (el('lpCourse')) el('lpCourse').value = String(defaultCourse || '');
      if (el('lpSectionCourseSelect')) el('lpSectionCourseSelect').value = String(defaultCourse || '');

      await loadLessonPlans();
    } catch (error) {
      console.error('Lesson plans init error:', error);
      toast(error?.message || 'Failed to initialize lesson plans.', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('page:loaded', function (event) {
    if (event.detail && event.detail.page === 'lesson-plans') {
      init();
    }
  });
})();
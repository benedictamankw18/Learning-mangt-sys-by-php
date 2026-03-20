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

  function confirmPopup(message, title) {
    return new Promise(function (resolve) {
      const existing = document.getElementById('_lpConfirmOverlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = '_lpConfirmOverlay';
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
        + '    <h3 style="margin:0;font-size:1rem;color:#0f172a;">' + esc(title || 'Confirm Action') + '</h3>'
        + '    <button type="button" data-role="close" style="border:none;background:#f1f5f9;color:#475569;border-radius:8px;width:30px;height:30px;cursor:pointer;">&times;</button>'
        + '  </div>'
        + '  <div style="padding:1rem;color:#334155;font-size:0.9rem;line-height:1.5;">' + esc(message || 'Are you sure?') + '</div>'
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

  function getPlanStrand(plan) {
    return String(plan?.strand || plan?.title || '').trim();
  }

  function getFieldValue(id) {
    return String(el(id)?.value || '').trim();
  }

  function getSelectableMaterialOptions(selectEl) {
    return Array.from(selectEl?.options || []).filter(function (option) {
      const value = Number(option.value || 0);
      return !option.disabled && Number.isInteger(value) && value > 0;
    });
  }

  function updateMaterialsUi() {
    const materialsSelect = el('lpMaterials');
    const countBadge = el('lpMaterialsCount');
    const emptyHint = el('lpMaterialsEmptyHint');
    const clearBtn = el('lpMaterialsClearBtn');
    if (!materialsSelect) return;

    const selectable = getSelectableMaterialOptions(materialsSelect);
    const selectedCount = selectable.filter(function (option) {
      return option.selected;
    }).length;

    if (countBadge) countBadge.textContent = selectedCount + ' selected';
    if (clearBtn) clearBtn.disabled = selectedCount === 0;
    if (emptyHint) emptyHint.style.display = selectable.length ? 'none' : 'block';
  }

  function clearSelectedMaterials() {
    const materialsSelect = el('lpMaterials');
    if (!materialsSelect) return;

    Array.from(materialsSelect.options).forEach(function (option) {
      option.selected = false;
    });
    updateMaterialsUi();
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
    const exportBtn = el('lpExportBtn');
    const manageSectionsBtn = el('lpManageSectionsBtn');
    const form = el('lpForm');
    const listContainer = el('lpListContainer');

    if (createBtn) createBtn.addEventListener('click', openCreateModal);
    if (exportBtn) exportBtn.addEventListener('click', exportLessonPlans);
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
    const materialsSelect = el('lpMaterials');
    const materialsClearBtn = el('lpMaterialsClearBtn');

    if (courseFilter) {
      courseFilter.addEventListener('change', function () {
        loadLessonPlans();
      });
    }
    if (sectionFilter) sectionFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (materialsSelect) materialsSelect.addEventListener('change', updateMaterialsUi);
    if (materialsClearBtn) materialsClearBtn.addEventListener('click', clearSelectedMaterials);

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
        if (action === 'export') await exportLessonPlanById(id);
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
        updateMaterialsUi();
        return;
      }

      materials.forEach(function (material) {
        const opt = document.createElement('option');
        opt.value = material.material_id;
        opt.text = material.title || 'Untitled Material';
        materialsSelect.appendChild(opt);
      });
      updateMaterialsUi();
    } catch (error) {
      console.error('Error loading materials:', error);
      updateMaterialsUi();
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
      const strand = getPlanStrand(lp) || 'Untitled';
      const statusBadge = Number(lp.is_active) === 1
        ? '<span class="lp-badge" style="background:#dcfce7;color:#166534;">Active</span>'
        : '<span class="lp-badge" style="background:#ffedd5;color:#9a3412;">Inactive</span>';

      return '' +
        '<div class="lp-row">' +
        '  <div>' +
        '    <strong>' + esc(strand) + '</strong>' +
        '    <div style="font-size:0.75rem;color:#64748b;margin-top:0.2rem;">' + statusBadge + '</div>' +
        '  </div>' +
        '  <div style="font-size:0.85rem;color:#64748b;">' + esc(grouping) + '</div>' +
        '  <div><span class="lp-badge">' + esc(String(getMaterialCount(lp))) + '</span></div>' +
        '  <div style="display:flex;gap:0.3rem;justify-content:center;">' +
        '    <button class="btn-icon" data-action="export" data-id="' + Number(lp.lesson_plan_id || 0) + '" title="Export"><i class="fas fa-file-export"></i></button>' +
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
    if (el('lpStrand')) el('lpStrand').value = getPlanStrand(lp);
    if (el('lpSubStrand')) el('lpSubStrand').value = lp.sub_strand || '';
    if (el('lpDuration')) el('lpDuration').value = lp.duration || '';
    if (el('lpContentStandard')) el('lpContentStandard').value = lp.content_standard || '';
    if (el('lpLearningOutcomes')) el('lpLearningOutcomes').value = lp.learning_outcomes || '';
    if (el('lpLearningIndicators')) el('lpLearningIndicators').value = lp.learning_indicators || '';
    if (el('lpEssentialQuestions')) el('lpEssentialQuestions').value = lp.essential_questions || '';
    if (el('lpPedagogicalStrategies')) el('lpPedagogicalStrategies').value = lp.pedagogical_strategies || '';
    if (el('lpTeachingLearningResources')) el('lpTeachingLearningResources').value = lp.teaching_learning_resources || '';
    if (el('lpDifferentiationNotes')) el('lpDifferentiationNotes').value = lp.differentiation_notes || '';
    if (el('lpLessonIntroduction')) el('lpLessonIntroduction').value = lp.lesson_introduction || '';
    if (el('lpLessonMain')) el('lpLessonMain').value = lp.lesson_main || '';
    if (el('lpLessonClosure')) el('lpLessonClosure').value = lp.lesson_closure || '';
    if (el('lpFormativeAssessmentMode')) el('lpFormativeAssessmentMode').value = lp.formative_assessment_mode || '';
    if (el('lpFormativeAssessmentTask')) el('lpFormativeAssessmentTask').value = lp.formative_assessment_task || '';
    if (el('lpFormativeMarkScheme')) el('lpFormativeMarkScheme').value = lp.formative_mark_scheme || '';
    if (el('lpTranscriptAssessmentMode')) el('lpTranscriptAssessmentMode').value = lp.transcript_assessment_mode || '';
    if (el('lpTranscriptAssessmentTask')) el('lpTranscriptAssessmentTask').value = lp.transcript_assessment_task || '';
    if (el('lpTranscriptRubricMarkScheme')) el('lpTranscriptRubricMarkScheme').value = lp.transcript_rubric_mark_scheme || '';
    if (el('lpReflectionRemarks')) el('lpReflectionRemarks').value = lp.reflection_remarks || '';
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

    updateMaterialsUi();

    showModal();
  }

  function closeLpModal() {
    if (el('lpModal')) el('lpModal').classList.remove('open');
    S.currentEditId = null;
    if (el('lpForm')) el('lpForm').reset();
    updateMaterialsUi();
  }

  function showModal() {
    if (el('lpModal')) el('lpModal').classList.add('open');
  }

  async function handleFormSubmit(event) {
    event.preventDefault();

    const courseId = Number(el('lpCourse')?.value || 0);
    const strand = String(el('lpStrand')?.value || '').trim();
    const sectionId = Number(el('lpSection')?.value || 0) || null;
    if (!courseId || !strand) {
      toast('Course and strand are required.', 'error');
      return;
    }

    const materialIds = Array.from(el('lpMaterials')?.selectedOptions || [])
      .map(function (opt) { return Number(opt.value || 0); })
      .filter(function (id) { return Number.isInteger(id) && id > 0; });

    const payload = {
      course_id: courseId,
      strand: strand,
      sub_strand: getFieldValue('lpSubStrand'),
      duration: getFieldValue('lpDuration'),
      content_standard: getFieldValue('lpContentStandard'),
      learning_outcomes: getFieldValue('lpLearningOutcomes'),
      learning_indicators: getFieldValue('lpLearningIndicators'),
      essential_questions: getFieldValue('lpEssentialQuestions'),
      pedagogical_strategies: getFieldValue('lpPedagogicalStrategies'),
      teaching_learning_resources: getFieldValue('lpTeachingLearningResources'),
      differentiation_notes: getFieldValue('lpDifferentiationNotes'),
      lesson_introduction: getFieldValue('lpLessonIntroduction'),
      lesson_main: getFieldValue('lpLessonMain'),
      lesson_closure: getFieldValue('lpLessonClosure'),
      formative_assessment_mode: getFieldValue('lpFormativeAssessmentMode'),
      formative_assessment_task: getFieldValue('lpFormativeAssessmentTask'),
      formative_mark_scheme: getFieldValue('lpFormativeMarkScheme'),
      transcript_assessment_mode: getFieldValue('lpTranscriptAssessmentMode'),
      transcript_assessment_task: getFieldValue('lpTranscriptAssessmentTask'),
      transcript_rubric_mark_scheme: getFieldValue('lpTranscriptRubricMarkScheme'),
      reflection_remarks: getFieldValue('lpReflectionRemarks'),
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
    const ok = await confirmPopup('Are you sure you want to delete this lesson plan?', 'Delete Lesson Plan');
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

    const ok = await confirmPopup('Delete this Topic / Unit / Week?', 'Delete Topic');
    if (!ok) return;

    await API.delete('/courses/' + courseId + '/sections/' + sectionId);
    toast('Topic deleted successfully.', 'success');

    await refreshSectionsForCourse(courseId);
    await renderSectionManagerList(courseId);
    await populateSectionFilter(Number(el('lpCourseFilter')?.value || courseId));
    await populateEditSections(Number(el('lpCourse')?.value || courseId), Number(el('lpSection')?.value || 0));
  }

  function csvValue(value) {
    const text = String(value ?? '').replace(/\r?\n/g, ' ').trim();
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function getCourseLabelById(courseId) {
    const match = S.courses.find(function (course) {
      return Number(course.course_id) === Number(courseId);
    });
    return match ? getCourseLabel(match) : ('Course #' + Number(courseId || 0));
  }

  async function resolveSectionLabel(plan) {
    if (plan.section_name) return String(plan.section_name);
    if (plan.week_number) return 'Week ' + plan.week_number;

    const courseId = Number(plan.course_id || 0);
    const sectionId = Number(plan.section_id || 0);
    if (!courseId || !sectionId) return '-';

    const sections = await loadSectionsForCourse(courseId);
    const found = sections.find(function (section) {
      return Number(section.section_id) === sectionId;
    });
    return found ? String(found.section_name || '-') : '-';
  }

  function buildSinglePlanSections(plan, sectionLabel) {
    const materials = Array.isArray(plan.materials)
      ? plan.materials
        .map(function (material) {
          return material.title || ('Material #' + Number(material.material_id || 0));
        })
        .filter(Boolean)
      : [];

    return [
      {
        title: 'Document Info',
        entries: [
          ['Date of Export', new Date().toLocaleString()],
          ['Class/Subject', getCourseLabelById(plan.course_id)],
          ['Topic / Unit / Week', sectionLabel || '-'],
        ],
      },
      {
        title: 'Curriculum Focus',
        entries: [
          ['Strand', getPlanStrand(plan) || 'Untitled'],
          ['Sub Strand', plan.sub_strand || ''],
          ['Duration', plan.duration || ''],
          ['Content Standard', plan.content_standard || ''],
          ['Learning Outcomes', plan.learning_outcomes || ''],
          ['Learning Indicators', plan.learning_indicators || ''],
          ['Essential Questions', plan.essential_questions || ''],
        ],
      },
      {
        title: 'Pedagogy and Delivery',
        entries: [
          ['Pedagogical Strategies', plan.pedagogical_strategies || ''],
          ['Teaching and Learning Resources', plan.teaching_learning_resources || ''],
          ['Differentiation Notes', plan.differentiation_notes || ''],
          ['Lesson Introduction', plan.lesson_introduction || ''],
          ['Lesson Main', plan.lesson_main || ''],
          ['Lesson Closure', plan.lesson_closure || ''],
        ],
      },
      {
        title: 'Assessment',
        entries: [
          ['Formative Assessment Mode', plan.formative_assessment_mode || ''],
          ['Formative Assessment Task', plan.formative_assessment_task || ''],
          ['Formative Mark Scheme', plan.formative_mark_scheme || ''],
          ['Transcript Assessment Mode', plan.transcript_assessment_mode || ''],
          ['Transcript Assessment Task', plan.transcript_assessment_task || ''],
          ['Transcript Rubric Mark Scheme', plan.transcript_rubric_mark_scheme || ''],
        ],
      },
      {
        title: 'Reflection and Resources',
        entries: [
          ['Reflection Remarks', plan.reflection_remarks || ''],
          ['Linked Course Materials', materials.length ? materials.join(', ') : 'None'],
        ],
      },
    ];
  }

  function downloadSinglePlanCsv(sections, fileSafeTitle) {
    const lines = [['Section', 'Field', 'Value'].map(csvValue).join(',')];
    sections.forEach(function (section) {
      (section.entries || []).forEach(function (entry) {
        lines.push([section.title || '', entry[0], entry[1]].map(csvValue).join(','));
      });
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lesson-plan-' + fileSafeTitle + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportSinglePlanPdf(sections, fileSafeTitle) {
    if (!window.jspdf || typeof window.jspdf.jsPDF !== 'function') return false;

    const doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentBottom = pageHeight - 56;
    const footerY = pageHeight - 24;
    const palette = {
      headerBg: [15, 23, 42],
      headerText: [255, 255, 255],
      accent: [14, 116, 144],
      sectionTitle: [30, 64, 175],
      label: [71, 85, 105],
      body: [30, 41, 59],
      divider: [203, 213, 225],
    };
    const infoSection = (sections || []).find(function (section) {
      return section.title === 'Document Info';
    }) || { entries: [] };
    const fieldMap = new Map((infoSection.entries || []).map(function (entry) {
      return [String(entry[0] || ''), String(entry[1] || '')];
    }));

    function setBold() {
      doc.setFont('helvetica', 'bold');
    }

    function setNormal() {
      doc.setFont('helvetica', 'normal');
    }

    let y = 44;

    doc.setFillColor(palette.headerBg[0], palette.headerBg[1], palette.headerBg[2]);
    doc.rect(0, 0, 595, 74, 'F');

    setBold();
    doc.setTextColor(palette.headerText[0], palette.headerText[1], palette.headerText[2]);
    doc.setFontSize(24);
    doc.text('Lesson Plan', 40, 46);

    y = 74;
    doc.setDrawColor(palette.accent[0], palette.accent[1], palette.accent[2]);
    doc.setLineWidth(1.2);
    doc.line(40, y, 555, y);

    y += 22;
    setBold();
    doc.setFontSize(11);
    doc.setTextColor(palette.label[0], palette.label[1], palette.label[2]);
    doc.text('Date of Export:', 40, y);
    setNormal();
    doc.setTextColor(palette.body[0], palette.body[1], palette.body[2]);
    doc.text(fieldMap.get('Date of Export') || '-', 130, y);

    y += 18;
    setBold();
    doc.setTextColor(palette.label[0], palette.label[1], palette.label[2]);
    doc.text('Class/Subject:', 40, y);
    setNormal();
    doc.setTextColor(palette.body[0], palette.body[1], palette.body[2]);
    doc.text(fieldMap.get('Class/Subject') || '-', 130, y);

    y += 18;
    setBold();
    doc.setTextColor(palette.label[0], palette.label[1], palette.label[2]);
    doc.text('Topic / Unit / Week:', 40, y);
    setNormal();
    doc.setTextColor(palette.body[0], palette.body[1], palette.body[2]);
    doc.text(fieldMap.get('Topic / Unit / Week') || '-', 170, y);

    function drawFooter(pageNumber, totalPages) {
      doc.setDrawColor(palette.divider[0], palette.divider[1], palette.divider[2]);
      doc.setLineWidth(0.6);
      doc.line(40, pageHeight - 36, 555, pageHeight - 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(palette.label[0], palette.label[1], palette.label[2]);
      doc.text('GHANA LMS', 40, footerY);
      doc.text('Page ' + pageNumber + ' of ' + totalPages, 555, footerY, { align: 'right' });
    }

    function ensureSpace(height) {
      if (y + height > contentBottom) {
        doc.addPage();
        y = 48;
      }
    }

    function addSectionTitle(title) {
      ensureSpace(36);
      y += 24;
      setBold();
      doc.setFontSize(15);
      doc.setTextColor(palette.sectionTitle[0], palette.sectionTitle[1], palette.sectionTitle[2]);
      doc.text(title, 40, y);

      y += 8;
      doc.setLineWidth(0.6);
      doc.setDrawColor(palette.divider[0], palette.divider[1], palette.divider[2]);
      doc.line(40, y, 555, y);

      y += 14;
    }

    function addSectionEntry(label, value) {
      const safeValue = String(value || '').trim() || 'N/A';
      const labelWidth = 140;
      const valueX = 190;
      const valueWidth = 350;
      const lineHeight = 14;
      const allLines = doc.splitTextToSize(safeValue, valueWidth);
      let remainingLines = allLines.slice();
      let isContinuation = false;

      while (remainingLines.length) {
        const labelText = String(label || 'Field') + (isContinuation ? ' (cont.)' : '') + ':';
        const labelLines = doc.splitTextToSize(labelText, labelWidth);
        ensureSpace(Math.max(24, labelLines.length * lineHeight + 8));

        setBold();
        doc.setFontSize(10.5);
        doc.setTextColor(palette.label[0], palette.label[1], palette.label[2]);
        doc.text(labelLines, 40, y);

        setNormal();
        doc.setFontSize(11);
        doc.setTextColor(palette.body[0], palette.body[1], palette.body[2]);

        const availableHeight = Math.max(lineHeight, contentBottom - y);
        const maxLines = Math.max(1, Math.floor(availableHeight / lineHeight));
        const chunk = remainingLines.splice(0, maxLines);

        doc.text(chunk, valueX, y);
        const rowLines = Math.max(labelLines.length, chunk.length);
        y += Math.max(20, rowLines * lineHeight);
        y += 6;
        isContinuation = true;
      }
    }

    (sections || []).forEach(function (section) {
      if (!section || section.title === 'Document Info') return;
      addSectionTitle(section.title || 'Section');
      (section.entries || []).forEach(function (entry) {
        addSectionEntry(entry[0], entry[1]);
      });
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i += 1) {
      doc.setPage(i);
      drawFooter(i, totalPages);
    }

    doc.save('lesson-plan-' + fileSafeTitle + '-' + new Date().toISOString().slice(0, 10) + '.pdf');
    return true;
  }

  function sanitizeFilenamePart(value) {
    return String(value || 'lesson-plan')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'lesson-plan';
  }

  async function exportLessonPlanById(id) {
    const response = await API.get('/lesson-plans/' + id);
    const plan = response?.data || response;
    if (!plan || !plan.lesson_plan_id) {
      toast('Unable to export this lesson plan right now.', 'error');
      return;
    }

    const sectionLabel = await resolveSectionLabel(plan);
    const sections = buildSinglePlanSections(plan, sectionLabel);
    const fileSafeTitle = sanitizeFilenamePart(getPlanStrand(plan) || ('lesson-plan-' + id));

    const pdfDone = exportSinglePlanPdf(sections, fileSafeTitle);
    if (pdfDone) {
      toast('Lesson plan exported to PDF.', 'success');
      return;
    }

    downloadSinglePlanCsv(sections, fileSafeTitle);
    toast('PDF library unavailable. Exported CSV instead.', 'warning');
  }

  function exportLessonPlans() {
    if (!S.view.length) {
      toast('No lesson plans available to export.', 'warning');
      return;
    }

    if (S.view.length > 1) {
      toast('Use the export button on a specific lesson plan row.', 'info');
      return;
    }

    const planId = Number(S.view[0]?.lesson_plan_id || 0);
    if (!planId) {
      toast('Could not find lesson plan to export.', 'error');
      return;
    }

    exportLessonPlanById(planId).catch(function () {
      toast('Failed to export lesson plan.', 'error');
    });
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
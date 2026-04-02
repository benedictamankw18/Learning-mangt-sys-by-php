/* ============================================
   Admin Assessments (Config + Read-only Monitor)
============================================ */

(function () {
  "use strict";

  const state = {
    courses: [],
    assessments: [],
    categories: [],
    serverCategories: {},
  };

  let el = {};

  function cacheEls() {
    el = {
      root: document.getElementById("admAssessmentsRoot"),
      kpiTotal: document.getElementById("admAssKpiTotal"),
      kpiUpcoming: document.getElementById("admAssKpiUpcoming"),
      kpiPublished: document.getElementById("admAssKpiPublished"),
      kpiClasses: document.getElementById("admAssKpiClasses"),
      weightList: document.getElementById("admAssWeightList"),
      createName: document.getElementById("admAssCreateCategoryName"),
      createWeight: document.getElementById("admAssCreateCategoryWeight"),
      createDescription: document.getElementById("admAssCreateCategoryDescription"),
      addCategoryBtn: document.getElementById("admAssAddCategoryBtn"),
      saveWeightsBtn: document.getElementById("admAssSaveWeightsBtn"),
      resetWeightsBtn: document.getElementById("admAssResetWeightsBtn"),
      weightTotal: document.getElementById("admAssWeightTotal"),
      upcomingByClass: document.getElementById("admAssUpcomingByClass"),
      scheduleBody: document.getElementById("admAssScheduleBody"),
      calendarList: document.getElementById("admAssCalendarList"),
      refreshBtn: document.getElementById("admAssRefreshBtn"),
    };
  }

  function showToastSafe(message, type) {
    if (typeof showToast === "function") {
      showToast(message, type || "info");
      return;
    }
    console.log((type || "info").toUpperCase() + ": " + message);
  }

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showConfirmPopup(title, message) {
    if (typeof window.showModal === "function") {
      return new Promise(function (resolve) {
        window.showModal(
          title || "Confirm",
          message || "Are you sure?",
          function () {
            resolve(true);
          },
          function () {
            resolve(false);
          }
        );
      });
    }

    return new Promise(function (resolve) {
      const overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;";
      const box = document.createElement("div");
      box.style.cssText =
        "background:#fff;border-radius:12px;max-width:420px;width:100%;padding:18px;box-shadow:0 18px 48px rgba(0,0,0,.2);";
      box.innerHTML =
        '<h3 style="margin:0 0 8px;font-size:16px;color:#0f172a">' +
        esc(title || "Confirm") +
        "</h3>" +
        '<p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.5">' +
        esc(message || "Are you sure?") +
        "</p>" +
        '<div style="display:flex;justify-content:flex-end;gap:8px">' +
        '<button type="button" data-role="cancel" style="padding:8px 12px;border:1px solid #cbd5e1;background:#fff;border-radius:8px;cursor:pointer">Cancel</button>' +
        '<button type="button" data-role="confirm" style="padding:8px 12px;border:0;background:#006a3f;color:#fff;border-radius:8px;cursor:pointer">Confirm</button>' +
        "</div>";

      overlay.appendChild(box);
      document.body.appendChild(overlay);

      function close(result) {
        overlay.remove();
        resolve(result);
      }

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close(false);
      });
      box.querySelector('[data-role="cancel"]').addEventListener("click", function () {
        close(false);
      });
      box.querySelector('[data-role="confirm"]').addEventListener("click", function () {
        close(true);
      });
    });
  }

  function fmtDateTime(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  }

  function parseDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function getTypeLabel(type) {
    const key = String(type || "").toLowerCase().trim();
    if (key === "exam") return "Exam";
    if (key === "quiz") return "Quiz";
    if (key === "assignment") return "Assignment";
    if (key === "project") return "Project";
    if (key === "presentation") return "Presentation";
    return key || "Unknown";
  }

  function isUpcomingWithinDays(value, days) {
    const due = parseDate(value);
    if (!due) return false;
    const now = new Date();
    const max = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return due >= now && due <= max;
  }

  function normalizeCourse(row) {
    return {
      id: row.course_id || row.id || row.class_subject_id || null,
      code: row.course_code || row.code || "",
      name: row.course_name || row.subject_name || row.name || "Untitled Course",
      className: row.class_name || row.class_section_name || row.section_name || "Unassigned Class",
      teacherName:
        row.teacher_name ||
        [row.teacher_first_name, row.teacher_last_name].filter(Boolean).join(" ") ||
        "Teacher",
    };
  }

  function isTruthyPublished(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    const normalized = String(value == null ? "" : value).toLowerCase().trim();
    return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "published";
  }

  function normalizeAssessment(row, course) {
    const dueDate = row.due_date || row.dueDate || null;
    const type = String(row.assessment_type || row.type || "").toLowerCase();
    const rawStatus = String(row.status || row.assessment_status || "").toLowerCase().trim();
    const isPublished =
      isTruthyPublished(row.is_published) ||
      isTruthyPublished(row.published) ||
      rawStatus === "published";

    return {
      id: row.assessment_id || row.id || null,
      title: row.title || "Untitled Assessment",
      type,
      maxScore: row.max_score,
      dueDate,
      isPublished,
      weight: row.weight_percentage,
      courseId: course.id,
      courseCode: course.code,
      courseName: course.name,
      className: course.className,
      teacherName: course.teacherName,
    };
  }

  function normalizeCategoriesResponse(payload) {
    const list = Array.isArray(payload?.data?.data)
      ? payload.data.data
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

    return list
      .map((row) => {
        const id = Number(row.category_id ?? row.id ?? 0);
        if (!id) return null;
        const weight = Number(row.weight_percentage ?? 0);
        return {
          category_id: id,
          category_name: String(row.category_name || "Unnamed Category"),
          description: String(row.description || "").trim(),
          weight_percentage: Number.isFinite(weight) && weight >= 1 ? weight : 1,
        };
      })
      .filter(Boolean);
  }

  function setServerSnapshot(categories) {
    state.serverCategories = {};
    categories.forEach((category) => {
      state.serverCategories[String(category.category_id)] = {
        category_name: String(category.category_name || "").trim(),
        description: String(category.description || "").trim(),
        weight_percentage: Number(category.weight_percentage) || 1,
      };
    });
  }

  function clearCreateForm() {
    if (el.createName) el.createName.value = "";
    if (el.createWeight) el.createWeight.value = "";
    if (el.createDescription) el.createDescription.value = "";
  }

  async function loadCategoryWeightsFromDatabase() {
    if (!AssessmentCategoryAPI || typeof AssessmentCategoryAPI.getAll !== "function") {
      throw new Error("Assessment category API is not available.");
    }

    const res = await AssessmentCategoryAPI.getAll({ page: 1, limit: 100 });
    const categories = normalizeCategoriesResponse(res);

    state.categories = categories.map((c) => ({ ...c }));
    setServerSnapshot(categories);
  }

  async function saveWeightsToDatabase() {
    const updates = state.categories
      .map((category) => {
        const id = String(category.category_id);
        const snapshot = state.serverCategories[id];
        if (!snapshot) return null;

        const nextName = String(category.category_name || "").trim();
        const nextDescription = String(category.description || "").trim();
        const nextWeight = Number(category.weight_percentage ?? 1);

        if (!nextName) {
          throw new Error("Category name is required for all rows.");
        }

        if (!Number.isFinite(nextWeight) || nextWeight < 1 || nextWeight > 100) {
          throw new Error("Each category weight must be between 1 and 100.");
        }

        const changed =
          nextName !== snapshot.category_name ||
          nextDescription !== snapshot.description ||
          nextWeight !== Number(snapshot.weight_percentage);

        return changed
          ? {
              categoryId: category.category_id,
              payload: {
                category_name: nextName,
                description: nextDescription || null,
                weight_percentage: nextWeight,
              },
            }
          : null;
      })
      .filter(Boolean);

    if (!updates.length) {
      showToastSafe("No category weight changes to save.", "info");
      return;
    }

    const results = await Promise.allSettled(
      updates.map((u) =>
        AssessmentCategoryAPI.update(u.categoryId, u.payload)
      )
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) {
      throw new Error(`Saved ${results.length - failed.length}/${results.length} category weights.`);
    }

    updates.forEach((u) => {
      state.serverCategories[String(u.categoryId)] = {
        category_name: String(u.payload.category_name || "").trim(),
        description: String(u.payload.description || "").trim(),
        weight_percentage: Number(u.payload.weight_percentage) || 1,
      };
    });
  }

  async function createCategoryInDatabase() {
    const categoryName = String(el.createName?.value || "").trim();
    const weight = Number(el.createWeight?.value || 0);
    const description = String(el.createDescription?.value || "").trim();

    if (!categoryName) {
      throw new Error("Category name is required.");
    }

    if (!Number.isFinite(weight) || weight < 1 || weight > 100) {
      throw new Error("Category weight must be between 1 and 100.");
    }

    await AssessmentCategoryAPI.create({
      category_name: categoryName,
      weight_percentage: weight,
      description: description || null,
    });

    clearCreateForm();
    await loadCategoryWeightsFromDatabase();
    renderWeights();
  }

  async function deleteCategoryInDatabase(categoryId) {
    const id = Number(categoryId);
    if (!id) return false;

    const target = state.categories.find((c) => Number(c.category_id) === id);
    const targetName = target ? String(target.category_name || "this category") : "this category";

    const confirmed = await showConfirmPopup(
      "Delete Assessment Category",
      `Delete ${targetName}? This action cannot be undone.`
    );
    if (!confirmed) {
      return false;
    }

    await AssessmentCategoryAPI.delete(id);
    await loadCategoryWeightsFromDatabase();
    renderWeights();
    return true;
  }

  function getWeightTotal() {
    return state.categories.reduce((sum, category) => {
      return sum + (Number(category.weight_percentage) || 0);
    }, 0);
  }

  function renderWeights() {
    if (!el.weightList) return;

    if (!state.categories.length) {
      el.weightList.innerHTML = '<div class="adm-ass-empty">No assessment categories found in the database.</div>';
      renderWeightTotal();
      return;
    }

    el.weightList.innerHTML = state.categories
      .map((category) => {
        const id = String(category.category_id);
        return `
          <div class="adm-ass-weight-row">
            <input
              id="admAssCategoryName_${esc(id)}"
              type="text"
              maxlength="100"
              data-category-field="name"
              data-category-id="${esc(id)}"
              value="${esc(category.category_name || "")}" 
              placeholder="Category name"
            />
            <input
              id="admAssWeight_${esc(id)}"
              type="number"
              min="1"
              max="100"
              step="1"
              data-category-field="weight"
              data-category-id="${esc(id)}"
              value="${esc(category.weight_percentage ?? 1)}"
            />
            <button
              class="sub-btn sub-btn-danger"
              type="button"
              data-category-action="delete"
              data-category-id="${esc(id)}"
              aria-label="Delete ${esc(category.category_name)}"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <div class="adm-ass-weight-desc">
            <textarea
              maxlength="500"
              data-category-field="description"
              data-category-id="${esc(id)}"
              placeholder="Optional description"
            >${esc(category.description || "")}</textarea>
          </div>
        `;
      })
      .join("");

    const getCategoryById = (categoryId) =>
      state.categories.find((c) => String(c.category_id) === String(categoryId));

    el.weightList.querySelectorAll("[data-category-field]").forEach((field) => {
      field.addEventListener("input", () => {
        const categoryId = String(field.getAttribute("data-category-id") || "").trim();
        const category = getCategoryById(categoryId);
        if (!category) return;

        const type = String(field.getAttribute("data-category-field") || "").trim();
        if (type === "name") {
          category.category_name = String(field.value || "").trim();
          return;
        }

        if (type === "description") {
          category.description = String(field.value || "").trim();
          return;
        }

        if (type === "weight") {
          const value = Number(field.value);
          category.weight_percentage = Number.isFinite(value) && value >= 1 ? value : 1;
          renderWeightTotal();
        }
      });
    });

    el.weightList.querySelectorAll("button[data-category-action='delete']").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const categoryId = String(btn.getAttribute("data-category-id") || "").trim();
        if (!categoryId) return;

        btn.disabled = true;
        try {
          const deleted = await deleteCategoryInDatabase(categoryId);
          if (deleted) {
            showToastSafe("Assessment category deleted successfully.", "success");
          }
        } catch (err) {
          showToastSafe(err?.message || "Failed to delete category.", "error");
        } finally {
          btn.disabled = false;
          renderWeightTotal();
        }
      });
    });

    renderWeightTotal();
  }

  function renderWeightTotal() {
    if (!el.weightTotal) return;
    const total = getWeightTotal();
    el.weightTotal.textContent = `Total: ${total}%`;
    el.weightTotal.classList.remove("ok", "warn");
    if (total === 100) {
      el.weightTotal.classList.add("ok");
    } else {
      el.weightTotal.classList.add("warn");
    }
  }

  function renderKpis() {
    const total = state.assessments.length;
    const upcoming = state.assessments.filter((a) => isUpcomingWithinDays(a.dueDate, 7)).length;
    const published = state.assessments.filter((a) => a.isPublished).length;
    const classes = new Set(state.assessments.map((a) => a.className).filter(Boolean)).size;

    if (el.kpiTotal) el.kpiTotal.textContent = String(total);
    if (el.kpiUpcoming) el.kpiUpcoming.textContent = String(upcoming);
    if (el.kpiPublished) el.kpiPublished.textContent = String(published);
    if (el.kpiClasses) el.kpiClasses.textContent = String(classes);
  }

  function renderSchedule() {
    if (!el.scheduleBody) return;

    if (!state.assessments.length) {
      el.scheduleBody.innerHTML = '<tr><td colspan="6" class="adm-ass-empty">No assessments found yet.</td></tr>';
      return;
    }

    const rows = state.assessments
      .slice()
      .sort((a, b) => {
        const d1 = parseDate(a.dueDate)?.getTime() || 0;
        const d2 = parseDate(b.dueDate)?.getTime() || 0;
        return d1 - d2;
      })
      .map((a) => {
        const typeClass = esc(a.type || "assignment");
        const status = a.isPublished ? "Teacher Published" : "Teacher Draft";
        return `
          <tr>
            <td>
              <div style="font-weight:600;color:#0f172a">${esc(a.title)}</div>
              <div style="font-size:0.76rem;color:#64748b">Teacher: ${esc(a.teacherName)}</div>
            </td>
            <td>${esc(a.className)}<br /><span style="font-size:0.76rem;color:#64748b">${esc(a.courseCode || a.courseName)}</span></td>
            <td><span class="adm-ass-chip ${typeClass}">${esc(getTypeLabel(a.type))}</span></td>
            <td>${esc(fmtDateTime(a.dueDate))}</td>
            <td>${esc(a.weight == null ? "-" : `${a.weight}%`)}</td>
            <td>${esc(status)}</td>
          </tr>
        `;
      })
      .join("");

    el.scheduleBody.innerHTML = rows;
  }

  function renderUpcomingByClass() {
    if (!el.upcomingByClass) return;

    const upcoming = state.assessments.filter((a) => isUpcomingWithinDays(a.dueDate, 14));
    if (!upcoming.length) {
      el.upcomingByClass.innerHTML = '<li class="adm-ass-empty">No upcoming assessments in the next 14 days.</li>';
      return;
    }

    const map = new Map();
    upcoming.forEach((a) => {
      const key = a.className || "Unassigned Class";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });

    const html = Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([className, items]) => {
        items.sort((x, y) => (parseDate(x.dueDate)?.getTime() || 0) - (parseDate(y.dueDate)?.getTime() || 0));
        const next = items[0];
        return `
          <li>
            <div class="title">${esc(className)}</div>
            <div class="meta">${items.length} upcoming • next: ${esc(next ? fmtDateTime(next.dueDate) : "-")}</div>
          </li>
        `;
      })
      .join("");

    el.upcomingByClass.innerHTML = html;
  }

  function renderCalendarList() {
    if (!el.calendarList) return;

    if (!state.assessments.length) {
      el.calendarList.innerHTML = '<li class="adm-ass-empty">No calendar entries available.</li>';
      return;
    }

    const sorted = state.assessments
      .slice()
      .filter((a) => a.dueDate)
      .sort((a, b) => (parseDate(a.dueDate)?.getTime() || 0) - (parseDate(b.dueDate)?.getTime() || 0));

    if (!sorted.length) {
      el.calendarList.innerHTML = '<li class="adm-ass-empty">No due dates set for assessments.</li>';
      return;
    }

    el.calendarList.innerHTML = sorted
      .slice(0, 30)
      .map((a) => {
        return `
          <li>
            <div class="title">${esc(a.title)} <span class="adm-ass-chip ${esc(a.type)}">${esc(getTypeLabel(a.type))}</span></div>
            <div class="meta">${esc(fmtDateTime(a.dueDate))} • ${esc(a.className)} • ${esc(a.courseCode || a.courseName)}</div>
          </li>
        `;
      })
      .join("");
  }

  function renderAll() {
    renderWeights();
    renderKpis();
    renderSchedule();
    renderUpcomingByClass();
    renderCalendarList();
  }

  async function loadAssessmentsData() {
    if (!el.scheduleBody) return;

    el.scheduleBody.innerHTML = '<tr><td colspan="6" class="adm-ass-empty">Loading assessments...</td></tr>';

    try {
      const courseRes = await CourseAPI.getAll();
      const courseRows = Array.isArray(courseRes?.data)
        ? courseRes.data
        : Array.isArray(courseRes)
          ? courseRes
          : Array.isArray(courseRes?.data?.courses)
            ? courseRes.data.courses
            : Array.isArray(courseRes?.courses)
              ? courseRes.courses
              : [];

      const courses = courseRows.map(normalizeCourse).filter((c) => c.id);
      state.courses = courses;

      const settled = await Promise.allSettled(
        courses.map((course) => AssessmentAPI.getAll({ course_id: course.id }))
      );

      const allAssessments = [];
      settled.forEach((entry, idx) => {
        if (entry.status !== "fulfilled") return;
        const payload = entry.value;
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        rows.forEach((row) => {
          allAssessments.push(normalizeAssessment(row, courses[idx]));
        });
      });

      state.assessments = allAssessments;
      renderAll();
    } catch (err) {
      console.error("Admin assessments load error:", err);
      el.scheduleBody.innerHTML = '<tr><td colspan="6" class="adm-ass-empty">Failed to load assessment schedule.</td></tr>';
      if (el.upcomingByClass) {
        el.upcomingByClass.innerHTML = '<li class="adm-ass-empty">Unable to load upcoming by class.</li>';
      }
      if (el.calendarList) {
        el.calendarList.innerHTML = '<li class="adm-ass-empty">Unable to load calendar entries.</li>';
      }
      showToastSafe(err?.message || "Failed to load assessments", "error");
    }
  }

  function bindEvents() {
    el.saveWeightsBtn?.addEventListener("click", async () => {
      el.saveWeightsBtn.disabled = true;
      el.saveWeightsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      try {
        await saveWeightsToDatabase();
        showToastSafe("Assessment weights saved to database.", "success");
      } catch (err) {
        showToastSafe(err?.message || "Failed to save category weights.", "error");
      } finally {
        el.saveWeightsBtn.disabled = false;
        el.saveWeightsBtn.innerHTML = '<i class="fas fa-save"></i> Save Weights';
        renderWeightTotal();
      }
    });

    el.resetWeightsBtn?.addEventListener("click", () => {
      state.categories = state.categories.map((category) => {
        const snap = state.serverCategories[String(category.category_id)] || {};
        return {
          ...category,
          category_name: String(snap.category_name || category.category_name || "").trim(),
          description: String(snap.description || "").trim(),
          weight_percentage: Number(snap.weight_percentage || category.weight_percentage || 1),
        };
      });
      renderWeights();
      showToastSafe("Assessment weights reset to database values.", "info");
    });

    el.addCategoryBtn?.addEventListener("click", async () => {
      el.addCategoryBtn.disabled = true;
      el.addCategoryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
      try {
        await createCategoryInDatabase();
        showToastSafe("Assessment category created successfully.", "success");
      } catch (err) {
        showToastSafe(err?.message || "Failed to create category.", "error");
      } finally {
        el.addCategoryBtn.disabled = false;
        el.addCategoryBtn.innerHTML = '<i class="fas fa-plus"></i> Add Category';
        renderWeightTotal();
      }
    });

    el.refreshBtn?.addEventListener("click", () => {
      loadAssessmentsData().catch(() => {});
    });
  }

  async function initPage() {
    if (!Auth || !Auth.requireAuth || !Auth.requireAuth([USER_ROLES.ADMIN])) {
      return;
    }

    cacheEls();
    if (!el.root) return;

    if (el.root.dataset.initialized === "1") {
      return;
    }
    el.root.dataset.initialized = "1";

    bindEvents();
    await loadCategoryWeightsFromDatabase();
    renderWeights();
    await loadAssessmentsData();
  }

  function bootIfAssessmentsVisible() {
    const currentHash = String(window.location.hash || "").replace(/^#/, "").trim();
    if (currentHash === "assessments" || document.getElementById("admAssessmentsRoot")) {
      initPage().catch((err) => {
        console.error("Admin assessments init error:", err);
      });
    }
  }

  document.addEventListener("page:loaded", function (e) {
    if (e.detail && e.detail.page === "assessments") {
      initPage().catch((err) => {
        console.error("Admin assessments init error:", err);
      });
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootIfAssessmentsVisible);
  } else {
    bootIfAssessmentsVisible();
  }
})();

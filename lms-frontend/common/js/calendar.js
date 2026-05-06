/* ============================================
   Shared School Calendar Module
============================================ */

(function () {
  const state = {
    initialized: false,
    view: "month",
    selectedDate: new Date(),
    typeFilter: "all",
    events: [],
    currentViewEvents: [],
    semester: null,
    institutionId: null,
    role: null,
    userId: null,
    editingPersonalEventId: null,
    confirmResolver: null,
    nationalHolidayCache: new Map(),
    nationalHolidayApiWarned: false,
    importRows: [],
    validAcademicYearIds: null,
    academicYearNameMap: null,
    activeAcademicYearId: null,
  };

  const allowedPersonalRoles = new Set(["admin", "teacher", "student", "parent"]);
  const allowedCalendarUploadRoles = new Set(["admin", "super_admin"]);
  const validEventTypes = new Set(["school", "academic", "sports", "cultural", "exam", "holiday", "meeting", "other"]);

  const typeStyles = {
    academic: { bg: "#e0f2fe", text: "#0c4a6e" },
    exam: { bg: "#fee2e2", text: "#7f1d1d" },
    holiday: { bg: "#dcfce7", text: "#14532d" },
    school: { bg: "#ede9fe", text: "#4c1d95" },
    sports: { bg: "#ffedd5", text: "#7c2d12" },
    cultural: { bg: "#fce7f3", text: "#831843" },
    meeting: { bg: "#fef3c7", text: "#78350f" },
    other: { bg: "#e2e8f0", text: "#0f172a" },
  };

  document.addEventListener("page:loaded", (e) => {
    if (e?.detail?.page === "calendar") {
      initCalendarPage();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (window.location.hash.replace("#", "") === "calendar") {
      initCalendarPage();
    }
  });

  function initCalendarPage() {
    const root = document.getElementById("commonCalendarPage");
    if (!root) return;

    const alreadyBound = root.dataset.calendarBound === "1";
    if (!alreadyBound) {
      bindEvents(root);
      root.dataset.calendarBound = "1";
    }

    const user = typeof Auth !== "undefined" && Auth.getUser ? Auth.getUser() : null;
    state.role = String(user?.role || "").toLowerCase();
    state.institutionId = user?.institution_id || user?.institutionId || null;
    state.userId = Number(user?.user_id || user?.id || 0) || null;

    togglePersonalEventBox();
    toggleAdminUploadBox();
    setView(state.view);

    loadSemesterMeta();
    refreshEvents();
    state.initialized = true;
  }

  function bindEvents(root) {
    const monthBtn = document.getElementById("calMonthViewBtn");
    const weekBtn = document.getElementById("calWeekViewBtn");
    const typeFilter = document.getElementById("calTypeFilter");
    const prevBtn = document.getElementById("calPrevBtn");
    const nextBtn = document.getElementById("calNextBtn");
    const todayBtn = document.getElementById("calTodayBtn");
    const exportBtn = document.getElementById("calExportBtn");
    const syncBtn = document.getElementById("calSyncBtn");
    const savePersonalBtn = document.getElementById("calPersonalSaveBtn");
    const cancelPersonalBtn = document.getElementById("calPersonalCancelBtn");
    const openImportBtn = document.getElementById("calOpenImportBtn");

    if (monthBtn) monthBtn.addEventListener("click", () => setView("month"));
    if (weekBtn) weekBtn.addEventListener("click", () => setView("week"));

    if (typeFilter) {
      typeFilter.addEventListener("change", () => {
        state.typeFilter = typeFilter.value;
        render();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        shiftPeriod(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        shiftPeriod(1);
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener("click", () => {
        state.selectedDate = new Date();
        refreshEvents();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", exportCsv);
    }

    if (syncBtn) {
      syncBtn.addEventListener("click", exportIcs);
    }

    if (savePersonalBtn) {
      savePersonalBtn.addEventListener("click", savePersonalEvent);
    }

    if (cancelPersonalBtn) {
      cancelPersonalBtn.addEventListener("click", resetPersonalEditor);
    }

    if (openImportBtn) {
      openImportBtn.addEventListener("click", openImportModal);
    }

    document.getElementById("calImportModalClose")?.addEventListener("click", closeImportModal);
    document.getElementById("calImportCancelBtn")?.addEventListener("click", closeImportModal);
    document.getElementById("calImportConfirmBtn")?.addEventListener("click", confirmImport);
    document.getElementById("calImportResultsClose")?.addEventListener("click", closeImportResults);
    document.getElementById("calImportResultsDoneBtn")?.addEventListener("click", closeImportResults);

    document.getElementById("calImportTemplateLink")?.addEventListener("click", (evt) => {
      evt.preventDefault();
      downloadCalendarTemplate();
    });

    document.getElementById("calImportDropZone")?.addEventListener("click", () => {
      document.getElementById("calImportFileInput")?.click();
    });

    document
      .getElementById("calImportFileInput")
      ?.addEventListener("change", (evt) => handleImportFile(evt.target?.files?.[0]));

    const importOverlay = document.getElementById("calImportModalOverlay");
    if (importOverlay) {
      importOverlay.addEventListener("click", (evt) => {
        if (evt.target === importOverlay) closeImportModal();
      });
    }

    const resultsOverlay = document.getElementById("calImportResultsOverlay");
    if (resultsOverlay) {
      resultsOverlay.addEventListener("click", (evt) => {
        if (evt.target === resultsOverlay) closeImportResults();
      });
    }

    const dz = document.getElementById("calImportDropZone");
    if (dz) {
      ["dragenter", "dragover"].forEach((eventName) => {
        dz.addEventListener(eventName, (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          dz.classList.add("dragover");
        });
      });
      ["dragleave", "drop"].forEach((eventName) => {
        dz.addEventListener(eventName, (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          dz.classList.remove("dragover");
        });
      });
      dz.addEventListener("drop", (evt) => handleImportFile(evt.dataTransfer?.files?.[0]));
    }

    root.addEventListener("click", (evt) => {
      const confirmActionBtn = evt.target.closest("[data-confirm-action]");
      if (confirmActionBtn) {
        const action = confirmActionBtn.getAttribute("data-confirm-action");
        closeConfirmModal(action === "ok");
        return;
      }

      const confirmBackdrop = evt.target.closest("#calConfirmModal");
      if (confirmBackdrop && evt.target === confirmBackdrop) {
        closeConfirmModal(false);
        return;
      }

      const actionBtn = evt.target.closest("[data-personal-action]");
      if (actionBtn) {
        const action = actionBtn.getAttribute("data-personal-action");
        const eventId = actionBtn.getAttribute("data-event-id");
        if (action === "edit") {
          startEditPersonalEvent(eventId);
          return;
        }
        if (action === "delete") {
          deletePersonalEvent(eventId);
          return;
        }
      }

      const dayEl = evt.target.closest("[data-cal-day]");
      if (!dayEl) return;
      const iso = dayEl.getAttribute("data-cal-day");
      if (!iso) return;
      const parsed = parseDateOnly(iso);
      if (!parsed) return;
      state.selectedDate = parsed;
      render();
    });
  }

  function setView(view) {
    state.view = view === "week" ? "week" : "month";
    const monthBtn = document.getElementById("calMonthViewBtn");
    const weekBtn = document.getElementById("calWeekViewBtn");
    if (monthBtn) monthBtn.classList.toggle("active", state.view === "month");
    if (weekBtn) weekBtn.classList.toggle("active", state.view === "week");
    refreshEvents();
  }

  function shiftPeriod(delta) {
    const d = new Date(state.selectedDate);
    if (state.view === "month") {
      d.setMonth(d.getMonth() + delta);
    } else {
      d.setDate(d.getDate() + delta * 7);
    }
    state.selectedDate = d;
    refreshEvents();
  }

  async function loadSemesterMeta() {
    const labelEl = document.getElementById("calSemesterLabel");
    const datesEl = document.getElementById("calSemesterDates");
    try {
      if (typeof API === "undefined" || !API.get) return;
      const res = await API.get(API_ENDPOINTS.SEMESTER_CURRENT);
      const semester = res?.data || null;
      state.semester = semester;

      if (!semester) {
        if (labelEl) labelEl.textContent = "Not Set";
        if (datesEl) datesEl.textContent = "No active semester configured.";
        return;
      }

      const name = semester.semester_name || semester.name || "Current Semester";
      const start = formatDate(semester.start_date);
      const end = formatDate(semester.end_date);

      if (labelEl) labelEl.textContent = name;
      if (datesEl) datesEl.textContent = `${start} - ${end}`;
    } catch (error) {
      if (labelEl) labelEl.textContent = "Unavailable";
      if (datesEl) datesEl.textContent = "Could not load semester dates.";
    }
  }

  async function refreshEvents() {
    if (typeof EventAPI === "undefined") {
      showToastSafe("Calendar API is not available.", "error");
      return;
    }

    try {
      const loader = `<div class="cal-empty">Loading calendar data...</div>`;
      const viewport = document.getElementById("calViewport");
      const eventList = document.getElementById("calEventList");
      if (viewport) viewport.innerHTML = loader;
      if (eventList) eventList.innerHTML = loader;

      const selected = new Date(state.selectedDate);
      if (state.view === "month") {
        const y = selected.getFullYear();
        const m = selected.getMonth() + 1;

        const [calendarRes, academicRes] = await Promise.all([
          EventAPI.getCalendar({ institution_id: state.institutionId, year: y, month: m, published_only: 1 }),
          EventAPI.getAcademicCalendar({ institution_id: state.institutionId, published_only: 1 }),
        ]);

        const monthStart = new Date(y, m - 1, 1);
        const monthEnd = new Date(y, m, 0);

        const calendarEvents = normalizeEvents(extractEvents(calendarRes));
        const academicEvents = normalizeEvents(extractEvents(academicRes)).filter((evt) =>
          overlapsRange(evt, monthStart, monthEnd),
        );
        const nationalHolidays = await getNationalHolidayEventsForRange(monthStart, monthEnd);

        state.events = dedupeEvents([...calendarEvents, ...academicEvents, ...nationalHolidays]);
      } else {
        const [weekStart, weekEnd] = getWeekRange(selected);
        const allRes = await EventAPI.getAll({
          institution_id: state.institutionId,
          start_date: `${toDateOnly(weekStart)} 00:00:00`,
          end_date: `${toDateOnly(weekEnd)} 23:59:59`,
          published_only: 1,
          limit: 200,
        });

        const allEvents = normalizeEvents(extractEvents(allRes));
        const nationalHolidays = await getNationalHolidayEventsForRange(weekStart, weekEnd);
        state.events = dedupeEvents([
          ...allEvents.filter((evt) => overlapsRange(evt, weekStart, weekEnd)),
          ...nationalHolidays,
        ]);
      }

      render();
    } catch (error) {
      const viewport = document.getElementById("calViewport");
      const eventList = document.getElementById("calEventList");
      const message = "Unable to load calendar events.";
      if (viewport) viewport.innerHTML = `<div class="cal-empty">${message}</div>`;
      if (eventList) eventList.innerHTML = `<div class="cal-empty">${message}</div>`;
      showToastSafe(error?.message || message, "error");
    }
  }

  function render() {
    const filtered = filterEvents(state.events, state.typeFilter);
    state.currentViewEvents = filtered;

    renderStats(filtered);
    if (state.view === "month") {
      renderMonth(filtered);
      renderSideList(filtered, "Events This Month");
    } else {
      renderWeek(filtered);
      renderSideList(filtered, "Events This Week");
    }
  }

  function renderStats(events) {
    setText("calCountEvents", String(events.length));
    setText("calCountExams", String(events.filter((e) => e.type === "exam").length));
    setText("calCountHolidays", String(events.filter((e) => e.type === "holiday").length));
  }

  function renderMonth(events) {
    const viewport = document.getElementById("calViewport");
    const rangeLabel = document.getElementById("calRangeLabel");
    if (!viewport) return;

    const y = state.selectedDate.getFullYear();
    const m = state.selectedDate.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);

    if (rangeLabel) {
      rangeLabel.textContent = first.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const lead = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();

    const eventMap = mapEventsByDate(events);
    const todayIso = toDateOnly(new Date());
    const selectedIso = toDateOnly(state.selectedDate);

    let html = `<div class="cal-month-grid">`;
    html += weekdays.map((d) => `<div class="cal-weekday">${d}</div>`).join("");

    for (let i = 0; i < lead; i += 1) {
      html += `<div class="cal-day is-out"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(y, m, day);
      const iso = toDateOnly(date);
      const dayEvents = eventMap.get(iso) || [];
      const chips = dayEvents
        .slice(0, 2)
        .map((ev) => {
          const style = typeStyles[ev.type] || typeStyles.other;
          return `<span class="cal-dot" style="background:${style.bg};color:${style.text};">${esc(ev.title)}</span>`;
        })
        .join("");
      const more = dayEvents.length > 2 ? `<span class="cal-dot">+${dayEvents.length - 2} more</span>` : "";

      const classes = ["cal-day"];
      if (iso === todayIso) classes.push("is-today");
      if (iso === selectedIso) classes.push("is-selected");

      html += `<div class="${classes.join(" ")}" data-cal-day="${iso}">
        <div class="cal-day-num">${day}</div>
        ${chips}
        ${more}
      </div>`;
    }

    html += `</div>`;
    viewport.innerHTML = html;
  }

  function renderWeek(events) {
    const viewport = document.getElementById("calViewport");
    const rangeLabel = document.getElementById("calRangeLabel");
    if (!viewport) return;

    const [weekStart, weekEnd] = getWeekRange(state.selectedDate);
    if (rangeLabel) {
      rangeLabel.textContent = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    }

    const eventMap = mapEventsByDate(events);

    let html = `<div class="cal-week-grid">`;
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const iso = toDateOnly(date);
      const dayEvents = eventMap.get(iso) || [];

      const blocks = dayEvents.length
        ? dayEvents
            .map((ev) => {
              const style = typeStyles[ev.type] || typeStyles.other;
              return `<div class="cal-week-item" style="border-left:3px solid ${style.text};">
                <strong>${esc(ev.title)}</strong><br />
                <span>${formatDate(ev.startDate)} - ${formatDate(ev.endDate)}</span>
              </div>`;
            })
            .join("")
        : `<div class="cal-empty" style="padding:0.8rem 0.4rem;">No events</div>`;

      html += `<div class="cal-week-col">
        <div class="cal-week-head">
          <strong>${date.toLocaleDateString(undefined, { weekday: "short" })}</strong>
          <span>${formatDate(date)}</span>
        </div>
        <div class="cal-week-body">${blocks}</div>
      </div>`;
    }
    html += `</div>`;

    viewport.innerHTML = html;
  }

  function renderSideList(events, title) {
    const list = document.getElementById("calEventList");
    const sideTitle = document.getElementById("calSideTitle");
    if (!list) return;
    if (sideTitle) sideTitle.textContent = title;

    const sorted = [...events].sort((a, b) => a.startDate - b.startDate);

    if (!sorted.length) {
      list.innerHTML = `<div class="cal-empty">No events for the current filter.</div>`;
      return;
    }

    list.innerHTML = sorted
      .map((ev) => {
        const style = typeStyles[ev.type] || typeStyles.other;
        return `<div class="cal-event-item">
          <p class="cal-event-title">${esc(ev.title)}</p>
          <span class="cal-tag" style="background:${style.bg};color:${style.text};">${esc(ev.type)}</span>
          <div class="cal-event-meta">
            <span>${formatDate(ev.startDate)} - ${formatDate(ev.endDate)}</span>
            ${ev.institutionName ? `<span>${esc(ev.institutionName)}</span>` : ""}
            ${
              Array.isArray(ev.holidayTypes) && ev.holidayTypes.length
                ? `<span>Official Type: ${esc(ev.holidayTypes.join(", "))}</span>`
                : ""
            }
          </div>
          ${ev.description ? `<div class="cal-event-meta">${esc(ev.description)}</div>` : ""}
          ${
            ev.isOwnedPersonal
              ? `<div class="cal-event-actions">
                  <button type="button" class="cal-btn" data-personal-action="edit" data-event-id="${esc(ev.uid)}">Edit</button>
                  <button type="button" class="cal-btn" data-personal-action="delete" data-event-id="${esc(ev.uid)}">Delete</button>
                </div>`
              : ""
          }
        </div>`;
      })
      .join("");
  }

  async function savePersonalEvent() {
    if (!allowedPersonalRoles.has(state.role)) return;

    const titleEl = document.getElementById("calPersonalTitle");
    const startEl = document.getElementById("calPersonalStart");
    const endEl = document.getElementById("calPersonalEnd");
    const descEl = document.getElementById("calPersonalDesc");

    const title = titleEl?.value?.trim() || "";
    const start = startEl?.value || "";
    const end = endEl?.value || start;
    const desc = descEl?.value?.trim() || "";

    if (!title || !start) {
      showToastSafe("Title and start date are required.", "warning");
      return;
    }

    if (new Date(end) < new Date(start)) {
      showToastSafe("End date cannot be before start date.", "warning");
      return;
    }

    try {
      if (state.editingPersonalEventId) {
        await EventAPI.update(state.editingPersonalEventId, {
          title: `[Personal] ${title}`,
          description: desc || "Personal calendar entry",
          start_date: start,
          end_date: end,
          event_type: "other",
          is_published: 1,
        });
        showToastSafe("Personal event updated.", "success");
      } else {
        await EventAPI.create({
          title: `[Personal] ${title}`,
          description: desc || "Personal calendar entry",
          start_date: start,
          end_date: end,
          event_type: "other",
          institution_id: state.institutionId,
          target_role: "personal",
          is_published: 1,
        });
        showToastSafe("Personal event added.", "success");
      }

      resetPersonalEditor();
      refreshEvents();
    } catch (error) {
      showToastSafe(error?.message || "Failed to add personal event.", "error");
    }
  }

  function startEditPersonalEvent(eventId) {
    if (!eventId) return;
    const event = state.currentViewEvents.find((e) => String(e.uid) === String(eventId));
    if (!event || !event.isOwnedPersonal) return;

    state.editingPersonalEventId = event.uid;

    const titleEl = document.getElementById("calPersonalTitle");
    const startEl = document.getElementById("calPersonalStart");
    const endEl = document.getElementById("calPersonalEnd");
    const descEl = document.getElementById("calPersonalDesc");
    const saveBtn = document.getElementById("calPersonalSaveBtn");
    const cancelBtn = document.getElementById("calPersonalCancelBtn");

    if (titleEl) titleEl.value = stripPersonalPrefix(event.title);
    if (startEl) startEl.value = toDateOnly(event.startDate);
    if (endEl) endEl.value = toDateOnly(event.endDate);
    if (descEl) descEl.value = event.description || "";
    if (saveBtn) saveBtn.textContent = "Update Personal Event";
    if (cancelBtn) cancelBtn.style.display = "inline-flex";
  }

  async function deletePersonalEvent(eventId) {
    if (!eventId) return;
    const event = state.currentViewEvents.find((e) => String(e.uid) === String(eventId));
    if (!event || !event.isOwnedPersonal) return;

    document.getElementById("btn_ok").innerText = "Delete";
    const ok = await showConfirmModal("Delete this personal event?");
    if (!ok) return;

    try {
      await EventAPI.delete(event.uid);
      showToastSafe("Personal event deleted.", "success");
      if (String(state.editingPersonalEventId || "") === String(event.uid)) {
        resetPersonalEditor();
      }
      refreshEvents();
    } catch (error) {
      showToastSafe(error?.message || "Failed to delete personal event.", "error");
    }
  }

  function showConfirmModal(message) {
    const modal = document.getElementById("calConfirmModal");
    const messageEl = document.getElementById("calConfirmMessage");
    if (!modal || !messageEl) {
      return Promise.resolve(window.confirm(message));
    }

    messageEl.textContent = String(message || "Are you sure you want to continue?");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    return new Promise((resolve) => {
      state.confirmResolver = resolve;
    });
  }

  function closeConfirmModal(result) {
    const modal = document.getElementById("calConfirmModal");
    if (modal) {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }

    if (typeof state.confirmResolver === "function") {
      const resolve = state.confirmResolver;
      state.confirmResolver = null;
      resolve(Boolean(result));
    }
  }

  function resetPersonalEditor() {
    state.editingPersonalEventId = null;

    const titleEl = document.getElementById("calPersonalTitle");
    const startEl = document.getElementById("calPersonalStart");
    const endEl = document.getElementById("calPersonalEnd");
    const descEl = document.getElementById("calPersonalDesc");
    const saveBtn = document.getElementById("calPersonalSaveBtn");
    const cancelBtn = document.getElementById("calPersonalCancelBtn");

    if (titleEl) titleEl.value = "";
    if (startEl) startEl.value = "";
    if (endEl) endEl.value = "";
    if (descEl) descEl.value = "";
    if (saveBtn) saveBtn.textContent = "Save Personal Event";
    if (cancelBtn) cancelBtn.style.display = "none";
  }

  function togglePersonalEventBox() {
    const box = document.getElementById("calPersonalBox");
    if (!box) return;
    box.style.display = allowedPersonalRoles.has(state.role) ? "grid" : "none";
  }

  function toggleAdminUploadBox() {
    const box = document.getElementById("calAdminUploadBox");
    if (!box) return;
    box.style.display = allowedCalendarUploadRoles.has(state.role) ? "grid" : "none";
  }

  function openImportModal() {
    state.importRows = [];
    const fi = document.getElementById("calImportFileInput");
    if (fi) fi.value = "";
    hideEl("calImportPreview");
    hideEl("calImportErrors");
    const btn = document.getElementById("calImportConfirmBtn");
    if (btn) btn.disabled = true;
    setElText("calImportConfirmText", "Import");
    hideEl("calImportConfirmSpinner");
    openOverlay("calImportModalOverlay");
  }

  function closeImportModal() {
    closeOverlay("calImportModalOverlay");
  }

  function closeImportResults() {
    closeOverlay("calImportResultsOverlay");
  }

  function handleImportFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      showToastSafe("Please select a CSV file.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      let parsed;
      try {
        parsed = parseCalendarCsv(evt.target?.result || "");
      } catch (error) {
        state.importRows = [];
        const errEl = document.getElementById("calImportErrors");
        if (errEl) {
          errEl.textContent = error?.message || "Invalid CSV file.";
          showEl("calImportErrors");
        }
        hideEl("calImportPreview");
        const btn = document.getElementById("calImportConfirmBtn");
        if (btn) btn.disabled = true;
        return;
      }

      state.importRows = parsed;
      setElText("calImportFileName", file.name);
      setElText("calImportRowCount", `${parsed.length} row${parsed.length !== 1 ? "s" : ""} found`);

      const body = document.getElementById("calImportPreviewBody");
      if (body) {
        body.innerHTML = parsed
          .slice(0, 8)
          .map(
            (row) => `<tr>
              <td>${row.__line || "-"}</td>
              <td>${esc(row.title || "")}</td>
              <td>${esc(row.start_date || "")}${row.end_date ? ` - ${esc(row.end_date)}` : ""}</td>
              <td>${esc(row.event_type || "")}</td>
            </tr>`,
          )
          .join("");
      }

      showEl("calImportPreview");
      hideEl("calImportErrors");
      const btn = document.getElementById("calImportConfirmBtn");
      if (btn) btn.disabled = parsed.length === 0;
    };
    reader.readAsText(file);
  }

  async function confirmImport() {
    if (!allowedCalendarUploadRoles.has(state.role)) {
      showToastSafe("Only admins can upload the school calendar.", "warning");
      return;
    }
    if (!state.institutionId) {
      showToastSafe("Institution is missing for this account.", "error");
      return;
    }
    if (!state.importRows.length) return;

    const btn = document.getElementById("calImportConfirmBtn");
    if (btn) btn.disabled = true;
    showEl("calImportConfirmSpinner");
    setElText("calImportConfirmText", "Importing...");

    const results = [];
    for (let i = 0; i < state.importRows.length; i += 1) {
      const row = state.importRows[i];
      const name = row.title || `Row ${row.__line || i + 2}`;
      try {
        const payload = await buildCalendarUploadPayload(row);
        const res = await EventAPI.create(payload);
        if (res?.success === false) {
          results.push({ row: row.__line || i + 2, name, status: "failed", reason: res?.message || "Unknown error" });
        } else {
          results.push({ row: row.__line || i + 2, name, status: "success", reason: "" });
        }
      } catch (error) {
        results.push({
          row: row.__line || i + 2,
          name,
          status: "failed",
          reason: error?.message || "Request failed",
        });
      }
    }

    hideEl("calImportConfirmSpinner");
    setElText("calImportConfirmText", "Import");
    if (btn) btn.disabled = false;

    const successCount = results.filter((entry) => entry.status === "success").length;
    closeImportModal();
    if (successCount > 0) refreshEvents();
    showImportResults(results);
  }

  function showImportResults(results) {
    const success = results.filter((entry) => entry.status === "success").length;
    const failed = results.filter((entry) => entry.status === "failed").length;

    const summaryEl = document.getElementById("calImportResultsSummary");
    if (summaryEl) {
      summaryEl.innerHTML = [
        `<span style="display:inline-flex;align-items:center;gap:.4rem;background:#dcfce7;color:#166534;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600"><i class="fas fa-check-circle"></i> ${success} Successful</span>`,
        failed
          ? `<span style="display:inline-flex;align-items:center;gap:.4rem;background:#fee2e2;color:#991b1b;border-radius:20px;padding:.3rem .85rem;font-size:.82rem;font-weight:600"><i class="fas fa-times-circle"></i> ${failed} Failed</span>`
          : "",
        `<span style="display:inline-flex;align-items:center;gap:.4rem;background:#f8fafc;color:#64748b;border-radius:20px;padding:.3rem .85rem;font-size:.82rem"><i class="fas fa-list"></i> ${results.length} Total</span>`,
      ].join("");
    }

    const body = document.getElementById("calImportResultsBody");
    if (body) {
      body.innerHTML = results
        .map((entry) => {
          const isOk = entry.status === "success";
          const rowBg = isOk ? "" : "#fff7f7";
          const color = isOk ? "#16a34a" : "#dc2626";
          const icon = isOk ? "fa-check" : "fa-times";
          const label = isOk ? "Created" : "Failed";
          return `<tr style="border-bottom:1px solid #e2e8f0;background:${rowBg}">
            <td style="padding:.45rem .75rem;color:#64748b">${entry.row}</td>
            <td style="padding:.45rem .75rem;font-weight:500">${esc(entry.name)}</td>
            <td style="padding:.45rem .75rem"><span style="display:inline-flex;align-items:center;gap:.3rem;font-size:.75rem;font-weight:600;color:${color}"><i class="fas ${icon}"></i> ${label}</span></td>
            <td style="padding:.45rem .75rem;color:${isOk ? "#64748b" : color};font-size:.78rem">${esc(entry.reason || "-")}</td>
          </tr>`;
        })
        .join("");
    }

    openOverlay("calImportResultsOverlay");
  }

  function parseCalendarCsv(text) {
    const allLines = String(text || "")
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    const lines = allLines.filter((line) => !line.trimStart().startsWith("#"));

    if (!lines.length) return [];

    const headers = parseCsvLine(lines[0]).map((value) => String(value || "").trim().toLowerCase());
    const headerIndex = {};
    headers.forEach((header, idx) => {
      headerIndex[header] = idx;
    });

    const required = ["title", "start_date", "end_date", "event_type"];
    const missing = required.filter((column) => !(column in headerIndex));
    if (missing.length) {
      throw new Error(`Missing required CSV columns: ${missing.join(", ")}`);
    }

    const rows = [];
    for (let i = 1; i < lines.length; i += 1) {
      const cells = parseCsvLine(lines[i]);
      const row = { __line: i + 1 };

      headers.forEach((header, idx) => {
        row[header] = String(cells[idx] || "").trim();
      });

      if (!row.title && !row.start_date && !row.end_date && !row.event_type) {
        continue;
      }

      rows.push(row);
    }

    return rows;
  }

  function parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current);
    return values;
  }

  async function buildCalendarUploadPayload(row) {
    const title = String(row.title || "").trim();
    const startRaw = String(row.start_date || "").trim();
    const endRaw = String(row.end_date || "").trim() || startRaw;
    const startDate = normalizeCsvDate(startRaw);
    const endDate = normalizeCsvDate(endRaw);
    const eventType = normalizeUploadEventType(row.event_type);

    if (!title) {
      throw new Error("title is required");
    }

    if (!startDate || !endDate) {
      throw new Error("start_date and end_date must be valid dates (YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY, or date-time)");
    }

    if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) {
      throw new Error("end_date cannot be before start_date");
    }

    if (!validEventTypes.has(eventType)) {
      throw new Error(`invalid event_type: ${eventType}`);
    }

    const payload = {
      title,
      start_date: startDate,
      end_date: endDate,
      event_type: eventType,
      description: String(row.description || "").trim() || "Uploaded school calendar event",
      institution_id: state.institutionId,
      target_role: String(row.target_role || "all").trim().toLowerCase() || "all",
      is_published: 1,
    };

    const academicYearName = String(row.academic_year || row.academic_year_name || row.year_name || "").trim();
    const academicYearRaw = String(row.academic_year_id || "").trim();
    const lookup = await getAcademicYearLookup();

    if (academicYearName) {
      const key = normalizeAcademicYearName(academicYearName);
      const matchedId = lookup?.byName?.get(key);
      if (!matchedId) {
        throw new Error(`academic_year '${academicYearName}' does not exist`);
      }
      payload.academic_year_id = matchedId;
    } else if (academicYearRaw) {
      const academicYearId = Number(academicYearRaw);
      if (!Number.isInteger(academicYearId) || academicYearId <= 0) {
        throw new Error("academic_year_id must be a positive number or blank");
      }

      if (lookup?.ids && !lookup.ids.has(academicYearId)) {
        throw new Error(`academic_year_id ${academicYearId} does not exist`);
      }

      payload.academic_year_id = academicYearId;
    } else if (lookup?.activeId) {
      payload.academic_year_id = lookup.activeId;
    }

    return payload;
  }

  function normalizeUploadEventType(value) {
    const parsed = String(value || "").trim().toLowerCase();
    if (parsed === "examination") return "exam";
    return parsed;
  }

  function normalizeCsvDate(value) {
    const raw = String(value || "").trim();
    if (!raw) return null;

    // Support ISO datetime values by keeping the date part.
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const yyyy = isoMatch[1];
      const mm = isoMatch[2];
      const dd = isoMatch[3];
      return isValidYmd(yyyy, mm, dd) ? `${yyyy}-${mm}-${dd}` : null;
    }

    // Support yyyy/mm/dd and yyyy.mm.dd.
    const yFirstMatch = raw.match(/^(\d{4})[\/\.](\d{1,2})[\/\.](\d{1,2})$/);
    if (yFirstMatch) {
      const yyyy = yFirstMatch[1];
      const mm = yFirstMatch[2].padStart(2, "0");
      const dd = yFirstMatch[3].padStart(2, "0");
      return isValidYmd(yyyy, mm, dd) ? `${yyyy}-${mm}-${dd}` : null;
    }

    // Support d/m/yyyy, dd/mm/yyyy, m/d/yyyy.
    const dmyMatch = raw.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/);
    if (dmyMatch) {
      const first = Number(dmyMatch[1]);
      const second = Number(dmyMatch[2]);
      const yyyy = dmyMatch[3];

      let day = first;
      let month = second;

      // If obvious US-style month/day, swap.
      if (first <= 12 && second > 12) {
        day = second;
        month = first;
      }

      const mm = String(month).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      return isValidYmd(yyyy, mm, dd) ? `${yyyy}-${mm}-${dd}` : null;
    }

    // Support Excel numeric date serials (days since 1899-12-30).
    if (/^\d{5}(\.\d+)?$/.test(raw)) {
      const serial = Number(raw);
      if (Number.isFinite(serial)) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(excelEpoch.getTime() + Math.floor(serial) * 86400000);
        const yyyy = String(date.getUTCFullYear());
        const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(date.getUTCDate()).padStart(2, "0");
        return isValidYmd(yyyy, mm, dd) ? `${yyyy}-${mm}-${dd}` : null;
      }
    }

    return null;
  }

  function isValidYmd(yyyy, mm, dd) {
    if (!/^\d{4}$/.test(String(yyyy))) return false;
    if (!/^\d{2}$/.test(String(mm))) return false;
    if (!/^\d{2}$/.test(String(dd))) return false;

    const y = Number(yyyy);
    const m = Number(mm);
    const d = Number(dd);
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;

    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() + 1 === m && date.getUTCDate() === d;
  }

  async function getAcademicYearLookup() {
    if (state.validAcademicYearIds instanceof Set && state.academicYearNameMap instanceof Map) {
      return {
        ids: state.validAcademicYearIds,
        byName: state.academicYearNameMap,
        activeId: state.activeAcademicYearId,
      };
    }

    if (typeof API === "undefined" || !API.get) {
      return null;
    }

    try {
      const query = state.institutionId
        ? `/api/academic-years?page=1&limit=500&institution_id=${encodeURIComponent(state.institutionId)}`
        : "/api/academic-years?page=1&limit=500";
      const response = await API.get(query);
      const rows = response?.data?.data || response?.data?.academic_years || response?.data || [];
      if (!Array.isArray(rows)) {
        return null;
      }

      const ids = new Set(
        rows
          .map((row) => Number(row?.academic_year_id || row?.id || 0))
          .filter((id) => Number.isInteger(id) && id > 0),
      );

      const byName = new Map();
      let activeId = null;
      rows.forEach((row) => {
        const id = Number(row?.academic_year_id || row?.id || 0);
        if (!Number.isInteger(id) || id <= 0) return;

        const yearName = String(row?.year_name || row?.name || "").trim();
        if (yearName) {
          byName.set(normalizeAcademicYearName(yearName), id);
        }

        const isCurrent = Number(row?.is_current || 0) === 1 || row?.is_current === true;
        if (isCurrent && !activeId) {
          activeId = id;
        }
      });

      state.validAcademicYearIds = ids;
      state.academicYearNameMap = byName;
      state.activeAcademicYearId = activeId;
      return { ids, byName, activeId };
    } catch (error) {
      return null;
    }
  }

  function normalizeAcademicYearName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
  }

  function downloadCalendarTemplate() {
    const csv = [
      "# Required: title,start_date,end_date,event_type",
      "# Optional: description,target_role,academic_year (uses academic_years.year_name)",
      "# If academic_year is blank, current active academic year is used automatically",
      "title,start_date,end_date,event_type,description,target_role,academic_year",
      'Mid-Term Exams,2026-05-12,2026-05-16,exam,"Mid-term assessment week",all,2024-2025',
      'Founders Day Celebration,2026-08-04,2026-08-04,school,"Assembly and activities",all,',
    ].join("\n");

    downloadText(csv, "school-calendar-template.csv", "text/csv;charset=utf-8;");
  }

  function exportCsv() {
    if (!state.currentViewEvents.length) {
      showToastSafe("No events to export.", "warning");
      return;
    }

    const rows = [
      ["Title", "Type", "Start Date", "End Date", "Institution", "Description"],
      ...state.currentViewEvents.map((ev) => [
        escapeCsv(ev.title),
        escapeCsv(ev.type),
        toDateOnly(ev.startDate),
        toDateOnly(ev.endDate),
        escapeCsv(ev.institutionName || ""),
        escapeCsv(ev.description || ""),
      ]),
    ];

    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadText(csv, `school-calendar-${toDateOnly(new Date())}.csv`, "text/csv;charset=utf-8;");
  }

  function exportIcs() {
    if (!state.currentViewEvents.length) {
      showToastSafe("No events to sync.", "warning");
      return;
    }

    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Ghana SHS LMS//School Calendar//EN"];

    state.currentViewEvents.forEach((ev) => {
      const start = toIcsDate(ev.startDate);
      const end = toIcsDate(addDays(ev.endDate, 1));
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${ev.uid}@ghana-shs-lms`);
      lines.push(`DTSTAMP:${toIcsDate(new Date())}`);
      lines.push(`DTSTART;VALUE=DATE:${start.substring(0, 8)}`);
      lines.push(`DTEND;VALUE=DATE:${end.substring(0, 8)}`);
      lines.push(`SUMMARY:${escapeIcs(ev.title)}`);
      if (ev.description) lines.push(`DESCRIPTION:${escapeIcs(ev.description)}`);
      lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");
    downloadText(lines.join("\r\n"), `school-calendar-${toDateOnly(new Date())}.ics`, "text/calendar;charset=utf-8;");
  }

  function extractEvents(response) {
    if (!response) return [];
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.events)) return response.data.events;
    if (Array.isArray(response?.events)) return response.events;
    if (Array.isArray(response)) return response;
    return [];
  }

  function normalizeEvents(rows) {
    return (rows || [])
      .map((row) => {
        const start = parseDateOnly(row.start_date || row.startDate);
        const end = parseDateOnly(row.end_date || row.endDate || row.start_date || row.startDate);
        if (!start || !end) return null;
        const rawType = String(row.event_type || row.type || "other").toLowerCase();
        const normalizedType = rawType === "examination" ? "exam" : rawType;
        return {
          uid: row.event_uuid || row.uuid || row.event_id || row.id || `${row.title || "event"}-${toDateOnly(start)}`,
          title: row.title || row.name || "Untitled Event",
          type: normalizedType,
          startDate: start,
          endDate: end,
          description: row.description || "",
          institutionName: row.institution_name || row.institutionName || "",
          holidayTypes: normalizeHolidayTypes(row.holiday_types || row.holidayTypes || row.types),
          createdBy: Number(row.created_by || row.createdBy || 0) || null,
          targetRole: String(row.target_role || row.targetRole || "").toLowerCase(),
          isOwnedPersonal: isOwnedPersonalEvent(row, state.userId),
        };
      })
      .filter(Boolean);
  }

  function isOwnedPersonalEvent(row, currentUserId) {
    const createdBy = Number(row.created_by || row.createdBy || 0) || null;
    const title = String(row.title || "");
    const targetRole = String(row.target_role || row.targetRole || "").toLowerCase();

    const looksPersonal = targetRole === "personal" || title.startsWith("[Personal]");
    if (!looksPersonal || !currentUserId) return false;
    return createdBy === Number(currentUserId);
  }

  async function getNationalHolidayEventsForRange(rangeStart, rangeEnd) {
    const startYear = new Date(rangeStart).getFullYear();
    const endYear = new Date(rangeEnd).getFullYear();
    const events = [];

    for (let year = startYear; year <= endYear; year += 1) {
      const yearEvents = await getNationalHolidayEventsByYear(year);
      events.push(...yearEvents);
    }

    return events.filter((event) => overlapsRange(event, rangeStart, rangeEnd));
  }

  async function getNationalHolidayEventsByYear(year) {
    if (state.nationalHolidayCache.has(year)) {
      return state.nationalHolidayCache.get(year);
    }

    const endpoint = `https://date.nager.at/api/v3/PublicHolidays/${year}/GH`;
    try {
      const response = await fetch(endpoint, { method: "GET" });
      if (!response.ok) {
        throw new Error(`Holiday API returned ${response.status}`);
      }

      const rows = await response.json();
      const events = (Array.isArray(rows) ? rows : [])
        .map((row) => {
          const holidayDate = parseDateOnly(row?.date);
          if (!holidayDate) return null;

          const holidayName = row.localName || row.name || "Public Holiday";
          return {
            uid: `national-${year}-${String(row.date || "").toLowerCase()}-${String(holidayName)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")}`,
            title: `National Holiday: ${holidayName}`,
            type: "holiday",
            startDate: holidayDate,
            endDate: holidayDate,
            description: "National holiday in Ghana",
            institutionName: "Ghana",
            holidayTypes: normalizeHolidayTypes(row?.types),
            createdBy: null,
            targetRole: "all",
            isOwnedPersonal: false,
          };
        })
        .filter(Boolean);

      state.nationalHolidayCache.set(year, events);
      return events;
    } catch (error) {
      if (!state.nationalHolidayApiWarned) {
        state.nationalHolidayApiWarned = true;
        showToastSafe("Could not fetch national holidays right now.", "warning");
      }
      state.nationalHolidayCache.set(year, []);
      return [];
    }
  }

  function stripPersonalPrefix(title) {
    return String(title || "").replace(/^\[Personal\]\s*/i, "").trim();
  }

  function normalizeHolidayTypes(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());
  }

  function filterEvents(events, type) {
    if (!type || type === "all") return [...events];
    return events.filter((ev) => ev.type === type);
  }

  function dedupeEvents(events) {
    const map = new Map();
    events.forEach((ev) => {
      if (!map.has(ev.uid)) map.set(ev.uid, ev);
    });
    return Array.from(map.values());
  }

  function mapEventsByDate(events) {
    const map = new Map();
    events.forEach((ev) => {
      const cursor = new Date(ev.startDate);
      const end = new Date(ev.endDate);
      while (cursor <= end) {
        const key = toDateOnly(cursor);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(ev);
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return map;
  }

  function getWeekRange(date) {
    const d = new Date(date);
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + mondayOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return [normalizeDate(start), normalizeDate(end)];
  }

  function overlapsRange(event, start, end) {
    const s = normalizeDate(event.startDate);
    const e = normalizeDate(event.endDate);
    const rs = normalizeDate(start);
    const re = normalizeDate(end);
    return s <= re && e >= rs;
  }

  function parseDateOnly(input) {
    if (!input) return null;
    const str = String(input);
    const datePart = str.length >= 10 ? str.slice(0, 10) : str;
    const parsed = new Date(`${datePart}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function normalizeDate(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function toDateOnly(date) {
    const d = normalizeDate(new Date(date));
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDate(dateLike) {
    const d = new Date(dateLike);
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function toIcsDate(dateLike) {
    const d = new Date(dateLike);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
  }

  function addDays(dateLike, days) {
    const d = normalizeDate(new Date(dateLike));
    d.setDate(d.getDate() + days);
    return d;
  }

  function escapeCsv(value) {
    const str = String(value ?? "").replace(/"/g, '""');
    return `"${str}"`;
  }

  function escapeIcs(value) {
    return String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  }

  function downloadText(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function esc(value) {
    if (typeof escapeHtml === "function") return escapeHtml(String(value));
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function showToastSafe(message, type) {
    if (typeof showToast === "function") {
      showToast(message, type || "info");
      return;
    }
    console[type === "error" ? "error" : "log"](message);
  }

  function showEl(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "";
  }

  function hideEl(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  }

  function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function openOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("open");
  }

  function closeOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("open");
  }
})();

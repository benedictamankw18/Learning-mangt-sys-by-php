(function () {
  const state = {
    initialized: false,
    quizId: null,
    quiz: null,
    questions: [],
    dragFromId: null,
    els: {}
  };

  function parseQuizId() {
    const hash = window.location.hash || "";
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) {
      return null;
    }

    const params = new URLSearchParams(hash.slice(queryIndex + 1));
    const rawId = params.get("id");
    const parsed = Number.parseInt(rawId, 10);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  function cacheElements() {
    state.els.root = document.getElementById("teacherQuizQuestionsRoot");
    if (!state.els.root) {
      return false;
    }

    state.els.subtitle = document.getElementById("quizQuestionsSubtitle");
    state.els.notice = document.getElementById("quizQuestionsNotice");
    state.els.backBtn = document.getElementById("quizQuestionsBackBtn");
    state.els.previewBtn = document.getElementById("quizQuestionsPreviewBtn");
    state.els.publishBtn = document.getElementById("quizQuestionsPublishBtn");
    state.els.resultsBtn = document.getElementById("quizQuestionsResultsBtn");
    state.els.exportBtn = document.getElementById("quizQuestionsExportBtn");

    state.els.form = document.getElementById("quizQuestionForm");
    state.els.submitBtn = document.getElementById("questionSubmitBtn");
    state.els.resetBtn = document.getElementById("questionResetBtn");
    state.els.questionId = document.getElementById("questionId");
    state.els.questionText = document.getElementById("questionText");
    state.els.questionType = document.getElementById("questionType");
    state.els.questionPoints = document.getElementById("questionPoints");
    state.els.questionDifficulty = document.getElementById("questionDifficulty");
    state.els.questionImage = document.getElementById("questionImage");
    state.els.questionImageCurrent = document.getElementById("questionImageCurrent");
    state.els.questionOptionA = document.getElementById("questionOptionA");
    state.els.questionOptionB = document.getElementById("questionOptionB");
    state.els.questionOptionC = document.getElementById("questionOptionC");
    state.els.questionOptionD = document.getElementById("questionOptionD");
    state.els.questionCorrectOption = document.getElementById("questionCorrectOption");
    state.els.questionCorrectAnswer = document.getElementById("questionCorrectAnswer");
    state.els.questionCorrectAnswerField = document.getElementById("questionCorrectAnswerField");
    state.els.questionExplanation = document.getElementById("questionExplanation");
    state.els.questionOptionsBlock = document.getElementById("questionOptionsBlock");
    state.els.questionTrueFalseBlock = document.getElementById("questionTrueFalseBlock");
    state.els.questionTrueValue = document.getElementById("questionTrueValue");
    state.els.questionFalseValue = document.getElementById("questionFalseValue");

    state.els.questionListBody = document.getElementById("questionListBody");
    state.els.questionDetails = document.getElementById("questionDetails");

    return true;
  }

  function setNotice(message, type) {
    if (!state.els.notice) {
      return;
    }

    if (!message) {
      state.els.notice.className = "tqq-note";
      state.els.notice.textContent = "";
      return;
    }

    state.els.notice.textContent = message;
    state.els.notice.className = "tqq-note show " + (type === "error" ? "error" : "success");
  }

  function updateSubtitle() {
    if (!state.els.subtitle) {
      return;
    }

    if (!state.quiz) {
      state.els.subtitle.textContent = "Loading quiz...";
      return;
    }

    const status = String(state.quiz.status || "draft").toLowerCase() === "active" ? "Published" : "Draft";
    state.els.subtitle.textContent = state.quiz.title + " | " + status + " | " + state.questions.length + " question(s)";
  }

  function getTypeLabel(type) {
    const map = {
      multiple_choice: "Multiple Choice",
      true_false: "True/False",
      short_answer: "Short Answer",
      essay: "Essay"
    };

    return map[type] || type || "Unknown";
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value == null ? "" : value);
    return div.innerHTML;
  }

  function toAccessibleImageUrl(rawPath) {
    const value = String(rawPath || "").trim();
    if (!value) {
      return "";
    }

    if (/^https?:\/\//i.test(value) || value.startsWith("/api/upload/")) {
      return value;
    }

    if (value.startsWith("/uploads/")) {
      const parts = value.split("/").filter(Boolean);
      if (parts.length >= 3) {
        const category = parts[1];
        const filename = parts.slice(2).join("/");
        return "/api/upload/" + category + "/" + filename;
      }
    }
      // Legacy values may store only the raw filename in DB.
      if (!value.includes("/")) {
        return "/api/upload/quiz-questions/" + value;
      }

    return value;
  }

  function isMultipleChoice(type) {
    return type === "multiple_choice";
  }

  function updateFormByType() {
    const type = state.els.questionType.value;
    const showMc = isMultipleChoice(type);
    const showTf = type === "true_false";

    state.els.questionOptionsBlock.style.display = showMc ? "grid" : "none";
    state.els.questionTrueFalseBlock.style.display = showTf ? "grid" : "none";
    state.els.questionCorrectAnswerField.style.display = (!showMc && !showTf) ? "grid" : "none";
  }

  function normalizeQuestions(rawQuestions) {
    let rows = [];

    if (Array.isArray(rawQuestions)) {
      rows = rawQuestions;
    } else if (rawQuestions && Array.isArray(rawQuestions.questions)) {
      rows = rawQuestions.questions;
    } else if (rawQuestions && rawQuestions.data && Array.isArray(rawQuestions.data)) {
      rows = rawQuestions.data;
    } else if (rawQuestions && rawQuestions.data && Array.isArray(rawQuestions.data.questions)) {
      rows = rawQuestions.data.questions;
    }

    return rows
      .slice()
      .sort((a, b) => {
        const oa = Number.parseInt(a.order_index || a.question_order || 0, 10);
        const ob = Number.parseInt(b.order_index || b.question_order || 0, 10);
        return oa - ob;
      })
      .map((q, index) => {
        const options = Array.isArray(q.options) ? q.options : [];
        return {
          id: q.id || q.question_id,
          question_text: q.question_text || "",
          image_question: q.image_question || q.image_name || "",
          question_type: q.question_type || "multiple_choice",
          points: Number.parseInt(q.points || 1, 10),
          difficulty: q.difficulty || q.difficulty_level || "medium",
          explanation: q.explanation || "",
          correct_answer: q.correct_answer || "",
          order_index: Number.parseInt(q.order_index || q.question_order || (index + 1), 10),
          options: options.map((opt) => ({
            id: opt.id,
            option_text: opt.option_text || "",
            option_order: String(opt.option_order || opt.option_label || "")
          }))
        };
      });
  }

  function renderQuestionDetails(questionId) {
    const q = state.questions.find((item) => String(item.id) === String(questionId));
    if (!q) {
      state.els.questionDetails.className = "tqq-details";
      state.els.questionDetails.innerHTML = "";
      return;
    }

    let optionsHtml = "";
    if (Array.isArray(q.options) && q.options.length > 0) {
      optionsHtml = "<div><strong>Options</strong><ul>" + q.options.map((opt) => {
        return "<li>" + escapeHtml(opt.option_order + ": " + opt.option_text) + "</li>";
      }).join("") + "</ul></div>";
    }

    const imageValue = toAccessibleImageUrl(q.image_question || "");
    const imageHtml = imageValue
      ? ('<p><strong>Image:</strong> <a href="' + escapeHtml(imageValue) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(imageValue) + '</a></p>')
      : "<p><strong>Image:</strong> -</p>";

    const detailsHtml = [
      "<h4>Question Details</h4>",
      "<p><strong>Text:</strong> " + escapeHtml(q.question_text) + "</p>",
      imageHtml,
      "<p><strong>Type:</strong> " + escapeHtml(getTypeLabel(q.question_type)) + "</p>",
      "<p><strong>Points:</strong> " + escapeHtml(q.points) + "</p>",
      "<p><strong>Difficulty:</strong> " + escapeHtml(q.difficulty) + "</p>",
      "<p><strong>Correct Answer:</strong> " + escapeHtml(q.correct_answer || "-") + "</p>",
      optionsHtml,
      q.explanation ? ("<p><strong>Explanation:</strong> " + escapeHtml(q.explanation) + "</p>") : ""
    ].join("");

    state.els.questionDetails.innerHTML = detailsHtml;
    state.els.questionDetails.className = "tqq-details show";
  }

  function renderQuestionList() {
    if (!state.els.questionListBody) {
      return;
    }

    if (!state.questions.length) {
      state.els.questionListBody.innerHTML = "<div class=\"tqq-empty\">No questions yet. Add your first question.</div>";
      updateSubtitle();
      return;
    }

    state.els.questionListBody.innerHTML = state.questions.map((q, index) => {
      const preview = q.question_text.length > 95
        ? q.question_text.slice(0, 95) + "..."
        : q.question_text;

      return [
        "<div class=\"tqq-row\" draggable=\"true\" data-id=\"" + q.id + "\">",
        "<div>" + (index + 1) + "</div>",
        "<div class=\"tqq-title\"><strong>" + escapeHtml(preview) + "</strong><span>Drag row to reorder</span></div>",
        "<div>" + escapeHtml(getTypeLabel(q.question_type)) + "</div>",
        "<div>" + escapeHtml(q.points) + "</div>",
        "<div class=\"tqq-actions\">",
        "<button class=\"tqq-icon\" data-action=\"view\" data-id=\"" + q.id + "\" title=\"View\"><i class=\"fas fa-eye\"></i></button>",
        "<button class=\"tqq-icon\" data-action=\"edit\" data-id=\"" + q.id + "\" title=\"Edit\"><i class=\"fas fa-pen\"></i></button>",
        "<button class=\"tqq-icon danger\" data-action=\"delete\" data-id=\"" + q.id + "\" title=\"Delete\"><i class=\"fas fa-trash\"></i></button>",
        "</div>",
        "</div>"
      ].join("");
    }).join("");

    updateSubtitle();
  }

  function fillFormForEdit(questionId) {
    const q = state.questions.find((item) => String(item.id) === String(questionId));
    if (!q) {
      return;
    }

    state.els.questionId.value = q.id;
    state.els.questionText.value = q.question_text || "";
    state.els.questionType.value = q.question_type || "multiple_choice";
    state.els.questionPoints.value = q.points || 1;
    state.els.questionDifficulty.value = q.difficulty || "medium";
    state.els.questionExplanation.value = q.explanation || "";
    state.els.questionCorrectAnswer.value = "";
    state.els.questionCorrectOption.value = "";
    if (state.els.questionImage) {
      state.els.questionImage.value = "";
    }

    if (state.els.questionImageCurrent) {
      if (q.image_question) {
        const displayImage = toAccessibleImageUrl(q.image_question);
        state.els.questionImageCurrent.textContent = "Current image: " + displayImage;
        state.els.questionImageCurrent.style.display = "block";
      } else {
        state.els.questionImageCurrent.textContent = "";
        state.els.questionImageCurrent.style.display = "none";
      }
    }

    if (state.els.questionTrueValue) {
      state.els.questionTrueValue.checked = false;
    }
    if (state.els.questionFalseValue) {
      state.els.questionFalseValue.checked = false;
    }

    const byOrder = {};
    (q.options || []).forEach((opt) => {
      byOrder[String(opt.option_order || "").toUpperCase()] = opt.option_text || "";
    });

    state.els.questionOptionA.value = byOrder.A || "";
    state.els.questionOptionB.value = byOrder.B || "";
    state.els.questionOptionC.value = byOrder.C || "";
    state.els.questionOptionD.value = byOrder.D || "";

    if (isMultipleChoice(q.question_type)) {
      state.els.questionCorrectOption.value = (q.correct_answer || "").toUpperCase();
    } else if (q.question_type === "true_false") {
      const answer = String(q.correct_answer || "").toLowerCase();
      if (answer === "true" && state.els.questionTrueValue) {
        state.els.questionTrueValue.checked = true;
      }
      if (answer === "false" && state.els.questionFalseValue) {
        state.els.questionFalseValue.checked = true;
      }
    } else {
      state.els.questionCorrectAnswer.value = q.correct_answer || "";
    }

    updateFormByType();
    state.els.submitBtn.textContent = "Update Question";
    state.els.questionText.focus();
  }

  function resetForm() {
    state.els.form.reset();
    state.els.questionId.value = "";
    state.els.questionType.value = "multiple_choice";
    state.els.questionPoints.value = 1;
    state.els.questionDifficulty.value = "medium";
    state.els.submitBtn.textContent = "Add Question";
    if (state.els.questionImageCurrent) {
      state.els.questionImageCurrent.textContent = "";
      state.els.questionImageCurrent.style.display = "none";
    }
    updateFormByType();
  }

  async function loadQuiz() {
    const response = await QuizAPI.getById(state.quizId);
    if (!response || !response.success) {
      throw new Error(response && response.message ? response.message : "Failed to load quiz");
    }

    state.quiz = response.data;
    updateSubtitle();
    syncPublishButton();
  }

  async function loadQuestions() {
    state.els.questionListBody.innerHTML = "<div class=\"tqq-loading\">Loading questions...</div>";

    const response = await QuizAPI.getQuestions(state.quizId);
    if (!response || !response.success) {
      throw new Error(response && response.message ? response.message : "Failed to load questions");
    }

    state.questions = normalizeQuestions(response.data || []);
    renderQuestionList();
  }

  function collectPayloadFromForm() {
    const type = state.els.questionType.value;
    const isMc = isMultipleChoice(type);

    const basePayload = {
      question_text: state.els.questionText.value.trim(),
      question_type: type,
      points: Number.parseInt(state.els.questionPoints.value, 10) || 1,
      difficulty: state.els.questionDifficulty.value,
      explanation: state.els.questionExplanation.value.trim() || null
    };

    if (!basePayload.question_text) {
      throw new Error("Question text is required.");
    }

    if (isMc) {
      const options = [
        { option_order: "A", option_text: state.els.questionOptionA.value.trim() },
        { option_order: "B", option_text: state.els.questionOptionB.value.trim() },
        { option_order: "C", option_text: state.els.questionOptionC.value.trim() },
        { option_order: "D", option_text: state.els.questionOptionD.value.trim() }
      ].filter((opt) => opt.option_text.length > 0);

      if (options.length < 2) {
        throw new Error("Multiple choice questions require at least two options.");
      }

      const correctOption = (state.els.questionCorrectOption.value || "").toUpperCase();
      if (!correctOption) {
        throw new Error("Please select the correct option.");
      }

      const hasCorrectOption = options.some((opt) => opt.option_order === correctOption);
      if (!hasCorrectOption) {
        throw new Error("Correct option must match an entered option.");
      }

      basePayload.correct_answer = correctOption;
      basePayload.options = options.map((opt) => ({
        label: opt.option_order,
        text: opt.option_text,
        is_correct: opt.option_order === correctOption ? 1 : 0
      }));
    } else if (type === "true_false") {
      const selectedTrueFalse = state.els.questionTrueValue && state.els.questionTrueValue.checked
        ? "true"
        : (state.els.questionFalseValue && state.els.questionFalseValue.checked ? "false" : "");

      if (!selectedTrueFalse) {
        throw new Error("Please select True or False.");
      }

      basePayload.correct_answer = selectedTrueFalse;
      basePayload.options = [];
    } else {
      const answer = state.els.questionCorrectAnswer.value.trim();
      if (!answer) {
        throw new Error("Correct answer is required for this question type.");
      }

      basePayload.correct_answer = answer;
      basePayload.options = [];
    }

    return basePayload;
  }

  async function uploadQuestionImage() {
    if (!state.els.questionImage || !state.els.questionImage.files || !state.els.questionImage.files[0]) {
      return null;
    }

    const file = state.els.questionImage.files[0];
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Question image must be under 5 MB.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", "quiz-questions");

    const uploadResponse = await FileAPI.upload(formData);
    const uploadData = uploadResponse && uploadResponse.data ? uploadResponse.data : uploadResponse;
    const uploadedUrl = uploadData && (uploadData.api_url || uploadData.url)
      ? String(uploadData.api_url || uploadData.url)
      : "";

    if (!uploadedUrl) {
      throw new Error("Image uploaded but URL was not returned.");
    }

    return uploadedUrl;
  }

  async function submitQuestion(event) {
    event.preventDefault();

    try {
      setNotice("");
      const payload = collectPayloadFromForm();
      const questionId = state.els.questionId.value;

      const uploadedImageUrl = await uploadQuestionImage();
      if (uploadedImageUrl) {
        payload.image_question = uploadedImageUrl;
        payload.image_name = uploadedImageUrl;
        } else if (questionId) {
          const existingQuestion = state.questions.find((item) => String(item.id) === String(questionId));
          if (existingQuestion && existingQuestion.image_question) {
            const normalizedExistingImage = toAccessibleImageUrl(existingQuestion.image_question);
            payload.image_question = normalizedExistingImage;
            payload.image_name = normalizedExistingImage;
          }
      }

      let response;
      if (questionId) {
        response = await QuizAPI.updateQuestion(questionId, payload);
      } else {
        response = await QuizAPI.addQuestion(state.quizId, payload);
      }

      if (!response || !response.success) {
        throw new Error(response && response.message ? response.message : "Failed to save question");
      }

      resetForm();
      await loadQuestions();
      setNotice(questionId ? "Question updated." : "Question added.", "success");
    } catch (error) {
      setNotice(error.message || "Could not save question.", "error");
    }
  }

  async function deleteQuestion(questionId) {
    if (!window.confirm("Delete this question?")) {
      return;
    }

    try {
      setNotice("");
      const response = await QuizAPI.deleteQuestion(questionId);
      if (!response || !response.success) {
        throw new Error(response && response.message ? response.message : "Delete failed");
      }

      if (state.els.questionId.value && String(state.els.questionId.value) === String(questionId)) {
        resetForm();
      }

      await loadQuestions();
      state.els.questionDetails.className = "tqq-details";
      state.els.questionDetails.innerHTML = "";
      setNotice("Question deleted.", "success");
    } catch (error) {
      setNotice(error.message || "Could not delete question.", "error");
    }
  }

  async function persistOrder() {
    for (let i = 0; i < state.questions.length; i += 1) {
      const q = state.questions[i];
      const orderIndex = i + 1;
      if (Number.parseInt(q.order_index, 10) === orderIndex) {
        continue;
      }

      const response = await QuizAPI.updateQuestion(q.id, { order_index: orderIndex });
      if (!response || !response.success) {
        throw new Error(response && response.message ? response.message : "Failed to reorder questions");
      }
    }

    state.questions = state.questions.map((q, index) => ({ ...q, order_index: index + 1 }));
  }

  async function onDropQuestion(toId) {
    const fromId = state.dragFromId;
    state.dragFromId = null;

    if (!fromId || !toId || String(fromId) === String(toId)) {
      return;
    }

    const fromIndex = state.questions.findIndex((item) => String(item.id) === String(fromId));
    const toIndex = state.questions.findIndex((item) => String(item.id) === String(toId));
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const updated = state.questions.slice();
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    state.questions = updated;
    renderQuestionList();

    try {
      await persistOrder();
      setNotice("Question order updated.", "success");
    } catch (error) {
      setNotice(error.message || "Reorder failed.", "error");
      await loadQuestions();
    }
  }

  function syncPublishButton() {
    if (!state.quiz || !state.els.publishBtn) {
      return;
    }

    const isPublished = String(state.quiz.status || "draft").toLowerCase() === "active";
    state.els.publishBtn.innerHTML = isPublished
      ? '<i class="fas fa-eye-slash"></i> Unpublish'
      : '<i class="fas fa-paper-plane"></i> Publish';
  }

  async function togglePublish() {
    if (!state.quiz) {
      return;
    }

    const isPublished = String(state.quiz.status || "draft").toLowerCase() === "active";
    const payload = {
      status: isPublished ? "draft" : "active",
      is_activated: isPublished ? 0 : 1
    };

    try {
      setNotice("");
      const response = await QuizAPI.update(state.quizId, payload);
      if (!response || !response.success) {
        throw new Error(response && response.message ? response.message : "Publish update failed");
      }

      state.quiz.status = payload.status;
      state.quiz.is_activated = payload.is_activated;
      syncPublishButton();
      updateSubtitle();
      setNotice(!isPublished ? "Quiz published." : "Quiz moved to draft.", "success");
    } catch (error) {
      setNotice(error.message || "Could not update publish status.", "error");
    }
  }

  function exportResultsCsv(rows) {
    const headers = ["Submission ID", "Student Name", "Student Number", "Score", "Total Points", "Percentage", "Submitted At"];

    const data = rows.map((item) => [
      item.submission_id || "",
      item.student_name || "",
      item.student_number || item.student_id_number || "",
      item.score || 0,
      item.total_points || 0,
      item.percentage || 0,
      item.submitted_at || ""
    ]);

    const toCsvCell = (value) => {
      const str = String(value == null ? "" : value);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    const lines = [headers].concat(data).map((row) => row.map(toCsvCell).join(","));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeTitle = (state.quiz && state.quiz.title ? state.quiz.title : "quiz").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();

    link.href = url;
    link.download = safeTitle + "-results.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function exportResults() {
    try {
      setNotice("");
      const response = await QuizAPI.getResults(state.quizId);
      if (!response || !response.success) {
        throw new Error(response && response.message ? response.message : "Failed to fetch results");
      }

      const submissions = (response.data && response.data.submissions) || [];
      if (!submissions.length) {
        throw new Error("No results available to export.");
      }

      exportResultsCsv(submissions);
      setNotice("Results exported.", "success");
    } catch (error) {
      setNotice(error.message || "Export failed.", "error");
    }
  }

  function onQuestionListClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const questionId = button.dataset.id;

    if (action === "view") {
      renderQuestionDetails(questionId);
      return;
    }

    if (action === "edit") {
      fillFormForEdit(questionId);
      return;
    }

    if (action === "delete") {
      deleteQuestion(questionId);
    }
  }

  function onDragStart(event) {
    const row = event.target.closest(".tqq-row");
    if (!row) {
      return;
    }

    state.dragFromId = row.dataset.id;
    row.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(event) {
    const row = event.target.closest(".tqq-row");
    if (!row) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function onDrop(event) {
    const row = event.target.closest(".tqq-row");
    if (!row) {
      return;
    }

    event.preventDefault();
    onDropQuestion(row.dataset.id);
  }

  function onDragEnd(event) {
    const row = event.target.closest(".tqq-row");
    if (row) {
      row.classList.remove("dragging");
    }
  }

  function bindEvents() {
    if (!state.els.root) {
      return;
    }

    state.els.form.addEventListener("submit", submitQuestion);
    state.els.resetBtn.addEventListener("click", resetForm);
    state.els.questionType.addEventListener("change", updateFormByType);
    state.els.backBtn.addEventListener("click", () => {
      window.location.hash = "#quizzes";
    });

    state.els.previewBtn.addEventListener("click", () => {
      window.location.hash = "#quiz-details?id=" + state.quizId;
    });

    state.els.resultsBtn.addEventListener("click", () => {
      window.location.hash = "#quiz-details?id=" + state.quizId;
    });

    state.els.publishBtn.addEventListener("click", togglePublish);
    state.els.exportBtn.addEventListener("click", exportResults);

    state.els.questionListBody.addEventListener("click", onQuestionListClick);
    state.els.questionListBody.addEventListener("dragstart", onDragStart);
    state.els.questionListBody.addEventListener("dragover", onDragOver);
    state.els.questionListBody.addEventListener("drop", onDrop);
    state.els.questionListBody.addEventListener("dragend", onDragEnd);
  }

  async function initQuizQuestionsPage() {
    if (!cacheElements()) {
      return;
    }

    state.quizId = parseQuizId();
    if (!state.quizId) {
      setNotice("Missing quiz ID. Open this page from the quizzes list.", "error");
      if (state.els.questionListBody) {
        state.els.questionListBody.innerHTML = "<div class=\"tqq-empty\">Missing quiz ID.</div>";
      }
      return;
    }

    if (!state.initialized) {
      bindEvents();
      state.initialized = true;
    }

    resetForm();
    state.els.questionDetails.className = "tqq-details";
    state.els.questionDetails.innerHTML = "";

    try {
      await loadQuiz();
      await loadQuestions();
      setNotice("");
    } catch (error) {
      setNotice(error.message || "Unable to load quiz questions page.", "error");
      state.els.questionListBody.innerHTML = "<div class=\"tqq-empty\">Failed to load data.</div>";
    }
  }

  document.addEventListener("page:loaded", function (event) {
    if (!event || !event.detail || event.detail.page !== "quiz-questions") {
      return;
    }

    initQuizQuestionsPage();
  });
})();

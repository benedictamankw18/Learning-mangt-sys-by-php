(function () {
    'use strict';

    const state = {
        quizId: 0,
        quiz: null,
        questions: [],
        summary: null,
        submissions: []
    };

    let elements = {};

    function hasPageRoot() {
        return !!document.getElementById('teacherQuizDetailsRoot');
    }

    function cacheElements() {
        elements = {
            root: document.getElementById('teacherQuizDetailsRoot'),
            subtitle: document.getElementById('quizDetailsSubtitle'),
            notice: document.getElementById('quizDetailsNotice'),
            backBtn: document.getElementById('quizDetailsBackBtn'),
            infoGrid: document.getElementById('quizInfoGrid'),
            stats: document.getElementById('quizStats'),
            questionsBody: document.getElementById('quizQuestionsBody'),
            resultsBody: document.getElementById('quizResultsBody'),
            previewBtn: document.getElementById('quizPreviewBtn'),
            publishToggleBtn: document.getElementById('quizPublishToggleBtn'),
            exportQuestionsPdfBtn: document.getElementById('quizExportQuestionsPdfBtn'),
            exportResultsPdfBtn: document.getElementById('quizExportResultsPdfBtn'),
            exportResultsCsvBtn: document.getElementById('quizExportResultsCsvBtn'),
            previewModal: document.getElementById('quizPreviewModal'),
            previewTitle: document.getElementById('quizPreviewTitle'),
            previewBody: document.getElementById('quizPreviewBody'),
            previewCloseBtn: document.getElementById('quizPreviewCloseBtn')
        };
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function showNotice(message, type) {
        if (!elements.notice) {
            return;
        }

        if (!message) {
            elements.notice.className = 'tqd-note';
            elements.notice.textContent = '';
            return;
        }

        elements.notice.className = `tqd-note show ${type === 'error' ? 'error' : 'success'}`;
        elements.notice.textContent = message;
    }

    function parseRouteQuizId(queryParams) {
        const fromEvent = new URLSearchParams(String(queryParams || ''));
        const eventId = Number(fromEvent.get('id') || 0);
        if (eventId > 0) {
            return eventId;
        }

        const raw = window.location.hash.replace(/^#/, '');
        const idx = raw.indexOf('?');
        const qs = idx >= 0 ? raw.slice(idx + 1) : '';
        const fromHash = new URLSearchParams(qs);
        return Number(fromHash.get('id') || 0);
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

    function toNumber(value, fallback) {
        const n = Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    function getApiBaseUrl() {
        return String(typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : '').replace(/\/$/, '');
    }

    function toAccessibleImageUrl(rawPath) {
        const value = String(rawPath || '').trim();
        if (!value) {
            return '';
        }

        if (/^https?:\/\//i.test(value)) {
            return value;
        }

        if (value.startsWith('/api/upload/')) {
            return value;
        }

        if (value.startsWith('/uploads/')) {
            const parts = value.split('/').filter(Boolean);
            if (parts.length >= 3) {
                return '/api/upload/' + parts[1] + '/' + parts.slice(2).join('/');
            }
        }

        if (!value.includes('/')) {
            return '/api/upload/quiz-questions/' + value;
        }

        return value;
    }

    function toAbsoluteUrl(path) {
        const value = String(path || '').trim();
        if (!value) {
            return '';
        }

        if (/^https?:\/\//i.test(value)) {
            return value;
        }

        const base = getApiBaseUrl();
        if (!base) {
            return value;
        }

        // Prevent duplicated /api prefix when API_BASE_URL already ends with /api.
        if (value.startsWith('/api/') && /\/api$/i.test(base)) {
            return base + value.slice(4);
        }

        if (value.startsWith('/')) {
            return base + value;
        }

        return base + '/' + value.replace(/^\/+/, '');
    }

    async function fetchImageAsDataUrl(url) {
        const appendCacheBuster = (inputUrl) => {
            const raw = String(inputUrl || '').trim();
            if (!raw) {
                return '';
            }

            const stamp = Date.now();
            return raw + (raw.includes('?') ? '&' : '?') + '_cors_ts=' + stamp;
        };

        const requestCandidates = [];
        requestCandidates.push(appendCacheBuster(url));

        const cleanUrl = String(url || '').trim();
        if (cleanUrl.includes('/api/api/')) {
            requestCandidates.push(appendCacheBuster(cleanUrl.replace('/api/api/', '/api/')));
        }

        let blob = null;
        let lastError = null;

        for (const candidate of requestCandidates) {
            if (!candidate) {
                continue;
            }

            try {
                const plainResponse = await fetch(candidate, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-store'
                });
                if (plainResponse.ok) {
                    const contentType = String(plainResponse.headers.get('content-type') || '').toLowerCase();
                    if (contentType.startsWith('image/')) {
                        blob = await plainResponse.blob();
                        break;
                    }
                }

                let token = null;
                try {
                    if (typeof Auth !== 'undefined' && typeof Auth.getToken === 'function') {
                        token = Auth.getToken();
                    }
                } catch (_) {
                    token = null;
                }

                if (!token) {
                    continue;
                }

                const authResponse = await fetch(candidate, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-store',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!authResponse.ok) {
                    lastError = new Error(`Image request failed (${authResponse.status})`);
                    continue;
                }

                const authContentType = String(authResponse.headers.get('content-type') || '').toLowerCase();
                if (!authContentType.startsWith('image/')) {
                    lastError = new Error('Image response content type is invalid');
                    continue;
                }

                blob = await authResponse.blob();
                break;
            } catch (error) {
                lastError = error;
            }
        }

        if (!blob) {
            throw lastError || new Error('Unable to fetch image for export');
        }

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('Failed to read image data'));
            reader.readAsDataURL(blob);
        });
    }

    function normalizeOption(option) {
        return {
            label: String(option && (option.option_label || option.label || '') || '').trim().toUpperCase(),
            text: String(option && (option.option_text || option.text || '') || '').trim(),
            is_correct: Number(option && option.is_correct ? option.is_correct : 0) === 1
        };
    }

    function normalizeQuestionOptions(question) {
        if (!Array.isArray(question && question.options)) {
            return [];
        }

        return question.options
            .map(normalizeOption)
            .filter((opt) => opt.label || opt.text)
            .sort((a, b) => a.label.localeCompare(b.label));
    }

    function getSelectedAnswerLabel(question, options) {
        const type = String(question && question.question_type || '').toLowerCase();
        const correctAnswer = String(question && question.correct_answer || '').trim();

        if (!correctAnswer) {
            const byFlag = options.find((opt) => opt.is_correct);
            return byFlag ? byFlag.label : '';
        }

        if (type === 'multiple_choice') {
            return correctAnswer.toUpperCase();
        }

        return correctAnswer;
    }

    function renderQuestionPreview(question, index) {
        const text = String(question.question_text || '-');
        const type = String(question.question_type || 'multiple_choice').toLowerCase();
        const points = toNumber(question.points, 0);
        const difficulty = String(question.difficulty || 'medium');
        const explanation = String(question.explanation || '').trim();
        const correctAnswer = String(question.correct_answer || '').trim();
        const normalizedImagePath = toAccessibleImageUrl(question.image_question || question.image_name || '');
        const imageUrl = toAbsoluteUrl(normalizedImagePath);
        const options = normalizeQuestionOptions(question);
        const selectedValue = getSelectedAnswerLabel(question, options);

        let optionsHtml = '';
        if (type === 'multiple_choice' && options.length) {
            optionsHtml = '<div class="tqd-preview-options">' + options.map((opt) => {
                const checked = selectedValue && opt.label === selectedValue ? ' checked' : '';
                const answerClass = checked ? ' is-selected' : '';
                return [
                    '<label class="tqd-preview-option' + answerClass + '">',
                    '<input type="radio" disabled' + checked + '>',
                    '<span class="tqd-preview-option-label">' + escapeHtml(opt.label) + '.</span>',
                    '<span>' + escapeHtml(opt.text) + '</span>',
                    '</label>'
                ].join('');
            }).join('') + '</div>';
        } else if (type === 'true_false') {
            const tfOptions = [
                { value: 'true', label: 'True' },
                { value: 'false', label: 'False' }
            ];

            optionsHtml = '<div class="tqd-preview-options">' + tfOptions.map((opt) => {
                const checked = selectedValue.toLowerCase() === opt.value ? ' checked' : '';
                const answerClass = checked ? ' is-selected' : '';
                return [
                    '<label class="tqd-preview-option' + answerClass + '">',
                    '<input type="radio" disabled' + checked + '>',
                    '<span>' + escapeHtml(opt.label) + '</span>',
                    '</label>'
                ].join('');
            }).join('') + '</div>';
        }

        const imageHtml = imageUrl
            ? ('<div class="tqd-preview-image-wrap"><img class="tqd-preview-image" src="' + escapeHtml(imageUrl) + '" alt="Question image for question ' + (index + 1) + '"></div>')
            : '';

        const explanationHtml = explanation
            ? ('<div class="tqd-preview-explanation"><strong>Explanation</strong><p>' + escapeHtml(explanation) + '</p></div>')
            : '<div class="tqd-preview-explanation"><strong>Explanation</strong><p>-</p></div>';

        return [
            '<div class="tqd-preview-item">',
            '<div class="tqd-preview-top">',
            '<strong>Q' + (index + 1) + '. ' + escapeHtml(text) + '</strong>',
            '<div class="tqd-preview-meta">',
            '<span>Points: ' + points + '</span>',
            '<span>Difficulty: ' + escapeHtml(difficulty) + '</span>',
            '</div>',
            '</div>',
            imageHtml,
            optionsHtml,
            '<div class="tqd-preview-answer"><strong>Correct Answer:</strong> ' + escapeHtml(correctAnswer || '-') + '</div>',
            explanationHtml,
            '</div>'
        ].join('');
    }

    function renderInfo() {
        if (!elements.infoGrid || !state.quiz) {
            return;
        }

        const q = state.quiz;
        const title = q.title || `Quiz ${q.quiz_id || state.quizId}`;
        const section = q.section_name || 'All sections';
        const duration = toNumber(q.duration_minutes, 0);
        const attempts = toNumber(q.max_attempts, 1);
        const points = toNumber(q.total_points, 0);
        const questions = toNumber(q.question_count, 0);
        const status = String(q.status || 'draft').toLowerCase();
        const randomize = Number(q.randomize_questions || 0) === 1 ? 'Yes' : 'No';

        elements.subtitle.textContent = `${title} • ${section}`;

        elements.infoGrid.innerHTML = `
            <div class="tqd-info-item">
                <small>Title</small>
                <strong>${escapeHtml(title)}</strong>
            </div>
            <div class="tqd-info-item">
                <small>Status</small>
                <strong><span class="tqd-chip ${escapeHtml(status)}">${escapeHtml(status)}</span></strong>
            </div>
            <div class="tqd-info-item">
                <small>Duration</small>
                <strong>${duration > 0 ? `${duration} minutes` : '-'}</strong>
            </div>
            <div class="tqd-info-item">
                <small>Max Attempts</small>
                <strong>${attempts}</strong>
            </div>
            <div class="tqd-info-item">
                <small>Total Points</small>
                <strong>${points}</strong>
            </div>
            <div class="tqd-info-item">
                <small>Question Count</small>
                <strong>${questions}</strong>
            </div>
            <div class="tqd-info-item">
                <small>Available From</small>
                <strong>${escapeHtml(formatDateTime(q.start_date))}</strong>
            </div>
            <div class="tqd-info-item">
                <small>Available To</small>
                <strong>${escapeHtml(formatDateTime(q.end_date))}</strong>
            </div>
            <div class="tqd-info-item">
                <small>Shuffle Questions</small>
                <strong>${randomize}</strong>
            </div>
            <div class="tqd-info-item">
                <small>Show Results</small>
                <strong>${escapeHtml(String(q.show_results || 'after_end').replace(/_/g, ' '))}</strong>
            </div>
        `;

        if (elements.publishToggleBtn) {
            const isPublished = status === 'active';
            elements.publishToggleBtn.innerHTML = isPublished
                ? '<i class="fas fa-eye-slash"></i> Unpublish Quiz'
                : '<i class="fas fa-paper-plane"></i> Publish Quiz';
        }
    }

    function renderStats() {
        if (!elements.stats) {
            return;
        }

        const summary = state.summary || {};

        const totalAttempts = toNumber(summary.total_attempts, 0);
        const uniqueStudents = toNumber(summary.unique_students, 0);
        const submittedAttempts = toNumber(summary.submitted_attempts, 0);
        const inProgressAttempts = toNumber(summary.in_progress_attempts, 0);
        const avgPercentage = toNumber(summary.avg_percentage, 0);
        const bestPercentage = toNumber(summary.best_percentage, 0);
        const lowestPercentage = toNumber(summary.lowest_percentage, 0);

        elements.stats.innerHTML = `
            <div class="tqd-stat">
                <h4>${totalAttempts}</h4>
                <p>Total Attempts</p>
            </div>
            <div class="tqd-stat">
                <h4>${uniqueStudents}</h4>
                <p>Students Attempted</p>
            </div>
            <div class="tqd-stat">
                <h4>${submittedAttempts}</h4>
                <p>Submitted Attempts</p>
            </div>
            <div class="tqd-stat">
                <h4>${inProgressAttempts}</h4>
                <p>In Progress</p>
            </div>
            <div class="tqd-stat">
                <h4>${avgPercentage.toFixed(1)}%</h4>
                <p>Average Score</p>
            </div>
            <div class="tqd-stat">
                <h4>${bestPercentage.toFixed(1)}%</h4>
                <p>Best Score</p>
            </div>
            <div class="tqd-stat">
                <h4>${lowestPercentage.toFixed(1)}%</h4>
                <p>Lowest Score</p>
            </div>
        `;
    }

    function renderQuestions() {
        if (!elements.questionsBody) {
            return;
        }

        if (!state.questions.length) {
            elements.questionsBody.innerHTML = '<div class="tqd-empty">No questions have been added yet.</div>';
            return;
        }

        elements.questionsBody.innerHTML = state.questions
            .map((question, index) => {
                const text = question.question_text || '-';
                const type = String(question.question_type || 'multiple_choice').replace(/_/g, ' ');
                const points = toNumber(question.points, 0);
                const difficulty = String(question.difficulty || 'medium');

                return `
                    <div class="tqd-table-row tqd-questions-row">
                        <div>${index + 1}</div>
                        <div>${escapeHtml(text)}</div>
                        <div>${escapeHtml(type)}</div>
                        <div>${points}</div>
                        <div>${escapeHtml(difficulty)}</div>
                    </div>
                `;
            })
            .join('');
    }

    function renderResults() {
        if (!elements.resultsBody) {
            return;
        }

        if (!state.submissions.length) {
            elements.resultsBody.innerHTML = '<div class="tqd-empty">No quiz attempts yet.</div>';
            return;
        }

        elements.resultsBody.innerHTML = state.submissions
            .map((row) => {
                const studentName = row.student_name || row.student_number || `Student ${row.student_id || ''}`;
                const attempt = toNumber(row.attempt, 1);
                const status = String(row.status || '-');
                const score = toNumber(row.score, 0);
                const maxScore = toNumber(row.max_score, 0);
                const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;
                const submittedAt = formatDateTime(row.submitted_at);

                return `
                    <div class="tqd-table-row tqd-results-row">
                        <div>${escapeHtml(studentName)}</div>
                        <div>${attempt}</div>
                        <div>${escapeHtml(status)}</div>
                        <div>${score}/${maxScore}</div>
                        <div>${percent.toFixed(1)}%</div>
                        <div>${escapeHtml(submittedAt)}</div>
                    </div>
                `;
            })
            .join('');
    }

    function renderAll() {
        renderInfo();
        renderStats();
        renderQuestions();
        renderResults();
    }

    async function loadData() {
        if (!state.quizId) {
            showNotice('Quiz ID is missing. Please open this page from the quiz list.', 'error');
            return;
        }

        showNotice('', 'success');

        if (elements.questionsBody) {
            elements.questionsBody.innerHTML = '<div class="tqd-loading">Loading questions...</div>';
        }

        if (elements.resultsBody) {
            elements.resultsBody.innerHTML = '<div class="tqd-loading">Loading results...</div>';
        }

        try {
            const [quizResponse, questionsResponse, resultsResponse] = await Promise.all([
                QuizAPI.getById(state.quizId),
                QuizAPI.getQuestions(state.quizId),
                QuizAPI.getResults(state.quizId)
            ]);

            state.quiz = quizResponse && quizResponse.data ? quizResponse.data : quizResponse;
            state.questions = normalizeQuestions(questionsResponse);

            const resultsData = resultsResponse && resultsResponse.data ? resultsResponse.data : resultsResponse;
            state.summary = resultsData && resultsData.summary ? resultsData.summary : null;
            state.submissions = Array.isArray(resultsData && resultsData.submissions) ? resultsData.submissions : [];

            renderAll();
        } catch (error) {
            console.error('Failed to load quiz details:', error);
            showNotice(error.message || 'Failed to load quiz details.', 'error');
            if (elements.questionsBody) {
                elements.questionsBody.innerHTML = '<div class="tqd-empty">Unable to load questions.</div>';
            }
            if (elements.resultsBody) {
                elements.resultsBody.innerHTML = '<div class="tqd-empty">Unable to load results.</div>';
            }
        }
    }

    function normalizeQuestions(payload) {
        const data = payload && payload.data ? payload.data : payload;
        let questions = [];

        if (Array.isArray(data && data.questions)) {
            questions = data.questions;
        } else if (Array.isArray(data)) {
            questions = data;
        }

        return questions.slice().sort((a, b) => {
            const aOrder = toNumber(a && (a.order_index || a.question_order), 0);
            const bOrder = toNumber(b && (b.order_index || b.question_order), 0);
            return aOrder - bOrder;
        });
    }

    function openPreview() {
        if (!elements.previewModal || !elements.previewBody) {
            return;
        }

        const title = state.quiz && state.quiz.title ? state.quiz.title : `Quiz ${state.quizId}`;
        if (elements.previewTitle) {
            elements.previewTitle.textContent = `Preview: ${title}`;
        }

        if (!state.questions.length) {
            elements.previewBody.innerHTML = '<div class="tqd-empty">No questions available to preview.</div>';
        } else {
            elements.previewBody.innerHTML = state.questions
                .map((question, index) => renderQuestionPreview(question, index))
                .join('');
        }

        elements.previewModal.classList.add('open');
        elements.previewModal.setAttribute('aria-hidden', 'false');
    }

    async function togglePublish() {
        if (!state.quiz) {
            return;
        }

        const currentStatus = String(state.quiz.status || 'draft').toLowerCase();
        const publish = currentStatus !== 'active';
        const payload = {
            status: publish ? 'active' : 'draft',
            is_activated: publish ? 1 : 0
        };

        const original = elements.publishToggleBtn ? elements.publishToggleBtn.textContent : '';
        if (elements.publishToggleBtn) {
            elements.publishToggleBtn.disabled = true;
            elements.publishToggleBtn.textContent = publish ? 'Publishing...' : 'Unpublishing...';
        }

        try {
            await QuizAPI.update(state.quizId, payload);
            showNotice(publish ? 'Quiz published successfully.' : 'Quiz unpublished successfully.', 'success');
            await loadData();
        } catch (error) {
            console.error('Failed to update quiz status:', error);
            showNotice(error.message || 'Failed to update quiz status.', 'error');
            if (elements.publishToggleBtn) {
                elements.publishToggleBtn.textContent = original;
            }
        } finally {
            if (elements.publishToggleBtn) {
                elements.publishToggleBtn.disabled = false;
            }
        }
    }

    function closePreview() {
        if (!elements.previewModal) {
            return;
        }

        elements.previewModal.classList.remove('open');
        elements.previewModal.setAttribute('aria-hidden', 'true');
    }

    async function exportQuestionsPdf() {
        if (!state.questions.length) {
            showNotice('No questions available to export.', 'error');
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            showNotice('PDF export library is not available.', 'error');
            return;
        }

        const doc = new window.jspdf.jsPDF();
        const quiz = state.quiz || {};
        const title = quiz.title || `Quiz ${state.quizId}`;
        const description = String(quiz.description || '').trim();
        const duration = toNumber(quiz.duration_minutes, 0);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const left = 14;
        const right = 14;
        const maxWidth = pageWidth - left - right;
        let y = 16;

        const ensureSpace = (neededHeight) => {
            if (y + neededHeight <= pageHeight - 14) {
                return;
            }
            doc.addPage();
            y = 16;
        };

        const writeWrapped = (text, size, gapAfter) => {
            const value = String(text || '').trim();
            if (!value) {
                return;
            }
            doc.setFontSize(size);
            const lines = doc.splitTextToSize(value, maxWidth);
            ensureSpace((lines.length * (size * 0.45)) + gapAfter + 2);
            doc.text(lines, left, y);
            y += (lines.length * (size * 0.45)) + gapAfter;
        };

        doc.setFontSize(16);
        writeWrapped(title, 20, 2);

        if (description) {
            writeWrapped(`Description: ${description}`, 11, 4);
        } else {
            y += 2;
        }

        doc.setFontSize(11);
        writeWrapped(`Duration: ${duration > 0 ? `${duration} minutes` : '-'}`, 11, 2);

        

        for (let idx = 0; idx < state.questions.length; idx += 1) {
            const q = state.questions[idx];
            const qText = String(q.question_text || '-');
            const points = toNumber(q.points, 0);
            const imagePath = toAccessibleImageUrl(q.image_question || q.image_name || '');
            const imageUrl = toAbsoluteUrl(imagePath);
            let options = normalizeQuestionOptions(q);

            if (!options.length && String(q.question_type || '').toLowerCase() === 'true_false') {
                options = [
                    { label: 'A', text: 'True' },
                    { label: 'B', text: 'False' }
                ];
            }

            ensureSpace(18);
            doc.setFontSize(12);
            writeWrapped(`Q${idx + 1}. ${qText} (${points} point${points === 1 ? '' : 's'})`, 12, 2);

            if (imageUrl) {
                try {
                    const imageDataUrl = await fetchImageAsDataUrl(imageUrl);
                    if (imageDataUrl) {
                        const imageProps = doc.getImageProperties(imageDataUrl);
                        const maxImgWidth = maxWidth;
                        const maxImgHeight = 70;

                        let drawWidth = maxImgWidth;
                        let drawHeight = (imageProps.height * drawWidth) / imageProps.width;

                        if (drawHeight > maxImgHeight) {
                            drawHeight = maxImgHeight;
                            drawWidth = (imageProps.width * drawHeight) / imageProps.height;
                        }

                        ensureSpace(drawHeight + 4);
                        doc.addImage(imageDataUrl, imageProps.fileType || 'PNG', left, y, drawWidth, drawHeight);
                        y += drawHeight + 10.5;
                    }
                } catch (error) {
                    writeWrapped('Image unavailable for export.', 10, 20);
                }
            }

            if (options.length) {
                options.forEach((opt) => {
                    writeWrapped(`${opt.label}. ${opt.text}`, 11, 1.5);
                });
            } else {
                writeWrapped('Answer: _______________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________________', 11, 2.5);
            }

            y += 10.5;
        }

        doc.save(`quiz-${state.quizId}-questions.pdf`);
    }

    function exportResultsCsv() {
        if (!state.submissions.length) {
            showNotice('No results available to export.', 'error');
            return;
        }

        const header = ['Student', 'Student Number', 'Attempt', 'Status', 'Score', 'Max Score', 'Percentage', 'Submitted At'];
        const rows = state.submissions.map((row) => {
            const score = toNumber(row.score, 0);
            const maxScore = toNumber(row.max_score, 0);
            const percent = maxScore > 0 ? ((score / maxScore) * 100).toFixed(2) : '0.00';
            return [
                row.student_name || '',
                row.student_id_number || '',
                String(toNumber(row.attempt, 1)),
                row.status || '',
                String(score),
                String(maxScore),
                percent,
                row.submitted_at || ''
            ];
        });

        const csv = [header, ...rows]
            .map((line) => line.map((item) => `"${String(item || '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quiz-${state.quizId}-results.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportResultsPdf() {
        if (!state.submissions.length) {
            showNotice('No results available to export.', 'error');
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            showNotice('PDF export library is not available.', 'error');
            return;
        }

        const doc = new window.jspdf.jsPDF();
        const title = state.quiz && state.quiz.title ? state.quiz.title : `Quiz ${state.quizId}`;
        doc.setFontSize(14);
        doc.text(`Quiz Results: ${title}`, 14, 16);

        const body = state.submissions.map((row) => {
            const score = toNumber(row.score, 0);
            const maxScore = toNumber(row.max_score, 0);
            const percent = maxScore > 0 ? `${((score / maxScore) * 100).toFixed(1)}%` : '0%';
            return [
                String(row.student_name || row.student_number || `Student ${row.student_id || ''}`),
                String(toNumber(row.attempt, 1)),
                String(row.status || '-'),
                `${score}/${maxScore}`,
                percent,
                formatDateTime(row.submitted_at)
            ];
        });

        if (typeof doc.autoTable === 'function') {
            doc.autoTable({
                head: [['Student', 'Attempt', 'Status', 'Score', 'Percent', 'Submitted At']],
                body,
                startY: 24,
                styles: { fontSize: 8 }
            });
        }

        doc.save(`quiz-${state.quizId}-results.pdf`);
    }

    function bindEvents() {
        if (elements.backBtn) {
            elements.backBtn.addEventListener('click', () => {
                window.location.hash = '#quizzes';
            });
        }

        if (elements.publishToggleBtn) {
            elements.publishToggleBtn.addEventListener('click', togglePublish);
        }

        if (elements.previewBtn) {
            elements.previewBtn.addEventListener('click', openPreview);
        }

        if (elements.previewCloseBtn) {
            elements.previewCloseBtn.addEventListener('click', closePreview);
        }

        if (elements.previewModal) {
            elements.previewModal.addEventListener('click', (event) => {
                if (event.target === elements.previewModal) {
                    closePreview();
                }
            });
        }

        if (elements.exportQuestionsPdfBtn) {
            elements.exportQuestionsPdfBtn.addEventListener('click', exportQuestionsPdf);
        }

        if (elements.exportResultsCsvBtn) {
            elements.exportResultsCsvBtn.addEventListener('click', exportResultsCsv);
        }

        if (elements.exportResultsPdfBtn) {
            elements.exportResultsPdfBtn.addEventListener('click', exportResultsPdf);
        }
    }

    async function init(queryParams) {
        cacheElements();

        if (!elements.root) {
            return;
        }

        if (elements.root.dataset.initialized === '1') {
            state.quizId = parseRouteQuizId(queryParams);
            await loadData();
            return;
        }

        elements.root.dataset.initialized = '1';
        state.quizId = parseRouteQuizId(queryParams);

        bindEvents();
        await loadData();
    }

    document.addEventListener('page:loaded', function (event) {
        const page = event && event.detail ? event.detail.page : '';
        if (page === 'quiz-details') {
            init(event.detail ? event.detail.queryParams : '');
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        if (hasPageRoot()) {
            init('');
        }
    });
})();

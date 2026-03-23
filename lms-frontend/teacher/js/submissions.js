/**
 * ============================================
 * Submissions Management Module
 * ============================================
 * Handles grading, feedback, and submission analytics
 * for teacher assignment submissions page.
 * 
 * Features:
 * - Grade individual submissions
 * - Provide feedback
 * - Download all submissions as ZIP
 * - Publish grades to students
 * - Track late submissions
 * - Analytics dashboard
 */

const TeacherSubmissionsAPI = (() => {
  // ─── Config ───────────────────────────────────────────────────────
  const API_BASE = "/api";

  function getHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  // ─── Grade & Feedback ─────────────────────────────────────────────
  async function gradeSubmission(submissionId, payload) {
    /**
     * Save grade and feedback for a submission
     * @param {string} submissionId - Submission UUID or ID
     * @param {object} payload - { score, feedback, graded_at, status }
     * @returns {Promise<object>} Server response
     */
    const res = await fetch(`${API_BASE}/submissions/${submissionId}/grade`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Grade failed: ${res.status}`);
    }

    return res.json();
  }

  async function publishGrades(assignmentId) {
    /**
     * Publish all grades for an assignment to students
     * @param {string} assignmentId - Assignment UUID
     * @returns {Promise<object>} Server response
     */
    const res = await fetch(
      `${API_BASE}/assignments/${assignmentId}/submissions/publish`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          published_at: new Date().toISOString(),
        }),
      },
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        err.message || `Publish failed: ${res.status}`,
      );
    }

    return res.json();
  }

  // ─── Download ─────────────────────────────────────────────────────
  async function downloadAllSubmissions(assignmentId) {
    /**
     * Download all submissions for an assignment as ZIP
     * @param {string} assignmentId - Assignment UUID
     * @returns {Promise<Blob>} ZIP file blob
     */
    const res = await fetch(
      `${API_BASE}/assignments/${assignmentId}/submissions/download-all`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!res.ok) {
      throw new Error(`Download failed: ${res.status}`);
    }

    return res.blob();
  }

  async function downloadSubmission(submissionId) {
    /**
     * Download a single submission file
     * @param {string} submissionId - Submission UUID
     * @returns {Promise<Blob>} File blob
     */
    const res = await fetch(
      `${API_BASE}/submissions/${submissionId}/download`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!res.ok) {
      throw new Error(`Download failed: ${res.status}`);
    }

    return res.blob();
  }

  // ─── Analytics ────────────────────────────────────────────────────
  async function getSubmissionsAnalytics(assignmentId) {
    /**
     * Get analytics for assignment submissions
     * @param {string} assignmentId - Assignment UUID
     * @returns {Promise<object>} Analytics data
     *   {
     *     total: number,
     *     submitted: number,
     *     pending: number,
     *     graded: number,
     *     late: number,
     *     average_score: number,
     *     status_distribution: {...}
     *   }
     */
    const res = await fetch(
      `${API_BASE}/assignments/${assignmentId}/submissions/analytics`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!res.ok) {
      throw new Error(`Analytics failed: ${res.status}`);
    }

    return res.json();
  }

  // ─── Submission Details ────────────────────────────────────────────
  async function getSubmissionDetail(submissionId) {
    /**
     * Get detailed submission with files
     * @param {string} submissionId - Submission UUID
     * @returns {Promise<object>} Submission data with files
     */
    const res = await fetch(
      `${API_BASE}/submissions/${submissionId}`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status}`);
    }

    return res.json();
  }

  async function getSubmissions(assignmentId) {
    /**
     * Get all submissions for an assignment
     * @param {string} assignmentId - Assignment UUID
     * @returns {Promise<object>} { submissions: [...], due_date, ...}
     */
    const res = await fetch(
      `${API_BASE}/assignments/${assignmentId}/submissions`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status}`);
    }

    return res.json();
  }

  // ─── Bulk Operations ───────────────────────────────────────────────
  async function bulkGradeSubmissions(assignmentId, updates) {
    /**
     * Bulk grade multiple submissions
     * @param {string} assignmentId - Assignment UUID
     * @param {array} updates - [{ submission_id, score, feedback }, ...]
     * @returns {Promise<object>} Server response
     */
    const res = await fetch(
      `${API_BASE}/assignments/${assignmentId}/submissions/bulk-grade`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ updates }),
      },
    );

    if (!res.ok) {
      throw new Error(`Bulk grade failed: ${res.status}`);
    }

    return res.json();
  }

  // ─── Feedback ──────────────────────────────────────────────────────
  async function saveFeedback(submissionId, feedback) {
    /**
     * Save feedback without grading
     * @param {string} submissionId - Submission UUID
     * @param {string} feedback - Feedback text
     * @returns {Promise<object>} Server response
     */
    const res = await fetch(
      `${API_BASE}/submissions/${submissionId}/feedback`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ feedback }),
      },
    );

    if (!res.ok) {
      throw new Error(`Save feedback failed: ${res.status}`);
    }

    return res.json();
  }

  // ─── Export ────────────────────────────────────────────────────────
  async function exportGradesAsCSV(assignmentId) {
    /**
     * Export grades as CSV
     * @param {string} assignmentId - Assignment UUID
     * @returns {Promise<Blob>} CSV file blob
     */
    const res = await fetch(
      `${API_BASE}/assignments/${assignmentId}/submissions/export-grades`,
      {
        method: "GET",
        headers: getHeaders(),
      },
    );

    if (!res.ok) {
      throw new Error(`Export failed: ${res.status}`);
    }

    return res.blob();
  }

  // ─── Public API ────────────────────────────────────────────────────
  return {
    gradeSubmission,
    publishGrades,
    downloadAllSubmissions,
    downloadSubmission,
    getSubmissionsAnalytics,
    getSubmissionDetail,
    getSubmissions,
    bulkGradeSubmissions,
    saveFeedback,
    exportGradesAsCSV,
  };
})();

// ═══════════════════════════════════════════════════════════════════
// Utility Functions for Submissions UI
// ═══════════════════════════════════════════════════════════════════

/**
 * Format a date to human-readable string
 * @param {string|Date} dateStr - ISO date string or Date object
 * @returns {string} Formatted date
 */
function formatSubmissionDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) {
    return dateStr;
  }
}

/**
 * Check if submission is late
 * @param {object} submission - Submission object with submitted_at
 * @param {string|Date} dueDate - Due date ISO string or Date object
 * @returns {boolean} True if late
 */
function isSubmissionLate(submission, dueDate) {
  if (!submission.submitted_at || !dueDate) return false;
  const subDate = new Date(submission.submitted_at);
  const due = new Date(dueDate);
  return subDate > due;
}

/**
 * Get submission status badge HTML
 * @param {string} status - Submission status
 * @returns {string} HTML badge
 */
function getSubmissionStatusBadge(status) {
  const s = String(status || "").toLowerCase().trim();
  if (s.includes("graded")) {
    return '<span class="sub-badge sub-badge-graded">Graded</span>';
  } else if (s.includes("submitted")) {
    return '<span class="sub-badge sub-badge-submitted">Submitted</span>';
  }
  return '<span class="sub-badge sub-badge-pending">Pending</span>';
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeSubmissionHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Calculate submission statistics
 * @param {array} submissions - Array of submission objects
 * @param {string|Date} dueDate - Due date for late calculation
 * @returns {object} Statistics object
 */
function calculateSubmissionStats(submissions, dueDate) {
  const total = submissions.length;
  const submitted = submissions.filter((s) => s.submitted_at).length;
  const graded = submissions.filter((s) => s.score).length;
  const pending = submitted - graded;
  const late = submissions.filter((s) =>
    isSubmissionLate(s, dueDate),
  ).length;

  const scores = submissions
    .filter((s) => typeof s.score === "number")
    .map((s) => parseFloat(s.score));

  const averageScore =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
      : 0;

  return {
    total,
    submitted,
    pending,
    graded,
    late,
    submissionRate: total > 0 ? Math.round((submitted / total) * 100) : 0,
    gradingRate: total > 0 ? Math.round((graded / total) * 100) : 0,
    averageScore: parseFloat(averageScore),
  };
}

/**
 * Trigger file download from blob
 * @param {Blob} blob - File blob
 * @param {string} filename - Desired filename
 */
function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

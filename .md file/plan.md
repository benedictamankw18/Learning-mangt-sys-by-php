## Plan: Timetable PDF Export Modes

Add an export-options popup on the timetable page so Export PDF asks the user how to generate output: combined long list, grouped by classes, or grouped by teachers. Keep current PDF stack (jsPDF + autoTable), but refactor into reusable export builders and section renderers so each mode is predictable and maintainable.

**Steps**
1. Discovery and baseline mapping: confirm current export trigger and exportPdf flow in frontend, and identify reusable modal pattern in timetable page scripts.
2. Add export options dialog UI in timetable frontend: implement a lightweight promise-based popup with radio options for 3 modes, cancel/export actions, and validation that a mode is selected.
3. Refactor export logic into composable functions: split current single exportPdf function into helpers for common header, filter summary, row normalization, and table rendering.
4. Implement mode 1 (combined long list): preserve existing behavior with sorting and single table output as the baseline output.
5. Implement mode 2 (divide by classes): group rows by class_id/class_name, render per-class section headers and tables in a single PDF, apply page breaks between sections when needed.
6. Implement mode 3 (divide by teachers): group rows by teacher_id/teacher_name, include fallback label for missing teacher, render per-teacher sections in a single PDF.
7. Wire Export PDF button to popup flow: clicking Export PDF should always open the options popup, then dispatch to the chosen mode.
8. Add defensive handling and UX polish: no-data guard, clear toast messages for empty exports or missing library, consistent file naming that includes selected mode.
9. Verification: validate all 3 modes manually on real timetable data and filtered views; confirm section grouping, sort order, and pagination behavior in generated PDF.

**Relevant files**
- d:/db/lms-frontend/admin/js/timetable.js — modify export click flow, add popup, refactor export helpers, implement 3 mode builders.
- d:/db/lms-frontend/admin/page/timetable.html — optional only if export popup is moved to static markup; otherwise unchanged if built dynamically in JS.

**Verification**
1. Open timetable page and click Export PDF: confirm popup appears every time with 3 options.
2. Export mode Combined long list: confirm one continuous table sorted by day/time.
3. Export mode Divide by Classes: confirm one PDF containing multiple class sections with correct rows under each class.
4. Export mode Divide by Teachers: confirm one PDF containing teacher sections and fallback group for unassigned teacher rows.
5. Apply filters before export (class/day/teacher): confirm exported data respects current filtered dataset.
6. Test empty filtered result: confirm user gets a clear warning and no empty PDF file is generated.

**Decisions**
- Split modes output format: one PDF with sections (not separate files).
- Export trigger behavior: always show popup on each Export PDF click.
- Scope included: frontend-only redesign of PDF export flow for timetable page.
- Scope excluded: backend changes, CSV import redesign, and separate file-per-group zip generation.

**Further Considerations**
1. Section header detail: include class/teacher metadata lines (total periods and conflict count per section) if needed for readability.
2. Page break strategy: strict break per section vs smart continuation based on remaining page height.
3. Filename pattern: include mode token (combined, by-class, by-teacher) with date for audit-friendly downloads.
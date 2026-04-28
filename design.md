# 5S Audit App — Design Document

## Brand & Color Palette

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `primary` | `#1A56DB` | `#3B82F6` | Primary actions, active states |
| `background` | `#F8FAFC` | `#0F172A` | Screen background |
| `surface` | `#FFFFFF` | `#1E293B` | Cards, modals |
| `foreground` | `#0F172A` | `#F1F5F9` | Primary text |
| `muted` | `#64748B` | `#94A3B8` | Secondary text, labels |
| `border` | `#E2E8F0` | `#334155` | Dividers, card borders |
| `success` | `#16A34A` | `#22C55E` | OK/Pass status |
| `warning` | `#D97706` | `#F59E0B` | Partial/Warning status |
| `error` | `#DC2626` | `#EF4444` | Fail/Non-conformance |

Industrial, clean, high-contrast — optimized for factory floor readability.

---

## Screen List

1. **Home / Dashboard** — Recent audits, quick-start button, stats summary
2. **Areas** — List of factory areas (e.g., Packaging, Metal Elements, Assembly)
3. **New Audit** — Select area, start audit session
4. **Audit Checklist** — 5S categories with checklist items, scoring per item
5. **Non-Conformance Detail** — Log issue: description, photo(s), severity
6. **Audit Summary** — Score breakdown per 5S pillar, list of non-conformances
7. **Tasks** — List of all open/in-progress/completed tasks from non-conformances
8. **Task Detail** — View/edit a task: description, photos, assignee, due date, status
9. **Reports** — List of completed audits with filters
10. **Report Detail / Export** — Full audit report with scores, issues, and PDF export

---

## Primary Content & Functionality

### Home / Dashboard
- Summary cards: Total audits this month, open tasks, average 5S score
- "Start New Audit" prominent CTA button
- Recent audits list (last 5)

### Areas
- Predefined factory areas (editable list)
- Each area shows last audit date and last score
- Add/edit/delete areas

### Audit Checklist
- Organized by 5S pillars: Sort (整理), Set in Order (整頓), Shine (清掃), Standardize (清潔), Sustain (躾)
- Each item: pass / partial / fail toggle
- On fail or partial: prompt to add non-conformance (photo + note)
- Progress bar showing completion
- Score calculated live (0–100)

### Non-Conformance Detail
- Description text input
- Photo capture (camera) or gallery pick (multiple photos)
- Severity: Low / Medium / High
- Auto-creates a task linked to this non-conformance

### Audit Summary
- Radar/bar chart of 5S scores
- Total score badge
- List of all non-conformances found
- "Finish & Save" button

### Tasks
- Tab filters: All / Open / In Progress / Done
- Each task card: area, pillar, description, severity badge, due date
- Swipe to mark complete

### Task Detail
- Full description, linked audit, linked area
- Photos from non-conformance
- Status selector: Open → In Progress → Done
- Due date picker
- Notes field

### Reports
- List of past audits sorted by date
- Filter by area and date range
- Each row: area name, date, overall score, # of non-conformances

### Report Detail / Export
- Full audit breakdown: scores per pillar, list of issues with photos
- "Export PDF" button — generates a shareable PDF report

---

## Key User Flows

### Flow 1: Conduct an Audit
1. Home → tap "Start New Audit"
2. Select area (e.g., "Packaging")
3. Audit Checklist screen opens with 5S items
4. For each item: tap Pass / Partial / Fail
5. On Fail → Non-Conformance modal: add photo + description + severity
6. Complete all items → tap "Finish Audit"
7. Audit Summary screen shows scores and issues
8. Tasks auto-created for each non-conformance

### Flow 2: Manage Tasks
1. Tasks tab → see all open tasks
2. Tap task → Task Detail screen
3. Update status, add notes, set due date
4. Mark as Done → task moves to completed

### Flow 3: Generate Report
1. Reports tab → select past audit
2. Report Detail shows full breakdown
3. Tap "Export PDF" → PDF generated and shared

---

## Navigation Structure

**Tab Bar (4 tabs):**
- Home (house icon)
- Audit (clipboard icon) — starts new audit flow
- Tasks (checkmark icon)
- Reports (chart icon)

**Stack Screens (pushed from tabs):**
- Area Selection (from Audit tab)
- Audit Checklist (from Area Selection)
- Non-Conformance Modal (from Checklist item)
- Audit Summary (from Checklist completion)
- Task Detail (from Tasks tab)
- Report Detail (from Reports tab)

---

## Data Models

```typescript
type Area = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
};

type AuditItem = {
  id: string;
  pillar: '1S' | '2S' | '3S' | '4S' | '5S';
  description: string;
  status: 'pass' | 'partial' | 'fail' | 'pending';
};

type NonConformance = {
  id: string;
  auditId: string;
  auditItemId: string;
  pillar: '1S' | '2S' | '3S' | '4S' | '5S';
  description: string;
  photos: string[]; // local URIs
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
};

type Task = {
  id: string;
  nonConformanceId: string;
  auditId: string;
  areaId: string;
  pillar: '1S' | '2S' | '3S' | '4S' | '5S';
  title: string;
  description: string;
  photos: string[];
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'done';
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

type Audit = {
  id: string;
  areaId: string;
  areaName: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed';
  items: AuditItem[];
  nonConformances: NonConformance[];
  scores: {
    '1S': number; '2S': number; '3S': number; '4S': number; '5S': number;
    total: number;
  };
};
```

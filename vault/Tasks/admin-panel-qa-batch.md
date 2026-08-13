---
status: in-progress   # planned | in-progress | done | blocked
date: 2026-08-12
tags: [task, qa, admin, batch]
---

# Task — Admin panel QA batch

Running punch-list of issues found while QA-ing the live `/admin` panel. We fix in
code as they're found but **hold deployment** and ship them **all together** in one
batch. Append new issues under "Open" as they come; move to "Fixed (pending deploy)"
once coded.

> **Deploy (when we batch):** local commit + push → on server
> `cd /opt/examsexpress && git pull && cd deploy && docker compose up -d --build`

---

## ✅ Fixed in code (pending deploy)

- [x] **Create teacher failing** — with a login email, a 10+ char password was
  required but there was no easy way to make one, so submit errored.
  → Added a **🎲 Generate** button (CSPRNG strong password) on the teacher form.
  Files: `src/app/admin/(protected)/tenants/new/page.tsx`.
- [x] **Teacher onboarding email** — on create (when a login email is given), the
  teacher is emailed their **sign-in link + email + temp password**.
  → New `src/lib/email/sendTeacherWelcome.ts`; called from `createTenantAction`.
  ⚠️ Only actually delivers once **Resend is configured** (see Open below); until
  then it logs `[dev-teacher-welcome]` and the admin shares the password manually.
- [x] **Create exam error "Too big: expected string ≤50 characters"** — the slug
  (schema max 50) exceeded 50. → **Slug now auto-generates from the name, capped at
  50** (still hand-editable). Files: `src/app/admin/(protected)/exams/ExamForm.tsx`.
- [x] **Slug was manual, not auto** (exam + teacher) — now auto-fills from the
  name via `slugify()` on both forms; stops auto-syncing once edited by hand.
- [x] **Admin forms shrunk to the left (unprofessional)** — systemic across
  create/edit pages. → Global fix: `margin-inline: auto` on
  `.admin-content .auth-card` so every constrained form centers.
  File: `src/app/globals.css`. Exam card widened 520→600px.

- [x] **🔴 Package price saved in the wrong unit (money bug)** ✅ fixed (rupee
  input ×100 → paise; form now "Price (₹)") — entering `599`
  (meant as ₹599) shows as **₹5.99** (per-test ₹1). `Package.pricePaise` stores
  **paise**, but the create/edit form takes the rupee input and stores it directly
  as paise instead of ×100. Fix: convert **rupees → paise (×100)** on save (and
  paise → rupees on display/edit), or clearly label the unit — prefer rupee input.
  Verify the same unit handling on the storefront/packages display. Money bug →
  high priority. Files: `adminPackages.ts`, `packages/new` + `[packageId]` forms.

- [ ] **🔴 BIG: /packages mixes platform + teacher packages, no filter by
  teacher/exam** (marketplace structural) — the student "Buy Tests" page
  (`/packages`) lists **all** packages together: platform's MP Patwari tiers
  (Starter / Value / Popular / Pro) **and** a teacher's package ("REACHER 5") in
  the same grid, with **no attribution** (whose package?) and **no
  search/filter**. For the marketplace this is wrong. Needs:
  (a) **separate & attribute** platform vs teacher packages (show the teacher's
  name/brand on their cards);
  (b) let students **filter/search by exam AND by teacher**;
  (c) a teacher's packages primarily live on **their storefront** (`/t/[slug]`);
  the global page must be **organised** (grouped by exam, and by teacher), not a
  flat mixed list.
  (d) **UX/visual is also weak** — mixed cards, sparse wrapped second row, and a
  "Buy Now" that looks disabled/greyed on some cards (verify it's not actually a
  broken state); this folds into the design overhaul ([[Features/ui-design-overhaul]])
  alongside the reorganisation.
  Ties into [[Decisions/0002-tenant-marketplace-model]] — may warrant its own
  design pass/ADR. Files: `packages/page.tsx` + its query, `t/[slug]`, `orders.ts`.

## 🟡 Open — needs decision / config

- [ ] **Live/Coming-Soon toggle on Exams list** — "Live" is currently *derived*
  (exam has ≥1 active paper). MP Patwari shows "Coming Soon" because it has **0
  active papers** (despite 6 sections + 5 packages). Decide:
  - **(A)** Keep derived — just **activate a paper** to go Live (no code). *(safe default)*
  - **(B)** Add a **manual override** field (`auto | live | coming_soon`) + toggle
    button → small **schema change** (Prisma migration).
- [ ] **Resend email config** — set `RESEND_API_KEY` + `RESEND_FROM_EMAIL` in
  `deploy/.env` so teacher-welcome + purchase-receipt emails actually deliver
  (free tier is fine). Until then both fall back to console logs.

## 🔜 New issues (append here as found)

- [ ] **Marks & negative-marks should come from the exam/paper, not per question**
  🔒 (data-logic — needs an ADR) — both the Add-Question form AND the single-question Edit form (and the upload sheet) ask
  marks + negative *per question*; a mock's marking scheme is uniform, so this is
  repetitive and error-prone. **Recommended:** derive per-question values from the
  **Paper** (already has `totalMarks`, `totalQuestions`, `negativeMarkingRatio`):
  `marks = totalMarks / totalQuestions` (or add a `marksPerQuestion` on Paper),
  `negativeMarks = negativeMarkingRatio × marks`. Then drop the two fields from the
  manual add/edit form and the sheet (the importer already defaults negative from
  the paper — `importQuestions.ts`). Touches scoring → see [[Business-Rules]]
  (🔒 scoring) + write `Decisions/000X-paper-level-marking.md` before changing.
  Files: `papers/[paperId]/questions/new` + `.../[questionId]`, `adminPapers.ts`,
  `importQuestions.ts`, schema (`Paper`/`Question`).
  **🔴 Concrete integrity bug (confirmed 2026-08-12):** a question was saved with
  **0.25 negative** even though its paper has **no negative marking** — because
  marks/negative are per-question they can contradict the paper's policy, so a
  student gets wrongly negative-marked. This is a live scoring-correctness issue,
  not just UX. When we move to paper-level marking, also run a **data audit/fix**
  to reconcile existing questions' negative marks to their paper's setting.

- [ ] **Upload form clears its fields after a successful upload** — React 19
  auto-resets a `<form>` with a function `action`, so after "✓ 100 uploaded" the
  Title / duration / etc. blank out. Combined with the browser's leftover
  "Please fill out this field" tooltip on Title and the still-visible success
  banner, it looks broken when the admin clicks Upload again. Fix: cleaner
  post-upload UX — show an explicit "Uploaded ✓ — start a new upload" state (or
  keep values), and don't leave a required-field error dangling.
  File: `src/app/admin/(protected)/upload/UploadForm.tsx`.
- [ ] **Admin forms waste screen width (thin left strip)** — even after the
  `margin-inline:auto` centering, create/edit forms (Add Question, exam, teacher,
  upload) are a single narrow column with most of the screen empty. Proper fix:
  widen the form card **and** lay short fields out in a **2-column grid** — wrap
  each `label`+`input` in a `.field` div (question text / section span full
  width). Apply consistently across all admin create/edit forms. This
  **supersedes** the quick centering — centering alone doesn't use the space.
  Files: `globals.css` + each admin form page (`exams/ExamForm`,
  `papers/[paperId]/questions/new` + `.../[questionId]`, `tenants/new`,
  `upload/UploadForm`, `coupons/new`, `packages/new`).
- [x] **Show/hide password toggle on password fields** ✅ fixed (admin login;
  tenant temp-password is already shown as plain text) — admin login
  (`/admin/login`) has no way to reveal the typed password (eye icon toggle);
  add one. Also apply to the teacher-create temp-password field and student
  login where a password is entered. Files: `admin/login` form,
  `tenants/new` password input, any password field.
- [ ] **Forms must not wipe the user's input on a validation error** (systemic,
  high-priority UX) — one typo / one missing letter should NOT force re-filling
  the whole form. Root cause: React 19 auto-resets a `<form action={fn}>` after
  the action runs, so even when the action returns `{error}` the fields clear
  (same root cause as the upload-form reset item below). Fixes (pick per form):
  (a) **client-side validation** that flags the bad field **upfront** before
  submit, and/or (b) make inputs **controlled** / echo the submitted values back
  in the action state so entries persist through an error. Apply to every admin
  create/edit form (exam, teacher, coupon, package, question, upload). Files:
  each form component + its action.
- [ ] **User management: no "Add user" + edit should be permission-gated** — (a)
  no way to **add a student** from the admin side (only self-signup exists); add
  an admin "Add user" flow. (b) **Editing user details** must be gated by a
  role-based permission — only super-admin (`"*"`) or a dedicated
  **customer-support** permission (e.g. new key `STUDENT_MANAGE`/`student.edit`)
  can edit; plain `STUDENT_READ` stays view-only. Ties into the data-driven RBAC
  ([[Decisions/0003-data-driven-rbac]]) — likely a new permission key + a
  `support` role. Files: `permissions.ts` (new key), `adminUsers.ts` action,
  `admin/(protected)/users/*` pages.
- [x] **No "Back to list" / Cancel link on create & edit forms** (systemic) —
  ✅ fixed on the create forms (exam, teacher, package, coupon, question, upload). —
  e.g. Create Coupon (`/admin/coupons/new`) has no way back to the coupon list
  without submitting or using the browser back button. Add a consistent
  "← Back to <list>" / Cancel link near the title or beside the submit button on
  every admin create/edit form (coupons, exams, teachers, questions, packages,
  upload). Files: all `admin/(protected)/**/new` + `**/[id]` form pages.
- [x] **After upload: clear success/failure + redirect to the questions page** —
  ✅ fixed (clean import → redirect to the paper's questions with a success
  banner; partial import stays on the form with the per-row error report). —
  the post-upload feedback isn't clear enough. On a **successful** import, redirect
  to that paper's questions page (`/admin/papers/[paperId]`) with a success
  message so the admin immediately sees the imported questions. On **partial/
  failed** rows, stay on the form and keep showing the per-row error report (valid
  rows already saved). Pairs with the "upload form clears fields" item.
  File: `contentUpload.ts` action + `upload/UploadForm.tsx`.
- [ ] **🔴 No per-question answer review on the result/report** (core student
  feature) — after submitting, the student can't see, per question: the
  **question text**, all options, **the option they chose**, the **correct
  answer**, and right/wrong + marks. This is the whole point of a mock (learn from
  mistakes) — right now only score/accuracy/section summary shows. Add a
  question-by-question review to the report (respect anti-cheat: only for the
  student's own **submitted** attempt). Files: `exam/result/[attemptId]/page.tsx`,
  `lib/exam/report.ts`, exam answer/question queries.
- [ ] **Paginate the paper's questions list** — a 100-question mock renders as one
  long list. Preferred: **pagination at 10 per page** (100 Q → 10 pages). (Fixed-
  height scroll window is the fallback, but founder prefers pagination.) Reuse the
  existing admin pagination pattern (used on users/orders lists — `.pg-*` styles
  already exist). File: `admin/(protected)/papers/[paperId]/page.tsx`.
- [ ] **No "View question" action — can't inspect/verify a question** — the
  Questions list on a paper only offers *Edit · Deactivate*. Need a **View**
  that opens a **modal** with the full question: stem, all options with the
  **correct one marked**, section, marks, and EN/HI text — so the admin can
  confirm an upload imported correctly (options + answer) and quick-edit inline.
  This is the real fix for the "questions gadbad lag rahe hain" worry — right now
  only the stem is visible, so you can't see if options/answers are right.
  Files: `src/app/admin/(protected)/papers/[paperId]/page.tsx` + questions list.
- [x] **(Resolved — not a bug) "Test Question 00X …" placeholders** — reviewed
  the actual uploaded file `ExamExpress_Test_Questions_01_of_05.xlsx` on
  2026-08-12: **format is perfect** (all required columns present, 2 tabs incl. a
  "Sections (valid codes)" reference, 100 rows) and **options + correct answers
  imported correctly** (e.g. capital of MP → B=Bhopal ✓, national animal →
  C=Tiger ✓). The upload engine works. It only *looks* wrong because (a) the
  question **stems** are placeholder wording from a test sheet, and (b) the list
  shows only the stem — hence the View-modal item above. Action: replace with
  real MP Patwari questions before launch, same column format.

---

## Notes
- All fixes above **build clean** (`npm run build` ✓) but are **uncommitted /
  undeployed** on purpose — batching per the founder's call on 2026-08-12.
- ⚠️ **QA-vs-deploy gap:** the founder is QA-ing the **live** site, which does NOT
  have any of these fixes yet — so already-fixed issues (e.g. left-align) still
  appear live and get re-reported. Recommend a **deploy checkpoint**: ship the
  batch once, then QA the fixed version. Otherwise we can't verify fixes.
- Golden rule reminder: no schema change (option B) without an ADR in `Decisions/`.

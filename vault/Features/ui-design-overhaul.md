---
status: planned   # planned | in-progress | done | blocked
date: 2026-08-12
tags: [feature, design, ui, storefront, deferred]
priority: high (deferred)
owner:
---

# Feature — UI / design overhaul (whole app + teacher storefront)

## Problem / why
The current UI looks unpolished and the **colour palette reads as unprofessional**.
Most critically, the **teacher storefront** (`/t/[slug]`, e.g. the first dummy
teacher "JACK REACHER / COACH REACHER") is the **teacher-facing sales surface** —
it's what a recruited teacher sees and shows their audience. A weak first
impression directly undermines teacher recruitment, which **is** the go-to-market
([[Decisions/0002-tenant-marketplace-model]], [[Product]]). Founder's words
(2026-08-12): *"No teacher will like this storefront… this colour palette is not
looking professional."*

## Scope
- **In:** a cohesive, professional **design system** (colour palette, typography,
  spacing, components) applied across the app; a **redesigned teacher storefront**
  as the flagship surface (hero, teacher brand/logo, mock/package cards, trust);
  the public landing + student app polished to match.
- **Out (for now):** any functional/logic change — this is presentation only.

## Status / sequencing
**Deferred — HOLD until the admin-panel bug/issue batch is cleared**
([[Tasks/admin-panel-qa-batch]]). Founder's explicit call: fix all functional
bugs first, then do the design overhaul (it's a large, whole-app change and
shouldn't interleave with bug-fixing).

## Storefront URL scheme (part of this, needs an ADR)
The current `/t/<slug>` (e.g. `/t/reacher`) reads as terse/technical, not
branded. ("Secure" is already covered — the whole site is HTTPS/valid TLS.)
Want a more professional, trustworthy URL. Options, cheapest → most branded:
- **`examsexpress.in/<slug>`** (Udemy / YouTube-handle style) — cleanest; but must
  add a **reserved-slug list** so a storefront can't collide with app routes
  (`login`, `dashboard`, `packages`, `admin`, `t`, `api`, …).
- **`examsexpress.in/teacher/<slug>`** or `/coach/<slug>` — clearer than `/t/`,
  low risk, small routing change.
- **`<slug>.examsexpress.in`** (subdomain — most branded, Substack/Gumroad-style)
  — needs **wildcard DNS** + wildcard/on-demand **TLS** (Caddy on-demand certs)
  + host-based routing. Bigger infra change.
- **Custom domains per teacher** — later/advanced.
Decide the scheme (path vs subdomain) → write `Decisions/000X-storefront-url.md`;
subdomain/custom-domain also touches DNS + TLS ([[Decisions/0005-lean-vps-deployment]]).

## Storefront content priority (product intent)
- **Lead with the teacher's packages.** On the storefront, packages should come
  **first / most prominent**, so a visitor immediately understands the teacher's
  speciality and offering (e.g. for MP Patwari, the teacher's "Package A"). The
  primary action is **buy a package**, not take a single mock.
- **Sell packages, not single tests.** Per-teacher **free / single / sample
  tests** are a **later** feature — don't foreground single-mock purchase now.

## Notes
- The storefront is the **highest-value** screen to redesign first (teacher
  recruitment ROI), even if the rest follows in phases.
- Likely wants a real design pass (not ad-hoc tweaks): define tokens in CSS,
  rebuild shared components, then reskin pages. Consider an ADR for the design
  system once direction is chosen.
- Empty states seen on the dummy storefront ("No mock tests available yet",
  "No packages available yet") are expected (no content yet) — but the redesign
  should make empty states look intentional, not broken.

## Related
[[Product]] · [[Roadmap]] · [[Decisions/0002-tenant-marketplace-model]] ·
[[Tasks/admin-panel-qa-batch]]

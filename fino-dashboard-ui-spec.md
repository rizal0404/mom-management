# FINO Dashboard — UI/UX Design Specification

> **Target:** Reproduce the visual language and information hierarchy of the supplied FINO dashboard reference while implementing the UI using **Material Design 3 (M3) principles**.
>
> **Primary reference:** supplied FINO dashboard screenshot  
> **Design system reference:** https://m3.material.io/
>
> This document is intended to be read directly by an AI coding agent (Codex, Claude Code, Cursor, Windsurf, etc.) before any UI implementation.

---

## 0. Non-negotiable instruction for the coding agent

**Do not improvise a generic SaaS dashboard.**

Before writing code:

1. Read this entire specification.
2. Inspect the existing project structure and reusable components.
3. Reuse existing components whenever possible.
4. Implement the layout hierarchy before decorative details.
5. Use the tokens defined in this document rather than arbitrary values.
6. Do not add UI elements that are not required by the product or visible in the reference.
7. When uncertain, prefer **less decoration, stronger hierarchy, and consistent spacing**.

The desired result is a **financial dashboard with a friendly, organic, green FINO identity**, not a generic AI-generated fintech dashboard.

---

# 1. Product intent

FINO is a personal/family finance dashboard focused on:

- seeing the current financial period,
- reviewing transactions,
- monitoring income and expenses,
- tracking savings,
- viewing activity consistency/streaks,
- checking wallet/bank balance,
- analyzing spending,
- exporting data.

The dashboard should feel:

- friendly,
- calm,
- trustworthy,
- lightweight,
- practical,
- slightly playful,
- data-first.

It should **not** feel:

- corporate banking,
- crypto,
- gaming,
- futuristic,
- glassmorphic,
- luxury fintech,
- overly minimal to the point of losing information.

---

# 2. Material Design 3 references

Use Material Design 3 as the behavioral and structural baseline, especially for semantic color roles, typography, responsive layout, accessible interaction states, navigation, cards, buttons, and form controls.

Recommended references:

- Material Design 3: https://m3.material.io/
- Color roles: https://m3.material.io/styles/color/roles
- Typography: https://m3.material.io/styles/typography/overview
- Cards: https://m3.material.io/components/cards/overview
- Buttons: https://m3.material.io/components/buttons/overview
- Navigation rail: https://m3.material.io/components/navigation-rail/overview
- Navigation drawer: https://m3.material.io/components/navigation-drawer/overview
- Top app bar: https://m3.material.io/components/top-app-bar/overview
- Segmented buttons: https://m3.material.io/components/segmented-buttons/overview
- Icons: https://fonts.google.com/icons

### Important interpretation

Do **not** apply default Material styling blindly.

Material 3 should provide:

- semantic token structure,
- component behavior,
- interaction states,
- accessibility,
- responsive logic,
- visual consistency.

FINO provides:

- brand palette,
- density,
- organic illustration language,
- custom card composition,
- financial-dashboard hierarchy.

The result should look like **FINO built correctly on top of M3**, not like a stock Material demo.

---

# 3. Visual direction

## 3.1 Core visual characteristics

The reference uses:

- a very light warm-green page background,
- pale-green elevated/tonal surfaces,
- saturated lime-green branded surfaces,
- dark forest-green actions,
- very little shadow,
- generous rounded corners,
- compact but comfortable dashboard density,
- simple monochrome icons,
- abstract organic green illustrations,
- subtle borders/dividers instead of heavy elevation.

### Visual keywords

`organic` · `calm` · `friendly finance` · `lime` · `soft surfaces` · `rounded` · `data-dense` · `functional`

---

# 4. Color system

Use **semantic M3-style tokens**, not hardcoded colors scattered across components.

The values below are project-specific approximations derived from the reference screenshot.

```css
:root {
  /* Brand */
  --md-sys-color-primary: #0D5E02;
  --md-sys-color-on-primary: #FFFFFF;

  --md-sys-color-primary-container: #AAED77;
  --md-sys-color-on-primary-container: #173310;

  --md-sys-color-secondary: #52B10F;
  --md-sys-color-on-secondary: #FFFFFF;

  --md-sys-color-secondary-container: #C8E4AF;
  --md-sys-color-on-secondary-container: #24361B;

  /* Background + surfaces */
  --md-sys-color-background: #F0F9E6;
  --md-sys-color-on-background: #172911;

  --md-sys-color-surface: #F0F9E6;
  --md-sys-color-on-surface: #172911;

  --md-sys-color-surface-container-lowest: #F7FCEF;
  --md-sys-color-surface-container-low: #E5F0D2;
  --md-sys-color-surface-container: #DFEDCB;
  --md-sys-color-surface-container-high: #D5E7BC;
  --md-sys-color-surface-container-highest: #C8DFAF;

  --md-sys-color-on-surface-variant: #566A4C;
  --md-sys-color-outline: #91A380;
  --md-sys-color-outline-variant: #C5D5B3;

  /* Status */
  --md-sys-color-error: #BA1A1A;
  --md-sys-color-on-error: #FFFFFF;
}
```

## 4.1 Dominant screenshot color cues

Approximate visual families observed in the reference:

| Role | Approx. color |
|---|---|
| Pale green surface | `#E5F0D2` |
| Bright hero green | `#AAED77` |
| Lime decorative green | `#7FD632` |
| Mid green | `#52B10F` |
| Deep action green | `#0D5E02` |
| Dark text | `#172911` |
| Main page background | `#F0F9E6` |

## 4.2 Color rules

- Use `primary` for high-priority actions and selected/active emphasis.
- Use `primary-container` for branded hero areas and selected tonal surfaces.
- Use surface-container tokens for cards.
- Prefer dark green text/icons over pure black.
- Avoid introducing blue, purple, neon cyan, gold, or unrelated fintech colors.
- Red is reserved for destructive/error states.
- Do not use decorative gradients unless a future approved visual explicitly requires them.
- Charts may introduce category colors only through a predefined chart palette.

---

# 5. Typography

Use a highly readable sans-serif.

Preferred:

```text
Inter
```

Fallback:

```css
font-family:
  Inter,
  Roboto,
  "Helvetica Neue",
  Arial,
  sans-serif;
```

Map typography semantically using an M3-style hierarchy.

| Token | Use | Desktop |
|---|---|---|
| `display-small` | Avoid in application UI | — |
| `headline-large` | Greeting / hero | 36px / 44px, 500 |
| `headline-small` | Major chart/card title | 24px / 32px, 600 |
| `title-large` | Dashboard section title | 20px / 28px, 600 |
| `title-medium` | Card header | 16px / 24px, 600 |
| `body-large` | Important descriptive copy | 16px / 24px, 400 |
| `body-medium` | Default body | 14px / 20px, 400 |
| `label-large` | Buttons/nav | 14px / 20px, 600 |
| `label-medium` | Metadata | 12px / 16px, 600 |
| `label-small` | Overline/mini labels | 11px / 16px, 600 |

### Rules

- Do not use font sizes above 40px in this application.
- Dashboard numbers should feel readable, not promotional.
- Metric values: `24–28px`, medium weight.
- Labels may use uppercase only for small semantic labels.
- Avoid excessive letter spacing.
- Avoid bolding entire paragraphs.
- Do not generate generic marketing copy inside the dashboard.

---

# 6. Shape system

Rounded corners are a strong part of the reference, but must stay systematic.

```css
--radius-xs: 6px;
--radius-sm: 10px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-xl: 32px;
--radius-full: 9999px;
```

Use:

| Element | Radius |
|---|---|
| Small controls | 8–10px |
| Standard cards | 20–24px |
| Hero card | 28–32px |
| Sidebar active item | 20–24px |
| Pill button/chip | Full |
| Wallet card | 24px |

### Rules

- Do not assign random radii such as `13px`, `19px`, `27px`.
- Do not make every rectangular element a pill.
- Nesting multiple large-radius cards is discouraged.

---

# 7. Spacing system

Base unit: **4px**

Allowed spacing values:

```text
4
8
12
16
20
24
32
40
48
64
```

Preferred dashboard spacing:

- component internal gap: `8–16px`
- card padding: `20–24px`
- section gap: `16–24px`
- main content gutter: `24px`
- large page separation: `32px`

### Never

- invent arbitrary spacing for visual tuning unless documented,
- use excessive whitespace that reduces dashboard information density,
- compensate for weak hierarchy with huge empty areas.

---

# 8. Elevation

The reference is predominantly **tonal**, not shadow-driven.

Use:

```text
Level 0: default surfaces/cards
Level 1: hover/floating control if necessary
Level 2: dropdown/menu
Level 3: modal/dialog
```

Standard dashboard cards should have:

```css
box-shadow: none;
border: 1px solid transparent;
```

or a subtle outline where necessary:

```css
border: 1px solid var(--md-sys-color-outline-variant);
```

### Do not

- add glowing shadows,
- use large blurred shadows around every card,
- stack multiple elevation effects,
- use glass blur/backdrop filters.

---

# 9. Desktop layout

Reference target: wide desktop dashboard.

## 9.1 Page shell

```text
┌───────────────┬────────────────────────────────────────────┐
│               │ Top App Bar                                │
│ Sidebar       ├────────────────────────────────────────────┤
│               │                                            │
│               │ Main dashboard content                     │
│               │                                            │
└───────────────┴────────────────────────────────────────────┘
```

### Desktop values

```text
Sidebar width:         224–240px
Top app bar height:    64px
Main content padding:  24px
Max content width:     none; use available viewport width
Minimum viewport:      1280px for full expanded composition
```

Main shell recommendation:

```css
.dashboard-shell {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  min-height: 100dvh;
}

.dashboard-main {
  min-width: 0;
}

.dashboard-content {
  padding: 24px;
}
```

---

# 10. Responsive breakpoints

Use an adaptive strategy consistent with Material 3 concepts.

```text
Compact:   0–599px
Medium:    600–839px
Expanded:  840px+
Wide:      1200px+
```

## Expanded / wide

- persistent left navigation,
- full hero,
- wallet card visible in right column,
- summary metrics shown as four columns,
- charts may span multiple columns.

## Medium

- collapse sidebar into navigation rail or temporary drawer,
- reduce card columns,
- wallet card may become full-width,
- hero decorative illustration can be simplified.

## Compact

- temporary navigation drawer or bottom navigation depending on product scope,
- hero content becomes vertical,
- export actions move into overflow or stacked actions,
- metric cards display `1–2` columns,
- no horizontal page scrolling,
- charts horizontally scroll internally only if absolutely necessary.

---

# 11. Desktop grid

Use a 12-column responsive grid for the main content area.

```css
.content-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
}
```

Suggested reference composition:

```text
Hero                    12 cols

Calendar/activity        5 cols
Streak stack             3 cols
Wallet                   4 cols

Income                    3 cols
Expense                   3 cols
Transactions              3 cols
Savings                   3 cols

Expense chart             8 cols
Category chart            4 cols
```

At narrower widths, let these span adaptively.

---

# 12. Sidebar

The left navigation is a major visual anchor.

## Structure

```text
FINO logo

APLIKASI
- Dashboard
- Transaksi
- Pengaturan

OPERASIONAL
- Admin
- Gateway WA
- Format Balasan
- Kamus
- Review Pesan
```

## Styling

- background: `surface-container-low`
- width: ~232px
- fixed/persistent on expanded layouts
- section labels use `label-small`
- icons: 20–24px
- item height: 44–48px
- horizontal padding: 16px
- gap icon-to-label: 12px

### Active item

```text
background: secondary-container
foreground: on-secondary-container
radius: 22px
```

### Hover

Use an M3-like state layer. Do not create a new random hover color.

### Iconography

Prefer Material Symbols Rounded or a single consistent icon library.

Do not mix:

- Material Symbols,
- Lucide,
- Font Awesome,
- Heroicons

in the same interface unless the existing codebase explicitly does so.

---

# 13. Top app bar

Contents from left to right:

```text
Sidebar collapse/back control
"Fino Dashboard"
spacer
period selector: "Agustus 2026"
theme/display icon
user avatar "FA"
```

Specifications:

```text
Height: 64px
Background: surface-container-lowest or transparent over page background
Horizontal padding: 20–24px
```

- Do not use a heavy bottom shadow.
- A subtle tonal distinction from the content is enough.
- Avatar diameter: 36–40px.
- Top bar controls need at least a 48×48px interactive target.

---

# 14. Hero / welcome card

The hero is the strongest brand surface.

## Content

```text
AETHER FAMILY FINANCE

Selamat pagi, Fino

Mulai hari dengan catatan yang rapi.
1 Agustus 2026 - 31 Agustus 2026

[Excel] [PDF]
```

## Styling

```text
Background: primary-container / bright FINO green
Minimum height: 180–200px
Padding: 24px
Radius: 28–32px
```

## Composition

Left:

- small family/account identifier,
- large greeting,
- period description.

Right:

- abstract organic decorative shapes,
- export actions aligned toward bottom/right.

## Decoration rules

Allowed:

- organic blobs,
- simple outlined loops,
- flat circular/rounded shapes,
- brand-green tonal differences.

Not allowed:

- stock illustrations,
- 3D blobs,
- glass spheres,
- futuristic glow,
- fake AI-generated people,
- unrelated decorative icons.

Decoration must remain behind functional content and must never reduce text contrast.

---

# 15. Export buttons

Actions:

```text
Excel
PDF
```

Use M3-style filled buttons.

```text
background: primary
foreground: on-primary
height: 44–48px
horizontal padding: 16–20px
radius: full
icon: 18–20px
```

Rules:

- Export controls are secondary to dashboard information.
- Do not enlarge them into prominent CTAs.
- On mobile, combine under an overflow/menu if space is insufficient.

---

# 16. Activity / calendar card

This card displays current activity consistency.

Reference content:

```text
Belum ada streak
54 transaksi · Terakhir: 13 Agu

<     Agustus 2026     >

JUM SAB MIN SEN SEL RAB KAM
14  15  16  17  18  19  20

Lihat satu bulan
```

## Styling

- background: `surface-container-low`
- radius: `24px`
- padding: `20–24px`
- selected day uses a clear lime/primary-container state
- inactive day circles use subtle surface tone

Do not turn the week into seven separate cards.

---

# 17. Streak metric stack

Three compact vertically stacked metrics:

```text
STREAK BERJALAN
0 hari

STREAK TERPANJANG
29 hari

HARI TERCATAT BULAN INI
13 / 31
```

Each row:

```text
min-height: 88px
padding: 16–20px
icon container: 40px
divider between rows
```

Use a common parent card or visually connected tonal group.

Do not create three floating shadow cards.

---

# 18. Wallet / bank balance card

Reference content:

```text
FINO
Saldo dompet

Rp 387.000

•••• •••• •••• 0005
Bank

Rp 4.158.000 keluar periode ini
```

This surface may use stronger green branding than ordinary cards.

Recommended:

```text
background: primary-container or secondary
foreground: dark green/on-primary-container
radius: 24px
padding: 20–24px
min-height: 240px
```

May contain flat abstract shapes to create depth.

### Do not

- reproduce a real credit-card brand,
- introduce metallic shine,
- add unnecessary gradients,
- use glass effects.

---

# 19. KPI / summary cards

Four reference cards:

```text
PEMASUKAN
Rp 0

PENGELUARAN
Rp 6.702.000

TRANSAKSI
54

TABUNGAN
Rp 0
```

Additional content may include:

- mini trend line,
- spark bars,
- contextual label,
- category count.

## Card structure

```text
[icon]

LABEL
Metric

[mini visualization]

Supporting text
```

Specifications:

```text
background: surface-container-low
radius: 24px
padding: 20px
min-height: 200px
```

Use microcharts only when backed by real data.

**Never fabricate visually plausible chart data merely to fill space.**

---

# 20. Chart cards

Reference sections:

```text
GRAFIK PENGELUARAN
Pengeluaran harian

[Per hari] [Per transaksi]
```

and:

```text
KOMPOSISI
Kategori
```

## Component behavior

Use:

- line/area chart for time series,
- bar chart for transaction count,
- donut/pie only when category composition is genuinely useful.

## Chart visual language

- minimal axes,
- muted grid lines,
- green primary series,
- readable labels,
- no 3D,
- no drop shadows,
- no excessive legends.

### Segmented control

Use M3 segmented-button behavior for:

```text
Per hari
Per transaksi
```

Do not build two unrelated pill buttons.

---

# 21. Icons

Preferred implementation:

**Material Symbols Rounded**

Recommended visual settings:

```text
size: 20–24px
weight: 400–500
optical size: 24
```

Rules:

- Icon alone is acceptable only where meaning is obvious.
- Provide tooltips for ambiguous icon-only controls.
- Avoid oversized decorative icons inside KPI cards.
- Keep stroke/fill style consistent.

---

# 22. Interaction states

All interactive components must provide:

```text
default
hover
focus-visible
pressed
disabled
selected (where applicable)
```

Use semantic state layers rather than arbitrary new colors.

Example:

```css
.interactive:hover {
  background-color: color-mix(
    in srgb,
    var(--md-sys-color-on-surface) 8%,
    transparent
  );
}
```

Implementation may differ depending on browser support/framework.

---

# 23. Accessibility

Minimum requirements:

- WCAG 2.1 AA contrast for text and important UI.
- Minimum interactive target: **48×48px** where practical.
- Keyboard navigation for all dashboard controls.
- Visible `focus-visible` state.
- Icons must have accessible names when interactive.
- Charts must have text/tabular summaries when needed.
- Never encode critical status using color alone.
- Respect `prefers-reduced-motion`.
- Decorative hero shapes must be hidden from assistive technology.

Example:

```html
<svg aria-hidden="true">...</svg>
```

---

# 24. Motion

Motion should be subtle and functional.

Allowed:

```text
hover:         100–150ms
press:          80–120ms
drawer:        200–300ms
modal:         200–300ms
chart update:  200–400ms
```

Use standard easing.

Avoid:

- springy cards everywhere,
- floating/breathing animations,
- auto-moving decorative shapes,
- parallax,
- animated gradients.

---

# 25. Component architecture

Recommended component tree:

```text
DashboardShell
├── Sidebar
│   ├── BrandLogo
│   ├── NavSection
│   └── NavItem
│
├── Main
│   ├── TopAppBar
│   │   ├── SidebarToggle
│   │   ├── PageTitle
│   │   ├── PeriodSelector
│   │   ├── ThemeToggle
│   │   └── UserAvatar
│   │
│   └── DashboardContent
│       ├── WelcomeHero
│       │   ├── AccountIdentity
│       │   ├── Greeting
│       │   ├── PeriodText
│       │   ├── ExportActions
│       │   └── BrandDecoration
│       │
│       ├── ActivityCard
│       │   └── WeekCalendar
│       │
│       ├── StreakSummary
│       │   └── MetricRow ×3
│       │
│       ├── WalletCard
│       │
│       ├── KPIGrid
│       │   └── MetricCard ×4
│       │
│       └── AnalyticsGrid
│           ├── ExpenseChartCard
│           └── CategoryCompositionCard
```

---

# 26. Suggested design tokens

Example TypeScript representation:

```ts
export const finoTokens = {
  color: {
    primary: "#0D5E02",
    onPrimary: "#FFFFFF",
    primaryContainer: "#AAED77",
    onPrimaryContainer: "#173310",

    background: "#F0F9E6",
    surface: "#F0F9E6",
    surfaceContainerLow: "#E5F0D2",
    surfaceContainer: "#DFEDCB",
    surfaceContainerHigh: "#D5E7BC",

    onSurface: "#172911",
    onSurfaceVariant: "#566A4C",

    outline: "#91A380",
    outlineVariant: "#C5D5B3",
  },

  radius: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },

  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },
};
```

---

# 27. If using Tailwind

Prefer semantic variables rather than arbitrary utility colors.

Example:

```css
@theme {
  --color-primary: #0D5E02;
  --color-on-primary: #FFFFFF;

  --color-primary-container: #AAED77;
  --color-on-primary-container: #173310;

  --color-background: #F0F9E6;
  --color-surface-container-low: #E5F0D2;
  --color-surface-container: #DFEDCB;

  --color-on-surface: #172911;
  --color-on-surface-variant: #566A4C;
}
```

Avoid:

```html
<div class="bg-[#e5f0d2] rounded-[23px] p-[21px]">
```

Prefer:

```html
<div class="bg-surface-container-low rounded-lg p-6">
```

The project should converge toward reusable tokens rather than pixel-by-pixel improvisation.

---

# 28. Anti-AI-slop constitution

The coding agent must obey the following.

## Never add unless explicitly requested

- purple/blue gradient backgrounds,
- glassmorphism,
- backdrop blur,
- glowing borders,
- neon effects,
- huge hero typography,
- random blobs outside the approved hero/wallet illustration system,
- excessive shadow,
- excessive pills,
- nested cards,
- cards used solely to fill empty space,
- fake testimonials,
- fake notification feeds,
- fake AI assistant panels,
- fake financial metrics,
- fake charts,
- generic "Welcome back 👋" copy,
- decorative emoji,
- redundant icons next to obvious labels,
- arbitrary Tailwind values,
- multiple competing accent colors.

## Card rule

Before creating a card ask:

> Does this information require a distinct interactive or semantic container?

If **no**, use:

- spacing,
- typography,
- grouping,
- divider,
- grid structure.

Do not default to another card.

## Icon rule

If text alone communicates the action clearly, an icon is optional.

Do not add an icon merely to make the UI appear "designed."

## Decoration rule

Decoration exists only in:

1. welcome hero,
2. wallet card,
3. optional tiny brand accents.

All other application surfaces are primarily functional.

---

# 29. Content density rules

The reference dashboard is intentionally information-rich.

Maintain:

- short card titles,
- concise helper text,
- clearly visible numbers,
- small but legible metadata,
- compact vertical rhythm.

Avoid expanding each metric into a large standalone block.

For desktop, important dashboard information should remain visible **above or close to the fold**.

---

# 30. Implementation workflow for AI coding agents

## Phase 1 — audit

Before coding, return a short implementation plan containing:

```text
Existing components to reuse
New components required
Layout structure
Token files to update
Responsive strategy
```

Do not implement yet.

## Phase 2 — shell

Implement:

```text
DashboardShell
Sidebar
TopAppBar
responsive navigation behavior
```

Validate before moving on.

## Phase 3 — design tokens

Implement:

```text
color roles
type scale
radius
spacing
surface roles
interaction states
```

## Phase 4 — dashboard sections

Order:

```text
1. WelcomeHero
2. ActivityCard
3. StreakSummary
4. WalletCard
5. KPIGrid
6. AnalyticsGrid
```

## Phase 5 — visual QA

Compare the implementation against:

- the supplied reference image,
- this specification,
- Material 3 interaction/accessibility behavior.

Do not solve visual mismatches by adding arbitrary CSS values.

---

# 31. Visual QA checklist

Before considering the screen complete, check:

### Layout

- [ ] Sidebar proportions match the reference.
- [ ] Top app bar remains visually lightweight.
- [ ] Main content uses a consistent grid.
- [ ] Hero spans the intended width.
- [ ] Dashboard cards align on shared column edges.
- [ ] No accidental horizontal scroll.

### Color

- [ ] Page background is warm pale green.
- [ ] Standard cards use subtle tonal surface differences.
- [ ] Saturated lime is concentrated in branded surfaces.
- [ ] Dark green is used for strong actions/text.
- [ ] No unapproved accent colors.

### Typography

- [ ] Greeting is the largest dashboard text but not oversized.
- [ ] Metric numbers are clearly distinguishable from labels.
- [ ] Labels have consistent case and weight.
- [ ] Supporting text remains legible.

### Shape

- [ ] Major cards share one radius family.
- [ ] Buttons/chips use appropriate shape semantics.
- [ ] Pills are not used indiscriminately.

### Elevation

- [ ] Ordinary cards have little/no drop shadow.
- [ ] Surface hierarchy comes primarily from tone and spacing.

### Components

- [ ] Existing project components are reused.
- [ ] No duplicate button/card implementation exists.
- [ ] Segmented controls behave like segmented controls.
- [ ] Navigation state is clear.

### Accessibility

- [ ] Keyboard focus is visible.
- [ ] Interactive targets are sufficiently large.
- [ ] Contrast meets AA.
- [ ] Icon-only actions have accessible labels.
- [ ] Charts expose useful nonvisual information.

---

# 32. Acceptance criteria

The dashboard is considered visually acceptable when:

1. A viewer can immediately recognize the supplied FINO reference as the visual source.
2. The interface does not resemble a generic purple/blue AI SaaS dashboard.
3. The green palette is consistent and tokenized.
4. Surface hierarchy is achieved primarily through tonal color, spacing, and grouping rather than shadows.
5. The sidebar, hero, calendar/streak region, wallet card, KPI cards, and analytics section retain the same overall hierarchy as the reference.
6. All repeated UI patterns are implemented as reusable components.
7. No major component contains arbitrary one-off color/radius/spacing values without documented reason.
8. Desktop, tablet, and mobile layouts remain functional.
9. Accessibility requirements are met.
10. No fabricated financial data is introduced by the UI layer.

---

# 33. Reference screen summary

Approximate desktop hierarchy:

```text
┌──────────────────────────────────────────────────────────────────┐
│ SIDEBAR │ TOP APP BAR                                            │
│         ├────────────────────────────────────────────────────────│
│         │ HERO / GREETING / EXPORT                               │
│         ├────────────────────────┬───────────────┬────────────────│
│         │ CALENDAR / ACTIVITY    │ STREAK STACK  │ WALLET         │
│         ├────────────────────────┴───────────────┴────────────────│
│         │ INCOME │ EXPENSE │ TRANSACTIONS │ SAVINGS              │
│         ├──────────────────────────────────┬──────────────────────│
│         │ EXPENSE ANALYTICS                │ CATEGORY COMPOSITION │
│         │                                  │                      │
└──────────────────────────────────────────────────────────────────┘
```

This hierarchy should survive responsive reflow even when the exact column arrangement changes.

---

# 34. Final instruction to the AI implementer

When a design decision is not defined here:

1. inspect existing application patterns,
2. follow Material Design 3 semantics,
3. match the FINO reference,
4. choose the simplest solution,
5. avoid adding decoration.

**Do not make the interface "more modern" by inventing visual effects.  
Make it more coherent, usable, and consistent.**

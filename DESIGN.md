---
name: Donnée OS
description: Premium internal operating system for Donnée's clients, projects and tasks.
colors:
  grafite: "#1A1824"
  verde-pinho: "#0D2C24"
  roxo-ardosia: "#6B5CA5"
  off-white: "#F2EFE9"
  surface-0: "#0F1F1A"
  surface-1: "#122820"
  surface-2: "#1A3328"
  surface-3: "#223D30"
  roxo-deep: "#3D3060"
  roxo-mid: "#52457E"
  roxo-light: "#8B7DC2"
  roxo-glow: "rgba(107, 92, 165, 0.18)"
  text-primary: "#F2EFE9"
  text-secondary: "#B8C4B0"
  text-muted: "#6E8070"
  danger-surface: "#3A1520"
  danger-text: "#F2C4C4"
typography:
  display:
    fontFamily: "\"Helvena\", \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "46px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  title:
    fontFamily: "\"Helvena\", \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "\"Helvena\", \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "\"Helvena\", \"Helvetica Neue\", Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  field: "10px"
  panel: "16px"
  card: "14px"
  badge: "999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.roxo-ardosia}"
    textColor: "{colors.off-white}"
    rounded: "{rounded.field}"
    padding: "11px 18px"
  panel:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.panel}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.field}"
    padding: "11px 14px"
  status-pill:
    backgroundColor: "rgba(107, 92, 165, 0.15)"
    textColor: "{colors.roxo-light}"
    rounded: "{rounded.badge}"
    padding: "4px 10px"
---

# Design System: Donnée OS

## 1. Overview

**Creative North Star: "The Forest Console"**

Donnée OS is a dark internal command surface for operational consulting work. The environment is organic-dark — deep forest greens and graphite depths anchored by a slate-purple accent that carries the brand identity from the logo into the interface.

The system should feel calm, premium and intelligent — like a well-made tool used inside the company, not a product being sold. Data and workflows are the foreground. The environment recedes.

**Key Characteristics:**
- Dark green-graphite atmospheric base (Verde Pinho + Grafite).
- Roxo Ardósia as the sole accent: buttons, active states, brand mark.
- Off-White for all primary text — warm, readable, not clinical white.
- Helvena typeface: clean, confident, slightly humanist.
- Compact, scan-friendly operational panels.

## 2. Colors

The palette is a two-tone dark environment (green + graphite) with a single slate-purple accent. Everything else is tonal variation within those two families.

### CSS Custom Properties

```css
:root {
  --grafite: #1A1824;
  --verde-pinho: #0D2C24;
  --roxo-ardosia: #6B5CA5;
  --off-white: #F2EFE9;

  /* Surface stack — green family */
  --surface-0: #0F1F1A;
  --surface-1: #122820;
  --surface-2: #1A3328;
  --surface-3: #223D30;

  /* Purple family — accent only */
  --roxo-deep: #3D3060;
  --roxo-mid: #52457E;
  --roxo-light: #8B7DC2;
  --roxo-glow: rgba(107, 92, 165, 0.18);

  /* Text */
  --text-primary: #F2EFE9;
  --text-secondary: #B8C4B0;
  --text-muted: #6E8070;

  /* Danger */
  --danger-surface: #3A1520;
  --danger-text: #F2C4C4;
}
```

### Named Rules

**The Single Accent Rule.** Roxo Ardósia is the only accent color. It is used for: primary buttons, active nav state, focus rings, status highlights and the brand symbol. Never use it as a background fill or decorative surface.

**The Green Depth Rule.** The application shell background is Verde Pinho. Panels and cards are lighter surface steps within the green family. Grafite (#1A1824) is used for the deepest surfaces — sidebars, drawers, overlays — where the green lightens too much.

**The Warm Text Rule.** All primary text uses Off-White (#F2EFE9), not pure white. Secondary text uses #B8C4B0 (desaturated sage). Muted text uses #6E8070 (dark sage). Never use #ffffff.

## 3. Typography

**Primary Typeface:** Helvena — a clean, humanist sans-serif that reads with clarity at all sizes. Fallback: "Helvetica Neue", Helvetica, Arial, sans-serif.

**Character:** Confident, neutral, slightly warm. The letter spacing is tight at display sizes, neutral at body. No decorative or experimental fonts elsewhere.

### Hierarchy
- **Display** (700, 46px, -0.02em): Page identity titles, login screen.
- **Title** (600, 20px, -0.01em): Panel headings, modal titles, section labels.
- **Body** (400, 15px, 0): All operational text, row content, descriptions.
- **Label** (600, 11px, +0.08em, uppercase): Eyebrows, column headers, status copy.

### Named Rules

**The Dense Clarity Rule.** Panels are operational tools, not editorial surfaces. Keep type compact. Large type belongs at page-level orientation only.

## 4. Elevation

The surface stack creates depth through tonal steps within the green family. No heavy drop shadows. No glassmorphism.

### Surface Stack
- `--surface-0` (#0F1F1A): App shell background, deepest ground.
- `--surface-1` (#122820): Default panel background.
- `--surface-2` (#1A3328): Hovered rows, secondary cards, chip backgrounds.
- `--surface-3` (#223D30): Active row highlight, selected state.
- `--grafite` (#1A1824): Sidebar, drawer, modal overlay — the graphite anchor.

### Shadows
- **Panel shadow:** `0 1px 3px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)` — subtle depth, not dramatic float.
- **Focus ring:** `0 0 0 3px rgba(107, 92, 165, 0.35)` — roxo-ardosia glow on inputs and interactive elements.
- **Modal overlay:** `rgba(13, 44, 36, 0.7)` — verde-pinho-tinted darkening, not black.

### Named Rules

**The No-Glass Rule.** The current system does not use glassmorphism. Panels are opaque surface steps. Translucency is reserved for modal overlays only.

## 5. Logo & Brand Mark

The Donnée logo has two forms:

- **Wordmark + Symbol** (primary): "Donnée" wordmark with the D/sparkle symbol to the left. Use on dark backgrounds.
- **Symbol only** (compact): The D/sparkle mark alone — use in sidebar, favicon, loading screen.

### Logo Usage
- **On Verde Pinho backgrounds:** Use `logo_nome_simboloroxo_fundoverde.png` or the transparent version.
- **On Grafite/dark backgrounds:** Use `logo_nome_simbolobranco_fundoroxo.png` or white variant.
- **Sidebar brand mark (collapsed):** Use `logo_simboloroxo.png` (symbol only).

### Clearspace
The logo must have clearspace of at least half its height on all sides. Never stretch, recolor outside the approved variants, or place on a busy background.

## 6. Components

### Buttons
- **Primary:** Roxo Ardósia fill (#6B5CA5), Off-White text, 10px radius, 11px 18px padding. Hover: lighten 8% (`#7A6BB4`).
- **Secondary/Ghost:** 1px border in roxo-ardosia, transparent fill, Off-White text.
- **Danger:** Danger surface fill, danger text.
- **Disabled:** 40% opacity, pointer-events none.

### Chips & Status Pills
- Background: `rgba(107, 92, 165, 0.15)` — roxo glow surface.
- Text: `--roxo-light` (#8B7DC2).
- Shape: pill (999px radius), compact padding 4px 10px, label size 11px.
- Status-specific: DONE gets green-tinted surface. BLOCKED gets danger-surface.

### Cards / Panels
- Background: `--surface-1` with 1px border `rgba(107, 92, 165, 0.12)`.
- Radius: 16px panels, 14px cards.
- Padding: 24px panels, 16px compact cards.
- Shadow: panel shadow from Elevation.
- No decorative borders. The border is functional — it separates surfaces.

### Inputs / Fields
- Background: `--surface-0`.
- Border: 1px solid `rgba(242, 239, 233, 0.1)`.
- Focus: border becomes `--roxo-ardosia`, receives focus ring.
- Radius: 10px.
- Text: `--text-primary`.
- Placeholder: `--text-muted`.

### Navigation (Sidebar)
- Sidebar background: `--grafite` (#1A1824).
- Default nav items: `--text-secondary`.
- Hover: background `--surface-2`, text `--text-primary`.
- Active: background `rgba(107, 92, 165, 0.2)`, left border 2px `--roxo-ardosia`, text `--off-white`.
- Brand area at top: logo wordmark or symbol depending on collapsed state.

### App Shell
Two-column layout: 256px fixed sidebar (grafite) + flexible content area (surface-0 background). Content area has a max-width of 1280px and 32px horizontal padding on desktop.

## 7. Do's and Don'ts

### Do:
- **Do** use Verde Pinho / Grafite as the environmental depth.
- **Do** use Roxo Ardósia only for interactive signals: buttons, active states, focus.
- **Do** use Off-White (#F2EFE9) for all primary text.
- **Do** keep panels opaque and surfaces tonal — no glass blur.
- **Do** use the approved logo variants from `/imgs`.
- **Do** apply Helvena at all type sizes with the defined fallback stack.

### Don't:
- **Don't** use bright violet (#7c2cff) or magenta from the old system.
- **Don't** use pure white (#ffffff) anywhere — it breaks the warm off-white system.
- **Don't** use glassmorphism or backdrop-filter effects.
- **Don't** add decorative gradients that aren't grounded in the surface stack.
- **Don't** make the interface look like a Bootstrap admin, CRM clone or generic SaaS dashboard.
- **Don't** use blue, orange, yellow or any color outside the defined palette.

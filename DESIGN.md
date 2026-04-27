---
name: Donnée OS
description: Premium internal operating system for Donnée's clients, projects and tasks.
colors:
  night-root: "#050012"
  deep-void: "#03000c"
  purple-depth: "#100023"
  violet-core: "#7c2cff"
  orchid-glow: "#d77cff"
  magenta-signal: "#c25cff"
  text-primary: "#f7f0ff"
  text-muted: "#a99cc5"
  text-soft: "#b9aecf"
  panel-dark: "#170c33"
  panel-void: "#080416"
  danger-surface: "#4a0c26"
  danger-text: "#ffd7e5"
typography:
  display:
    fontFamily: "\"Slop\", Inter, system-ui, sans-serif"
    fontSize: "46px"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0"
  title:
    fontFamily: "\"Slop\", Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0"
  body:
    fontFamily: "\"Slop\", Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "\"Slop\", Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "5px"
rounded:
  field: "14px"
  panel: "24px"
  card: "22px"
  badge: "999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "42px"
components:
  button-primary:
    backgroundColor: "{colors.violet-core}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.field}"
    padding: "13px 18px"
  panel:
    backgroundColor: "{colors.panel-dark}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.panel}"
    padding: "24px"
  input:
    backgroundColor: "{colors.panel-void}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.field}"
    padding: "13px 15px"
  status-pill:
    backgroundColor: "{colors.violet-core}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.badge}"
    padding: "5px 10px"
---

# Design System: Donnée OS

## 1. Overview

**Creative North Star: "The Intelligence Console"**

Donnée OS is a dark internal command surface for operational consulting work. It should feel premium, focused and slightly experimental, but the visual system must serve repeated use rather than spectacle.

The interface uses a deep purple-black environment, translucent panels and precise glowing accents to signal intelligence without becoming decorative noise. Data, forms and route-level screens remain the main product.

**Key Characteristics:**
- Dark premium operating surface.
- Purple-black tonal depth with rare bright accents.
- Glass-like panels used as a deliberate brand material.
- Compact, scan-friendly forms and rows.
- Responsive shell that preserves navigation and operational context.

## 2. Colors

The palette is a restrained purple-black system with violet and orchid accents reserved for active states, metrics and calls to action.

### Primary
- **Violet Core:** The main action color for primary buttons, brand mark and active navigation.
- **Orchid Glow:** The luminous companion accent used in gradients and glow moments.
- **Magenta Signal:** The high-signal accent for eyebrows, row counts and important numeric emphasis.

### Neutral
- **Night Root:** The base app background and darkest product atmosphere.
- **Deep Void:** The outer background depth used in gradients.
- **Purple Depth:** The mid-depth gradient color that gives the workspace its Donnée identity.
- **Panel Dark:** The upper surface tone for glass panels.
- **Panel Void:** The lower surface tone and field background.
- **Primary Text:** The main text color for titles and strong labels.
- **Muted Text:** Secondary descriptive text, empty states and row details.

### Named Rules

**The Signal Rarity Rule.** Bright violet and magenta are operational signals. Use them for active navigation, metrics, primary actions and status emphasis, not as general decoration.

**The Dark Console Rule.** Screens should stay dark and focused. Light surfaces, white dashboards and blue enterprise themes are off-brand.

## 3. Typography

**Display Font:** "Slop", with Inter, system-ui and sans-serif fallback.
**Body Font:** "Slop", with Inter, system-ui and sans-serif fallback.
**Label/Mono Font:** No distinct mono font is currently used.

**Character:** The current type direction is brand-forward and compact. It should feel more like a controlled internal operating surface than a generic web app.

### Hierarchy
- **Display** (700, 46px, 1.05): Page titles and primary screen identity.
- **Headline** (700, 36px on smaller screens): Responsive page titles.
- **Title** (700, 20px, 1.2): Panel titles and compact section headings.
- **Body** (400, 16px, 1.6): Supporting copy, row details and operational text.
- **Label** (600, 12px, 5px letter spacing, uppercase): Eyebrows and high-level product context.

### Named Rules

**The Dense Clarity Rule.** Typography must stay compact inside operational panels. Reserve large type for page-level orientation only.

## 4. Elevation

Donnée OS uses a hybrid of tonal layering, translucent surfaces and diffuse shadow. Panels do not float like generic cards; they sit inside a dark environment with subtle glass depth.

### Shadow Vocabulary
- **Panel Ambient Shadow** (`0 20px 60px rgba(0, 0, 0, 0.35)`): Used for panels and metric cards to separate surfaces from the purple-black background.
- **Brand Glow** (`0 0 34px rgba(153, 64, 255, 0.55)`): Reserved for the brand mark or rare brand moments.
- **Focus Glow** (`0 0 0 3px rgba(124, 44, 255, 0.18)`): Used for input and select focus states.

### Named Rules

**The Purposeful Glass Rule.** Glassmorphism is part of Donnée's identity here, but it must remain tied to real containers, not decorative floating cards.

## 5. Components

### Buttons
- **Shape:** Gently rounded operational controls (14px radius).
- **Primary:** Violet-to-orchid gradient with white text, strong weight and compact padding.
- **Hover / Focus:** Brightness lift on hover; disabled state lowers opacity and blocks interaction.
- **Secondary / Ghost / Tertiary:** Not currently defined. Do not invent variants until a real workflow needs them.

### Chips
- **Style:** Status pills use translucent violet surfaces, thin orchid borders and compact uppercase-like lettering.
- **State:** Current use is informational status display, not interactive filtering.

### Cards / Containers
- **Corner Style:** Rounded premium panels (24px panels, 22px metric cards).
- **Background:** Dark glass gradient from panel dark to panel void.
- **Shadow Strategy:** Use the panel ambient shadow from Elevation.
- **Border:** Thin violet-tinted border with low opacity.
- **Internal Padding:** 24px for panels, 22px for metric cards.

### Inputs / Fields
- **Style:** Dark filled fields with violet-tinted stroke and 14px radius.
- **Focus:** Border shifts to orchid and receives a soft violet focus ring.
- **Error / Disabled:** Error banners are defined; field-level errors are not yet defined.

### Navigation
- **Style, typography, default/hover/active states, mobile treatment.** Sidebar navigation uses icon plus label rows. Active and hover states use violet gradient fill with inset orchid border. On mobile, nav becomes a two-column grid above the content.

### App Shell

The shell is a two-column layout with a 280px sidebar and flexible content area. The sidebar carries brand, navigation and tagline; the content area owns page headers, panels, metric grids and route-level workflows.

## 6. Do's and Don'ts

### Do:
- **Do** keep new screens inside the existing app shell, content, page-header, panel, row and form-row conventions.
- **Do** pull statuses and priorities from metadata endpoints when available.
- **Do** preserve the dark premium purple-black workspace.
- **Do** use violet and magenta as operational signals, not background filler.
- **Do** keep forms compact, readable and responsive.

### Don't:
- **Don't** make Donnée OS look like a default Bootstrap admin panel.
- **Don't** use generic SaaS template composition or CRM clone layouts.
- **Don't** introduce bright corporate blue dashboards or flat white enterprise tables.
- **Don't** add advanced AI, automation, billing, finance, ERP or complex workflow engines unless explicitly requested.
- **Don't** use decorative effects that do not improve operational clarity.

# HeroUI Component Architecture & Standard Tailwind Theme Rules

> **Mandatory Rule for All Antigravity / Gemini Agents**
> **Scope**: All UI components, design tokens, layout primitives, and styling in *The Himalayan Trails*.
> **Reference**: [HeroUI Handbook](https://heroui.com/en/docs/native/getting-started/agents-md), Tailwind CSS v4 Theme Specifications.

---

## 1. HeroUI Component Architecture & Philosophy

All user interface components must adhere to the **HeroUI Component Standard**:

### A. Semantic Slot Architecture (`data-slot`)
Every component must explicitly label its internal anatomical elements using `data-slot` attributes. This enables transparent targeting, headless composition, and clear DOM semantics:
- `data-slot="base"`: The outer root element/wrapper of the component.
- `data-slot="content"`: The primary content container.
- `data-slot="header"`: Header section (title, toolbar, actions).
- `data-slot="body"`: Main body content area.
- `data-slot="footer"`: Footer section (meta information, action buttons).
- `data-slot="trigger"`: Interactive toggles, accordion triggers, or modal openers.
- `data-slot="indicator"`: Badges, status dots, chevron icons, or spinner animations.
- `data-slot="label"`: Accessible text labels.
- `data-slot="description"`: Supporting helper or contextual text.
- `data-slot="error"`: Field-level validation messages.

### B. Compound Component Pattern
Complex UI components (such as Cards, Modals, Drawers, Dropdowns, Accordions) must be structured as **Compound Components**:
- Expose typed subcomponents attached directly to the parent:
  ```tsx
  <GlassCard variant="interactive">
    <GlassCard.Header>
      <h3 data-slot="label">Annapurna Circuit</h3>
    </GlassCard.Header>
    <GlassCard.Body>
      <p data-slot="description">Trek through high alpine passes...</p>
    </GlassCard.Body>
    <GlassCard.Footer>
      <GlassBadge variant="gold">High Altitude</GlassBadge>
    </GlassCard.Footer>
  </GlassCard>
  ```
- Subcomponents must remain composable and accept standard `className` and `children` props.

### C. Interaction State Attributes
Components must expose their interactive lifecycle states using standard HTML data attributes instead of relying exclusively on pseudo-classes. This enables synchronized styling and animations:
- `data-hovered="true"`
- `data-pressed="true"`
- `data-focus-visible="true"`
- `data-disabled="true"`
- `data-selected="true"`

### D. Accessible Headless Composition (React Aria Standards)
- **Keyboard Navigation**: All interactive elements must support full keyboard operation (Enter, Space, Arrow keys, Escape).
- **Focus Rings**: Implement high-visibility focus indicators using `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2`.
- **ARIA Landmark & Roles**: Always provide proper `role`, `aria-label`, `aria-expanded`, and `aria-controls` where dynamic state exists.

---

## 2. Standard Tailwind CSS Theme Token System

All styling must use semantic tokens derived from the **Tailwind CSS v4 & HeroUI Theme System**:

### A. Semantic Color Palette Tokens
| Token | Description | CSS Variable |
|---|---|---|
| `background` / `foreground` | Primary page canvas and base text | `--background` / `--foreground` |
| `surface` / `surface-foreground` | Static cards, panels, HUD surfaces | `--surface` / `--surface-foreground` |
| `overlay` / `overlay-foreground` | Popovers, modals, flyouts, tooltips | `--overlay` / `--overlay-foreground` |
| `accent` / `accent-foreground` | Primary brand action (Himalayan Gold `#B68D40`) | `--accent` / `--accent-foreground` |
| `muted` / `muted-foreground` | Subdued backgrounds and subtle text | `--muted` / `--muted-foreground` |
| `default` / `default-foreground` | Neutral controls and subtle chips | `--default` / `--default-foreground` |
| `border` | Surface outlines and container borders | `--border` |
| `separator` | Dividers and horizontal/vertical rules | `--separator` |
| `focus` | Keyboard focus outline color | `--focus` |

### B. Strict Contrast Pairing Rule
**RULE**: Never use a background token without its corresponding `-foreground` token.
- Correct: `bg-accent text-accent-foreground`
- Correct: `bg-surface text-surface-foreground`
- Correct: `bg-muted text-muted-foreground`
- Incorrect: `bg-accent text-white` (violates theme flexibility and contrast ratio guarantees)

### C. Glassmorphic Integration with Theme Tokens
When building Himalayan glassmorphic surfaces, bind the glass styling directly to semantic tokens:
- **Base Glass Surface**: `backdrop-blur-xl bg-surface/70 border border-border/40 text-surface-foreground shadow-2xl`
- **Gold Accent Border / Glow**: `border-accent/40 shadow-accent/10`
- **Interactive Hover**: `hover:border-accent/60 data-[hovered=true]:border-accent/60`

### D. Scrollbar Utilities
Adopt HeroUI scrollbar standards for scrollable containers:
- `.scrollbar` — Styled thumb using theme `--scrollbar` variables.
- `.scrollbar-thin` — Sleek, compact Himalayan trail list scrollbar.
- `.scrollbar-none` — Hidden scrollbar for horizontal swipeable chips.

---

## 3. Enforcement & Verification Checklist

Before approving any UI component or view:
1. [ ] **Slots Declared**: Root and inner elements have explicit `data-slot="..."` attributes.
2. [ ] **Theme Tokens Used**: Colors use semantic utility tokens (`bg-surface`, `text-foreground`, `border-border`, `bg-accent`), avoiding arbitrary disconnected hex codes.
3. [ ] **Accessible Focus**: Element has visible focus state using `focus-visible:ring-2 focus-visible:ring-focus`.
4. [ ] **State Attributes**: Hover, press, and active states set `data-*` attributes for styling and GSAP targeting.
5. [ ] **Mobile & Cross-Device Ergonomics**: Minimum tap target of 44x44px on mobile devices (375px+).

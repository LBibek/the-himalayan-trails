# Strict Design Rules & Sequential Thinking Traits

> **Workspace Customization Rule**
> This file enforces glassmorphic aesthetic standards, responsive Tailwind CSS styling, 3-way component synchronization, and sequential thinking traits across all features in **The Himalayan Trails**.

## Key Directives:
1. **Glassmorphic Aesthetics**: Use `backdrop-blur-xl bg-surface/70 border border-border/40 shadow-2xl` with metallic gold accents (`#B68D40`).
2. **HeroUI Component Standard**: Structure components with semantic slots (`data-slot="base"`, `data-slot="content"`, `data-slot="header"`, `data-slot="body"`, `data-slot="footer"`, `data-slot="indicator"`) and state data attributes (`data-hovered`, `data-pressed`, `data-focus-visible`). See `.agents/rules/heroui_component_theme_rules.md`.
3. **Tailwind CSS Theme Tokens & Responsiveness**: Style elements with semantic tokens (`background`, `foreground`, `surface`, `surface-foreground`, `overlay`, `accent`, `muted`, `border`, `separator`, `focus`). Ensure full responsiveness across `sm:`, `md:`, `lg:`, `xl:` breakpoints.
4. **3-Way Component Sync**: Synchronize Map Markers ↔ Timeline Day Cards ↔ Elevation Line Chart for hover and click events.
5. **Sequential Thinking Steps**:
   - Step 1: Context & Rule Audit
   - Step 2: Schema & SSR Verification
   - Step 3: Glassmorphic UI Implementation with HeroUI Slots
   - Step 4: Bidirectional Sync Wiring
   - Step 5: Runtime Verification & Rule Updates
6. **Continuous Documentation Updates**: Update `design_rules.md` whenever new UI design patterns or components are added.


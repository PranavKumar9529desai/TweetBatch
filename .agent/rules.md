# Antigravity UI Patterns & Practices

This project uses the **Antigravity code editor**. Follow these patterns for `@apps/frontend`:

## Component Patterns
- **Dumb Components**: Place all dumb/presentational components in `apps/frontend/src/component/sub-component`.
- **shadcn/ui**: Do NOT write sub-components from scratch. Always use shadcn components from `packages/ui`.
- **Missing Components**: If a required component is not in `packages/ui`, add it using:
  ```bash
  bunx shadcn@latest add sheet accordion navigation-menu
  ```

## Styling & Colors
- **Design Tokens**: Never use manual Tailwind colors (e.g., `blue-500`).
- **shadcn Color Vars**: Always use shadcn color variables:
  - `primary` / `primary-foreground`
  - `secondary` / `secondary-foreground`
  - `accent` / `accent-foreground`
  - `destructive` / `destructive-foreground`
  - `muted` / `muted-foreground`
  - `popover` / `popover-foreground`
  - `card` / `card-foreground`
  - `background` / `foreground`
  - `border`, `input`, `ring`

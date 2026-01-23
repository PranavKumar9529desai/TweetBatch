# Antigravity UI Patterns & Practices

This project uses the **Antigravity code editor**. Follow these patterns for `@apps/frontend`:

## Component Patterns
- **Dumb Components**: Place all dumb/presentational components in `apps/frontend/src/component/sub-component`.
- **shadcn/ui**: Do NOT write sub-components from scratch. Always use shadcn components from `packages/ui`.
- **Automatic Path Resolution**: We use `vite-tsconfig-paths`, so imports like `@/lib/utils` in `packages/ui` will resolve correctly in the frontend.

## Styling & Colors
- **Design Tokens**: Never use manual Tailwind colors (e.g., `blue-500`).
- **shadcn Color Vars**: Always use shadcn color variables:
  - `primary` / `primary-foreground`
  - `secondary` / `secondary-foreground`
  - `accent` / `accent-foreground`
  - `destructive` / `destructive-foreground`
  - `muted` / `muted-foreground`
  - `background`, `foreground`, `border`, `input`, `ring`

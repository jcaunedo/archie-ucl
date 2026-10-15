# Archie UCL

React component library for Archie.

## Tech Stack

- React 19
- TypeScript (strict mode)
- Tailwind CSS 4
- Radix UI
- Storybook 10
- tsup (ESM bundling)
- React Hook Form and Zod

## Getting Started

```bash
npm install
npm run storybook
```

Storybook launches at [http://localhost:6006](http://localhost:6006).

## Commands

| Command                   | Description                  |
| ------------------------- | ---------------------------- |
| `npm run storybook`       | Launch Storybook             |
| `npm run build`           | Build the library to `dist/` |
| `npm run dev`             | Build in watch mode          |
| `npm run lint`            | Type-check with TypeScript   |
| `npm run build-storybook` | Build static Storybook site  |

## Project Structure

```text
src/
  index.ts                  # Public API exports
  lib/                      # cn(), breakpoints, motion system, hooks
  styles/
    theme.css               # Design tokens shipped to consumers
    globals.css             # Storybook styles
  docs/                     # Storybook MDX pages (Introduction, Foundations)
  components/
    <category>/             # buttons, forms, cards, feedback, overlays…
      <component-name>/
        <component-name>.tsx
        <component-name>.stories.tsx
        index.ts            # Re-exports the component, variants and types
```

Add each component in its own folder under its category, then re-export it from `src/index.ts`.

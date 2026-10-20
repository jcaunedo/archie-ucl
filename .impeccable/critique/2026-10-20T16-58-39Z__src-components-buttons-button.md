---
target: Button component
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
target_identity: "file:/Users/jcaunedo/development/archie-ucl/src/components/buttons/button"
timestamp: 2026-10-20T16-58-39Z
slug: src-components-buttons-button
---
# Critique: Button (src/components/buttons/button)

Method: dual-agent (A: design review · B: detector). Source only; no browser in session.

## Design Health Score: 20/40 (Acceptable)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 1 | No pending state, no press feedback; ghost/outline hover 1.06:1; primary hover lowers contrast |
| 2 | Match System / Real World | 3 | Native button, asChild links; variant names don't match Figma (Solid/Flat/Outlined) |
| 3 | User Control and Freedom | 2 | No pending → Stop pattern (progress PRD FR-08) |
| 4 | Consistency and Standards | 2 | CLAUDE.md conventions followed; ignores MOTION.md press, --disabled, --link tokens |
| 5 | Error Prevention | 1 | Primary ≈ destructive; no type="button" default |
| 6 | Recognition Rather Than Recall | 2 | Destructive not distinguishable; icon-only aria-label not enforced |
| 7 | Flexibility and Efficiency | 2 | No icon-sm; [&_svg]:size-4 needs ! to override |
| 8 | Aesthetic and Minimalist Design | 3 | Clean but generic |
| 9 | Error Recovery | 1 | disabled + pointer-events-none: unfocusable, no tooltip for why |
| 10 | Help and Documentation | 3 | Good MDX; no size/label-copy/dark guidance |

## Design Specificity Verdict
Stock (pre-v4) shadcn with Archie tokens. Detector: 0 findings, regex-only scan of 3 .ts/.tsx files (mdx not scanned; element rules incl. contrast did not run). No false positives. No browser overlay.

## Priority Issues
- [P0] Filled variants fail WCAG 2.2 AA: primary 4.47 L / 4.18 D, primary hover 3.92 / 3.56, secondary 3.87 L / 1.94 D, destructive 3.22 D. Fix in Figma (tokens come from archielabs.ds): white on vermilion-600 6.14, dark gray-950 on vermilion-400 5.06, dark secondary vermilion-100 on vermilion-700 6.02, light secondary vermilion-600 on vermilion-50 5.32; replace /90 and /80 alpha hovers with step tokens. → colorize, audit
- [P1] Primary and destructive nearly identical (1.30:1, ΔE 0.062). Rework destructive treatment in the same pass as P0; destructive pairs with confirmation. → colorize, clarify
- [P1] No pending/loading state or Stop pattern (progress PRD FR-08, sign-in 3D); pendingIconVariants exists unused. Add pending prop: aria-busy + aria-disabled, focusable, swallows repeat clicks, stable width, reduced-motion aware. → harden
- [P1] Dark-mode focus ring: ring-offset-2 with no offset color → white #fff band on gray-950; no dark decorator in Storybook. → polish
- [P2] No press motion (MOTION.md 0.98 pressPattern); disabled uses opacity-50 not --disabled; pointer-events-none cancels global not-allowed cursor. → animate, harden

## Persona Red Flags
- Alex: invisible ghost hover, no press response, no icon-sm, icon size locked.
- Sam: CTA contrast fails, hue-only destructive, unfocusable disabled Continue, no aria-busy, asChild ignores disabled.
- Maya (non-technical founder): double-fires Generate, no Stop, Deploy ≈ Delete, dark secondary unreadable.

## Minor Observations
AllVariants omits sizes; no Focus/Dark/icon/long-label/Pending stories; long labels overflow; duplicate rounded-md; link variant keeps h-9 px-4 box and only underlines on hover (3.24:1 vs body); outline border 1.30/1.55; MDX lacks label-copy guidance.

## Questions to Consider
- Should a solid red-family button ever mean danger in a vermilion brand?
- Should Button own the pending → Stop lifecycle?
- Should consequential actions state their scope ("Generate 4 modules")?

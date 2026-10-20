# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Builders:** founders, product teams and developers creating apps with Archie. The primary audience.
- **Team admins:** people managing workspaces, members, billing or permissions.
- **Internal operators:** Archie staff using internal and operational tools. They get the same quality bar as customers (DESIGN.md → "Design quality bar").
- **End users of generated apps:** people using the apps Archie generates, where those apps are built with UCL.

## Product Purpose

This repo, `archie-ucl`, is the shared React component library and the product design source for **Archie** and **Archie Core**. It holds the design rules (DESIGN.md), the product specs (`product-specs/`), prototypes, and the production components and layouts that Archie's frontend apps install from `@jcaunedo/archie-ucl`.

- **Archie:** the flagship AI app builder. It takes a builder from a prompt to a production-ready full-stack app.
- **Archie Core:** the backend-only tier. It gives teams the generated backend (APIs, data models, services) without the frontend layer.

Archie Labs (the professional services arm) is out of scope for this library.

## Positioning

Clarity before code: Archie generates a structured blueprint (modules, user types, services, tech stack and a working visual prototype) before writing any code, then generates a production-ready full-stack app. Archie Core offers the generated backend (APIs, data models, services) without the frontend.

Competitors (Lovable, Bolt, Base44, v0, Replit, Cursor) go from prompt to prototype with no definition step, and often leave apps that can't be finished. The critique is of that approach, not of the companies: be accurate and fair, never sneering.

## Operating Context

- Builders work in an AI chat that defines the blueprint, then generates, changes and deploys the app. `product-specs/conversational-progress-feedback.md` covers how that chat shows Archie's activity.
- Entry is one identifier-first sign-in flow with social sign-in (Google, Microsoft, Github) and email (`product-specs/sign-in-sign-up.md`).
- Design and engineering review components and layouts together in Storybook before any app uses them.

## Capabilities and Constraints

- Stack: React 19, Tailwind CSS 4, shadcn/ui on Radix, TypeScript and Motion (`motion/react`). CLAUDE.md → "Stack" is the source of truth.
- Figma decides how components look: `archielabs.ds` (shared tokens and components) and `archie.ds` (Archie-only components). UCL follows Figma; it doesn't invent a separate visual direction.
- **Terminology:** blueprint, module, user type, service, tech stack, prototype, app. Say "social sign-in" for consumer OAuth buttons, never "SSO", which is reserved for enterprise SAML/OIDC.
- **Product names:** Archie, Archie Core and Archie Labs are separate products and never interchangeable. Write "Archie" with a capital A and the rest lowercase (DESIGN.md → "Brand names").
- ⚠️ Undecided: the list of apps that consume UCL, client-only vs server rendering, and whether react-hook-form and zod become peer dependencies (CLAUDE.md → "Stack").

## Brand Commitments

- **Voice:** clear, calm, confident. Plain words, short sentences, and say what's happening. Never hype, jargon, cute or blaming. The same voice for every audience. DESIGN.md → "Brand voice" is the source of truth.
- **Motion personality:** calm, refined, natural and responsive (CLAUDE.md → "Motion System").

## Evidence on Hand

- Product specs: `product-specs/sign-in-sign-up.md`, `product-specs/conversational-progress-feedback.md`.
- Design rules: `DESIGN.md`. Motion system: `src/lib/motion/` and CLAUDE.md → "Motion System".
- No customer testimonials, usage metrics, benchmarks or pricing are in this repo. Don't make any up.

## Product Principles

1. **Clarity before code.** Show what will be built, and why, before building it.
2. **Production-ready, not throwaway.** Every surface is built to ship, including internal tools.
3. **Conversational and transparent.** Say what Archie is doing in plain language. Disclose details progressively, and always show actions that change, generate or deploy resources.
4. **Figma decides how things look.** UCL follows the design system and records why in DESIGN.md.

## Accessibility & Inclusion

WCAG 2.2 AA for every UCL component and layout.

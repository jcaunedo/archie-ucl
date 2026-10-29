<!--
Created: Oct 29, 2026
Created by: Julio Caunedo
Last updated: Oct 29, 2026
Scope: The sample project behind Archie's simulated conversations: an e-commerce store for high-end road bike accessories. Shared sample data for it lives in this folder.
Purpose: Give prototypes one realistic project to talk about, so sample data, scripted turns and copy stay consistent across layouts.
-->

# Sample project: road bike accessories store

## Names

| Item | Value | Where it shows |
| --- | --- | --- |
| Org | Paceline Supply | Topbar, project switcher |
| Project | Accessories store | Topbar, project switcher |

ℹ️ A paceline is a group of road cyclists riding in a single file, taking turns at the front.

## Initial prompt

The first message the person sends to Archie:

> Create an e-commerce store selling high-end accessories for road bikes.

Where it's used: `sampleProject` (`src/layouts/archie/project/sample-project.ts`) opens with it, and it's the first message in the `SimulatedConversation` story.

## How Archie responds

Archie doesn't build from the prompt alone. It plans first:

1. **Clarifying questions.** Archie asks what the prompt leaves open, each with options and a reason. The person answers in one message.
2. **Blueprint.** Archie drafts the blueprint from the prompt and the answers. The person reviews it in Plan and asks for changes in the chat.
3. **Prototype, then the app.** Only after the blueprint is agreed (not in this sample yet).

ℹ️ Archie compares to Lovable, Replit, Base44 and Bolt, but those go from prompt straight to code. The plan-first step is the difference the conversation has to show.

## Clarifying questions

| Question | What it decides | Answer |
| --- | --- | --- |
| Own stock or a marketplace? | Inventory and fulfillment, or seller accounts and payouts | Own stock, one warehouse |
| Where do you ship? | Currencies, tax rules, shipping rates | US and Canada |
| Guest checkout or accounts? | Checkout flow, what's saved | Both: guests buy, accounts optional |
| Save the rider's bike for fit checks? | A garage module and fit checks on product pages | Yes |

## Blueprint

`blueprint.ts` holds the full blueprint: every description, AI rationale, capability and setting. The names, as Plan lists them:

| Section | Count | Items |
| --- | --- | --- |
| Description | | One paragraph built from the prompt and the answers |
| User types | 4 | Guest, Customer, Fulfillment Staff, Store Administrator |
| Modules | 7 | Storefront, Catalog, My Garage, Cart & Checkout, Orders & Returns, Inventory, Admin Dashboard |
| Core services | 5 | User Management, Payment Processing, Notifications, File Storage Services, Global Search |
| Integrations | 3 | Stripe, Shippo, SendGrid |

ℹ️ Each item carries what its Plan detail panel shows. User types: description, rationale, software proficiency, devices. Modules: icon, description, rationale, capabilities, "Who is this module for?". Core services: icon, description, rationale, and settings for User Management (the one panel with a reference). Integrations: purpose, rationale, and the modules and services that use them.

ℹ️ The turns after the clarifying questions (answers, blueprint ready, change requests) are written next.

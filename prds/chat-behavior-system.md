<!--
Created: Oct 29, 2026
Created by: Julio Caunedo
Last updated: Oct 29, 2026
Scope: Archie's chat as a whole: what it does, how Archie behaves, every message type and chat component with its states, and the handoff to code. Extends conversational-progress-feedback.md, which covers the progress feedback inside it.
Purpose: Define the conversation UX model before building the realistic simulated chat in src/layouts/archie/, so the components, states and rules are agreed first.
-->

# Chat behavior system

## 1. Overview

Archie's chat is where a person turns an idea into an app. Archie plans first: it asks what the prompt leaves open, drafts a blueprint, waits for the person to approve, and only then builds. The chat has to make that plan-first flow visible, keep the person in control while Archie works, and leave a record of what changed.

This doc defines the conversation model: what the chat does, how Archie behaves, the message types, the components and their states, the rules, and how it maps to UCL. [conversational-progress-feedback.md](conversational-progress-feedback.md) (the "progress PRD") stays the source for progress feedback: activity indicator, activity disclosure, execution progress and completion summary. This doc places those inside the whole chat.

### References

| Source | What it gives |
| --- | --- |
| Figma "Archie-App" → page "Chat Experience" (fileKey `CAvv1Wfd1IDZo1BBOHeWAu`, page `1756:32313`) | The states, frame by frame (node ids in §4) |
| [AI UX Playground](https://aiuxplayground.com/patterns) | The patterns each component follows (named in §4) |
| [conversational-progress-feedback.md](conversational-progress-feedback.md) | Progress levels, status vocabulary, event model |
| `src/sample-data/road-bike-store/` | The project in the simulated conversation (§7) |

⚠️ **Constraint:** "Archie-App" isn't one of the design-system files in CLAUDE.md (`archielabs.ds`, `archie.ds`). The chat pieces below are built as layout-only parts until they exist in `archie.ds` (decision 2026-10-29, §8).

ℹ️ The earlier "Chat Behavior System" exploration in Claude Design couldn't be read from here (it needs a sign-in). Anything from it that this doc misses should be added here.

## 2. What the chat does

| Job | In Archie | Example |
| --- | --- | --- |
| Answer questions | Explains a concept or the project | "What's a database relationship?" |
| Ask for missing context | Clarifying questions before the blueprint | "Where do you ship?" |
| Clarify unclear input | Asks what the person meant instead of guessing | "make it better" → "Which part do you want to improve?" |
| Extract information | Turns the prompt and answers into a blueprint | User types, modules, services, integrations in Plan |
| Suggest actions | Next steps after a reply | "Add a wishlist", "Connect Stripe" |
| Confirm before applying changes | Waits for the person to choose before building | "Generate Prototype" / "Generate Full Stack Application" |
| Show progress | One live status, then what was done | "Creating project blueprint…", "56 files processed" |
| Record results | Each build is a version the person can restore | "Paceline Supply · Version 1" |
| Explain errors | Says what failed, what's unchanged, and what to try | "Couldn't connect to Stripe" |
| Hand off | Points to where the result lives | Plan, Code ("View in Code"), the preview |

## 3. How Archie behaves

| Situation | Archie… | Progress PRD level |
| --- | --- | --- |
| The message is unclear | Says plainly that it isn't sure what the person means, without blaming them. Offers the likely meanings as options, and typing it another way. Never builds or changes anything from an unclear message | Level 1 |
| How to refine the blueprint ("how do I update my user types?", "refine my specs") | Answers in detail: where that part lives in Plan, how to edit it there (open an item's details, + to add, × to remove, the sparkle to redraft) or here in the chat, then the order to review the blueprint in before generating (description, user types, modules, core services, integrations), and suggests a prototype first. Ends with what's next | Level 1 |
| A question it can answer | Answers directly. "Thinking…" only if the answer doesn't start at once, then streams | Level 1 |
| The request leaves decisions open | Asks clarifying questions, one at a time, each with options and "You decide". When the person chooses "You decide", Archie picks a sensible default and says which | Level 2 |
| It has enough to plan | Drafts the blueprint, filling Plan section by section, then summarizes it | Level 2 |
| An action that builds or changes the app | Proposes it and waits: the person chooses a CTA or asks for a change. Never builds from a question alone | Level 3, approval |
| It's building | Shows one live status, the files as they're written, then the result as a version | Level 3 |
| It's unsure | Says what it assumed and how to change it ("I used USD and CAD; tell me if you sell in more currencies") | Any |
| Something fails | Says what failed, what's unchanged, and offers Retry when retrying is safe | FR-11 |
| The person sends while it works | Queues the message and sends it when the current turn ends | §6 |
| The person stops it | Stops, keeps what's done, and says what didn't finish | FR-08 |

## 4. Message taxonomy and component inventory

### Message types

| Type | Who | What it holds |
| --- | --- | --- |
| Person message | The person | Text, and later attachments. Right-aligned bubble |
| Archie turn | Archie | Everything Archie does for one request, in order: thinking, text, questions, progress, files, results, actions |
| Action message | The person, by choosing | A CTA or an answer shown as the person's message ("Generate Prototype") |
| System note | The app | Context that isn't anyone's message: "Restoring to a previous version: 2 → 1", a day separator ("2 days ago") |

ℹ️ An Archie turn is one message made of blocks, not a message per step (progress PRD Rule 3).

### Components

| Component | Purpose | Figma frame | Pattern | Built from |
| --- | --- | --- | --- | --- |
| Person message | The person's prompt | Default `1756:34088` | — | `ChatMessage` (UCL) |
| Archie text | Archie's reply: paragraphs, bold headings, lists. A list of facts leads each item with its label in bold and a colon ("**7 modules:** Storefront, Catalog…"), the same format on every line, so it scans | Streaming `3581:16771`, Resolved `3581:16933` | Streaming | New part |
| Activity indicator | Archie's live status | Thought sheet `1971:15347` "Thinking" | Chain of Thought | `ActivityIndicator` (UCL) |
| Activity feed | What Archie is doing under its status, live: the latest 2 steps, the newest sliding up at the bottom | Thinking - How the system is working `1872:27093` | Chain of Thought, Streaming | New part |
| Thought disclosure | "Thought for 12s ›", expands to what Archie did | Thought sheet "Thought", "Thought Expanded" | Chain of Thought, Progressive Disclosure | New part |
| Clarification prompt | One question at a time: options A–D, "You decide", answered by click or by typing. Also used for an unclear message: the likely meanings as options | `3660:104046` (questions) | Human in the Loop | New part |
| Progress line | A long step: "Creating project blueprint…" → "Blueprint generated · 1m 23s" | Blue print generation `2186:15254`, Result `2186:15400` | Tool Use | New part |
| Approval prompt | Asks permission before a consequential change (removing part of the app): Deny / Allow, then the decision | archie.ds prompt-alert `51:6098` | Human in the Loop | `PromptAlert` (UCL) |
| What's next | Archie's next steps after an update: rows with what each produces, the recommended one first | Replaces the CTAs and follow-up chips (Result `2186:15400`, Suggested Follow-up Actions `2129:14006`); not in Figma yet | Suggest / Confirm / Execute, Follow-up Chips | New part |
| Files processed | Files written: live count, then "56 files processed · View in Code"; expands to the list with New/Modified, time and credits | Thought sheet "File 1", "Files", "Files Expanded"; File Process Expanded `1984:11642` | Tool Use, Cost Transparency | New part |
| Code stream | "Writing: src/styles/theme.css" with the code streaming in | Writing Code `2198:16206`, code streaming `2231:48935` | Streaming, Chat Artifacts | New part |
| Version card | The result of a build; current or restorable | Versions sheet `1988:12207`, Several Versions `2000:12295` | Checkpoints and Restore | New part |
| Response actions | Copy, helpful / not helpful, retry under a reply; helpful / not helpful, save under a version | Resolved `3581:16933` | Feedback Loops | New part on `Button` |
| Error card | What failed, what's unchanged, Retry | — (not in Figma) | Failure Disclosure | New part |
| Suggested prompts | Starters in an empty chat (follow-ups are now the "What's next" card) | Suggested Follow-up Actions `2129:14006` | Prompt Starters, Follow-up Chips | New part on `Button` |
| Queue | Messages waiting while Archie works, each removable | Queue-01…04 `3527:3688`…, Queue - Inline `3549:4020` | Interrupt and Resume | New part |
| Composer | Send, voice, Stop, add to queue, slash commands ("type / for options") | Prompt Composer (all frames) | Input Mode Toggle, Command Bar | `PromptComposer` (UCL) |
| System note | Restore notes and day separators | Several Versions, Code 8 `1971:13879` | — | New part |
| Plan canvas | The blueprint filling in as Archie drafts it | Eight Count references, "Plan First" page | Generative UI, Skeleton Screens | New part |

⚠️ **Gap:** file attachments (Figma "Image Attached" `2024:30837`), chat history and the "Add Context" chip aren't in this pass.

## 5. State matrix

| Component | Loading / running | Streaming | Needs input | Success | Error | Disabled / done |
| --- | --- | --- | --- | --- | --- | --- |
| Activity indicator | "Thinking…", label replaced in place, with the activity feed under it | Gone once text streams | — | Becomes the thought disclosure | Replaced by the error card | — |
| Thought disclosure | — | — | — | "Thought for 8s ›", collapsed; expands to its steps | — | — |
| Archie text | — | Words appear as they arrive | — | Full text, response actions below | "Stopped." after a partial reply | — |
| Clarification prompt | — | — | "Question 2 of 4", lettered options with "You decide" last; answered questions above it, each with an edit icon in its bubble. Unclear message: "Which part do you want to improve?", likely meanings as options | "4 questions answered"; for an unclear message, the chosen meaning sent as the person's message | — | Earlier answers locked |
| Progress line | Spinner, "Creating project blueprint…" | — | — | Check, "Blueprint generated · 9s" | Cross, "Couldn't connect Stripe" | — |
| Confirmation (CTAs) | — | — | Both actions available | The chosen one marked | — | The rest disabled after a choice |
| Files processed | "12 files processed", growing | Current file named | — | "56 files processed · View in Code" | Count of what finished | — |
| Code stream | Spinner, "Writing: path" | Code appears line by line | — | Collapses into files processed | — | — |
| Version card | — | — | — | Green check, "Current Version" | — | Older: "Version 1", Restore available |
| Error card | — | — | Retry | — | Title, what's unchanged, Retry | Retry disabled once retried |
| Queue | — | — | — | Item leaves when sent | — | Removable until sent |
| Composer | Busy: Stop; with text, "Add to queue" and a small Stop | — | "/" opens the commands menu, filtered as typed | Idle: voice; with text, Send | — | — |
| Plan canvas | Sections not yet drafted show skeletons | Sections appear in order | — | Full blueprint | — | Empty state before the first prompt |

ℹ️ "Edited" and "Reverted" apply to answers while answering (rule 13), Plan (editing a user type or module) and versions (Restore). Plan editing is out of this pass.

## 6. Behavior rules

1. **One live status.** One activity indicator per turn, replaced in place; it never piles up (progress PRD FR-02). After it, how long Archie has been working on the turn, ticking each second ("· 12s", "· 1m 05s"). Every duration Archie shows uses that format: "Thought for 1m 05s", "Blueprint generated · 7s", "Worked for 26s".
2. **Thinking collapses.** When text starts, the status becomes "Thought for Ns" with the real elapsed time. Times shown are always measured, never scripted (progress PRD §4.6).
3. **Questions before the blueprint.** For a new app, Archie asks up to four questions, one at a time. Each has options, "You decide" (Archie picks a default) and a free answer (typed in the composer). Typing just an option's letter ("b", "B.", "b)") picks that option, the same as clicking it; a letter past the last option stays a typed answer. When the last is answered, the answers go as one person message, and Archie drafts the blueprint. Answers can be changed at any point (rule 13).
4. **Unclear input gets a question, not a guess.** Archie asks when a message is:
   - **Not understandable** (random keys, a fragment): no options. A short, playful reply that asks again, with a hint of what to send, often with a nod to the project ("That one slipped its chain. Say it another way, and we'll get rolling again."). It changes every time, never the same twice in a row, and never blames the person (DESIGN.md "Brand voice", playful exception).
   - **Clear, but not something Archie can place:** "I'm not sure what you mean. What would you like to do?", with options such as "Change the design", "Add a feature", "Ask about my app".
   - **Too vague to act on** ("make it better"): "I can improve a few things. Which one do you mean?", with the parts that apply to this app ("The visual design", "Product pages", "Checkout").
   - **Open to two readings that lead to different changes** ("remove the cart"): "Do you want to remove the cart icon from the header, or remove the cart and checkout entirely?" When one reading removes something, the question says so.

   - **An answer to a clarifying question that doesn't read as words** ("sdkfj"): Archie keeps the answers it could read and asks that one question again, with its options: "Thanks. I couldn't read your answer to question 2, so I've kept the others." The blueprint waits until it has a clear answer.

   - **Only what exists (decision 2026-10-29):** Archie knows where the project stands (blueprint drafted, app built) and never offers or acts on what isn't there yet. Before a blueprint, an unclear message gets "tell me what you'd like to build", with no options. With a blueprint but nothing built, the options are Refine the blueprint, Generate Prototype and Ask about my app, and a design or feature change gets "Nothing's been generated yet, so there's no design or code to change", with what's next (refine the blueprint, or generate). Playful replies that mention changing the app wait until there is one.

   Archie checks whether a message reads as words before anything else, so gibberish that happens to contain a known word ("asdf red qwer") still gets a question, not a change. Choosing an option sends it as the person's message; typing a new message works too. Archie doesn't ask when the message is clear enough to act on safely: a small, easily undone change goes ahead and says what it assumed (§3 "It's unsure").
5. **Nothing builds without a choice, and nothing risky without permission.** A change that removes part of the app, or can't be easily undone, waits on an approval prompt ("Ask permission": what it changes, Deny / Allow); the decision then shows in the prompt. After the blueprint, Archie offers "Generate Prototype" and "Generate Full Stack Application". Choosing one sends it as the person's message; the others are disabled.
6. **Every build ends in a version.** A version card marks the current version; earlier ones can be restored. Restoring adds a system note ("Restoring to a previous version: 2 → 1") and a new current version, so nothing is lost.
7. **Send while busy queues.** While Archie works, the composer's button is Stop. Typing turns it into "Add to queue" with a small Stop beside it. Queued messages show above the composer, can be removed, and go one by one when each turn ends.
8. **Stop keeps what's done.** Stop ends the turn, keeps any text and finished files, marks unfinished steps as stopped, and says so. Queued messages then go.
9. **Errors say what's safe.** An error names the failed step, says what's unchanged, and offers Retry only when retrying can't duplicate changes.
10. **Every update says what's next.** When Archie finishes something (the blueprint, a build, a change, a fix), it says what happened, guides the next move in a sentence, and, when there are next steps, shows a "What's next" card: one row per step, each with what it produces, Archie's recommendation first (no badge: its place says it), an arrow to choose. Choosing a row sends it as the person's message; the card then locks with a check on the choice. "Or ask for something else below." keeps the composer open. One card for every "what's next" moment; it replaced the chips with a corner connector and the follow-up chips above the composer (decision 2026-10-29).
11. **The canvas follows the chat.** Plan fills in as the blueprint is drafted, with skeletons for sections still to come, so the chat and the canvas tell the same story.
12. **Commands are shortcuts, not a second language.** "/" opens the commands menu (`/prototype`, `/fullstack`, `/theme`, `/module`, `/contrast`, `/explain`). A sent command is handled like the request it stands for ("/theme blue" = "Change the color theme to blue"), with the same questions, approvals and versions. The composer interacts as intercept-ucl's does.
13. **Answers can be changed.**
    - **While answering:** questions stay in their order. Each answered one shows as asked, its answer in the person's bubble with an edit icon inside it, on the right. The edit icon reopens that question in place ("Changing question 2"), with the current answer marked, a field to type a new one, and "Keep my answer" to cancel.
    - **What a change clears:** only the answers that depend on the changed one. A question can depend on earlier ones (`dependsOn`); changing one of those asks it again, and so on down the chain. Answers that don't depend on it stay, and so does the question that was active. In the road bike store, "Where do you ship?" depends on the seller question (in a marketplace each seller ships) and "Save the rider's bike?" depends on accounts (saving a bike needs an account).
    - **The active area stays in view:** after each answer or change, the chat scrolls smoothly to the question that's now active (or jumps, under reduced motion). Scrolling yourself stops it.
    - **Once sent:** the answers bubble lists the answers and expands ("Show questions") to put each question above its answer, so the answers keep their context. ⚠️ **Decision needed:** editing sent answers ("Edit", then Update answers and a redrafted blueprint) was built and removed on 2026-10-29, for now; answers are changed while answering. Revisit it with the blueprint editing in Plan.
14. **Show the work as it happens.** While Archie thinks or builds, a live feed under its status lists what it's doing: each step it starts or finishes, in plain words ("Compared it with common e-commerce setups", "Grouped the features into 7 modules"). It shows the latest 2 steps (never more): each new step slides up into place at the bottom and the older one slides out at the top. Finished steps have a check; the newest, still in progress, has the bouncing ball. The feed keeps going when the status changes, and becomes the steps of "Thought for Ns" when the thinking ends, so nothing piles up in the conversation (progress PRD FR-02, Rule 3: decision 2026-10-29, the feed is transient). Steps are real activity, never filler (progress PRD §4.6). The feed is hidden from screen readers: the status is the live region, and the steps are in "Thought for Ns" afterwards.

## 7. Simulated conversation: road bike store

The sample responder plays these turns. Statuses follow the progress PRD's FR-03 vocabulary.

| # | Person | Archie |
| --- | --- | --- |
| 1 | "Create an e-commerce store selling high-end accessories for road bikes." | Understanding your request… → Analyzing the requirements… → "Thought for 4s". Asks 4 clarifying questions, one at a time |
| 2 | Answers (or "You decide") | Working through the details… → "Thought for 3s". Text, then "Creating project blueprint…" while Plan fills in → "Blueprint generated · 7s". Blueprint overview, then the two CTAs |
| 3 | "Generate Prototype" | Preparing your application structure… Writes files (live count, code stream), "56 files processed · View in Code", Version 1 card, follow-ups |
| 4 | "Change the accent color to green" | "Thought for 2s". "I'll update the color scheme…", code stream of `theme.css`, "4 files processed", Version 2 card |
| 5 | Restore Version 1 | System note, then a new current version |
| 6 | "Connect Stripe" | "Connecting Stripe…" fails → error card with Retry → retry succeeds |
| 7 | "What's a database relationship?" | Level 1: Thinking…, then the answer streams |
| 8 | "asdf qwer" | A playful reply that asks again, different each time ("I tried every gear and couldn't get that one moving. Tell me what you have in mind?"). No options |
| 9 | "make it better" | "I can improve a few things. Which one do you mean?" with options: The visual design, Product pages, Checkout |
| 10 | "remove the cart" | "Do you want to remove the cart icon from the header, or remove the cart and checkout entirely?" with both as options. Choosing to remove both brings an approval prompt ("Ask permission", Deny / Allow) |
| 11 | A clarifying answer typed as "sdkfj" | After the last answer: "Thanks. I couldn't read your answer to question 2, so I've kept the others." and that question again with its options. A clear answer, then the blueprint |

ℹ️ A clear message the script doesn't recognize gets the "What would you like to do?" question with options, not a canned "I can't do that", so the sample behaves like the real rule.

## 8. Implementation handoff

| Piece | Where | Notes |
| --- | --- | --- |
| Thread model and events | `src/layouts/archie/project/chat-model.ts` | Turns made of blocks, built from the responder's events (an extension of the progress PRD §11) |
| Chat parts | `src/layouts/archie/project/chat-parts.tsx` | Every "New part" in §4. Each moves to `src/components/` once it's in `archie.ds` |
| Plan canvas | `src/layouts/archie/project/plan-canvas.tsx` | Takes the blueprint as data |
| Composer Stop and queue | `PromptComposer` (UCL), new optional `onStop` | A minor API addition |
| Sample responder | `src/layouts/archie/project/sample-archie.ts` | The §7 script |

✅ **Resolved:** built 2026-10-29, as in the table; ARCHITECTURE.md "archie" has the wiring. Send and Add to queue are `brand`, voice and Stop `neutral` (DESIGN.md "PromptComposer").

⚠️ **Constraint:** the Stop and queue buttons, and every part in `chat-parts.tsx`, are read from Archie-App frames, not from `archie.ds`. Add them to `archie.ds` before they become UCL components.

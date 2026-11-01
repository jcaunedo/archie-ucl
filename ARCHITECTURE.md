# Architecture

How each app's reference layouts in `src/layouts/` are wired: which file does what, how the pieces connect, and which files are sample data. One section per app. Read an app's section before working on its layouts, and update it in the same change when the wiring changes.

What's elsewhere:

| Looking for | Go to |
| --- | --- |
| Why something looks or behaves as it does; Figma ↔ code decisions | DESIGN.md |
| What the product should do | `prds/` (Sign in / Sign up, Conversational progress feedback, Chat behavior system) |
| Repo-wide layout rules (where layouts live, not exported) | CLAUDE.md "Architecture" |
| UCL component APIs | CLAUDE.md "Current Component APIs" |

ℹ️ Apps are listed in CLAUDE.md "Project". The first layout for a new app adds its section here.

## Writing an app's section

Name the section after the app. Paths in it are relative to `src/layouts/<app>/`. Cover, as tables where items have a name and a short note:

| Part | What it says |
| --- | --- |
| The shell | The app frame every screen shares (navigation, header, page switching) and what state it owns |
| Pages or flows | Each screen's files, how you reach it, and the steps between screens in a flow |
| Sample data | Every `sample-*` file, what it holds and who uses it. Screens never import samples: the stories pass them in |
| Layout-only parts | Parts built in the layout because the design system doesn't have them yet. When it does, they move to `src/components/` and are exported |

## archie

The Archie app builder. Paths are relative to `src/layouts/archie/`. The chat follows [prds/chat-behavior-system.md](prds/chat-behavior-system.md): read it before changing how Archie behaves.

### The shell

There's no separate shell file yet: `project/project.tsx` is the whole app frame, from Figma `archie.ds` → "project", with the chat from Figma Archie-App → "Chat Experience". Split the frame out into `archie.tsx` when a second page needs it.

| Part | File | What it does |
| --- | --- | --- |
| Topbar | `project/project.tsx` | `Topbar` with the logo and project switcher on the left, MainNav (`SegmentedControl`) in the middle, actions (with the live credit balance) and the account on the right |
| Chat | `project/project.tsx` | `ChatPanel`, 440px wide: the thread (person messages, Archie's turns, day separators, the queue), and `PromptComposer`. The thread spaces items 24px apart (`gap-6`, over ChatPanelBody's 16px; decision 2026-10-29): the same above and below a message, and `MessageActions` (hidden until hover) sit in the gap under a message, 4px below it, without taking space, and the message keeps 4px more below them (`mb-1`: 28px to what follows); `ResponseActions` (always shown) sit the same way under a reply: 20px buttons 4px down, and the turn keeps 8px after them (`mb-2`), so the reply text is 32px from the next message |
| Canvas | `project/project.tsx`, `project/plan-canvas.tsx` | A `main` with a 48px header titled by the selected phase. Plan shows the blueprint (`PlanCanvas`); the other phases are still empty |

State, all in `Project`:

- `phase`: the MainNav value (`plan`, `design`, `frontend`, `backend`, `assets`). It titles the canvas. "View in Code" switches it to Frontend.
- `thread`: the conversation as `ThreadItem`s (`project/chat-model.ts`), seeded from `data.thread`. A person's message records when it was sent (`PersonMessage.sentAt`; the samples use their simulated clock). An Archie turn is one item holding its blocks in order.
- `answering`: Archie's turn is running. It marks the thread `aria-busy` and gives the composer `onStop`, so its button is Stop, or "Add to queue" with a smaller Stop once there's text.
- `queue`: messages sent while Archie works. Each shows in the thread with a remove button; the next one goes when the turn ends or is stopped.
- `plan`: how many Plan sections are drafted (`revealed`, 0 to 5) and whether Archie is still drafting. Seeded from `data.planRevealed`.
- `credits`: the balance in the topbar, lowered by each build's credits.
- A permission request waiting on the person (the latest turn's undecided `approval` block) renders as `ApprovalPrompt` on top of the composer (absolutely positioned in the footer, bottom-aligned; the composer is `inert` meanwhile); the thread shows `ApprovalRecord` once it's decided.
- `chatWidthPx`, `resizing`, `chatOpen`: the chat's width, set by dragging `ChatResizeHandle` (the 2px between chat and canvas; 320–720px, 440 by default), whether it's being dragged (turns off ChatPanel's width easing), and whether the chat is open (the handle hides when collapsed).
- `planFocus`: the Plan section a "What's next" review row asked to open (`NextStep.open`). Choosing one switches to Plan; `PlanCanvas` scrolls the section into view and rings it briefly. Next: open its first item in edit mode.
- Answers messages keep their questions and values (`PersonMessage.answers`), so they expand to show their questions.
- The chat's open state lives in `ChatPanel` (uncontrolled, `defaultChatOpen`). Scrolling: each message the person sends glides to the top of the thread (`scrollIntoViewSmoothly` with `align: "start"`, 16px of `scroll-pt-4`), and Archie's reply fills in below it; the thread doesn't follow the reply down. A spacer after the thread (`sizeSpacer()`, kept current by a ResizeObserver) gives a short reply room so the message can reach the top, and shrinks as the reply grows. A "What's next" card below the fold glides into view after that (a card that arrives mid-glide waits for it), unless the person has scrolled. Any wheel, touch, click or key stops a glide. A thread that opens on a message shows it at the top.

How Archie answers:

- `respond` (an `ArchieResponder`) stands in for Archie's backend. `Project` calls it with an `ArchieRequest` (a message, carrying the project's `stage`: blueprint drafted, app built, and the latest error not yet retried (`unresolvedError()`), so a question about it gets `explainError()`; or restoring a version) and gets back a function that stops it. A thread that opens on the person's message is answered on load.
- The responder sends `ArchieEvent`s (`project/chat-model.ts`, an extension of the progress PRD's event model §11). `applyEvent()` turns each one into a change to the current turn: a status, a step in the live feed under it (`ArchieTurn.feed`, shown by `ActivityFeed`, the latest 5), a thought, streamed text, questions, a progress line, proposed actions, files and the file being written, a version, a note or an error. `blueprint` and a build's `credits` change the page instead. `done` ends the turn.
- Times ("Thought for 3s", "Stripe connected · 2s", "Worked for 6s") are measured from the events' real timestamps, never scripted.
- Two flows from a request to build. The default, as in production: the prompt goes straight to the blueprint (`draftBlueprint("prompt")`), and Archie says which setup it chose for what the prompt left open; it ends on the overview, with no "What's next" card. "Clarification questions" (`/clarification-questions`) asks the clarifying questions first; the answers then draft it (`draftBlueprint("answers")`) and end on "What's next".
- Prototype shortcuts: commands in the `prototype` group (first in the menu, under "Preview interactions") play a scenario from `scenarios` in `sample-archie.ts`, whatever the stage (`/ask-permission`, `/clarification-questions`, `/code-generation`). Add a scenario there, and its command (`send: true`) and bubble text (`shortcutBubbles`) in `project.tsx`.
- Slash commands: the page passes `commands` to PromptComposer (the slash button sits after attach). The command set isn't defined yet: `/command-1` and `/command-2` are placeholders with no action, so they get the usual "not sure what you mean". A real command is a message like any other; the sample responder expands it to the request it stands for (`commandRequests` and `expandCommand()` in `sample-archie.ts`, empty for now).
- The page handles what the person does: Copy and Retry on their own message (`resend()`: the same message again, a set of answers again as a set, a prototype shortcut's command via `PersonMessage.sent`), answering a question (by option or by typing while one is open), choosing a proposed action, Retry on an error, Restore on a version, Stop, and the queue. `chat-model.ts` has the pure functions for each (`answerQuestion`, `editQuestion`, `withAnswer`, `currentQuestion`, `settleBlock`, `stopTurn`). Questions keep one answer slot each, so a changed answer only clears the ones that depend on it (`ClarifyingQuestion.dependsOn`, from the blueprint's `dependsOn` ids).
- Without `respond`, nothing replies and Archie stays "Thinking…" whenever the last item is the person's message. Every story passes the sample responder, so each one can be chatted with.
- A queued message goes through the same routing as a typed one when Archie is free: it answers an open question, or starts a new request.
- ℹ️ An app swaps the sample for a responder that turns its real stream into `ArchieEvent`s. The UI doesn't run timers; every change comes from an event.

### Pages

| Page | Files | How you reach it |
| --- | --- | --- |
| Project | `project/project.tsx`, `project/project.stories.tsx` (`Layouts/Archie/Project`) | Opening a project. The default phase is Plan. One story per state in the spec (`EmptyChat`, `PromptToBlueprint`, `ClarifyingQuestions`, `UnreadableAnswer`, `ChangeAnswers`, `BlueprintReady`, `VersionHistory`, `UnclearMessage`, `StepFails`, `QueueAndStop`, `ArchieReplies`). `Conversation` lets you chat with the sample Archie, and `SimulatedConversation` plays the whole script on its own (left out of `npm test`) |

### Sample data

| File | Holds | Used by |
| --- | --- | --- |
| `project/sample-archie.ts` | `createSampleArchie({ pace })`: the scripted responder for the road bike store (spec §7). `stepsFor()` gives a request's timed events. It checks first whether a message reads as words (`unreadable()`); gibberish gets a playful reply and anything it doesn't recognize a plain-text reply asking for more (`unclearReplies`, a different one each time), never options or a guess (rule 4). A question naming a part of the blueprint ("details of the Storefront") gets that part's details from the blueprint (`itemDetails()`). A request to build goes straight to the blueprint; `/clarification-questions` asks first. Each scripted turn says what it `needs` (a blueprint, or a built app); without it, Archie says so instead (`notYet()`), so nothing about design is offered before anything is generated. Questions on refining the blueprint get `refineGuide()`. Each responder has a memory, so an unreadable answer to a clarifying question is asked again and the blueprint waits for a clear one. `{ pace: 0 }` answers at once for tests | `project.stories.tsx`, passed in as `respond`; `sample-project.ts` |
| `project/sample-project.ts` | `sampleProject` (the prompt, Archie about to answer), `sampleProjectWithReply` (the clarification questions flow, questions waiting), `sampleBlueprintReady` (the clarification questions flow answered: Plan full, "What's next" waiting), `sampleVersionHistory` (two versions, two days apart) and `sampleNewProject` (an empty chat). Each thread replays the script on a simulated clock, so it matches the live conversation | `project.stories.tsx`, passed in as `data` |
| `@/sample-data/road-bike-store` | The blueprint (Plan's content, the clarifying questions and their answers) | `sample-project.ts` (as `data.blueprint`), `sample-archie.ts` |

### Layout-only parts

Each one replaces a component UCL doesn't have yet. When it lands in UCL, swap it in and remove it here.

| Part | File | Waiting for |
| --- | --- | --- |
| `LogoLink`, `ArchieMark` (the collapsed chat rail's mark) | `project/parts.tsx` | An Archie logo mark component |
| `ProjectSwitcher`, `ChatSwitcher`, `ModelPicker` | `project/parts.tsx` | DropdownMenu or Select |
| `Account` | `project/parts.tsx` | Avatar |
| `TopbarActions`'s notification dot | `project/parts.tsx` | A Badge or dot on Button (Figma "Show Red Dot") |
| `TopbarActions`'s credits pie (`images/credits.svg`, always the same slice) | `project/parts.tsx` | A credits meter that draws the real balance (DESIGN.md "Topbar") |
| `TopbarActions`, `ChatActions` | `project/parts.tsx` | Nothing: they're UCL Buttons holding the page's copy |
| `ChatResizeHandle` | `project/parts.tsx` | A Resizable component (shadcn Resizable) in UCL, and the handle in Figma |
| `ArchieText`, `ActivityFeed`, `MessageActions` (when the message was sent, `formatSentAt()`: the time today, the date and time before; then Copy and Retry, 20px; under the person's message, on hover or focus; their tooltips open below and ignore the pointer, so the hover holds), `FeedbackButtons` (Good / Bad response: a pick hides the other and fills, motion from `iconSwapVariants`, `layout` and `motionScale.pickIcon`), `ApprovalPrompt` (wraps UCL `PromptAlert`), `ThoughtDisclosure`, `QuestionsCard`, `AnswersMessage`, `ProgressLine`, `NextSteps`, `FilesProcessed` (with the code stream), `VersionCard`, `ResponseActions`, `ErrorCard`, `Note`, `DaySeparator`, `QueueList`, `PromptStarters` | `project/chat-parts.tsx` | Their components in `archie.ds` (spec §4, §8). They come from Figma Archie-App, which isn't a design-system file |
| `PlanCanvas` | `project/plan-canvas.tsx` | Plan's components in `archie.ds` (chips, section header, description card) |

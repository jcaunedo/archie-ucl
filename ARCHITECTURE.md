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
| Chat | `project/project.tsx` | `ChatPanel`, 440px wide: the thread (person messages, Archie's turns, day separators, the queue), and `PromptComposer` |
| Canvas | `project/project.tsx`, `project/plan-canvas.tsx` | A `main` with a 48px header titled by the selected phase. Plan shows the blueprint (`PlanCanvas`); the other phases are still empty |

State, all in `Project`:

- `phase`: the MainNav value (`plan`, `design`, `frontend`, `backend`, `assets`). It titles the canvas. "View in Code" switches it to Frontend.
- `thread`: the conversation as `ThreadItem`s (`project/chat-model.ts`), seeded from `data.thread`. An Archie turn is one item holding its blocks in order.
- `answering`: Archie's turn is running. It marks the thread `aria-busy` and gives the composer `onStop`, so its button is Stop, or "Add to queue" with a smaller Stop once there's text.
- `queue`: messages sent while Archie works. Each shows in the thread with a remove button; the next one goes when the turn ends or is stopped.
- `plan`: how many Plan sections are drafted (`revealed`, 0 to 5) and whether Archie is still drafting. Seeded from `data.planRevealed`.
- `credits`: the balance in the topbar, lowered by each build's credits.
- Answers messages keep their questions and values (`PersonMessage.answers`), so they expand to show their questions.
- The chat's open state lives in `ChatPanel` (uncontrolled, `defaultChatOpen`). The thread follows the newest content unless the person has scrolled up; sending pins it to the end again.

How Archie answers:

- `respond` (an `ArchieResponder`) stands in for Archie's backend. `Project` calls it with an `ArchieRequest` (a message, or restoring a version) and gets back a function that stops it. A thread that opens on the person's message is answered on load.
- The responder sends `ArchieEvent`s (`project/chat-model.ts`, an extension of the progress PRD's event model §11). `applyEvent()` turns each one into a change to the current turn: a status, a step in the live feed under it (`ArchieTurn.feed`, shown by `ActivityFeed`, the latest 2), a thought, streamed text, questions, a progress line, proposed actions, files and the file being written, a version, a note or an error. `blueprint` and a build's `credits` change the page instead. `done` ends the turn.
- Times ("Thought for 3s", "Blueprint generated · 7s", "Worked for 6s") are measured from the events' real timestamps, never scripted.
- Slash commands: the page passes `commands` to PromptComposer (the slash button sits after attach). A sent command ("/theme blue") is a message like any other; the sample responder expands it to the request it stands for (`expandCommand()` in `sample-archie.ts`).
- The page handles what the person does: answering a question (by option or by typing while one is open), choosing a proposed action, Retry on an error, Restore on a version, Stop, and the queue. `chat-model.ts` has the pure functions for each (`answerQuestion`, `editQuestion`, `withAnswer`, `currentQuestion`, `settleBlock`, `stopTurn`). Questions keep one answer slot each, so a changed answer only clears the ones that depend on it (`ClarifyingQuestion.dependsOn`, from the blueprint's `dependsOn` ids).
- Without `respond`, nothing replies and Archie stays "Thinking…" whenever the last item is the person's message. Every story passes the sample responder, so each one can be chatted with.
- A queued message goes through the same routing as a typed one when Archie is free: it answers an open question, or starts a new request.
- ℹ️ An app swaps the sample for a responder that turns its real stream into `ArchieEvent`s. The UI doesn't run timers; every change comes from an event.

### Pages

| Page | Files | How you reach it |
| --- | --- | --- |
| Project | `project/project.tsx`, `project/project.stories.tsx` (`Layouts/Archie/Project`) | Opening a project. The default phase is Plan. One story per state in the spec (`EmptyChat`, `ClarifyingQuestions`, `UnreadableAnswer`, `ChangeAnswers`, `BlueprintReady`, `VersionHistory`, `UnclearMessage`, `StepFails`, `QueueAndStop`, `ArchieReplies`). `Conversation` lets you chat with the sample Archie, and `SimulatedConversation` plays the whole script on its own (left out of `npm test`) |

### Sample data

| File | Holds | Used by |
| --- | --- | --- |
| `project/sample-archie.ts` | `createSampleArchie({ pace })`: the scripted responder for the road bike store (spec §7). `stepsFor()` gives a request's timed events. It checks first whether a message reads as words (`unreadable()`); gibberish and anything it doesn't recognize get a clarifying question (rule 4). Each responder has a memory, so an unreadable answer to a clarifying question is asked again and the blueprint waits for a clear one. `{ pace: 0 }` answers at once for tests | `project.stories.tsx`, passed in as `respond`; `sample-project.ts` |
| `project/sample-project.ts` | `sampleProject` (the prompt, Archie about to answer), `sampleProjectWithReply` (questions waiting), `sampleBlueprintReady` (Plan full, CTAs waiting), `sampleVersionHistory` (two versions, two days apart) and `sampleNewProject` (an empty chat). Each thread replays the script on a simulated clock, so it matches the live conversation | `project.stories.tsx`, passed in as `data` |
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
| `ArchieText`, `ActivityFeed`, `ApprovalPrompt` (wraps UCL `PromptAlert`), `ThoughtDisclosure`, `QuestionsCard`, `AnswersMessage`, `ProgressLine`, `NextSteps`, `FilesProcessed` (with the code stream), `VersionCard`, `ResponseActions`, `ErrorCard`, `Note`, `DaySeparator`, `QueueList`, `PromptStarters` | `project/chat-parts.tsx` | Their components in `archie.ds` (spec §4, §8). They come from Figma Archie-App, which isn't a design-system file |
| `PlanCanvas` | `project/plan-canvas.tsx` | Plan's components in `archie.ds` (chips, section header, description card) |

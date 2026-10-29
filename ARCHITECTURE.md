# Architecture

How each app's reference layouts in `src/layouts/` are wired: which file does what, how the pieces connect, and which files are sample data. One section per app. Read an app's section before working on its layouts, and update it in the same change when the wiring changes.

What's elsewhere:

| Looking for | Go to |
| --- | --- |
| Why something looks or behaves as it does; Figma ↔ code decisions | DESIGN.md |
| What the product should do | `prds/` (Sign in / Sign up, Conversational progress feedback) |
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

The Archie app builder. Paths are relative to `src/layouts/archie/`.

### The shell

There's no separate shell file yet: `project/project.tsx` is the whole app frame, from Figma `archie.ds` → "project". Split the frame out into `archie.tsx` when a second page needs it.

| Part | File | What it does |
| --- | --- | --- |
| Topbar | `project/project.tsx` | `Topbar` with the logo and project switcher on the left, MainNav (`SegmentedControl`) in the middle, actions and the account on the right |
| Chat | `project/project.tsx` | `ChatPanel`, 440px wide: `ChatMessage` for the person, plain text for Archie, `ActivityIndicator` while Archie thinks, `PromptComposer` at the bottom |
| Canvas | `project/project.tsx` | A `main` with a 48px header titled by the selected phase, over an empty content area each phase will fill |

State, all in `Project`:

- `phase`: the MainNav value (`plan`, `design`, `frontend`, `backend`, `assets`). It titles the canvas.
- `messages`: the thread, seeded from `data.messages`. Sending from the composer appends the person's message.
- `answering` and `status`: Archie's turn. `answering` makes PromptComposer `pending`; `status` is the label in the one `ActivityIndicator`.
- The chat's open state lives in `ChatPanel` (uncontrolled, `defaultChatOpen`). `ChatPanelTrigger` in `ChatActions` collapses it to the rail; the rail expands it.
- The thread follows the newest content as it streams, unless the person has scrolled up. Sending pins it to the end again.

How Archie answers:

- `respond` (an `ArchieResponder`) stands in for Archie's backend. `Project` calls it with each sent message and gets back a function that stops it. A thread that opens on the person's message is answered on load.
- The responder sends `ArchieEvent`s, a trimmed version of the PRD's event model (`prds/conversational-progress-feedback.md` §11). `status` replaces the indicator's label. The first `reply` chunk adds Archie's message and removes the indicator; later chunks extend it. `done` ends the turn and frees Send.
- Without `respond`, nothing replies and Archie stays "Thinking…" whenever the last message is the person's (Figma's frame).
- ℹ️ An app swaps the sample for a responder that turns its real stream into `ArchieEvent`s. The UI doesn't run timers; every change comes from an event.

### Pages

| Page | Files | How you reach it |
| --- | --- | --- |
| Project | `project/project.tsx`, `project/project.stories.tsx` (`Layouts/Archie/Project`) | Opening a project. The default phase is Plan. `Conversation` lets you chat with the sample Archie, and `SimulatedConversation` plays a whole conversation on its own (left out of `npm test`) |

### Sample data

| File | Holds | Used by |
| --- | --- | --- |
| `project/sample-project.ts` | `sampleProject` (one request, Archie thinking), `sampleProjectWithReply` (Archie has answered) and `sampleNewProject` (an empty chat): org, project, credits, avatar, chat title, model, messages | `project.stories.tsx`, passed in as `data` |
| `project/sample-archie.ts` | `createSampleArchie()`: a scripted responder for the ice cream inventory project. Its turns cover the PRD's three levels (question, review, change), plus a fallback that lists what it can answer. `{ statusMs: 0, wordMs: 0 }` answers at once for tests | `project.stories.tsx`, passed in as `respond` |

### Layout-only parts

All in `project/parts.tsx`, with their images in `project/images/`. Each one replaces a component UCL doesn't have yet:

| Part | Waiting for |
| --- | --- |
| `LogoLink`, `ArchieMark` (the collapsed chat rail's mark) | An Archie logo mark component |
| `ProjectSwitcher`, `ChatSwitcher`, `ModelPicker` | DropdownMenu or Select |
| `Account` | Avatar |
| `TopbarActions`'s notification dot | A Badge or dot on Button (Figma "Show Red Dot") |
| `TopbarActions`'s credits pie (`images/credits.svg`, Figma's drawing, always the same slice) | A credits meter that draws the real balance (DESIGN.md "Topbar") |
| `TopbarActions`, `ChatActions` | Nothing: they're UCL Buttons. They live here because they hold the page's copy |

⚠️ **Gap:** Archie's replies render as plain `text-sm` text (Figma's "Text" placeholder). Replace them when a reply component exists.

<!--
Created: Oct 15, 2026
Created by: Julio Caunedo
Last updated: Oct 28, 2026
Scope: Progress, reasoning and execution feedback in the AI chat, plus the UCL components that render it (activity indicator, activity disclosure, execution progress, completion summary).
Purpose: Replace the audit-log presentation of AI activity with a conversational, progressively disclosed experience grounded in real system events.
-->

# PRD: Conversational progress and execution feedback

**Product:** Archie
**Version:** 1.0
**Status:** Proposed
**Priority:** High
**Scope:** AI chat, reasoning feedback, tool execution, and application-building workflows

---

## 1. Overview

Archie should communicate its activity through a natural, conversational experience rather than displaying a continuously growing list of internal operations.

The current approach risks making the interaction feel like a system audit, diagnostic report, or execution log instead of a conversation with an intelligent product-building assistant.

This PRD introduces a unified progress feedback system built around three principles:

1. **Conversational by default:** Communicate what Archie is doing using concise, human-readable language.
2. **Progressive disclosure:** Show only the most relevant activity by default. Make additional details accessible when needed.
3. **Operational transparency:** Clearly communicate meaningful actions that modify, generate, or deploy application resources.

The experience must adapt to task complexity without requiring users to configure or understand different progress modes.

## 2. Problem statement

The existing AI activity experience places too much emphasis on internal processing steps.

This creates several UX issues:

- The conversation feels like an audit trail instead of a natural interaction.
- Internal system operations compete visually with the AI response.
- Users may struggle to distinguish reasoning from actual execution.
- Too many intermediate messages introduce unnecessary cognitive load.
- Progress feedback can become repetitive, particularly during simple requests.
- System activity is presented with similar prominence regardless of its relevance to the user.

Archie needs to communicate activity, progress, and outcomes without exposing unnecessary implementation details.

## 3. Goals

### Primary goals

- Establish a consistent conversational progress experience.
- Reduce visual noise during AI processing.
- Differentiate reasoning, tool usage, and application execution.
- Preserve transparency through expandable progress details.
- Make long-running tasks feel understandable and manageable.
- Support user control during execution.
- Maintain an uninterrupted conversational experience from request to response.

### Secondary goals

- Support both technical and non-technical users.
- Create reusable components across Archie.
- Support future agentic workflows and multi-step execution.
- Improve perceived responsiveness.
- Make troubleshooting information available without overwhelming the primary interface.

### Non-goals

- Exposing raw model chain-of-thought.
- Displaying internal prompts, tokens, or hidden reasoning.
- Replacing dedicated execution logs or developer tools.
- Creating a separate progress interface for every Archie feature.
- Providing artificial progress percentages.
- Simulating activities or completion steps that have not actually occurred.

## 4. Experience principles

### 4.1 Show intent, not implementation

Archie should describe its activities in terms users understand.

Preferred:

- Understanding your request…
- Reviewing your project…
- Working through the details…
- Updating your data model…
- Generating your application…

Avoid:

- Parsing prompt…
- Running inference…
- Processing tokens…
- Executing LLM pipeline…
- Evaluating model output…

Technical operations may appear in expanded execution details when relevant.

### 4.2 One primary status at a time

During standard reasoning, Archie should present a single active status.

When the activity changes, the status should update in place rather than creating additional messages.

Example:

Understanding your request…
↓
Reviewing your project…
↓
Putting it together…
↓
Response begins streaming.

Previous reasoning statuses should not accumulate in the main conversation.

### 4.3 Match feedback to task complexity

A simple question should not produce the same progress experience as generating an entire application.

The system should select an appropriate feedback pattern based on actual task activity.

### 4.4 Reveal complexity progressively

The default experience should remain lightweight.

Detailed activity should be accessible through an expandable disclosure control when meaningful events exist.

Users should not be forced to inspect steps to understand the final result.

### 4.5 Distinguish thinking from doing

Reasoning and execution represent different types of activity.

**Reasoning:** Archie is interpreting, evaluating, or preparing a response.

**Execution:** Archie is performing observable work, such as creating files, modifying the database schema, generating application code, or deploying a build.

Execution requires greater visibility and clearer outcomes.

### 4.6 Never fabricate progress

Statuses and completed steps must be grounded in actual system events.

Do not generate a sequence of arbitrary statuses solely to make the interface appear active.

If the backend cannot identify a specific activity, use a generic status such as "Working on your request…" rather than claiming work that cannot be verified.

## 5. Experience model

The system should support three levels of progress feedback.

### Level 1 — Simple conversation

**Use cases:**

- Asking general questions.
- Requesting explanations.
- Short conversational interactions.
- Simple copywriting or content generation.

**Behavior:**

- Show a minimal initial activity indicator when needed.
- Use a concise status such as "Thinking…"
- Begin streaming the response as soon as content becomes available.
- Remove the active indicator when the response begins.
- Do not display an execution checklist.
- Do not introduce an expandable activity trace unless meaningful events exist.

**Example:**

> **User:** What is authentication?
>
> **Archie:** Thinking…
>
> **Archie:** Authentication is the process of verifying who a user is…

### Level 2 — Contextual reasoning

**Use cases:**

- Analyzing project requirements.
- Reviewing existing architecture.
- Evaluating implementation approaches.
- Preparing application specifications.
- Comparing project features.

**Behavior:**

- Show one contextual status at a time.
- Update the status only when a meaningful activity transition occurs.
- Do not accumulate previous statuses in the main conversation.
- Allow users to expand a summary of meaningful activity when available.
- Collapse the progress trace once the final response begins streaming.
- Preserve relevant activity for later inspection.

**Example:**

Understanding your request…
↓
Reviewing your project…
↓
Working through the details…
↓
Response streams.

Completed disclosure example:

"Reviewed project context · 3 steps"

Expanded:

- Reviewed the existing project structure.
- Examined relevant application requirements.
- Prepared an implementation recommendation.

These steps must represent actual completed activities, not invented reasoning milestones.

### Level 3 — Agentic execution

**Use cases:**

- Generating a new application.
- Creating or modifying a data model.
- Implementing authentication.
- Generating frontend code.
- Creating backend services.
- Running tests.
- Deploying an application.
- Executing multi-step operations.

**Behavior:**

- Present a prominent but compact active execution status.
- Display the current operation in user-oriented language.
- Provide expandable execution details.
- Show completion, failure, and blocked states for actual operations.
- Display step counts only when the total number of steps is known.
- Allow users to stop or cancel operations when supported.
- Require approval for consequential actions based on existing product permissions and policies.
- Preserve execution outcomes in the conversation.

**Example:**

"Building your application…"

"3 of 5 steps completed · View progress"

Expanded:

- Completed: Created data model.
- Completed: Configured authentication.
- Completed: Generated backend services.
- In progress: Generating frontend.
- Pending: Running validation.

The expanded view must update as operations complete.

If the execution plan changes dynamically, use "3 steps completed" instead of "3 of 5" until the total becomes reliable.

## 6. Functional requirements

### FR-01 — Immediate activity feedback

When a user submits a valid request, Archie must acknowledge that the request has been received.

Requirements:

- Display activity feedback if a response is not immediately available.
- Prevent duplicate active indicators.
- Keep the status associated with the correct conversation turn.
- Do not show a completed state until an actual completion event occurs.

### FR-02 — Dynamic status replacement

The primary reasoning status must update in place.

Requirements:

- Only one reasoning status is visible at a time.
- Previous reasoning statuses do not accumulate in the main conversation.
- Avoid rapidly cycling through statuses.
- Skip intermediate statuses when the operation completes quickly.
- Do not introduce artificial delays to display status changes.
- Never allow a stale event to overwrite a newer status.

### FR-03 — Contextual status language

Use a centralized status vocabulary.

| Context                 | Recommended status            |
| ----------------------- | ----------------------------- |
| Initial request         | Understanding your request…   |
| General reasoning       | Thinking…                     |
| Project inspection      | Reviewing your project…       |
| Requirement analysis    | Analyzing the requirements…   |
| Preparing an approach   | Working through the details…  |
| Response preparation    | Putting it together…          |
| Data model modification | Updating your data model…     |
| Authentication setup    | Configuring authentication…   |
| Backend generation      | Generating backend services…  |
| Frontend generation     | Building your interface…      |
| Validation              | Validating the changes…       |
| Deployment              | Deploying your application…   |

These labels are illustrative and must be associated with real task context.

Avoid using multiple interchangeable generic messages without an underlying activity transition.

### FR-04 — Collapsible activity details

Archie must support an expandable activity component for requests with meaningful intermediate work.

**Collapsed state:**

Display a concise summary, for example:

"Reviewed project · 3 steps"

For active operations:

"Building your application… · View progress"

**Expanded state:**

Display relevant activities in chronological order with their respective statuses.

Requirements:

- Collapsed by default.
- Users may expand and collapse the details at any time.
- Expansion must not interrupt processing.
- Active operations continue updating while expanded.
- Activity remains available after completion where retained by the product.
- Do not display raw chain-of-thought or sensitive implementation data.
- Use accurate descriptions of observable operations.

### FR-05 — Streaming response integration

The progress component must integrate with response streaming.

Requirements:

- Begin rendering the response as soon as useful content is available.
- Transition the reasoning indicator to its completed/collapsed state.
- Avoid duplicating the same status above and below the response.
- Do not wait for unrelated background operations to finish before rendering the response when the architecture supports independent streaming.
- Keep genuinely ongoing execution operations visible until they complete.

### FR-06 — Meaningful tool activity

When Archie accesses external services, project resources, tools, or APIs, those activities should be represented when they materially affect the result.

Examples:

- Reading project files.
- Examining the data model.
- Updating a resource.
- Generating code.
- Running validation.
- Calling an external integration.

Each displayed tool activity should include, where appropriate:

- Human-readable action.
- Target resource.
- Current status.
- Outcome.
- Duration, when measured.
- Error details, if the operation fails.

Do not expose credentials, private tokens, or unnecessary technical payloads.

### FR-07 — Execution progress

Multi-step execution must communicate actual progress.

Supported step statuses:

- Pending
- In progress
- Completed
- Failed
- Canceled
- Skipped
- Awaiting approval

Requirements:

- Only one status per step at a time.
- Multiple operations may run concurrently when supported by the backend.
- Completed steps remain visibly distinct from pending steps.
- Show completion counts only when grounded in actual execution data.
- Avoid percentage-based indicators unless the system provides measurable progress.
- Support changes in the execution plan.
- Do not imply completion when a step has merely started.

### FR-08 — Interruption and cancellation

Users should retain control during generation and execution.

Requirements:

- Preserve an accessible Stop action while response generation is active.
- For long-running execution, provide Stop or Cancel when supported.
- Distinguish stopping response streaming from canceling operations that change resources.
- Do not imply that cancellation automatically rolls back completed changes.
- Clearly communicate operations that cannot be interrupted.
- Preserve completed operations and their outcomes.
- Communicate partial completion when execution stops.

Example:

"Stopped. Your data model was updated, but frontend generation was not completed."

The availability of Stop, Cancel, or Pause must match actual backend capabilities.

### FR-09 — Approval checkpoints

When execution requires explicit user approval:

- Transition the operation to "Awaiting approval."
- Present the proposed action and its impact.
- Provide clear approval and rejection controls.
- Suspend the dependent action until approval is received.
- Resume or terminate the operation based on the decision.

Example:

"Your application is ready to deploy. Review the changes before publishing."

Approval behavior must follow Archie's existing permissions and execution rules.

### FR-10 — Completion state

When activity finishes:

**For simple chat:**

- Remove the active indicator.
- Display the completed response.

**For contextual reasoning:**

- Collapse the activity details if meaningful steps exist.
- Keep the final response visually dominant.

**For agentic execution:**

- Show a clear completed outcome.
- Keep execution details accessible.
- Summarize what changed.
- Provide appropriate next actions.

Example:

"Authentication is ready."

"Added email login, session management, and protected routes."

### FR-11 — Error handling and recovery

Failures must be understandable and actionable.

Requirements:

- Replace indefinite progress with a clear failure state.
- Identify the failed operation when known.
- Preserve successfully completed operations.
- Provide Retry when the operation can safely be repeated.
- Avoid suggesting that a retry is harmless if duplicate changes are possible.
- Provide alternative recovery guidance when retry is unavailable.

Example:

"Couldn't finish generating your frontend."

"Your backend is ready, but frontend generation stopped."

Action: Retry frontend generation

### FR-12 — Persistence and restoration

For workflows that support persisted execution records:

- Restore the latest known task state after refresh or navigation.
- Preserve completed steps and known outcomes.
- Resume live updates when an operation remains active.
- Avoid presenting a stale operation as actively running.
- If execution status cannot be determined, show an explicit unknown or disconnected state.

Persistence must follow existing project and conversation access permissions.

## 7. Interaction state model

The implementation should distinguish the conversational lifecycle from the execution lifecycle.

### Conversation states

| State      | Expected behavior                     |
| ---------- | ------------------------------------- |
| Idle       | No activity indicator                 |
| Submitted  | Acknowledge request                   |
| Reasoning  | Show contextual, replaceable status   |
| Responding | Stream response content               |
| Completed  | Show final response                   |
| Failed     | Explain failure and recovery          |
| Stopped    | Preserve partial response and outcome |

### Execution states

| State             | Expected behavior                                  |
| ----------------- | -------------------------------------------------- |
| Pending           | Operation not started                              |
| Running           | Show active operation                              |
| Awaiting approval | Display human decision controls                    |
| Completed         | Confirm successful operation                       |
| Failed            | Surface failure and recovery                       |
| Canceled          | Confirm cancellation outcome                       |
| Skipped           | Explain when relevant                              |
| Unknown           | Communicate that current status cannot be verified |

A conversation can be streaming a response while an execution operation is still active.

Do not force both lifecycles into a single mutually exclusive state machine.

## 8. Behavioral rules

### Rule 1 — Avoid unnecessary statuses

Fast responses should transition directly into streaming without cycling through multiple progress messages.

### Rule 2 — No artificial animation sequences

Status transitions must correspond to actual events rather than predefined timers.

### Rule 3 — No audit trail in the primary conversation

Intermediate activity should not be rendered as multiple assistant messages unless it represents meaningful conversational communication.

### Rule 4 — Keep the response dominant

Progress indicators should remain visually secondary to the actual assistant response.

### Rule 5 — Preserve meaningful execution evidence

Actions that modify an application should remain inspectable after completion.

### Rule 6 — Distinguish proposed and completed actions

A planned step must never appear completed before the underlying operation succeeds.

### Rule 7 — Support unknown progress

If total execution steps or duration cannot be reliably estimated, communicate activity without invented numbers or ETAs.

### Rule 8 — Avoid excessive visual motion

Use subtle transitions. Do not animate every completed operation or cause frequent layout shifts.

### Rule 9 — Maintain conversational continuity

The user should remain within the same conversation as Archie transitions between reasoning, tool use, execution, and response.

### Rule 10 — Respect user intent and permissions

The progress component communicates actions but does not authorize them. Approval and permission enforcement must occur in the execution layer.

## 9. Component requirements

### Component A — Activity indicator

Used for simple conversations and contextual reasoning.

**Elements:**

- Subtle activity indicator.
- Dynamic status label.
- Optional disclosure control when relevant.

**Variants:**

- Default
- Active
- Completed
- Failed

**Behavior:**

- Status updates in place.
- Does not create new conversation messages.
- Disappears or collapses when the answer begins streaming.

### Component B — Activity disclosure

Used when intermediate steps provide meaningful transparency.

**Elements:**

- Summary label.
- Expand/collapse control.
- Activity list.
- Individual activity states.
- Optional measured duration.

**Variants:**

- Collapsed
- Expanded
- Running
- Completed
- Failed

**Behavior:**

- Collapsed by default.
- Preserves the user's current expand/collapse choice during an active operation.
- Supports keyboard interaction.
- Updates without disrupting reading position.

### Component C — Execution progress

Used for application-building and multi-step operations.

**Elements:**

- Current operation title.
- Overall status.
- Optional completed step count.
- Expandable execution details.
- Contextual controls.
- Completion or failure summary.

**Behavior:**

- Represents actual execution steps.
- Supports multiple operation states.
- Reflects backend updates.
- Supports cancellation when available.
- Supports approval gates where required.

### Component D — Completion summary

Used when a meaningful operation finishes.

**Elements:**

- Outcome title.
- Summary of completed changes.
- Optional links to modified resources.
- Appropriate follow-up actions.

Example:

"Your backend is ready."

"Created 5 database tables, configured authentication, and generated API endpoints."

Possible actions:

- View backend
- Review changes
- Continue building

## 10. Visual and interaction guidelines

### Visual hierarchy

1. Final assistant response.
2. Current meaningful action.
3. Optional progress disclosure.
4. Technical execution details.

### Layout

- Avoid unnecessary nested cards.
- Prefer compact inline indicators for reasoning.
- Use an expanded activity area only when additional detail is useful.
- Maintain consistent alignment within the chat.
- Minimize visual separation between an operation and its related response.
- Preserve the conversation's natural vertical flow.

### Motion

- Use subtle transitions for status replacement.
- Avoid repetitive attention-grabbing animations.
- Minimize layout shifts when labels change.
- Respect reduced-motion preferences.
- Do not animate completed steps indefinitely.

### Accessibility

- Use semantic status and progress information.
- Provide accessible labels for expansion controls.
- Expose `aria-expanded` on disclosure triggers.
- Announce meaningful changes using appropriate live-region behavior.
- Avoid announcing every rapid status update.
- Ensure keyboard support for all interactive controls.
- Do not rely on color alone to distinguish execution states.
- Meet WCAG 2.2 AA requirements for applicable components.

## 11. Data and event model

The frontend should consume structured activity events rather than infer operations from arbitrary assistant text.

Suggested conceptual event schema:

```typescript
type ActivityEvent = {
	id: string;
	conversationId: string;
	messageId?: string;
	runId?: string;
	stepId?: string;

	type: "reasoning" | "tool" | "execution" | "approval" | "response";

	status:
		| "pending"
		| "running"
		| "awaiting_approval"
		| "completed"
		| "failed"
		| "canceled"
		| "skipped"
		| "unknown";

	label: string;
	description?: string;

	startedAt?: string;
	completedAt?: string;

	sequence?: number;
	parentId?: string;

	metadata?: Record<string, unknown>;
};
```

This schema is a recommended frontend contract, not a requirement to replace an existing Archie backend implementation.

Engineering should first map the existing streaming and execution event architecture to these UI requirements.

### Implementation considerations

- Maintain stable event identifiers.
- Use sequence information or equivalent ordering guarantees.
- Prevent stale updates from overwriting newer states.
- Ensure repeated events are handled idempotently.
- Separate transient reasoning indicators from persisted execution outcomes.
- Sanitize all user-visible event descriptions.
- Avoid leaking protected project details into unauthorized sessions.
- Support reconnecting to active runs.
- Keep approval decisions enforced by the backend.

## 12. Example user journeys

### Scenario A — Simple question

**User:** What is a database relationship?

**Archie:**

- Shows "Thinking…" if necessary.
- Begins streaming the explanation.
- Removes the activity indicator.
- Completes the response.

**Expected outcome:** Minimal UI overhead.

### Scenario B — Project analysis

**User:** Can you review my current data model and suggest improvements?

**Archie:**

- Understanding your request…
- Reviewing your data model…
- Preparing recommendations…

The response begins streaming.

The activity disclosure becomes:

"Reviewed data model · 2 steps"

Expanded activity includes verified operations such as retrieving schema information and checking relationships.

**Expected outcome:** The user receives a conversational recommendation with optional evidence of the work performed.

### Scenario C — Application generation

**User:** Build a project management application with teams, tasks, and role-based access.

**Archie:**

- Understanding your requirements…
- Preparing your application structure…
- Building your application…

The interface switches to execution feedback when actual generation begins.

Expanded execution:

- Created data model.
- Configured roles and permissions.
- Generating backend services.
- Generating frontend.
- Validating application.

The current operation remains visible until execution completes.

On completion, Archie summarizes the implementation and provides relevant next actions.

**Expected outcome:** Users understand execution progress without navigating a technical audit interface.

### Scenario D — Interrupted generation

**User:** Stop.

Archie requests cancellation of the active operation.

Once the backend confirms the outcome, Archie identifies what was completed and what remains unfinished.

**Expected outcome:** Clear user control without implying that completed changes were automatically reversed.

### Scenario E — Execution failure

Frontend generation fails after backend generation succeeds.

Archie displays:

"Couldn't finish generating your frontend."

"Your backend was generated successfully."

The user can inspect the failure and retry the incomplete operation when supported.

**Expected outcome:** Transparent, recoverable failure with preserved work.

## 13. Acceptance criteria

### Conversational feedback

- [ ] Simple requests do not display unnecessary multi-step activity.
- [ ] Only one active reasoning status appears at a time.
- [ ] Status changes update the existing indicator.
- [ ] Reasoning statuses do not accumulate as conversation messages.
- [ ] The response begins streaming as soon as content is available.
- [ ] The active reasoning indicator disappears or collapses appropriately.

### Progressive disclosure

- [ ] Meaningful activity details are collapsed by default.
- [ ] Users can expand and collapse activity without interrupting a request.
- [ ] Completed activity remains inspectable when supported.
- [ ] Generic requests without meaningful steps do not show empty disclosures.
- [ ] Activity descriptions are understandable without technical knowledge.

### Execution feedback

- [ ] Actual execution operations are distinguished from reasoning.
- [ ] Each displayed execution step reflects a real operation.
- [ ] Step status updates accurately.
- [ ] Completion counts are shown only when supported by actual progress data.
- [ ] Unknown total progress does not generate artificial percentages.
- [ ] Failed steps remain distinguishable from completed steps.
- [ ] Final execution results summarize what changed.

### User control

- [ ] Stop is available during active streaming when supported.
- [ ] Cancel or equivalent control is available for interruptible operations.
- [ ] Cancellation outcomes accurately communicate partial completion.
- [ ] Approval checkpoints prevent dependent consequential actions until authorized.
- [ ] Retry is provided only where technically and operationally safe.

### Quality and accessibility

- [ ] Activity updates do not cause excessive layout shifts.
- [ ] All interactive controls support keyboard navigation.
- [ ] Status changes are accessible without excessive screen-reader announcements.
- [ ] Reduced-motion preferences are respected.
- [ ] Sensitive data is not exposed in activity details.
- [ ] Stale or duplicated backend events do not corrupt displayed progress.

## 14. Success metrics

The following metrics should be evaluated against the existing experience.

### Primary metrics

- **Task completion rate:** Percentage of initiated tasks successfully completed.
- **Interaction clarity:** Percentage of users who correctly understand whether Archie is thinking, executing, or awaiting input.
- **Progress comprehension:** Ability to identify the current task state and the next expected action.
- **Error recovery rate:** Percentage of recoverable failures successfully resolved.

### Secondary metrics

- Activity disclosure expansion rate.
- User-initiated cancellation rate.
- Repeated prompt submission during active execution.
- Time to first visible feedback.
- Time to first streamed response content.
- Abandonment rate during long-running operations.
- Accessibility and usability issues related to status feedback.

Avoid using disclosure expansion alone as a measure of success. Low expansion may indicate that the default experience communicates enough information.

## 15. Delivery phases

### Phase 1 — Conversational progress foundation

**Priority:** P0

Deliver:

- Unified activity indicator.
- Dynamic status replacement.
- Simple and contextual reasoning behavior.
- Streaming transitions.
- Collapsible meaningful activity details.
- Basic failure and stopped states.

Goal: Eliminate the audit-like presentation from normal AI conversations.

### Phase 2 — Agentic execution experience

**Priority:** P1

Deliver:

- Structured execution feedback.
- Running, completed, failed, and skipped steps.
- Live execution updates.
- Step counts where known.
- Interruption and cancellation behavior.
- Completion summaries.
- Approval state integration.

Goal: Provide operational transparency for actual application-building tasks.

### Phase 3 — Advanced transparency and recovery

**Priority:** P2

Deliver:

- More detailed execution inspection.
- Navigation to affected resources.
- Enhanced retry and recovery flows.
- Persisted execution history where supported.
- Improved restoration after disconnects.
- Advanced execution trace access for technical users.

Goal: Improve trust and troubleshooting without compromising the default conversational experience.

## 16. Dependencies

Implementation depends on:

- Existing Archie chat architecture.
- Streaming response infrastructure.
- Backend task and execution event availability.
- Tool invocation lifecycle.
- Project permissions and approval rules.
- Existing cancellation capabilities.
- Available persisted execution records.
- Archie design system components and tokens.

Engineering should assess current infrastructure before introducing additional event types or modifying API contracts.

## 17. Design and engineering handoff

Design should define:

- Activity indicator variants and states.
- Collapsed and expanded activity layouts.
- Status transitions and motion.
- Execution step presentation.
- Error, cancellation, and approval states.
- Responsive behavior.
- Accessibility specifications.
- Copy guidelines.

Engineering should define:

- Event-to-component mapping.
- Streaming lifecycle integration.
- Structured execution event support.
- State synchronization and ordering.
- Cancellation and retry capabilities.
- Persistence requirements.
- Error handling and recovery.

The implementation should reuse the existing Archie design system and chat infrastructure wherever possible.

### UCL notes

- ✅ **Resolved:** Component A exists as `ActivityIndicator` (`feedback/activity-indicator`), from the "Thought" row in `archie.ds` → "chat-composer". Only its Active state is in Figma; Default, Completed and Failed still need a design.
- ⚠️ **Gap:** Components B–D don't exist in UCL yet. Each needs a Figma source first.
- ⚠️ **Decision needed:** category for the rest. The indicator is in `feedback`; execution progress and completion summary fit there too. The disclosure could sit in `feedback` or `data-display`.
- ⚠️ **Gap:** DESIGN.md → "Brand voice" isn't defined yet. Once it is, record the FR-03 status vocabulary there so `ucl-ux-copywriter` and the components use the same words (e.g. "application" vs "app").
- ℹ️ Section 10 "Motion" maps to the existing motion vocabulary, so no new tokens should be needed:
  - Status replacement in place → `iconSwapVariants` / `fadeVariants` crossfade.
  - Active indicator → Pending. Built as a slow highlight sweep on the label (`pendingTextVariants`), from Figma's gradient label, instead of the opacity pulse.
  - Disclosure open/close → Expand (`expandVariants` + `useExpandClip()`).
  - Step completion → Confirm (`confirmPattern`), once per step, never looping.
  - Reduced motion → `useMotionPreference()`; feedback becomes near-instant, not removed.

## 18. References

UX patterns and interaction guidance:

- [AI UX Playground — Patterns](https://aiuxplayground.com/patterns)
- [Progress steps](https://aiuxplayground.com/pattern/status-steps/)
- [Tool use](https://aiuxplayground.com/pattern/tool-use/)
- [Human in the loop](https://aiuxplayground.com/pattern/human-in-the-loop)

Existing product reference:

- Archie conversational interface and current activity presentation.

---

## Final product direction

**Archie should feel like an intelligent collaborator, not an execution console.**

The primary experience must communicate intent, progress, and outcomes through concise conversational feedback.

Detailed activity should remain available when it adds transparency, supports user decisions, or helps resolve problems.

The user should always understand three things:

1. What Archie is doing.
2. Whether Archie is thinking, acting, or waiting for input.
3. What happened and what they can do next.

**Design principle:** Conversational on the surface. Operational underneath.

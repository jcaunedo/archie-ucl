// The chat thread as data, and how Archie's events change it (prds/chat-behavior-system.md §4, §8). An Archie turn is one
// message made of blocks, in the order Archie produced them; the responder's events add and finish blocks. Times are
// measured here from real timestamps, never taken from the script (progress PRD §4.6).

type StepState = "running" | "done" | "failed" | "stopped";

type FileChange = { path: string; change: "new" | "modified" };

/** A question with its options. `dependsOn`: the earlier questions (by index) whose answers decide this one. */
type ClarifyingQuestion = { question: string; options: string[]; dependsOn?: number[] };

/** What Archie explains when asked about an error: what happened, then how to fix it, step by step (rule 9). */
type ErrorHelp = { happened: string; fixes: string[] };

/** The parts of the blueprint Plan shows, in its order. */
type BlueprintSection = "user-types" | "modules" | "core-services" | "integrations";

/**
 * Something the person can do next: its label, what it produces, and whether it's Archie's recommendation. Choosing it
 * sends the label as the person's message, or, with `open`, opens that blueprint section in Plan instead (no message).
 */
type NextStep = { label: string; description?: string; recommended?: boolean; open?: BlueprintSection };

type ArchieBlock =
	| { kind: "text"; id: string; text: string }
	/** "Thought for 4s": what Archie did before answering, collapsed. */
	| { kind: "thought"; id: string; seconds: number; steps: string[] }
	/**
	 * Clarifying questions, one at a time. `single` is the one-question form (an unclear message, or an answer asked
	 * again): the chosen option is sent as the person's message. Otherwise all answers go together once the last is
	 * answered. `skippable` adds "You decide" as the last option: on the clarifying questions, not on an unclear message.
	 */
	| {
			kind: "questions";
			id: string;
			questions: ClarifyingQuestion[];
			/** One per question, in order; `null` until answered (or after a change it depends on clears it). */
			answers: (string | null)[];
			single: boolean;
			skippable: boolean;
			/** The answered question the person is changing, if any. */
			editing?: number;
	  }
	/** A long step with its own status line: "Creating project blueprint…" → "Blueprint generated · 7s". */
	| {
			kind: "progress";
			id: string;
			label: string;
			doneLabel: string;
			failedLabel: string;
			state: StepState;
			startedAt: number;
			seconds?: number;
	  }
	/** "What's next": the next steps Archie suggests, after an update (Suggest / Confirm / Execute, Follow-up Chips). */
	| { kind: "actions"; id: string; steps: NextStep[]; chosen?: string }
	/**
	 * Archie asking permission before a consequential action (PromptAlert; progress PRD FR-09). Each choice sends its
	 * message; once decided, the prompt shows the decision.
	 */
	| {
			kind: "approval";
			id: string;
			title: string;
			description: string;
			allow: { label: string; message: string };
			deny: { label: string; message: string };
			decided?: "allow" | "deny";
	  }
	/** Files Archie writes. While running, `writing` is the file streaming in. */
	| {
			kind: "files";
			id: string;
			files: FileChange[];
			state: StepState;
			startedAt: number;
			seconds?: number;
			credits?: number;
			writing?: { path: string; code: string };
	  }
	/** The result of a build. Only one version in the thread is current. */
	| { kind: "version"; id: string; title: string; number: number; current: boolean }
	/** Context that isn't a reply: "Restoring to a previous version: 2 → 1", "Stopped." */
	| { kind: "note"; id: string; text: string }
	/** What failed, what's unchanged, and the message that retries it (when retrying is safe). */
	| { kind: "error"; id: string; title: string; detail: string; retry?: string; retried?: boolean; help?: ErrorHelp };

type ArchieTurn = {
	kind: "archie";
	id: string;
	blocks: ArchieBlock[];
	/** The one live status (ActivityIndicator). Cleared as soon as something else shows. */
	status: string | null;
	/**
	 * What Archie is doing under the status, as a live feed: each step it starts or finishes, newest last. Shown while the
	 * status shows; it becomes the steps of "Thought for Ns" when the thinking ends.
	 */
	feed: string[];
	state: "working" | "done" | "stopped";
	startedAt: number;
};

/** Answers sent together after clarifying questions: kept with the message, so they can be edited and sent again. */
type SentAnswers = { questions: ClarifyingQuestion[]; values: string[] };

type PersonMessage = { kind: "person"; id: string; text: string; answers?: SentAnswers };

/** A day separator ("2 days ago") between parts of a long thread. */
type Separator = { kind: "separator"; id: string; label: string };

type ThreadItem = PersonMessage | ArchieTurn | Separator;

/**
 * What Archie sends while it works, after the progress PRD's event model (§11). Blocks with an `id` can be finished or
 * extended later; the others are added once. `blueprint` and `credits` change the page, not the thread.
 */
type ArchieEvent =
	| { type: "status"; label: string }
	/** A step in the live feed under the status. */
	| { type: "step"; label: string }
	/** The thinking is done: "Thought for Ns", with these steps (or, without them, the feed's). */
	| { type: "thought"; steps?: string[] }
	| { type: "text"; text: string }
	| { type: "questions"; questions: ClarifyingQuestion[]; single?: boolean; skippable?: boolean }
	| { type: "progress"; id: string; label: string; doneLabel: string; failedLabel?: string }
	| { type: "actions"; steps: NextStep[] }
	| {
			type: "approval";
			title?: string;
			description: string;
			allow: { label: string; message: string };
			deny: { label: string; message: string };
	  }
	| { type: "files"; id: string }
	| { type: "file"; id: string; file: FileChange }
	| { type: "writing"; id: string; path: string }
	| { type: "code"; id: string; text: string }
	| { type: "finish"; id: string; state: "done" | "failed"; credits?: number }
	| { type: "version"; title: string }
	| { type: "note"; text: string }
	| { type: "error"; title: string; detail: string; retry?: string; help?: ErrorHelp }
	| { type: "blueprint"; reveal: number }
	| { type: "done" };

/**
 * Where the project stands when a message is sent, so Archie only offers what exists: no design changes before anything
 * is generated (prds/chat-behavior-system.md rule 4). `error` is the latest error not yet retried, so a question like
 * "what's the error?" is answered about it (rule 9).
 */
type ProjectStage = {
	blueprint: boolean;
	built: boolean;
	error?: { title: string; detail: string; retry?: string; help?: ErrorHelp };
};

/** The latest error in the thread that hasn't been retried, if any. */
function unresolvedError(thread: ThreadItem[]) {
	for (const item of [...thread].reverse()) {
		if (item.kind !== "archie") {
			continue;
		}
		const error = [...item.blocks].reverse().find((block) => block.kind === "error");
		if (error?.kind === "error") {
			return error.retried ? undefined : error;
		}
	}
	return undefined;
}

/** What the person asked for: a message, or restoring an earlier version (not a message, so no bubble). */
type ArchieRequest =
	| { kind: "message"; text: string; stage?: ProjectStage }
	| { kind: "restore"; version: number; current: number };

/** Answers one request by calling `emit` for each event, and returns a function that stops it. Stands in for Archie's backend. */
type ArchieResponder = (request: ArchieRequest, emit: (event: ArchieEvent) => void) => () => void;

let nextId = 0;
const newId = (prefix: string) => `${prefix}-${++nextId}`;

function newTurn(now: number): ArchieTurn {
	return { kind: "archie", id: newId("turn"), blocks: [], status: null, feed: [], state: "working", startedAt: now };
}

const elapsed = (from: number, now: number) => Math.max(1, Math.round((now - from) / 1000));

function updateTurn(thread: ThreadItem[], turnId: string, update: (turn: ArchieTurn) => ArchieTurn) {
	return thread.map((item) => (item.kind === "archie" && item.id === turnId ? update(item) : item));
}

function updateBlock(turn: ArchieTurn, id: string, update: (block: ArchieBlock) => ArchieBlock): ArchieTurn {
	return { ...turn, blocks: turn.blocks.map((block) => (block.id === id ? update(block) : block)) };
}

/**
 * Adds a block and clears the live status and its feed: once something shows, they've done their job (progress PRD
 * FR-05).
 */
function addBlock(turn: ArchieTurn, block: ArchieBlock): ArchieTurn {
	return { ...turn, status: null, feed: [], blocks: [...turn.blocks, block] };
}

const versionCount = (thread: ThreadItem[]) =>
	thread.reduce(
		(count, item) => count + (item.kind === "archie" ? item.blocks.filter((block) => block.kind === "version").length : 0),
		0,
	);

/** The thread after one of Archie's events for the turn `turnId`. Page-level events leave it unchanged. */
function applyEvent(thread: ThreadItem[], turnId: string, event: ArchieEvent, now: number): ThreadItem[] {
	switch (event.type) {
		case "status":
			return updateTurn(thread, turnId, (turn) => ({ ...turn, status: event.label }));
		case "step":
			return updateTurn(thread, turnId, (turn) => ({ ...turn, feed: [...turn.feed, event.label] }));
		case "thought":
			return updateTurn(thread, turnId, (turn) =>
				addBlock(turn, {
					kind: "thought",
					id: newId("thought"),
					seconds: elapsed(turn.startedAt, now),
					steps: event.steps ?? turn.feed,
				}),
			);
		case "text":
			return updateTurn(thread, turnId, (turn) => {
				const last = turn.blocks.at(-1);
				if (last?.kind === "text") {
					return updateBlock({ ...turn, status: null, feed: [] }, last.id, (block) => ({
						...block,
						text: last.text + event.text,
					}));
				}
				return addBlock(turn, { kind: "text", id: newId("text"), text: event.text });
			});
		case "questions":
			return updateTurn(thread, turnId, (turn) =>
				addBlock(turn, {
					kind: "questions",
					id: newId("questions"),
					questions: event.questions,
					answers: [],
					single: event.single ?? false,
					skippable: event.skippable ?? !event.single,
				}),
			);
		case "progress":
			return updateTurn(thread, turnId, (turn) =>
				addBlock(turn, {
					kind: "progress",
					id: event.id,
					label: event.label,
					doneLabel: event.doneLabel,
					failedLabel: event.failedLabel ?? event.label,
					state: "running",
					startedAt: now,
				}),
			);
		case "actions":
			return updateTurn(thread, turnId, (turn) =>
				addBlock(turn, { kind: "actions", id: newId("actions"), steps: event.steps }),
			);
		case "approval":
			return updateTurn(thread, turnId, (turn) =>
				addBlock(turn, {
					kind: "approval",
					id: newId("approval"),
					title: event.title ?? "Ask permission",
					description: event.description,
					allow: event.allow,
					deny: event.deny,
				}),
			);
		case "files":
			return updateTurn(thread, turnId, (turn) =>
				addBlock(turn, { kind: "files", id: event.id, files: [], state: "running", startedAt: now }),
			);
		case "file":
			return updateTurn(thread, turnId, (turn) =>
				updateBlock(turn, event.id, (block) =>
					block.kind === "files" ? { ...block, files: [...block.files, event.file] } : block,
				),
			);
		case "writing":
			return updateTurn(thread, turnId, (turn) =>
				updateBlock(turn, event.id, (block) =>
					block.kind === "files" ? { ...block, writing: { path: event.path, code: "" } } : block,
				),
			);
		case "code":
			return updateTurn(thread, turnId, (turn) =>
				updateBlock(turn, event.id, (block) =>
					block.kind === "files" && block.writing
						? { ...block, writing: { ...block.writing, code: block.writing.code + event.text } }
						: block,
				),
			);
		case "finish":
			return updateTurn(thread, turnId, (turn) =>
				updateBlock(turn, event.id, (block) => {
					if (block.kind === "progress") {
						return { ...block, state: event.state, seconds: elapsed(block.startedAt, now) };
					}
					if (block.kind === "files") {
						return {
							...block,
							state: event.state,
							seconds: elapsed(block.startedAt, now),
							credits: event.credits,
							writing: undefined,
						};
					}
					return block;
				}),
			);
		case "version": {
			const number = versionCount(thread) + 1;
			const others = thread.map((item) =>
				item.kind === "archie"
					? {
							...item,
							blocks: item.blocks.map((block) => (block.kind === "version" ? { ...block, current: false } : block)),
						}
					: item,
			);
			return updateTurn(others, turnId, (turn) =>
				addBlock(turn, { kind: "version", id: newId("version"), title: event.title, number, current: true }),
			);
		}
		case "note":
			return updateTurn(thread, turnId, (turn) => addBlock(turn, { kind: "note", id: newId("note"), text: event.text }));
		case "error":
			return updateTurn(thread, turnId, (turn) =>
				addBlock(turn, {
					kind: "error",
					id: newId("error"),
					title: event.title,
					detail: event.detail,
					retry: event.retry,
					help: event.help,
				}),
			);
		case "done":
			return updateTurn(thread, turnId, (turn) => ({ ...turn, status: null, feed: [], state: "done" }));
		default:
			return thread;
	}
}

/** Stop keeps what's done: running steps are marked stopped, and a note says what didn't finish (rule 8). */
function stopTurn(thread: ThreadItem[], turnId: string, now: number): ThreadItem[] {
	return updateTurn(thread, turnId, (turn) => {
		const unfinished = turn.blocks.filter(
			(block) => (block.kind === "progress" || block.kind === "files") && block.state === "running",
		);
		const files = unfinished.find((block) => block.kind === "files");
		const blocks = turn.blocks.map((block) =>
			(block.kind === "progress" || block.kind === "files") && block.state === "running"
				? { ...block, state: "stopped" as const, seconds: elapsed(block.startedAt, now), writing: undefined }
				: block,
		);
		const text =
			files?.kind === "files" && files.files.length > 0
				? `Stopped. ${files.files.length} files were written; the rest weren't. Your current version is unchanged.`
				: "Stopped.";
		return {
			...turn,
			status: null,
			feed: [],
			state: "stopped",
			blocks: [...blocks, { kind: "note", id: newId("note"), text }],
		};
	});
}

type QuestionsBlock = Extract<ArchieBlock, { kind: "questions" }>;

/** The last option of a skippable question: the person hands the decision to Archie, which picks a sensible default. */
const youDecide = "You decide";

/** A question's choices in their lettered order: its options, then "You decide" when it can be skipped. */
function choicesFor(block: QuestionsBlock, index: number) {
	return [...block.questions[index].options, ...(block.skippable ? [youDecide] : [])];
}

/**
 * The option a typed letter stands for ("b", "B.", "b)") on the current question, so typing the letter answers like
 * clicking it. A letter past the last option, or anything else, isn't one: it stays a typed answer.
 */
function choiceForLetter(block: QuestionsBlock, text: string) {
	const index = currentQuestion(block);
	const letter = /^\s*([a-z])\s*[.)]?\s*$/i.exec(text)?.[1];
	if (index === undefined || !letter) {
		return undefined;
	}
	return choicesFor(block, index)[letter.toLowerCase().charCodeAt(0) - 97];
}

/** The question being asked: the one being changed, or else the first without an answer. None once all are answered. */
function currentQuestion(block: QuestionsBlock): number | undefined {
	if (block.editing !== undefined) {
		return block.editing;
	}
	const index = block.questions.findIndex((_, at) => block.answers[at] == null);
	return index === -1 ? undefined : index;
}

/**
 * The block after the person answers its current question. A changed answer keeps the answers below it, except those
 * that depend on it, directly or through another cleared answer: they're asked again (rule 13).
 */
function withAnswer(block: QuestionsBlock, answer: string): QuestionsBlock {
	const index = currentQuestion(block);
	if (index === undefined) {
		return block;
	}
	const answers = block.questions.map((_, at) => block.answers[at] ?? null);
	const changed = block.editing !== undefined && answers[index] !== answer;
	answers[index] = answer;
	if (changed) {
		const cleared = new Set([index]);
		block.questions.forEach((question, at) => {
			if (at > index && question.dependsOn?.some((earlier) => cleared.has(earlier))) {
				answers[at] = null;
				cleared.add(at);
			}
		});
	}
	return { ...block, answers, editing: undefined };
}

function updateQuestions(thread: ThreadItem[], blockId: string, update: (block: QuestionsBlock) => QuestionsBlock) {
	return thread.map((item) =>
		item.kind === "archie"
			? {
					...item,
					blocks: item.blocks.map((block) => (block.kind === "questions" && block.id === blockId ? update(block) : block)),
				}
			: item,
	);
}

/** Records the person's answer to the current question. */
function answerQuestion(thread: ThreadItem[], blockId: string, answer: string): ThreadItem[] {
	return updateQuestions(thread, blockId, (block) => withAnswer(block, answer));
}

/** Starts changing an answered question, or (`undefined`) stops and keeps the answer it had. */
function editQuestion(thread: ThreadItem[], blockId: string, index: number | undefined): ThreadItem[] {
	return updateQuestions(thread, blockId, (block) => ({ ...block, editing: index }));
}

/** Marks a proposed action as chosen, an approval as decided ("allow" or "deny"), or an error as retried, so its controls lock. */
function settleBlock(thread: ThreadItem[], blockId: string, chosen?: string): ThreadItem[] {
	return thread.map((item) =>
		item.kind === "archie"
			? {
					...item,
					blocks: item.blocks.map((block) => {
						if (block.id !== blockId) {
							return block;
						}
						if (block.kind === "actions") {
							return { ...block, chosen };
						}
						if (block.kind === "error") {
							return { ...block, retried: true };
						}
						if (block.kind === "approval" && (chosen === "allow" || chosen === "deny")) {
							return { ...block, decided: chosen };
						}
						return block;
					}),
				}
			: item,
	);
}

/** The questions block still waiting for an answer, if the latest turn ended on one. Typed messages answer it. */
function openQuestions(thread: ThreadItem[]) {
	const last = thread.at(-1);
	if (last?.kind !== "archie" || last.state !== "done") {
		return undefined;
	}
	const block = [...last.blocks].reverse().find((candidate) => candidate.kind === "questions");
	return block?.kind === "questions" && currentQuestion(block) !== undefined ? block : undefined;
}

/** The current version's number, for "Restoring to a previous version: 2 → 1". */
function currentVersion(thread: ThreadItem[]) {
	for (const item of thread) {
		if (item.kind === "archie") {
			const block = item.blocks.find((candidate) => candidate.kind === "version" && candidate.current);
			if (block?.kind === "version") {
				return block.number;
			}
		}
	}
	return 0;
}

const person = (text: string, answers?: SentAnswers): PersonMessage => ({
	kind: "person",
	id: newId("person"),
	text,
	answers,
});

export {
	answerQuestion,
	applyEvent,
	choiceForLetter,
	choicesFor,
	currentQuestion,
	currentVersion,
	editQuestion,
	newTurn,
	openQuestions,
	person,
	settleBlock,
	stopTurn,
	unresolvedError,
	withAnswer,
	youDecide,
	type ArchieBlock,
	type ArchieEvent,
	type ArchieRequest,
	type ArchieResponder,
	type ArchieTurn,
	type BlueprintSection,
	type ClarifyingQuestion,
	type ErrorHelp,
	type FileChange,
	type NextStep,
	type PersonMessage,
	type ProjectStage,
	type QuestionsBlock,
	type SentAnswers,
	type Separator,
	type StepState,
	type ThreadItem,
};

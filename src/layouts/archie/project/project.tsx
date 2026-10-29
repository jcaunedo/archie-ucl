import type * as React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Database, FileIcon, Frame, Mic, MousePointer2, Palette, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { ChatMessage } from "@/components/data-display/chat-message";
import {
	ChatPanel,
	ChatPanelBody,
	ChatPanelFooter,
	ChatPanelHeader,
	ChatPanelRail,
} from "@/components/data-display/chat-panel";
import { ActivityIndicator } from "@/components/feedback/activity-indicator";
import {
	PromptComposer,
	PromptComposerButton,
	PromptComposerCommands,
	PromptComposerFooter,
	PromptComposerSubmit,
	PromptComposerTextarea,
} from "@/components/forms/prompt-composer";
import {
	SegmentedControl,
	SegmentedControlList,
	SegmentedControlTrigger,
} from "@/components/navigation/segmented-control";
import { Topbar, TopbarCenter, TopbarEnd, TopbarStart } from "@/components/navigation/topbar";
import { TooltipProvider } from "@/components/overlays/tooltip";
import { Typography } from "@/components/typography";
import { fadeVariants, revealVariants, scrollIntoViewSmoothly, slideUpVariants, useMotionPreference } from "@/lib/motion";

import {
	answerQuestion,
	applyEvent,
	choiceForLetter,
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
	type ArchieBlock,
	type ArchieEvent,
	type ArchieRequest,
	type ArchieResponder,
	type ArchieTurn,
	type BlueprintSection,
	type ClarifyingQuestion,
	type NextStep,
	type ThreadItem,
} from "./chat-model";
import {
	ActivityFeed,
	ApprovalPrompt,
	ApprovalRecord,
	AnswersMessage,
	ArchieText,
	DaySeparator,
	ElapsedTime,
	ErrorCard,
	FilesProcessed,
	NextSteps,
	Note,
	ProgressLine,
	PromptStarters,
	QuestionsCard,
	QueueList,
	ResponseActions,
	ThoughtDisclosure,
	VersionCard,
} from "./chat-parts";
import {
	Account,
	ArchieMark,
	ChatActions,
	ChatResizeHandle,
	ChatSwitcher,
	chatWidth,
	LogoLink,
	ModelPicker,
	ProjectSwitcher,
	TopbarActions,
} from "./parts";
import { PlanCanvas, planSections, type PlanBlueprint } from "./plan-canvas";

/** The blueprint phases, in MainNav order. The selected one titles the canvas. */
const phases = [
	{ value: "plan", label: "Plan", icon: Frame },
	{ value: "design", label: "Design", icon: Palette },
	{ value: "frontend", label: "Frontend", icon: MousePointer2 },
	{ value: "backend", label: "Backend", icon: Database },
	{ value: "assets", label: "Assets", icon: FileIcon },
] as const;

type Phase = (typeof phases)[number]["value"];

/** The person's message after the last clarifying question: an intro line, then one line per answer. */
const answersIntro = "Here are my answers:";

/** An answers message as text: the intro, then one line per answer. Archie reads this. */
const answersText = (intro: string, answers: string[]) => [intro, ...answers.map((item) => `- ${item}`)].join("\n");

/** Archie's slash commands. Picking one writes "/name " into the message; the responder acts on it. */
const commands = [
	// Prototype shortcuts first, under "Preview interactions": each plays one scenario of the chat, at any point in the
	// conversation. A divider separates them from Archie's commands.
	{ name: "ask-permission", group: "prototype", send: true },
	{ name: "clarification-questions", group: "prototype", send: true },
	{ name: "code-generation", group: "prototype", send: true },
	// Placeholders until Archie's command set is defined (prds/chat-behavior-system.md rule 12).
	{ name: "command-1" },
	{ name: "command-2" },
];

/** What the person's bubble says for each prototype shortcut, instead of the command itself. */
const shortcutBubbles: Record<string, string> = {
	"/ask-permission": "Show ask permission interaction",
	"/clarification-questions": "Show clarification questions interaction",
	"/code-generation": "Show code generation interaction",
};

/** How many "What's next" cards the thread holds, so a new one can be told apart from a re-render. */
const actionsCount = (thread: ThreadItem[]) =>
	thread.reduce(
		(count, item) => count + (item.kind === "archie" ? item.blocks.filter((block) => block.kind === "actions").length : 0),
		0,
	);

/** Ways to start an empty chat (Prompt Starters): one to build, two to learn. */
const starters = [
	"Create an e-commerce store selling high-end accessories for road bikes.",
	"How does the fit check work?",
	"What's a database relationship?",
];

type ProjectData = {
	org: string;
	project: string;
	credits: number;
	/** Image URL for the account button. */
	avatar: string;
	chatTitle: string;
	model: string;
	/** The conversation so far. Ending on the person's message means Archie is about to answer it. */
	thread: ThreadItem[];
	/** The project's blueprint, shown in Plan as far as `planRevealed`. */
	blueprint: PlanBlueprint;
	/** How many Plan sections are drafted already (0 to 5). */
	planRevealed?: number;
};

type ProjectProps = {
	data: ProjectData;
	/** The phase shown first. */
	defaultPhase?: Phase;
	/** Whether the chat starts expanded (Figma chat-composer State=expanded). */
	defaultChatOpen?: boolean;
	/** Answers the person's requests. Without it, nothing replies and Archie stays "Thinking…" (Figma's frame). */
	respond?: ArchieResponder;
};

/** Archie's turn: its blocks in order, then its live status, then the reply's actions once it's done. */
function ArchieTurnView({
	turn,
	latest,
	onAnswer,
	onEditAnswer,
	onChoose,
	onRetry,
	onRestore,
	onViewCode,
	onRetryReply,
}: {
	turn: ArchieTurn;
	/** The thread's last item: only its questions and actions take input. */
	latest: boolean;
	onAnswer: (block: Extract<ArchieBlock, { kind: "questions" }>, answer: string) => void;
	/** Starts changing an answered question, or (`undefined`) keeps its answer. */
	onEditAnswer: (blockId: string, index: number | undefined) => void;
	onChoose: (blockId: string, step: NextStep) => void;
	onRetry: (blockId: string, message: string) => void;
	onRestore: (version: number) => void;
	onViewCode: () => void;
	onRetryReply: () => void;
}) {
	const { prefersReducedMotion } = useMotionPreference();
	// Blocks that arrive while Archie works ease in (Reveal); a thread opened later appears as it is.
	const enter = turn.state === "working" && !prefersReducedMotion ? "initial" : false;
	const text = turn.blocks
		.filter((block) => block.kind === "text")
		.map((block) => block.text)
		.join("\n\n");
	// A plain answer (Level 1 or 2) gets copy, feedback and retry; builds get their version card's feedback instead.
	const plainAnswer =
		turn.state === "done" &&
		text.trim() !== "" &&
		turn.blocks.every((block) => block.kind === "text" || block.kind === "thought");

	function render(block: ArchieBlock) {
		switch (block.kind) {
			case "text":
				return block.text.trim() === "" ? null : <ArchieText text={block.text} />;
			case "thought":
				return <ThoughtDisclosure block={block} />;
			case "questions":
				return (
					<QuestionsCard
						block={block}
						interactive={latest && turn.state === "done"}
						onAnswer={(answer) => onAnswer(block, answer)}
						onEdit={(index) => onEditAnswer(block.id, index)}
					/>
				);
			case "progress":
				return <ProgressLine block={block} />;
			case "actions":
				return (
					<NextSteps block={block} locked={!latest} onChoose={(step) => onChoose(block.id, step)} />
				);
			case "approval":
				// While it waits, the prompt is above the composer; the thread keeps the record once it's decided.
				return <ApprovalRecord block={block} waiting={latest && turn.state === "done" && !block.decided} />;
			case "files":
				return <FilesProcessed block={block} onViewCode={onViewCode} />;
			case "version":
				return <VersionCard block={block} onRestore={onRestore} />;
			case "note":
				return <Note text={block.text} />;
			case "error":
				return <ErrorCard block={block} onRetry={(message) => onRetry(block.id, message)} />;
		}
	}

	return (
		<div data-slot='archie-turn' className='flex flex-col gap-4'>
			{/* Blocks already there when the turn first shows (a thread opened later) skip every entrance inside them, the
			    Loader's grow included; blocks that arrive afterwards play theirs. */}
			<AnimatePresence initial={false}>
				{turn.blocks.map((block) => {
					const content = render(block);
					return content ? (
						// "Thought for Ns" takes the status line's place as it is, so the A growing in is the motion you see. Its text
						// ends 1px above its 20px row, so the block after it comes up 1px: 16px from that text to the next line.
						<motion.div
							key={block.id}
							variants={revealVariants}
							initial={block.kind === "thought" ? false : enter}
							animate='animate'
							className={block.kind === "thought" ? "-mb-px" : undefined}
						>
							{content}
						</motion.div>
					) : null;
				})}
			</AnimatePresence>
			{turn.status && (
				<div className='flex flex-col gap-2'>
					<div className='flex min-w-0 items-center gap-1.5'>
						<ActivityIndicator>{turn.status}</ActivityIndicator>
						<ElapsedTime since={turn.startedAt} />
					</div>
					{turn.feed.length > 0 && <ActivityFeed steps={turn.feed} />}
				</div>
			)}
			{plainAnswer && <ResponseActions text={text} onRetry={latest ? onRetryReply : undefined} />}
		</div>
	);
}

/**
 * The project page: Topbar, the chat on the left, the canvas for the selected phase on the right. Figma origin: archie.ds
 * → "project", with the chat from Archie-App → "Chat Experience" (prds/chat-behavior-system.md). With `respond`, Archie
 * answers each request in one turn: a live status, then blocks (thinking, text, questions, progress, files, versions).
 */
function Project({ data, defaultPhase = "plan", defaultChatOpen = true, respond }: ProjectProps) {
	const { prefersReducedMotion } = useMotionPreference();
	const [phase, setPhase] = useState<Phase>(defaultPhase);
	// The chat's width (drag the handle between chat and canvas), whether it's being dragged, and whether it's open.
	const [chatWidthPx, setChatWidthPx] = useState(chatWidth.default);
	const [resizing, setResizing] = useState(false);
	const [chatOpen, setChatOpen] = useState(defaultChatOpen);
	const [thread, setThread] = useState(data.thread);
	const [answering, setAnswering] = useState(false);
	const [queue, setQueue] = useState<string[]>([]);
	const [plan, setPlan] = useState({ revealed: data.planRevealed ?? 0, drafting: false });
	const [credits, setCredits] = useState(data.credits);
	/** The Plan section the chat last asked to open ("Review modules"). */
	const [planFocus, setPlanFocus] = useState<{ section: BlueprintSection; at: number }>();
	const stopAnswering = useRef<(() => void) | null>(null);
	const activeTurn = useRef<string | null>(null);
	const phaseLabel = phases.find(({ value }) => value === phase)?.label;
	// A permission request waiting on the person: Archie's latest turn ended on one, undecided.
	const lastItem = thread.at(-1);
	const pendingApproval =
		lastItem?.kind === "archie" && lastItem.state === "done"
			? lastItem.blocks.find((block): block is Extract<ArchieBlock, { kind: "approval" }> => block.kind === "approval" && !block.decided)
			: undefined;
	const showApproval = Boolean(pendingApproval) && !answering;
	// Without a responder, a thread ending on the person's message shows Figma's "Thinking…".
	const waiting = !respond && thread.at(-1)?.kind === "person";

	function handle(turnId: string, event: ArchieEvent) {
		if (event.type === "blueprint") {
			setPlan({ revealed: event.reveal, drafting: event.reveal < planSections });
		} else if (event.type === "finish" && event.credits) {
			setCredits((current) => current - event.credits!);
		}
		setThread((current) => applyEvent(current, turnId, event, Date.now()));
		if (event.type === "done") {
			stopAnswering.current = null;
			activeTurn.current = null;
			setAnswering(false);
		}
	}

	/** Starts Archie's turn for a request. Messages carry where the project stands (blueprint drafted, app built). */
	function request(next: ArchieRequest) {
		if (!respond) {
			return;
		}
		if (next.kind === "message") {
			const error = unresolvedError(thread);
			next = {
				...next,
				stage: {
					blueprint: plan.revealed >= planSections,
					built: currentVersion(thread) > 0,
					error: error && { title: error.title, detail: error.detail, retry: error.retry, help: error.help },
				},
			};
		}
		const turn = newTurn(Date.now());
		activeTurn.current = turn.id;
		setThread((current) => [...current, turn]);
		setAnswering(true);
		stopAnswering.current = respond(next, (event) => handle(turn.id, event));
	}

	/** Sends a message: queued while Archie works (rule 7), otherwise delivered. */
	function send(text: string) {
		pinnedToEnd.current = true;
		if (answering) {
			setQueue((current) => [...current, text]);
			return;
		}
		deliver(text);
	}

	/** A message Archie can take now: the answer to an open question (rules 3, 4), or a new request. */
	function deliver(text: string) {
		// A slash command is never an answer: it goes to Archie as a request, even with a question open.
		const questions = text.startsWith("/") ? undefined : openQuestions(thread);
		if (questions) {
			// A typed letter ("b", "B.") picks that option, the same as clicking it.
			answer(questions, choiceForLetter(questions, text) ?? text);
			return;
		}
		// A prototype shortcut shows as what it does ("Show ask permission interaction"); Archie still gets the command.
		setThread((current) => [...current, person(shortcutBubbles[text.trim()] ?? text)]);
		request({ kind: "message", text });
	}

	/** Records an answer. A single question sends it; the last of several sends them all as one message (rule 3). */
	function answer(block: Extract<ArchieBlock, { kind: "questions" }>, text: string) {
		const next = withAnswer(block, text);
		setThread((current) => answerQuestion(current, block.id, text));
		if (currentQuestion(next) !== undefined) {
			return;
		}
		const answers = next.answers.map((item) => item ?? "");
		if (block.single) {
			setThread((current) => [...current, person(text)]);
			request({ kind: "message", text });
			return;
		}
		sendAnswers(answersIntro, block.questions, answers);
	}

	/** Sends a set of answers as one message, kept with its questions so it can be expanded and edited. */
	function sendAnswers(intro: string, questions: ClarifyingQuestion[], answers: string[]) {
		const message = answersText(intro, answers);
		setThread((current) => [...current, person(message, { questions, values: answers })]);
		request({ kind: "message", text: message });
	}

	/** Stop keeps what's done (rule 8). Queued messages then go. */
	function stop() {
		stopAnswering.current?.();
		stopAnswering.current = null;
		const turnId = activeTurn.current;
		if (turnId) {
			setThread((current) => stopTurn(current, turnId, Date.now()));
		}
		activeTurn.current = null;
		setPlan((current) => ({ ...current, drafting: false }));
		setAnswering(false);
	}

	// The next queued message goes as soon as Archie is free.
	useEffect(() => {
		if (!answering && queue.length > 0 && respond) {
			const [next, ...rest] = queue;
			setQueue(rest);
			deliver(next);
		}
	}, [answering, queue]);

	// A thread that opens on the person's message (a project just created) gets its answer on load.
	useEffect(() => {
		const last = data.thread.at(-1);
		if (last?.kind === "person") {
			request({ kind: "message", text: last.text });
		}
		return () => stopAnswering.current?.();
	}, []);

	// Follow the thread as it grows, unless the person has scrolled up to read. Streamed text follows at once; a "What's
	// next" card that arrives glides into view (scrollTransition), and the thread waits for the glide before following
	// again. Any wheel, touch, click or key stops the glide.
	const body = useRef<HTMLDivElement>(null);
	const pinnedToEnd = useRef(true);
	const glide = useRef<(() => void) | null>(null);
	const nextStepsShown = useRef(actionsCount(data.thread));
	useLayoutEffect(() => {
		const count = actionsCount(thread);
		const arrived = count > nextStepsShown.current;
		nextStepsShown.current = count;
		if (!body.current || !pinnedToEnd.current) {
			return;
		}
		const card = arrived ? [...body.current.querySelectorAll<HTMLElement>("[data-slot='next-steps']")].at(-1) : undefined;
		if (card) {
			glide.current?.();
			glide.current = scrollIntoViewSmoothly(card, {
				reducedMotion: Boolean(prefersReducedMotion),
				onEnd: () => {
					glide.current = null;
				},
			});
		} else if (!glide.current) {
			body.current.scrollTop = body.current.scrollHeight;
		}
	}, [thread, queue, waiting]);
	useEffect(() => () => glide.current?.(), []);

	/** The person's message before a turn: what Retry sends again. */
	function messageBefore(turnId: string) {
		const index = thread.findIndex((item) => item.id === turnId);
		const before = thread.slice(0, index).reverse().find((item) => item.kind === "person");
		return before?.kind === "person" ? before.text : undefined;
	}

	return (
		<TooltipProvider>
			<div className='flex h-dvh min-h-0 flex-col bg-muted'>
				<Topbar>
					<TopbarStart>
						<LogoLink />
						<ProjectSwitcher org={data.org} project={data.project} />
					</TopbarStart>
					<TopbarCenter>
						<SegmentedControl value={phase} onValueChange={(next) => setPhase(next as Phase)}>
							<SegmentedControlList aria-label='Blueprint'>
								{phases.map(({ value, label, icon: Icon }) => (
									<SegmentedControlTrigger key={value} value={value}>
										<Icon />
										{label}
									</SegmentedControlTrigger>
								))}
							</SegmentedControlList>
						</SegmentedControl>
					</TopbarCenter>
					<TopbarEnd>
						<TopbarActions credits={credits} />
						<Account avatar={data.avatar} />
					</TopbarEnd>
				</Topbar>

				{/* Figma "Container": 8px on the sides and bottom, none on top, 2px between the chat and the canvas. */}
				{/* No gap: the resize handle is the 2px between the chat and the canvas (Figma's gap). */}
				<div className='flex min-h-0 flex-1 px-2 pb-2'>
					{/* 440px open; ChatPanel narrows itself to the 32px rail when collapsed, and the canvas takes the rest. */}
					<ChatPanel
						aria-label='Chat'
						defaultOpen={defaultChatOpen}
						onOpenChange={setChatOpen}
						data-resizing={resizing || undefined}
						// The chosen width (440px by default); collapsed still wins. While dragging, the width follows the pointer
						// instead of easing.
						className='w-(--chat-width) shrink-0 data-resizing:transition-none'
						style={{ "--chat-width": `${chatWidthPx}px` } as React.CSSProperties}
					>
						<ChatPanelRail>
							<ArchieMark />
						</ChatPanelRail>
						<ChatPanelHeader>
							<ChatSwitcher title={data.chatTitle} />
							<ChatActions />
						</ChatPanelHeader>
						{/* Busy while Archie answers, so assistive tech and tests know the thread is still changing. */}
						<ChatPanelBody
							ref={body}
							aria-busy={answering || undefined}
							onScroll={(event) => {
								// The glide's own scrolling isn't the person scrolling away.
								if (glide.current) {
									return;
								}
								const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
								pinnedToEnd.current = scrollHeight - scrollTop - clientHeight < 24;
							}}
						>
							{thread.length === 0 && <PromptStarters items={starters} onPick={send} />}
							{thread.map((item, index) => {
								if (item.kind === "person" && item.answers) {
									const { questions, values } = item.answers;
									return (
										<AnswersMessage
											key={item.id}
											intro={item.text.split("\n")[0]}
											questions={questions}
											answers={values}
										/>
									);
								}
								if (item.kind === "person") {
									return <ChatMessage key={item.id}>{item.text}</ChatMessage>;
								}
								if (item.kind === "separator") {
									return <DaySeparator key={item.id} label={item.label} />;
								}
								return (
									<ArchieTurnView
										key={item.id}
										turn={item}
										latest={index === thread.length - 1}
										onAnswer={answer}
										onEditAnswer={(blockId, answerIndex) =>
											setThread((current) => editQuestion(current, blockId, answerIndex))
										}
										onChoose={(blockId, step) => {
											// A blueprint section opens in Plan; anything else is sent as the person's message.
											if (step.open) {
												setPhase("plan");
												setPlanFocus({ section: step.open, at: Date.now() });
												return;
											}
											setThread((current) => settleBlock(current, blockId, step.label));
											send(step.label);
										}}
										onRetry={(blockId, message) => {
											setThread((current) => settleBlock(current, blockId));
											send(message);
										}}
										onRestore={(version) =>
											!answering && request({ kind: "restore", version, current: currentVersion(thread) })
										}
										onViewCode={() => setPhase("frontend")}
										onRetryReply={() => {
											const message = messageBefore(item.id);
											if (message) {
												send(message);
											}
										}}
									/>
								);
							})}
							{waiting && <ActivityIndicator>Thinking…</ActivityIndicator>}
							{queue.length > 0 && (
								<QueueList
									items={queue}
									onRemove={(index) => setQueue((current) => current.filter((_, item) => item !== index))}
								/>
							)}
						</ChatPanelBody>
						<ChatPanelFooter className='relative'>
							{/* A permission request waits on top of the composer: bottom-aligned with it, centered, as wide as it
							    (DESIGN.md "PromptAlert"), sliding up when Archie asks. The composer under it is inert until the
							    person decides; the thread then keeps the record. */}
							<AnimatePresence initial={false}>
								{showApproval && pendingApproval && (
									<motion.div
										key={pendingApproval.id}
										className='absolute inset-x-2 bottom-2 z-10'
										variants={prefersReducedMotion ? fadeVariants : slideUpVariants}
										initial='initial'
										animate='animate'
										// Deny or Allow: it slides back down as it leaves (Slide up's exit).
										exit='exit'
									>
										<ApprovalPrompt
											block={pendingApproval}
											onDecide={(choice, message) => {
												setThread((current) => settleBlock(current, pendingApproval.id, choice));
												send(message);
											}}
										/>
									</motion.div>
								)}
							</AnimatePresence>
							{/* While Archie works, the button is Stop; typing turns it into Add to queue (rule 7). */}
							<PromptComposer
								inert={showApproval || undefined}
								onSubmit={send}
								onStop={answering ? stop : undefined}
								commands={commands}
								commandGroups={{ prototype: "Preview interactions" }}
								onVoice={() => {}}
							>
								<PromptComposerTextarea placeholder='Message Archie or type / for options' aria-label='Message Archie' />
								<PromptComposerFooter>
									{/* Figma: attach, then the slash button, 5px apart. */}
									<div className='flex items-center gap-[5px]'>
										<PromptComposerButton aria-label='Attach files'>
											<Plus />
										</PromptComposerButton>
										<PromptComposerCommands />
									</div>
									<div className='flex items-center gap-2'>
										<ModelPicker model={data.model} />
										<PromptComposerButton variant='outline' aria-label='Dictate'>
											<Mic />
										</PromptComposerButton>
										<PromptComposerSubmit />
									</div>
								</PromptComposerFooter>
							</PromptComposer>
						</ChatPanelFooter>
					</ChatPanel>
					{chatOpen ? (
						<ChatResizeHandle width={chatWidthPx} onWidthChange={setChatWidthPx} onResizingChange={setResizing} />
					) : (
						<div aria-hidden className='w-0.5 shrink-0' />
					)}

					{/* Figma "Canvas": 16px corners, `border/border`, a 48px header over the phase's content. */}
					<main className='flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border'>
						<header className='flex h-12 shrink-0 items-center gap-2 border-b border-input bg-background pr-3 pl-4'>
							<Typography as='h1' size='base' weight='semibold'>
								{phaseLabel}
							</Typography>
						</header>
						<div className='min-h-0 flex-1 overflow-y-auto bg-background'>
							{phase === "plan" && (
								<PlanCanvas blueprint={data.blueprint} revealed={plan.revealed} drafting={plan.drafting} focus={planFocus} />
							)}
						</div>
					</main>
				</div>
			</div>
		</TooltipProvider>
	);
}

export { Project, answersIntro, type ProjectData, type ProjectProps };

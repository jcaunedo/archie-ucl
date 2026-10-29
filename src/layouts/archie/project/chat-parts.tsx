import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
	Bookmark,
	Check,
	ChevronRight,
	CircleAlert,
	CircleCheck,
	CodeXml,
	Copy,
	CornerDownRight,
	Ellipsis,
	Minus,
	Pencil,
	RotateCcw,
	ThumbsDown,
	ThumbsUp,
	Undo2,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/buttons/button";
import { ChatMessage } from "@/components/data-display/chat-message";
import { ActivityIndicatorIcon } from "@/components/feedback/activity-indicator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/overlays/tooltip";
import {
	expandVariants,
	fadeVariants,
	feedItemVariants,
	layoutSpring,
	reducedMotionTransition,
	scrollIntoViewSmoothly,
	slideUpVariants,
	useExpandClip,
	useMotionPreference,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

import { currentQuestion, youDecide, type ArchieBlock, type ClarifyingQuestion, type StepState } from "./chat-model";

// Layout-only chat parts (prds/chat-behavior-system.md §4): Figma Archie-App "Chat Experience" isn't a design-system
// file, so these live here until archie.ds has them (ARCHITECTURE.md "Layout-only parts"). Each takes its block's data
// and reports what the person does; the page owns the thread.

type Block<K extends ArchieBlock["kind"]> = Extract<ArchieBlock, { kind: K }>;

/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */

/** A 24px icon button with a tooltip that names it. */
function IconAction({
	label,
	onClick,
	pressed,
	children,
}: {
	label: string;
	onClick?: () => void;
	pressed?: boolean;
	children: ReactNode;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant='ghost'
					size='icon-xs'
					aria-label={label}
					aria-pressed={pressed}
					onClick={onClick}
					className='text-muted-foreground hover:text-foreground aria-pressed:text-foreground'
				>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent size='sm'>{label}</TooltipContent>
		</Tooltip>
	);
}

/** Helpful / not helpful, one at a time (Feedback Loops). */
function useFeedback() {
	const [rating, setRating] = useState<"up" | "down" | null>(null);
	const toggle = (next: "up" | "down") => setRating((current) => (current === next ? null : next));
	return { rating, toggle };
}

/** The spinner, check, cross or dash in front of a step, by its state. */
function StepIcon({ state }: { state: StepState }) {
	if (state === "running") {
		// Archie's one activity icon: the bouncing ball, in the line's color.
		return <ActivityIndicatorIcon />;
	}
	const Icon = state === "done" ? Check : state === "failed" ? X : Minus;
	return <Icon aria-hidden className={cn("size-4 shrink-0", state === "failed" ? "text-destructive" : "text-icon-muted")} />;
}

/**
 * A row that opens a detail region below it (Progressive Disclosure): the label, a chevron that turns, and the region
 * expanding in place. Collapsed by default (progress PRD FR-04).
 */
function Disclosure({
	icon,
	label,
	end,
	children,
}: {
	icon: ReactNode;
	label: ReactNode;
	end?: ReactNode;
	children: ReactNode;
}) {
	const [open, setOpen] = useState(false);
	const clip = useExpandClip();
	const { prefersReducedMotion } = useMotionPreference();

	return (
		<div className='flex flex-col'>
			<div className='flex items-center justify-between gap-2'>
				<button
					type='button'
					aria-expanded={open}
					onClick={() => setOpen((current) => !current)}
					className='group flex min-w-0 items-center gap-1.5 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
				>
					{icon}
					<span className='truncate'>{label}</span>
					<ChevronRight aria-hidden className='size-4 shrink-0 transition-transform group-aria-expanded:rotate-90' />
				</button>
				{end}
			</div>
			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						{...clip}
						variants={expandVariants}
						initial='initial'
						animate='animate'
						exit='exit'
						transition={prefersReducedMotion ? reducedMotionTransition : undefined}
					>
						<div className='pt-2'>{children}</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

/** Figma's corner connector before a chip: the action hangs off the reply above it. */
function Connector() {
	return <span aria-hidden className='-mt-3 h-4 w-2.5 shrink-0 rounded-bl-md border-b border-l border-border' />;
}

/* -------------------------------------------------------------------------- */
/* Archie's text                                                              */
/* -------------------------------------------------------------------------- */

/** Bold runs (`**text**`). One still streaming in (no closing `**` yet) shows bold already, never as raw asterisks. */
function inline(text: string) {
	return text.split(/(\*\*[^*]+\*\*|\*\*[^*]*$)/).map((part, index) => {
		if (part.startsWith("**")) {
			const closed = part.length > 4 && part.endsWith("**");
			return (
				<strong key={index} className='font-semibold text-foreground'>
					{closed ? part.slice(2, -2) : part.slice(2)}
				</strong>
			);
		}
		return <Fragment key={index}>{part}</Fragment>;
	});
}

/**
 * Archie's reply, from the light Markdown its replies use: paragraphs, a line in bold as a heading, `- ` lists and
 * `1. ` lists. Renders partial text as it streams.
 */
function ArchieText({ text }: { text: string }) {
	const paragraphs = text.split(/\n{2,}/).filter((paragraph) => paragraph.trim() !== "");

	return (
		<div className='flex flex-col gap-3 text-sm text-foreground'>
			{paragraphs.map((paragraph, index) => {
				const lines = paragraph.split("\n").filter((line) => line !== "");
				if (lines.every((line) => line.startsWith("- "))) {
					return (
						<ul key={index} className='flex list-disc flex-col gap-1 pl-5'>
							{lines.map((line, item) => (
								<li key={item}>{inline(line.slice(2))}</li>
							))}
						</ul>
					);
				}
				if (lines.every((line) => /^\d+\. /.test(line))) {
					return (
						<ol key={index} className='flex list-decimal flex-col gap-1 pl-5'>
							{lines.map((line, item) => (
								<li key={item}>{inline(line.replace(/^\d+\. /, ""))}</li>
							))}
						</ol>
					);
				}
				if (lines.length === 1 && /^\*\*[^*]+\*\*$/.test(lines[0])) {
					return (
						<p key={index} className='font-semibold'>
							{lines[0].slice(2, -2)}
						</p>
					);
				}
				return (
					<p key={index} className='whitespace-pre-wrap'>
						{inline(paragraph)}
					</p>
				);
			})}
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Blocks                                                                     */
/* -------------------------------------------------------------------------- */

/** The live feed shows this many steps at most (decision 2026-10-29); older ones slide out at the top. */
const feedSize = 2;

/**
 * What Archie is doing, under its status (Figma "Thinking - How the system is working"): its latest steps as a live feed,
 * two at most. Each new step slides up into place at the bottom and the oldest slides out at the top (Feed). Finished steps
 * have a check; the newest, still in progress, bounces the ball and has full contrast. Hidden from screen readers: the status is the
 * live region, and the same steps are in "Thought for Ns" afterwards (progress PRD: don't announce every update).
 */
function ActivityFeed({ steps }: { steps: string[] }) {
	const { prefersReducedMotion } = useMotionPreference();
	const first = Math.max(0, steps.length - feedSize);

	return (
		<ul aria-hidden data-slot='activity-feed' className='flex flex-col gap-1'>
			<AnimatePresence initial={false} mode='popLayout'>
				{steps.slice(first).map((step, offset) => {
					const index = first + offset;
					const latest = index === steps.length - 1;
					return (
						<motion.li
							key={index}
							layout={!prefersReducedMotion}
							variants={prefersReducedMotion ? fadeVariants : feedItemVariants}
							initial='initial'
							animate='animate'
							exit='exit'
							transition={{ layout: layoutSpring }}
							className={cn("flex items-center gap-1.5 text-sm", latest ? "text-foreground" : "text-muted-foreground")}
						>
							{/* The same 14px column as the status's ball, so the steps line up under its label. The step in progress
							    bounces the ball (Archie's one activity icon); finished ones have a check. */}
							{latest ? (
								<ActivityIndicatorIcon />
							) : (
								<span className='flex size-3.5 shrink-0 items-center justify-center'>
									<Check className='size-3.5 text-icon-muted' />
								</span>
							)}
							<span className='min-w-0 truncate'>{step}</span>
						</motion.li>
					);
				})}
			</AnimatePresence>
		</ul>
	);
}

/** Figma "Thought": "Thought for 8s ›", expanding to what Archie did (Chain of Thought, observable steps only). */
function ThoughtDisclosure({ block }: { block: Block<"thought"> }) {
	return (
		<Disclosure
			icon={<ActivityIndicatorIcon animate={false} className='text-icon-muted' />}
			label={`Thought for ${block.seconds}s`}
		>
			<ul className='flex flex-col gap-1 border-l border-border pl-3 text-sm text-muted-foreground'>
				{block.steps.map((step) => (
					<li key={step}>{step}</li>
				))}
			</ul>
		</Disclosure>
	);
}

/**
 * A question's lettered options as one bordered list: its options, then "You decide" when Archie can choose. `selected`
 * marks the current answer (a check and the hover tone); an answer that isn't one of the options shows as an extra
 * selected row, so it's never lost.
 */
function QuestionOptions({
	question,
	skippable,
	selected,
	onPick,
}: {
	question: ClarifyingQuestion;
	skippable: boolean;
	selected: string | null;
	onPick: (answer: string) => void;
}) {
	const values = [...question.options, ...(skippable ? [youDecide] : [])];
	const own = selected != null && !values.includes(selected) ? [selected] : [];

	return (
		<div role='group' aria-label={question.question} className='flex flex-col divide-y divide-border rounded-lg border border-border'>
			{[...values, ...own].map((value, index) => (
				<button
					key={value}
					type='button'
					aria-pressed={selected === value}
					onClick={() => onPick(value)}
					className='flex items-start gap-2 px-2.5 py-1.5 text-left text-sm text-foreground outline-none first:rounded-t-lg last:rounded-b-lg hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset aria-pressed:bg-accent'
				>
					<span className='text-muted-foreground'>{String.fromCharCode(65 + index)}.</span>
					<span className='flex-1'>{value}</span>
					{selected === value && <Check aria-hidden className='size-4 shrink-0 text-icon-muted' />}
				</button>
			))}
		</div>
	);
}

/** Clarifying questions while they're being answered; once all are answered (or the chat moves on), a one-line summary. */
function QuestionsCard({
	block,
	onAnswer,
	onEdit,
	interactive,
}: {
	block: Block<"questions">;
	onAnswer: (answer: string) => void;
	/** Starts changing an answered question, or (`undefined`) keeps the answer it had. */
	onEdit: (index: number | undefined) => void;
	/** False once the conversation has moved on: the card only shows what was answered. */
	interactive: boolean;
}) {
	if (currentQuestion(block) === undefined || !interactive) {
		const answered = block.answers.filter((answer) => answer != null).length;
		return (
			<p className='flex items-center gap-1.5 text-sm text-muted-foreground'>
				<Check aria-hidden className='size-4 shrink-0 text-icon-muted' />
				{block.single ? block.questions[0].question : `${answered} of ${block.questions.length} questions answered`}
			</p>
		);
	}
	return <QuestionsList block={block} onAnswer={onAnswer} onEdit={onEdit} />;
}

/**
 * Clarifying questions in order (Figma questions frame): each answered question as it was asked with the answer in the
 * person's bubble (an edit icon inside changes it), and the active question in its place with its lettered options,
 * "You decide" last when Archie can choose for the person. A typed message answers the active question too. `single`
 * drops the "Question 2 of 4" count. After each answer the chat scrolls to the active question (rule 13). Used while
 * answering (QuestionsCard) and to edit sent answers (AnswersEditor), so both read the same.
 */
function QuestionsList({
	block,
	onAnswer,
	onEdit,
}: {
	block: Block<"questions">;
	onAnswer: (answer: string) => void;
	onEdit: (index: number | undefined) => void;
}) {
	const current = currentQuestion(block);
	const active = useRef<HTMLLIElement>(null);
	const { prefersReducedMotion } = useMotionPreference();
	const mounted = useRef(false);

	// The active area moves (to the next question, or back after a change): bring it into view. Not on first render:
	// the thread already follows a new turn.
	useEffect(() => {
		if (!mounted.current) {
			mounted.current = true;
			return;
		}
		if (active.current) {
			return scrollIntoViewSmoothly(active.current, { reducedMotion: Boolean(prefersReducedMotion) });
		}
	}, [current, block.editing]);

	return (
		<ol aria-label='Questions' className='flex flex-col gap-3'>
			{block.questions.map((question, index) => {
				const answer = block.answers[index];
				if (index === current) {
					const editing = block.editing === index;
					return (
						// The active question slides up, subtly, each time it becomes active: the next one after an answer, or one
						// reopened to change it. Keyed apart from its answered form so it mounts fresh. Not on the card's first render: the
						// card itself reveals then.
						<motion.li
							key={`${index}-active`}
							ref={active}
							variants={slideUpVariants}
							initial={mounted.current && !prefersReducedMotion ? "initial" : false}
							animate='animate'
							className='flex scroll-my-4 flex-col gap-2'
						>
							{!block.single && (
								<p className='text-sm text-muted-foreground'>
									{editing ? `Changing question ${index + 1}` : `Question ${index + 1} of ${block.questions.length}`}
								</p>
							)}
							<p className='text-sm font-semibold text-foreground'>
								{block.single ? question.question : `${index + 1}. ${question.question}`}
							</p>
							<QuestionOptions
								question={question}
								skippable={block.skippable}
								selected={editing ? answer : null}
								onPick={onAnswer}
							/>
							<div className='flex items-center justify-between gap-2 pl-1'>
								<p className='text-xs text-muted-foreground'>
									{editing && answer != null && !question.options.includes(answer) && answer !== youDecide
										? `Your answer: "${answer}". Or type a new one below.`
										: "Or type a letter, or your own answer, below."}
								</p>
								{editing && (
									<Button variant='ghost' size='xs' onClick={() => onEdit(undefined)}>
										Keep my answer
									</Button>
								)}
							</div>
						</motion.li>
					);
				}
				if (answer == null) {
					return null;
				}
				return (
					<li key={index} className='flex flex-col gap-2'>
						<p className='text-sm font-semibold text-foreground'>
							{index + 1}. {question.question}
						</p>
						<ChatMessage className='flex items-center gap-2'>
							{answer}
							{/* Edit sits inside the bubble, after the answer: it changes this answer. Sized to the text line, so the
							    bubble keeps its height. */}
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										type='button'
										aria-label={`Change answer ${index + 1}`}
										onClick={() => onEdit(index)}
										className='-mr-1 flex size-5 shrink-0 items-center justify-center rounded-sm text-icon-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
									>
										<Pencil aria-hidden className='size-3' />
									</button>
								</TooltipTrigger>
								<TooltipContent size='sm'>Change answer</TooltipContent>
							</Tooltip>
						</ChatMessage>
					</li>
				);
			})}
		</ol>
	);
}

/**
 * The person's answers to the clarifying questions, sent together, in their bubble. Collapsed, it lists the answers;
 * "Show questions" expands it to put each question above its answer, so the answers keep their context. Sent answers
 * aren't edited here for now (decision 2026-10-29); each one can be changed while answering.
 */
function AnswersMessage({
	intro,
	questions,
	answers,
}: {
	intro: string;
	questions: ClarifyingQuestion[];
	answers: string[];
}) {
	const [open, setOpen] = useState(false);
	const regionId = useId();
	const clip = useExpandClip();
	const { prefersReducedMotion } = useMotionPreference();

	return (
		<ChatMessage className='flex flex-col gap-2 whitespace-normal'>
			<p>{intro}</p>
			<ol id={regionId} className='flex flex-col gap-1.5'>
				{answers.map((answer, index) => (
					<li key={index} className='flex flex-col'>
						<AnimatePresence initial={false}>
							{open && (
								<motion.span
									{...clip}
									variants={expandVariants}
									initial='initial'
									animate='animate'
									exit='exit'
									transition={prefersReducedMotion ? reducedMotionTransition : undefined}
									className='block text-xs text-muted-foreground'
								>
									{index + 1}. {questions[index].question}
								</motion.span>
							)}
						</AnimatePresence>
						<span>
							{!open && `${index + 1}. `}
							{answer}
						</span>
					</li>
				))}
			</ol>
			<button
				type='button'
				aria-expanded={open}
				aria-controls={regionId}
				onClick={() => setOpen((current) => !current)}
				className='group flex items-center gap-1 self-start rounded-sm text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
			>
				{open ? "Hide questions" : "Show questions"}
				<ChevronRight aria-hidden className='size-3.5 transition-transform group-aria-expanded:rotate-90' />
			</button>
		</ChatMessage>
	);
}

/** A long step on one line: spinner and "Creating project blueprint…", then a check and the measured time. */
function ProgressLine({ block }: { block: Block<"progress"> }) {
	const label =
		block.state === "running"
			? block.label
			: block.state === "done"
				? `${block.doneLabel} · ${block.seconds}s`
				: block.state === "failed"
					? block.failedLabel
					: `${block.label.replace(/…$/, "")}: stopped`;

	return (
		<p className={cn("flex items-center gap-1.5 text-sm", block.state === "running" ? "text-brand" : "text-muted-foreground")}>
			<StepIcon state={block.state} />
			{label}
		</p>
	);
}

/**
 * The actions Archie proposes (Figma CTAs). Choosing one sends it; then they all lock, the chosen one checked. They also
 * lock once the conversation has moved on (`locked`).
 */
function ActionChips({
	block,
	locked: lockedProp = false,
	onChoose,
}: {
	block: Block<"actions">;
	locked?: boolean;
	onChoose: (option: string) => void;
}) {
	return (
		<div className='flex flex-col gap-2 pl-1'>
			{block.options.map((option) => {
				const chosen = block.chosen === option;
				const locked = lockedProp || block.chosen !== undefined;
				return (
					<div key={option} className='flex items-center gap-1.5'>
						<Connector />
						{chosen ? (
							// The choice stays readable: it's what the person asked for, not a disabled control.
							<span className='flex h-7 items-center gap-1.5 rounded-button-sm border border-border bg-background px-2.5 text-sm text-foreground'>
								<Check aria-hidden className='size-4' />
								{option}
							</span>
						) : (
							<Button
								variant='outline'
								size='sm'
								aria-disabled={locked || undefined}
								onClick={() => !locked && onChoose(option)}
							>
								{option}
							</Button>
						)}
					</div>
				);
			})}
		</div>
	);
}

/** The file streaming in: "Writing: path", the newest lines kept in view. */
function CodeStream({ path, code }: { path: string; code: string }) {
	const body = useRef<HTMLPreElement>(null);
	useEffect(() => {
		if (body.current) {
			body.current.scrollTop = body.current.scrollHeight;
		}
	}, [code]);

	return (
		<div className='overflow-hidden rounded-lg border border-border bg-background'>
			<div className='flex items-center justify-between gap-2 border-b border-border px-3 py-1.5 text-xs text-muted-foreground'>
				<span className='flex min-w-0 items-center gap-1.5'>
					<CodeXml aria-hidden className='size-3.5 shrink-0' />
					<span className='truncate'>
						Writing: <span className='text-foreground'>{path}</span>
					</span>
				</span>
				<StepIcon state='running' />
			</div>
			<pre ref={body} className='max-h-36 overflow-hidden px-3 py-2 font-mono text-xs leading-5 text-foreground'>
				{code}
			</pre>
		</div>
	);
}

/**
 * Files Archie writes (Tool Use): a live count with the file streaming in, then "56 files processed", expanding to time,
 * credits and the list (Cost Transparency).
 */
function FilesProcessed({ block, onViewCode }: { block: Block<"files">; onViewCode: () => void }) {
	const count = `${block.files.length} ${block.files.length === 1 ? "file" : "files"} processed`;

	if (block.state === "running") {
		return (
			<div className='flex flex-col gap-2'>
				<p className='flex items-center gap-1.5 text-sm text-muted-foreground'>
					<CodeXml aria-hidden className='size-4 shrink-0 text-icon-muted' />
					{count}
				</p>
				{block.writing && <CodeStream path={block.writing.path} code={block.writing.code} />}
			</div>
		);
	}

	return (
		<Disclosure
			icon={<CodeXml aria-hidden className='size-4 shrink-0 text-icon-muted' />}
			label={block.state === "stopped" ? `${count}, stopped` : count}
			end={
				block.state === "done" && (
					<Button variant='link' size='xs' onClick={onViewCode} className='text-link'>
						View in Code
					</Button>
				)
			}
		>
			<div className='flex flex-col gap-2'>
				<p className='text-xs text-muted-foreground'>
					Worked for {block.seconds}s{block.credits !== undefined && ` · ${block.credits} credits used`}
				</p>
				<ul className='flex max-h-60 flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border'>
					{block.files.map((file) => (
						<li key={file.path} className='flex items-center justify-between gap-2 px-3 py-1.5 text-sm'>
							<span className='truncate font-mono text-xs text-foreground'>{file.path}</span>
							<span className='shrink-0 text-xs text-muted-foreground'>{file.change === "new" ? "New" : "Modified"}</span>
						</li>
					))}
				</ul>
			</div>
		</Disclosure>
	);
}

/** Figma "Versions": the result of a build. The current one has a green check; earlier ones can be restored. */
function VersionCard({ block, onRestore }: { block: Block<"version">; onRestore: (version: number) => void }) {
	const { rating, toggle } = useFeedback();
	const [saved, setSaved] = useState(false);

	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex items-center gap-3 rounded-lg border border-border bg-background py-2.5 pr-2 pl-3'>
				{block.current ? (
					<CircleCheck aria-hidden className='size-5 shrink-0 fill-success text-background' />
				) : (
					<CircleCheck aria-hidden className='size-5 shrink-0 text-icon-muted' />
				)}
				<div className='flex min-w-0 flex-1 flex-col'>
					<span className='truncate text-sm font-semibold text-foreground'>{block.title}</span>
					<span className='text-xs text-muted-foreground'>{block.current ? "Current version" : `Version ${block.number}`}</span>
				</div>
				{!block.current && (
					<>
						<IconAction label='Restore this version' onClick={() => onRestore(block.number)}>
							<Undo2 />
						</IconAction>
						<IconAction label='More actions'>
							<Ellipsis />
						</IconAction>
					</>
				)}
			</div>
			<div className='flex items-center'>
				<IconAction label='Helpful' pressed={rating === "up"} onClick={() => toggle("up")}>
					<ThumbsUp />
				</IconAction>
				<IconAction label='Not helpful' pressed={rating === "down"} onClick={() => toggle("down")}>
					<ThumbsDown />
				</IconAction>
				<IconAction label={saved ? "Saved" : "Save version"} pressed={saved} onClick={() => setSaved((current) => !current)}>
					<Bookmark />
				</IconAction>
			</div>
		</div>
	);
}

/** Under a finished reply: copy, helpful / not helpful, and retry (Feedback Loops). */
function ResponseActions({ text, onRetry }: { text: string; onRetry?: () => void }) {
	const { rating, toggle } = useFeedback();
	const [copied, setCopied] = useState(false);

	return (
		<div className='flex items-center'>
			<IconAction
				label={copied ? "Copied" : "Copy"}
				onClick={() => {
					void navigator.clipboard?.writeText(text);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				}}
			>
				{copied ? <Check /> : <Copy />}
			</IconAction>
			<IconAction label='Helpful' pressed={rating === "up"} onClick={() => toggle("up")}>
				<ThumbsUp />
			</IconAction>
			<IconAction label='Not helpful' pressed={rating === "down"} onClick={() => toggle("down")}>
				<ThumbsDown />
			</IconAction>
			{onRetry && (
				<IconAction label='Retry' onClick={onRetry}>
					<RotateCcw />
				</IconAction>
			)}
		</div>
	);
}

/** What failed, what's unchanged, and Retry when retrying is safe (Failure Disclosure). */
function ErrorCard({ block, onRetry }: { block: Block<"error">; onRetry: (message: string) => void }) {
	return (
		<div role='alert' className='flex gap-2.5 rounded-lg border border-destructive-muted bg-destructive-subtle p-3'>
			<CircleAlert aria-hidden className='mt-0.5 size-4 shrink-0 text-destructive' />
			<div className='flex min-w-0 flex-col gap-2'>
				<div className='flex flex-col gap-0.5'>
					<p className='text-sm font-semibold text-foreground'>{block.title}</p>
					<p className='text-sm text-muted-foreground'>{block.detail}</p>
				</div>
				{block.retry && (
					<Button
						variant='outline'
						size='sm'
						aria-disabled={block.retried || undefined}
						onClick={() => !block.retried && block.retry && onRetry(block.retry)}
						className='self-start'
					>
						<RotateCcw data-icon='inline-start' />
						{block.retried ? "Retried" : block.retry}
					</Button>
				)}
			</div>
		</div>
	);
}

/** Context that isn't a reply ("Restoring to a previous version: 2 → 1", "Stopped."). */
function Note({ text }: { text: string }) {
	return <p className='text-sm text-muted-foreground'>{text}</p>;
}

/* -------------------------------------------------------------------------- */
/* Around the thread                                                          */
/* -------------------------------------------------------------------------- */

/** Figma "2 days ago": a day separator in a long thread. */
function DaySeparator({ label }: { label: string }) {
	return (
		<div role='separator' aria-label={label} className='flex items-center gap-3 text-xs text-muted-foreground'>
			<span className='h-px flex-1 bg-border' />
			{label}
			<span className='h-px flex-1 bg-border' />
		</div>
	);
}

/** Figma "Queue": messages waiting while Archie works, each removable until it's sent. */
function QueueList({ items, onRemove }: { items: string[]; onRemove: (index: number) => void }) {
	return (
		<div className='flex flex-col gap-1.5'>
			<p className='text-xs text-muted-foreground'>In queue ({items.length})</p>
			<ul className='flex flex-col gap-1.5'>
				{items.map((item, index) => (
					<li key={`${index}-${item}`} className='flex items-start gap-2 rounded-md border border-dashed border-border py-1.5 pr-1 pl-2.5'>
						<CornerDownRight aria-hidden className='mt-0.5 size-4 shrink-0 text-icon-muted' />
						<span className='min-w-0 flex-1 pt-px text-sm text-foreground'>{item}</span>
						<IconAction label='Remove from queue' onClick={() => onRemove(index)}>
							<X />
						</IconAction>
					</li>
				))}
			</ul>
		</div>
	);
}

/** Follow-up prompts above the composer after a build (Follow-up Chips). */
function SuggestionChips({ items, onPick }: { items: string[]; onPick: (item: string) => void }) {
	return (
		<div role='group' aria-label='Suggested next steps' className='flex gap-2 overflow-x-auto px-2 pb-2'>
			{items.map((item) => (
				<Button key={item} variant='outline' size='sm' className='shrink-0 bg-background' onClick={() => onPick(item)}>
					{item}
				</Button>
			))}
		</div>
	);
}

/** An empty chat: what Archie does, and a few ways to start (Prompt Starters). */
function PromptStarters({ items, onPick }: { items: string[]; onPick: (item: string) => void }) {
	return (
		<div className='flex flex-1 flex-col justify-center gap-4 py-8'>
			<div className='flex flex-col gap-1'>
				<p className='text-base font-semibold text-foreground'>What do you want to build?</p>
				<p className='text-sm text-muted-foreground'>
					Describe your app. Archie asks a few questions, plans it with you, then builds it.
				</p>
			</div>
			<div className='flex flex-col items-start gap-2'>
				{items.map((item) => (
					<Button key={item} variant='outline' size='sm' className='h-auto py-1.5 text-left whitespace-normal' onClick={() => onPick(item)}>
						{item}
					</Button>
				))}
			</div>
		</div>
	);
}

export {
	ActionChips,
	ActivityFeed,
	AnswersMessage,
	ArchieText,
	DaySeparator,
	ErrorCard,
	FilesProcessed,
	Note,
	ProgressLine,
	PromptStarters,
	QuestionsCard,
	QueueList,
	ResponseActions,
	SuggestionChips,
	ThoughtDisclosure,
	VersionCard,
};

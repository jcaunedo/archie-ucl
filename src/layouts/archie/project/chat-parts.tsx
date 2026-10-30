import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
	ArrowRight,
	Bookmark,
	Check,
	ChevronRight,
	CircleAlert,
	CircleCheck,
	CodeXml,
	Copy,
	CornerDownRight,
	Ellipsis,
	Hand,
	Minus,
	Pencil,
	RotateCw,
	ThumbsDown,
	ThumbsUp,
	Undo2,
	X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/buttons/button";
import { ChatMessage } from "@/components/data-display/chat-message";
import {
	PromptAlert,
	PromptAlertActions,
	PromptAlertDescription,
	PromptAlertTitle,
} from "@/components/feedback/prompt-alert";
import { ActivityIndicatorIcon } from "@/components/feedback/activity-indicator";
import { Loader } from "@/components/feedback/loader";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/overlays/tooltip";
import {
	drawVariants,
	expandVariants,
	fadeVariants,
	feedItemVariants,
	iconSwapReducedVariants,
	iconSwapVariants,
	layoutSpring,
	motionDuration,
	motionScale,
	reducedMotionTransition,
	revealVariants,
	scrollIntoViewSmoothly,
	slideUpVariants,
	staggerContainerVariants,
	standardTransition,
	useExpandClip,
	useMotionPreference,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

import { currentQuestion, youDecide, type ArchieBlock, type NextStep, type ClarifyingQuestion, type StepState } from "./chat-model";

// Layout-only chat parts (prds/chat-behavior-system.md §4): Figma Archie-App "Chat Experience" isn't a design-system
// file, so these live here until archie.ds has them (ARCHITECTURE.md "Layout-only parts"). Each takes its block's data
// and reports what the person does; the page owns the thread.

type Block<K extends ArchieBlock["kind"]> = Extract<ArchieBlock, { kind: K }>;

/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A 24px icon button with a tooltip that names it (`compact`: 20px, the same 12px icon). The tooltip ignores the
 * pointer, so it never covers what the pointer is heading for (a hover-revealed row would lose its hover to it).
 * `side`: where it opens, above by default.
 */
function IconAction({
	label,
	onClick,
	pressed,
	side,
	compact = false,
	children,
}: {
	label: string;
	onClick?: () => void;
	pressed?: boolean;
	side?: "top" | "bottom";
	compact?: boolean;
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
					// The icon is `foreground-subtle`, `foreground` on hover (with Button ghost's hover fill) and while pressed.
					// Ghost colors its icon itself (`[&_svg]:text-icon`), so these target the icon. Its line stays lucide's
					// default (stroke 2, 1px at 12px): fractional widths blur at this size (decision 2026-10-29).
					className={cn(
						"[&_svg]:text-foreground-subtle hover:[&_svg]:text-foreground aria-pressed:[&_svg]:text-foreground",
						compact && "size-5",
					)}
				>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent size='sm' side={side} className='pointer-events-none'>
				{label}
			</TooltipContent>
		</Tooltip>
	);
}

const MotionThumbsUp = motion.create(ThumbsUp);
const MotionThumbsDown = motion.create(ThumbsDown);

/**
 * Good / bad response (Feedback Loops). Picking one hides the other and fills its thumb (solid); picking it again
 * clears the rating, and both come back as outlines. Motion: the other one shrinks and fades out (Swap's exit) while
 * the buttons after it glide over (`layout`; wrap them in `ShiftsWithFeedback`); the pick fills and swells to
 * `motionScale.pickIcon` and settles (Confirm). Under reduced motion, it all happens at once.
 */
function FeedbackButtons({ compact = false }: { compact?: boolean }) {
	const [rating, setRating] = useState<"up" | "down" | null>(null);
	const toggle = (next: "up" | "down") => setRating((current) => (current === next ? null : next));
	const { prefersReducedMotion, resolve } = useMotionPreference();

	const thumb = (picked: boolean) => ({
		fill: "currentColor",
		initial: false,
		animate: { fillOpacity: picked ? 1 : 0, scale: picked && !prefersReducedMotion ? [1, motionScale.pickIcon, 1] : 1 },
		transition: resolve({ ...standardTransition, fillOpacity: { duration: motionDuration.fast } }),
	});

	return (
		<AnimatePresence initial={false} mode='popLayout'>
			{(["up", "down"] as const)
				.filter((choice) => rating === null || rating === choice)
				.map((choice) => (
					<motion.span
						key={choice}
						layout={!prefersReducedMotion}
						className='flex'
						variants={prefersReducedMotion ? iconSwapReducedVariants : iconSwapVariants}
						initial='hidden'
						animate='shown'
						exit='hidden'
						transition={{ layout: layoutSpring }}
					>
						{choice === "up" ? (
							<IconAction label='Good response' pressed={rating === "up"} onClick={() => toggle("up")} compact={compact}>
								<MotionThumbsUp {...thumb(rating === "up")} />
							</IconAction>
						) : (
							<IconAction label='Bad response' pressed={rating === "down"} onClick={() => toggle("down")} compact={compact}>
								<MotionThumbsDown {...thumb(rating === "down")} />
							</IconAction>
						)}
					</motion.span>
				))}
		</AnimatePresence>
	);
}

/** Buttons after `FeedbackButtons` in a row: they glide over when a choice hides, instead of jumping. */
function ShiftsWithFeedback({ children }: { children: ReactNode }) {
	const { prefersReducedMotion } = useMotionPreference();
	return (
		<motion.span layout={!prefersReducedMotion} transition={{ layout: layoutSpring }} className='flex items-center'>
			{children}
		</motion.span>
	);
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
					// Open (Figma 61:706), the label turns foreground and the chevron `icon`, keeping its weight (decision
					// 2026-10-29: Figma's medium is dropped); an icon with its own color (the brand A) keeps it. 6px after the icon, 2px between the label and the chevron.
					className='group flex min-w-0 items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-expanded:text-foreground'
				>
					{icon}
					<span className='flex min-w-0 items-center gap-[2px]'>
						<span className='truncate'>{label}</span>
						<ChevronRight
							aria-hidden
							className='size-4 shrink-0 transition-transform group-aria-expanded:rotate-90 group-aria-expanded:text-icon'
						/>
					</span>
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

const isHeading = (lines: string[]) => lines.length === 1 && /^\*\*[^*]+\*\*$/.test(lines[0]);

/** One paragraph of Archie's text: a `- ` list, a `1. ` list, a bold heading, or plain text. */
function TextBlock({ lines, paragraph }: { lines: string[]; paragraph: string }) {
	if (lines.every((line) => line.startsWith("- "))) {
		return (
			<ul className='flex list-disc flex-col gap-1 pl-5'>
				{lines.map((line, item) => (
					<li key={item}>{inline(line.slice(2))}</li>
				))}
			</ul>
		);
	}
	if (lines.every((line) => /^\d+\. /.test(line))) {
		return (
			<ol className='flex list-decimal flex-col gap-1 pl-5'>
				{lines.map((line, item) => (
					<li key={item}>{inline(line.replace(/^\d+\. /, ""))}</li>
				))}
			</ol>
		);
	}
	if (isHeading(lines)) {
		return <p className='font-semibold'>{lines[0].slice(2, -2)}</p>;
	}
	return <p className='whitespace-pre-wrap'>{inline(paragraph)}</p>;
}

/**
 * Archie's reply, from the light Markdown its replies use: paragraphs, a line in bold as a heading, `- ` lists and
 * `1. ` lists. Renders partial text as it streams. Paragraphs are 16px apart; a heading sits 8px above what it
 * introduces, so it reads as that content's title (prds/chat-behavior-system.md "Archie text").
 */
function ArchieText({ text }: { text: string }) {
	const paragraphs = text
		.split(/\n{2,}/)
		.filter((paragraph) => paragraph.trim() !== "")
		.map((paragraph) => ({ paragraph, lines: paragraph.split("\n").filter((line) => line !== "") }));

	// Each heading is grouped with the paragraph or list after it.
	const groups: (typeof paragraphs)[] = [];
	for (const block of paragraphs) {
		const previous = groups.at(-1);
		if (previous && previous.length === 1 && isHeading(previous[0].lines)) {
			previous.push(block);
		} else {
			groups.push([block]);
		}
	}

	return (
		<div className='flex flex-col gap-4 text-sm text-foreground'>
			{groups.map((group, index) =>
				group.length > 1 ? (
					<div key={index} className='flex flex-col gap-2'>
						{group.map((block, item) => (
							<TextBlock key={item} {...block} />
						))}
					</div>
				) : (
					<TextBlock key={index} {...group[0]} />
				),
			)}
		</div>
	);
}

/* -------------------------------------------------------------------------- */
/* Blocks                                                                     */
/* -------------------------------------------------------------------------- */

/** A duration as Archie shows it: "12s" under a minute, "1m 5s" from there (no leading zero). */
function formatDuration(seconds: number) {
	const minutes = Math.floor(seconds / 60);
	const rest = seconds % 60;
	return minutes > 0 ? `${minutes}m ${rest}s` : `${rest}s`;
}

/**
 * How long Archie has been working on this turn, after its live status ("· 1m 5s"), ticking each second from the
 * turn's start. Hidden from screen readers: a value changing every second shouldn't be announced.
 */
function ElapsedTime({ since }: { since: number }) {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const timer = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timer);
	}, []);

	return (
		<span aria-hidden data-slot='elapsed-time' className='shrink-0 text-sm text-muted-foreground tabular-nums'>
			· {formatDuration(Math.max(0, Math.floor((now - since) / 1000)))}
		</span>
	);
}

/**
 * A check drawn on from its short stroke (Draw): a finished step in the feed, or Copy once copied. Lucide's Check path,
 * reversed so the stroke starts at the short end, so it matches the other checks. `className` sizes and colors it (the
 * feed's 14px muted check by default).
 */
function DrawnCheck({ className = "size-3.5 text-icon-muted" }: { className?: string }) {
	const { prefersReducedMotion } = useMotionPreference();
	return (
		<svg
			aria-hidden
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth={2}
			strokeLinecap='round'
			strokeLinejoin='round'
			className={className}
		>
			<motion.path
				d='M4 12l5 5L20 6'
				variants={prefersReducedMotion ? iconSwapReducedVariants : drawVariants}
				initial='hidden'
				animate='shown'
			/>
		</svg>
	);
}

/** The live feed shows this many steps at most (decision 2026-10-29); older ones slide out at the top. */
const feedSize = 5;

/**
 * What Archie is doing, under its status (Figma "Thinking - How the system is working"): its latest steps as a live feed,
 * five at most. Each new step slides up into place at the bottom and the oldest slides out at the top (Feed). Finished steps
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
							    bounces the ball (Archie's one activity icon); when it finishes, its check draws on (Draw). The check's
							    own AnimatePresence lets it play even on a step that was in the feed from its first render. */}
							{latest ? (
								<ActivityIndicatorIcon />
							) : (
								<AnimatePresence>
									<span key='check' className='flex size-3.5 shrink-0 items-center justify-center'>
										<DrawnCheck />
									</span>
								</AnimatePresence>
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
			// Figma project 26:1053: the loader's brand state, 16px. It grows in as the thinking ends and stays brand when the
			// steps are open (the label turns foreground instead).
			icon={<Loader state='brand' className='size-4' />}
			label={`Thought for ${formatDuration(block.seconds)}`}
		>
			{/* Figma 61:706: the steps on a timeline under the A, 4px apart, drawn as Loader's `steps` state at 16px: a hollow
			    node (`background`, `foreground-subtle` ring) in the A's 16px column, 6px before each step, and one
			    `border-defined` line through the nodes, from the first step's top to the last step's node. Built here, not
			    from Loader instances: its line can't stop at the last node or bridge the rows' gaps (Figma's frame adds
			    connector and last-node pieces too). */}
			<ol className='flex flex-col gap-1 text-sm text-muted-foreground'>
				{block.steps.map((step, index) => (
					<li key={step} className='relative flex items-start gap-1.5'>
						<span
							aria-hidden
							className={cn(
								"absolute top-0 left-2 w-[1.1429px] -translate-x-1/2 bg-border-defined",
								index === block.steps.length - 1 ? "h-2.5" : "-bottom-1",
							)}
						/>
						<span aria-hidden className='relative flex h-5 w-4 shrink-0 items-center justify-center'>
							<span className='size-[7.4286px] rounded-full border-[1.1429px] border-foreground-subtle bg-background' />
						</span>
						<span className='min-w-0'>{step}</span>
					</li>
				))}
			</ol>
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
		<ol aria-label='Questions' className='flex flex-col gap-4'>
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
	...props
}: React.ComponentProps<typeof ChatMessage> & {
	intro: string;
	questions: ClarifyingQuestion[];
	answers: string[];
}) {
	const [open, setOpen] = useState(false);
	const regionId = useId();
	const clip = useExpandClip();
	const { prefersReducedMotion } = useMotionPreference();

	return (
		<ChatMessage {...props} className='flex flex-col gap-2 whitespace-normal'>
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
				? `${block.doneLabel} · ${formatDuration(block.seconds ?? 0)}`
				: block.state === "failed"
					? block.failedLabel
					: `${block.label.replace(/…$/, "")}: stopped`;

	return (
		<p className={cn("flex items-center gap-1.5 text-sm", block.state === "running" ? "text-brand" : "text-muted-foreground")}>
			{/* Figma project 26:1053: a finished step ("Stripe connected · 2s") shows the loader's done check, 16px. */}
			{block.state === "done" ? <Loader state='done' className='size-4' /> : <StepIcon state={block.state} />}
			{label}
		</p>
	);
}

/**
 * "What's next" (Follow-up Chips, Suggest / Confirm / Execute): after Archie's update, the next steps as one card, in
 * Archie's order (blueprint sections to review first, then building). Each row says what it produces. A row with `open`
 * opens that blueprint section in Plan and stays available; any other row sends its label as the person's message, and
 * then the card locks with a check on the choice (it also locks once the conversation moves on). Not in Figma: decision
 * 2026-10-29 (prds/chat-behavior-system.md rule 10).
 */
function NextSteps({
	block,
	locked: lockedProp = false,
	onChoose,
}: {
	block: Block<"actions">;
	locked?: boolean;
	onChoose: (step: NextStep) => void;
}) {
	const id = useId();
	const locked = lockedProp || block.chosen !== undefined;
	const steps = block.steps;

	// Flow: the rows, then "Or ask…", reveal one after another as the card arrives (the turn's Reveal starts them). The
	// scroll margin matches the thread's padding, so gliding to the card lands at the thread's end.
	return (
		<motion.div data-slot='next-steps' variants={staggerContainerVariants} className='flex scroll-mb-4 flex-col gap-1.5'>
			<div
				role='group'
				aria-labelledby={`${id}-title`}
				className='flex flex-col overflow-hidden rounded-lg border border-border bg-background'
			>
				<p id={`${id}-title`} className='border-b border-border px-3 py-1.5 text-xs font-medium text-muted-foreground'>
					What's next
				</p>
				<div className='flex flex-col divide-y divide-border'>
					{steps.map((step, index) => {
						const chosen = block.chosen === step.label;
						// Opening a section in Plan sends nothing, so it never locks.
						const rowLocked = locked && !step.open;
						return (
							<motion.button
								key={step.label}
								variants={revealVariants}
								type='button'
								aria-label={step.label}
								aria-describedby={step.description ? `${id}-${index}` : undefined}
								aria-disabled={rowLocked || undefined}
								aria-pressed={chosen || undefined}
								onClick={() => !rowLocked && onChoose(step)}
								className={cn(
									"group flex items-center gap-3 px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
									!rowLocked && "hover:bg-accent",
									rowLocked && !chosen && "opacity-60",
								)}
							>
								<span className='flex min-w-0 flex-1 flex-col gap-0.5'>
									<span className='text-sm font-medium text-foreground'>{step.label}</span>
									{step.description && (
										<span id={`${id}-${index}`} className='text-xs text-muted-foreground'>
											{step.description}
										</span>
									)}
								</span>
								{chosen ? (
									<Check aria-hidden className='size-4 shrink-0 text-icon-muted' />
								) : (
									<ArrowRight
										aria-hidden
										className={cn(
											"size-4 shrink-0 text-icon-muted transition-transform",
											!rowLocked && "group-hover:translate-x-0.5 group-hover:text-icon",
										)}
									/>
								)}
							</motion.button>
						);
					})}
				</div>
			</div>
			{!locked && (
				<motion.p variants={revealVariants} className='pl-1 text-xs text-muted-foreground'>
					Or ask for something else below.
				</motion.p>
			)}
		</motion.div>
	);
}

/**
 * Archie asking permission before a consequential action (UCL PromptAlert, archie.ds prompt-alert): the description,
 * then Deny (`outline`) and Allow (`neutral`). Shown on top of the composer, not in the thread, while it waits (DESIGN.md
 * "PromptAlert").
 */
function ApprovalPrompt({
	block,
	onDecide,
}: {
	block: Block<"approval">;
	onDecide: (choice: "allow" | "deny", message: string) => void;
}) {
	return (
		<PromptAlert>
			<PromptAlertTitle>{block.title}</PromptAlertTitle>
			<PromptAlertDescription>{block.description}</PromptAlertDescription>
			<PromptAlertActions>
				<Button variant='outline' size='sm' onClick={() => onDecide("deny", block.deny.message)}>
					{block.deny.label}
				</Button>
				<Button variant='neutral' size='sm' onClick={() => onDecide("allow", block.allow.message)}>
					{block.allow.label}
				</Button>
			</PromptAlertActions>
		</PromptAlert>
	);
}

/**
 * What stays in the thread from a permission request: what was asked and the decision ("Allowed", "Denied", or
 * "No answer" once the conversation moved on). Nothing while it's waiting: the prompt is on top of the composer then.
 */
function ApprovalRecord({ block, waiting }: { block: Block<"approval">; waiting: boolean }) {
	if (waiting) {
		return null;
	}
	const ask = block.description.split(". ")[0].replace(/\.$/, "");
	const outcome = block.decided === "allow" ? "Allowed" : block.decided === "deny" ? "Denied" : "No answer";
	return (
		<p className='flex items-start gap-1.5 text-sm text-muted-foreground'>
			<Hand aria-hidden className='mt-0.5 size-3.5 shrink-0 -scale-x-100' />
			<span>
				Asked permission: {ask} · <span className='font-medium text-foreground'>{outcome}</span>
			</span>
		</p>
	);
}

/**
 * Code colors, from the theme's tones so they follow light and dark mode (decision 2026-10-29): tags `success`,
 * attributes, properties and keywords `info`, CSS variables `emphasis`, strings `brand` (the theme has no magenta),
 * numbers and braces `warning`, punctuation `muted-foreground`, comments `foreground-subtle`.
 */
const codeColors = {
	comment: "text-foreground-subtle",
	string: "text-brand",
	tag: "text-success",
	variable: "text-emphasis",
	keyword: "text-info",
	attribute: "text-info",
	call: "text-warning",
	number: "text-warning",
	brace: "text-warning",
	punctuation: "text-muted-foreground",
} as const;

// One pattern for the languages Archie writes (TSX, CSS, HTML), group by group in `codeColors` order.
const codeToken = new RegExp(
	[
		String.raw`(\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
		String.raw`("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|\x60(?:[^\x60\\]|\\.)*\x60?)`,
		String.raw`(<\/?[A-Za-z!][\w.:-]*)`,
		String.raw`(--[\w-]+)`,
		String.raw`\b(import|from|export|const|let|function|return|if|else|true|false|null|new|async|await|type)\b`,
		String.raw`([A-Za-z_][\w-]*)(?==|:\s)`,
		String.raw`([A-Za-z_][\w-]*)(?=\()`,
		String.raw`\b(\d+(?:\.\d+)?(?:%|px|rem)?)\b`,
		String.raw`([{}()[\]])`,
		String.raw`([<>/=:;,.*])`,
	].join("|"),
	"g",
);

/** Code with the theme's syntax colors. Tolerates partial code (an unclosed string) as it streams in. */
function highlight(code: string) {
	const kinds = Object.keys(codeColors) as (keyof typeof codeColors)[];
	const out: ReactNode[] = [];
	let last = 0;
	for (const match of code.matchAll(codeToken)) {
		const index = match.index ?? 0;
		if (index > last) {
			out.push(code.slice(last, index));
		}
		const group = match.slice(1).findIndex((value) => value !== undefined);
		out.push(
			<span key={index} className={codeColors[kinds[group]]}>
				{match[0]}
			</span>,
		);
		last = index + match[0].length;
	}
	if (last < code.length) {
		out.push(code.slice(last));
	}
	return out;
}

/** The file streaming in: "Writing: path", the newest lines kept in view, in the theme's code colors. */
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
				{highlight(code)}
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
					Worked for {formatDuration(block.seconds ?? 0)}{block.credits !== undefined && ` · ${block.credits} credits used`}
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
			<div className='relative flex items-center'>
				<FeedbackButtons />
				<ShiftsWithFeedback>
					<IconAction label="Bookmark" pressed={saved} onClick={() => setSaved((current) => !current)}>
						<Bookmark />
					</IconAction>
				</ShiftsWithFeedback>
			</div>
		</div>
	);
}

/**
 * The check that replaces Copy once copied, drawn on (Draw). `foreground`, over the action icons' `foreground-subtle`
 * (`!`, since the button colors its icon through a descendant selector); the button sizes it.
 */
const CopiedCheck = () => <DrawnCheck className='text-foreground!' />;

/** Copies text to the clipboard. `copied` stays true for 1.5s after, so the button can say "Copied". */
function useCopy(text: string) {
	const [copied, setCopied] = useState(false);
	const copy = () => {
		void navigator.clipboard?.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};
	return { copied, copy };
}

const timeFormat = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const dayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const dayYearFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** When a message was sent: "3:42 PM" today, "Oct 27, 3:42 PM" another day, with the year when it isn't this one. */
function formatSentAt(at: number, now = Date.now()) {
	const sent = new Date(at);
	const today = new Date(now);
	const time = timeFormat.format(sent);
	if (sent.toDateString() === today.toDateString()) {
		return time;
	}
	const day = (sent.getFullYear() === today.getFullYear() ? dayFormat : dayYearFormat).format(sent);
	return `${day}, ${time}`;
}

/**
 * When the person's message was sent, then Copy and Retry, below its bubble on the right, in the thread's gap. They
 * show while the message is hovered (`group/message` on its row) or when one of them has keyboard focus. Retry sends the message again.
 */
function MessageActions({ text, sentAt, onRetry }: { text: string; sentAt: number; onRetry: () => void }) {
	const { copied, copy } = useCopy(text);

	return (
		// Below the bubble, its buttons 4px down, over the thread's 24px gap, so it takes no space. Hidden, it lets clicks
		// through. The 4px is padding, not margin: the row touches the bubble, so moving the pointer from the bubble to a
		// button never leaves the hover area and the actions stay.
		<div className='pointer-events-none absolute top-full right-0 flex pt-1 items-center opacity-0 transition-opacity group-hover/message:pointer-events-auto group-hover/message:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100'>
			{/* When it was sent, before the buttons: the time today, the date and time before. */}
			<time dateTime={new Date(sentAt).toISOString()} className='mr-1 text-xs text-foreground-subtle'>
				{formatSentAt(sentAt)}
			</time>
			{/* Tooltips below: above, they'd cover the bubble the pointer comes from. 20px buttons: 4px down, they end where
			    the next item starts (24px), so they never overlap it (decision 2026-10-29). */}
			<IconAction label={copied ? "Copied" : "Copy"} onClick={copy} side='bottom' compact>
				{copied ? <CopiedCheck /> : <Copy />}
			</IconAction>
			<IconAction label='Retry' onClick={onRetry} side='bottom' compact>
				<RotateCw />
			</IconAction>
		</div>
	);
}

/** Under a finished reply: copy, good / bad response, and retry (Feedback Loops). */
function ResponseActions({ text, onRetry }: { text: string; onRetry?: () => void }) {
	const { copied, copy } = useCopy(text);

	return (
		// In the gap below the reply, so it takes no space: 20px buttons 4px down, then 8px (the turn's `mb-2`) before the
		// next message (decision 2026-10-29). The turn is `relative`.
		<div className='absolute top-full left-0 flex pt-1'>
			<IconAction label={copied ? "Copied" : "Copy"} onClick={copy} compact>
				{copied ? <CopiedCheck /> : <Copy />}
			</IconAction>
			<FeedbackButtons compact />
			{onRetry && (
				<ShiftsWithFeedback>
					<IconAction label='Retry' onClick={onRetry} compact>
						<RotateCw />
					</IconAction>
				</ShiftsWithFeedback>
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
						<RotateCw data-icon='inline-start' />
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
	ActivityFeed,
	ApprovalPrompt,
	ApprovalRecord,
	ElapsedTime,
	AnswersMessage,
	ArchieText,
	DaySeparator,
	ErrorCard,
	FilesProcessed,
	NextSteps,
	Note,
	ProgressLine,
	PromptStarters,
	QuestionsCard,
	QueueList,
	MessageActions,
	ResponseActions,
	ThoughtDisclosure,
	VersionCard,
};

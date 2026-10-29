import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Database, FileIcon, Frame, Mic, MousePointer2, Palette, Plus } from "lucide-react";

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
import { Typography } from "@/components/typography";

import {
	Account,
	ArchieMark,
	ChatActions,
	ChatSwitcher,
	LogoLink,
	ModelPicker,
	ProjectSwitcher,
	TopbarActions,
} from "./parts";

/** The blueprint phases, in MainNav order. The selected one titles the canvas. */
const phases = [
	{ value: "plan", label: "Plan", icon: Frame },
	{ value: "design", label: "Design", icon: Palette },
	{ value: "frontend", label: "Frontend", icon: MousePointer2 },
	{ value: "backend", label: "Backend", icon: Database },
	{ value: "assets", label: "Assets", icon: FileIcon },
] as const;

type Phase = (typeof phases)[number]["value"];

type ChatEntry = { from: "person" | "archie"; text: string };

/**
 * What Archie sends while it answers, after the PRD's event model ("Conversational progress feedback" §11), trimmed to
 * what the layout shows: a status that replaces the previous one, a chunk of the streamed reply, and the end of the turn.
 */
type ArchieEvent = { type: "status"; label: string } | { type: "reply"; text: string } | { type: "done" };

/** Answers one message by calling `emit` for each event, and returns a function that stops it. Stands in for Archie's backend. */
type ArchieResponder = (message: string, emit: (event: ArchieEvent) => void) => () => void;

type ProjectData = {
	org: string;
	project: string;
	credits: number;
	/** Image URL for the account button. */
	avatar: string;
	chatTitle: string;
	model: string;
	messages: ChatEntry[];
};

type ProjectProps = {
	data: ProjectData;
	/** The phase shown first. */
	defaultPhase?: Phase;
	/** Whether the chat starts expanded (Figma chat-composer State=expanded). */
	defaultChatOpen?: boolean;
	/** Answers the person's messages. Without it, nothing replies and Archie stays "Thinking…" (Figma's frame). */
	respond?: ArchieResponder;
};

/**
 * The project page: Topbar, the chat on the left, the canvas for the selected phase on the right. Figma origin: archie.ds
 * → "project". With `respond`, Archie answers each message: one status updated in place, then the reply streams in.
 */
function Project({ data, defaultPhase = "plan", defaultChatOpen = true, respond }: ProjectProps) {
	const [phase, setPhase] = useState<Phase>(defaultPhase);
	const [messages, setMessages] = useState(data.messages);
	const [answering, setAnswering] = useState(false);
	// Archie's latest status. Cleared when the reply starts streaming (PRD FR-05).
	const [status, setStatus] = useState<string | null>(null);
	const stopAnswering = useRef<(() => void) | null>(null);
	const activity = respond ? status : messages.at(-1)?.from === "person" ? "Thinking…" : null;
	const phaseLabel = phases.find(({ value }) => value === phase)?.label;

	function ask(message: string) {
		if (!respond) {
			return;
		}
		stopAnswering.current?.();
		setAnswering(true);
		setStatus(null);
		let replying = false;
		stopAnswering.current = respond(message, (event) => {
			if (event.type === "status") {
				setStatus(event.label);
			} else if (event.type === "reply") {
				setStatus(null);
				const started = replying;
				replying = true;
				setMessages((current) =>
					started
						? [...current.slice(0, -1), { from: "archie", text: current.at(-1)!.text + event.text }]
						: [...current, { from: "archie", text: event.text }],
				);
			} else {
				setStatus(null);
				setAnswering(false);
				stopAnswering.current = null;
			}
		});
	}

	// A thread that opens on the person's message (a project just created) gets its answer on load.
	useEffect(() => {
		if (data.messages.at(-1)?.from === "person") {
			ask(data.messages.at(-1)!.text);
		}
		return () => stopAnswering.current?.();
	}, []);

	// Follow the reply as it streams, unless the person has scrolled up to read.
	const thread = useRef<HTMLDivElement>(null);
	const pinnedToEnd = useRef(true);
	useLayoutEffect(() => {
		if (thread.current && pinnedToEnd.current) {
			thread.current.scrollTop = thread.current.scrollHeight;
		}
	}, [messages, activity]);

	return (
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
					<TopbarActions credits={data.credits} />
					<Account avatar={data.avatar} />
				</TopbarEnd>
			</Topbar>

			{/* Figma "Container": 8px on the sides and bottom, none on top, 2px between the chat and the canvas. */}
			<div className='flex min-h-0 flex-1 gap-0.5 px-2 pb-2'>
				{/* 440px open; ChatPanel narrows itself to the 32px rail when collapsed, and the canvas takes the rest. */}
				<ChatPanel aria-label='Chat' defaultOpen={defaultChatOpen} className='w-110 shrink-0'>
					<ChatPanelRail>
						<ArchieMark />
					</ChatPanelRail>
					<ChatPanelHeader>
						<ChatSwitcher title={data.chatTitle} />
						<ChatActions />
					</ChatPanelHeader>
					<ChatPanelBody
						ref={thread}
						onScroll={(event) => {
							const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
							pinnedToEnd.current = scrollHeight - scrollTop - clientHeight < 24;
						}}
					>
						{messages.map((message, index) =>
							message.from === "person" ? (
								<ChatMessage key={index}>{message.text}</ChatMessage>
							) : (
								// Figma's "Text" placeholder: Archie's reply has no component yet (DESIGN.md "Chat panel").
								<p key={index} className='text-sm whitespace-pre-wrap text-foreground'>
									{message.text}
								</p>
							),
						)}
						{activity && <ActivityIndicator>{activity}</ActivityIndicator>}
					</ChatPanelBody>
					<ChatPanelFooter>
						<PromptComposer
							pending={answering}
							onSubmit={(text) => {
								pinnedToEnd.current = true;
								setMessages((current) => [...current, { from: "person", text }]);
								ask(text);
							}}
							onVoice={() => {}}
						>
							<PromptComposerTextarea placeholder='Message Archie…' aria-label='Message Archie' />
							<PromptComposerFooter>
								<PromptComposerButton aria-label='Attach files'>
									<Plus />
								</PromptComposerButton>
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

				{/* Figma "Canvas": 16px corners, `border/border`, a 48px header over the phase's content. */}
				<main className='flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border'>
					<header className='flex h-12 shrink-0 items-center gap-2 border-b border-input bg-background pr-3 pl-4'>
						<Typography as='h1' size='base' weight='semibold'>
							{phaseLabel}
						</Typography>
					</header>
					{/* Each phase's content goes here; Figma leaves it empty. */}
					<div className='min-h-0 flex-1 overflow-y-auto bg-background p-4' />
				</main>
			</div>
		</div>
	);
}

export { Project, type ArchieEvent, type ArchieResponder, type ProjectData, type ProjectProps };

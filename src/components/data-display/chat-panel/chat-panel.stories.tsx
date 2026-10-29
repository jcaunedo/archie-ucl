/// <reference types="vite/client" />
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, MessageCirclePlus, Mic, Plus } from "lucide-react";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/buttons/button";
import { ChatMessage } from "@/components/data-display/chat-message";
import { ActivityIndicator } from "@/components/feedback/activity-indicator";
import {
	PromptComposer,
	PromptComposerButton,
	PromptComposerFooter,
	PromptComposerSubmit,
	PromptComposerTextarea,
} from "@/components/forms/prompt-composer";

import {
	ChatPanel,
	ChatPanelBody,
	ChatPanelFooter,
	ChatPanelHeader,
	ChatPanelRail,
	ChatPanelTrigger,
} from "./chat-panel";
import archieLogomark from "./story-assets/archie-logomark.svg";
import historyIcon from "./story-assets/history.svg";

// Stand-ins for parts UCL doesn't have yet: the chat switcher and the model picker (both need DropdownMenu or Select),
// and the Archie mark on the collapsed rail.

/** Figma State=collapsed: an 18px brand circle with the white logomark. */
function ArchieMarkStandIn() {
	return (
		<span aria-hidden className='flex size-4.5 items-center justify-center rounded-full bg-brand'>
			<img alt='' src={archieLogomark} />
		</span>
	);
}

function ChatSwitcherStandIn() {
	return (
		<button type='button' className='flex min-w-0 items-center gap-1 text-sm font-medium text-foreground'>
			<span className='truncate'>Ice cream inventory app</span>
			<ChevronDown aria-hidden className='size-4 shrink-0 text-icon' />
		</button>
	);
}

function ModelStandIn() {
	return (
		<button
			type='button'
			aria-label='Model: Auto'
			className='flex h-7 items-center gap-[2px] rounded-full pr-2 pl-3 text-sm text-muted-foreground transition-colors hover:bg-accent'
		>
			Auto
			<ChevronDown aria-hidden className='size-4 text-icon-muted' />
		</button>
	);
}

/** Figma's header actions: 28px ghost buttons with 16px icons, 2px apart. New chat, history, collapse. */
function HeaderActions() {
	return (
		<div className='flex items-center gap-0.5'>
			<Button variant='ghost' size='icon-sm' aria-label='New chat'>
				<MessageCirclePlus aria-hidden className='size-4' />
			</Button>
			<Button variant='ghost' size='icon-sm' aria-label='Chat history'>
				<img alt='' src={historyIcon} className='size-4' />
			</Button>
			<ChatPanelTrigger />
		</div>
	);
}

/** The chat column with a working composer: sending adds the message and shows "Thinking…". */
function Chat({ initial, defaultOpen }: { initial: string[]; defaultOpen?: boolean }) {
	const [messages, setMessages] = useState(initial);

	return (
		<ChatPanel aria-label='Chat' defaultOpen={defaultOpen}>
			<ChatPanelRail>
				<ArchieMarkStandIn />
			</ChatPanelRail>
			<ChatPanelHeader>
				<ChatSwitcherStandIn />
				<HeaderActions />
			</ChatPanelHeader>
			<ChatPanelBody>
				{messages.map((message, index) => (
					<ChatMessage key={index}>{message}</ChatMessage>
				))}
				{messages.length > 0 && <ActivityIndicator>Thinking…</ActivityIndicator>}
			</ChatPanelBody>
			<ChatPanelFooter>
				<PromptComposer onSubmit={(message) => setMessages((current) => [...current, message])} onVoice={() => {}}>
					<PromptComposerTextarea placeholder='Message Archie…' aria-label='Message Archie' />
					<PromptComposerFooter>
						<PromptComposerButton aria-label='Attach files'>
							<Plus />
						</PromptComposerButton>
						<div className='flex items-center gap-2'>
							<ModelStandIn />
							<PromptComposerButton variant='outline' aria-label='Dictate'>
								<Mic />
							</PromptComposerButton>
							<PromptComposerSubmit />
						</div>
					</PromptComposerFooter>
				</PromptComposer>
			</ChatPanelFooter>
		</ChatPanel>
	);
}

const meta = {
	title: "Data Display/ChatPanel",
	component: ChatPanel,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div className='h-[1048px] w-[440px]'>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Figma chat-composer: one message, Archie thinking, the composer at the bottom.
 * Test: sending from the composer adds the message to the thread, which is a live `log`.
 */
export const Default: Story = {
	render: () => <Chat initial={["create an ice cream shop inventory app"]} />,
	play: async ({ canvas, userEvent }) => {
		const thread = canvas.getByRole("log");
		await userEvent.type(canvas.getByRole("textbox", { name: "Message Archie" }), "Add a supplier page{Enter}");
		await expect(thread).toHaveTextContent("Add a supplier page");
		await expect(canvas.getAllByRole("status")).toHaveLength(1);
	},
};

/**
 * Figma State=collapsed: a 32px rail with the Archie mark.
 * Test: the rail expands the panel, the header button collapses it again, only one control answers to "Expand chat"
 * while it animates, and a draft in the composer survives.
 */
export const Collapsed: Story = {
	render: () => <Chat initial={["create an ice cream shop inventory app"]} defaultOpen={false} />,
	play: async ({ canvas, canvasElement, userEvent }) => {
		const panel = canvasElement.querySelector<HTMLElement>("[data-slot='chat-panel']")!;
		await expect(panel.getBoundingClientRect().width).toBe(32);
		await expect(canvas.queryByRole("log")).not.toBeInTheDocument();

		await userEvent.click(canvas.getByRole("button", { name: "Expand chat" }));
		await expect(panel).toHaveAttribute("data-state", "expanded");
		// The content fades in once the panel has widened.
		const field = await waitFor(() => canvas.getByRole("textbox", { name: "Message Archie" }));
		await waitFor(() => expect(field).toBeVisible());
		await userEvent.type(field, "Add a supplier page");

		await userEvent.click(canvas.getByRole("button", { name: "Collapse chat" }));
		await expect(panel).toHaveAttribute("data-state", "collapsed");
		// Hidden parts are inert from the first frame, so only the rail answers to "Expand chat". Testing Library doesn't
		// treat `inert` as hidden, so leave inert elements out, as the browser's accessibility tree does.
		const reachable = canvas.getAllByRole("button", { name: "Expand chat" }).filter((button) => !button.closest("[inert]"));
		await expect(reachable).toHaveLength(1);
		await userEvent.click(reachable[0]);
		await waitFor(() => expect(canvas.getByRole("textbox", { name: "Message Archie" })).toHaveValue("Add a supplier page"));
	},
};

/** Before the first message: an empty thread, no activity. */
export const Empty: Story = {
	render: () => <Chat initial={[]} />,
};

/** A long thread scrolls inside the body; the header and composer stay put. */
export const LongThread: Story = {
	render: () => (
		<Chat
			initial={Array.from({ length: 14 }, (_, index) =>
				index % 2 === 0 ? "create an ice cream shop inventory app" : "Add a supplier page with order history",
			)}
		/>
	),
};

export const AllVariants: Story = {
	decorators: [
		(Story) => (
			<div className='flex h-[640px] w-[920px] gap-4'>
				<Story />
			</div>
		),
	],
	render: () => (
		<>
			<Chat initial={[]} defaultOpen={false} />
			<Chat initial={[]} />
			<Chat initial={["create an ice cream shop inventory app"]} />
		</>
	),
};

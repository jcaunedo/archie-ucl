import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChatMessage } from "./chat-message";

const meta = {
	title: "Data Display/ChatMessage",
	component: ChatMessage,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	args: {
		children: "create an ice cream shop inventory app",
	},
	decorators: [
		(Story) => (
			<div className='flex w-[408px] flex-col'>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof ChatMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's Bubble: one short line, hugging its text on the right. */
export const Default: Story = {};

/** A long message wraps at 85% of the thread and keeps its line breaks. */
export const LongMessage: Story = {
	args: {
		children:
			"Create an inventory app for my ice cream shop.\nTrack flavors, tubs in the freezer and supplier orders, and warn me when a flavor runs low.",
	},
};

export const AllVariants: Story = {
	render: () => (
		<div className='flex flex-col gap-4'>
			<ChatMessage>create an ice cream shop inventory app</ChatMessage>
			<ChatMessage>Add a supplier page</ChatMessage>
			<ChatMessage>
				Create an inventory app for my ice cream shop. Track flavors, tubs in the freezer and supplier orders, and
				warn me when a flavor runs low.
			</ChatMessage>
		</div>
	),
};

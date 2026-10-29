import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown, Mic, Plus } from "lucide-react";
import { expect, fn } from "storybook/test";

import {
	PromptComposer,
	PromptComposerButton,
	PromptComposerFooter,
	PromptComposerSubmit,
	PromptComposerTextarea,
} from "./prompt-composer";

/** Stand-in for the model picker until Select or DropdownMenu exists. Figma: 28px pill, muted label and chevron. */
function ModelStandIn() {
	return (
		<button
			type='button'
			aria-label='Model: Default'
			className='flex h-7 items-center gap-[2px] rounded-full pr-2 pl-3 text-sm text-muted-foreground transition-colors hover:bg-accent'
		>
			Default
			<ChevronDown aria-hidden className='size-4 text-icon-muted' />
		</button>
	);
}

/** Figma's row: attach on the left; model, mic and Send on the right, 8px apart. */
function Composer(props: ComponentProps<typeof PromptComposer>) {
	return (
		<PromptComposer {...props}>
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
	);
}

const meta = {
	title: "Forms/PromptComposer",
	component: PromptComposer,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	args: {
		onSubmit: fn(),
		onVoice: fn(),
	},
	decorators: [
		(Story) => (
			<div className='w-[420px]'>
				<Story />
			</div>
		),
	],
	render: (args) => <Composer {...args} />,
} satisfies Meta<typeof PromptComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Figma prompt-composer: empty, so the dark button starts voice mode.
 * Test: typing turns it into Send; Enter sends the trimmed message, clears the box and brings voice mode back.
 */
export const Default: Story = {
	play: async ({ args, canvas, userEvent }) => {
		const field = canvas.getByRole("textbox", { name: "Message Archie" });
		await userEvent.click(canvas.getByRole("button", { name: "Start voice mode" }));
		await expect(args.onVoice).toHaveBeenCalledOnce();

		await userEvent.type(field, "  Add a booking page  ");
		await expect(canvas.getByRole("button", { name: "Send" })).toBeInTheDocument();

		await userEvent.keyboard("{Enter}");
		await expect(args.onSubmit).toHaveBeenCalledWith("Add a booking page");
		await expect(field).toHaveValue("");
		await expect(canvas.getByRole("button", { name: "Start voice mode" })).toBeInTheDocument();
	},
};

/** Test: Shift+Enter adds a line instead of sending, and the Send button sends. */
export const MultipleLines: Story = {
	play: async ({ args, canvas, userEvent }) => {
		const field = canvas.getByRole("textbox", { name: "Message Archie" });
		await userEvent.type(field, "Add a booking page{Shift>}{Enter}{/Shift}with a calendar");
		await expect(args.onSubmit).not.toHaveBeenCalled();
		await expect(field).toHaveValue("Add a booking page\nwith a calendar");

		await userEvent.click(canvas.getByRole("button", { name: "Send" }));
		await expect(args.onSubmit).toHaveBeenCalledWith("Add a booking page\nwith a calendar");
	},
};

/** Without `onVoice`, an empty box shows Send, focusable but disabled. Test: clicking it sends nothing. */
export const WithoutVoice: Story = {
	args: {
		onVoice: undefined,
	},
	play: async ({ args, canvas, userEvent }) => {
		const send = canvas.getByRole("button", { name: "Send" });
		await expect(send).toHaveAttribute("aria-disabled", "true");
		await userEvent.click(send);
		await expect(args.onSubmit).not.toHaveBeenCalled();
	},
};

/** Archie is answering. Test: Send is busy, and Enter doesn't send the next message yet. */
export const Pending: Story = {
	args: {
		pending: true,
		defaultValue: "Now add payments",
	},
	play: async ({ args, canvas, userEvent }) => {
		await expect(canvas.getByRole("button", { name: "Send" })).toHaveAttribute("aria-busy", "true");
		await userEvent.click(canvas.getByRole("textbox", { name: "Message Archie" }));
		await userEvent.keyboard("{Enter}");
		await expect(args.onSubmit).not.toHaveBeenCalled();
	},
};

export const AllVariants: Story = {
	render: (args) => (
		<div className='flex flex-col gap-4 text-sm text-muted-foreground'>
			<span>Empty, with voice</span>
			<Composer {...args} />
			<span>With a message</span>
			<Composer {...args} defaultValue='Add a booking page with a calendar' />
			<span>Empty, without voice</span>
			<Composer {...args} onVoice={undefined} />
			<span>Pending</span>
			<Composer {...args} pending defaultValue='Now add payments' />
		</div>
	),
};

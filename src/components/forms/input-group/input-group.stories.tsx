import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowUp, Copy, Search } from "lucide-react";
import { expect } from "storybook/test";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
} from "./input-group";

const meta = {
	title: "Forms/InputGroup",
	component: InputGroup,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div className='w-80'>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An icon before the field. Test: clicking the icon focuses the field, and the group shows the focus ring. */
export const Default: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupInput placeholder='Search projects' aria-label='Search projects' />
			<InputGroupAddon>
				<Search aria-hidden />
			</InputGroupAddon>
		</InputGroup>
	),
	play: async ({ canvas, canvasElement, userEvent }) => {
		const input = canvas.getByRole("textbox", { name: "Search projects" });
		await userEvent.click(canvasElement.querySelector("[data-slot='input-group-addon']")!);
		await expect(input).toHaveFocus();
	},
};

/** Text and a button after the field. */
export const WithTextAndButton: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupInput defaultValue='archie.com/p/blueprint' aria-label='Share link' readOnly />
			<InputGroupAddon align='inline-end'>
				<InputGroupButton size='icon-xs' aria-label='Copy link'>
					<Copy />
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	),
};

export const WithSuffixText: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupInput placeholder='my-app' aria-label='Subdomain' />
			<InputGroupAddon align='inline-end'>
				<InputGroupText>.archie.app</InputGroupText>
			</InputGroupAddon>
		</InputGroup>
	),
};

/** A textarea with a row of actions below it (PromptComposer is built this way). Test: the field takes typed text. */
export const Textarea: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupTextarea placeholder='Describe your app' aria-label='Describe your app' />
			<InputGroupAddon align='block-end' className='justify-between'>
				<InputGroupText>0 / 500</InputGroupText>
				<InputGroupButton size='icon-xs' variant='default' aria-label='Send'>
					<ArrowUp />
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	),
	play: async ({ canvas, userEvent }) => {
		const field = canvas.getByRole("textbox", { name: "Describe your app" });
		await userEvent.type(field, "A booking app for a dog groomer");
		await expect(field).toHaveValue("A booking app for a dog groomer");
	},
};

/** Figma Input, State=Error: set `aria-invalid` on the control and the whole group turns red. */
export const Invalid: Story = {
	render: (args) => (
		<InputGroup {...args}>
			<InputGroupInput defaultValue='my app' aria-label='Subdomain' aria-invalid />
			<InputGroupAddon align='inline-end'>
				<InputGroupText>.archie.app</InputGroupText>
			</InputGroupAddon>
		</InputGroup>
	),
};

/** Figma Input, State=Disabled. Set `data-disabled` on the group to dim its addons too. */
export const Disabled: Story = {
	render: (args) => (
		<InputGroup data-disabled='true' {...args}>
			<InputGroupInput placeholder='Search projects' aria-label='Search projects' disabled />
			<InputGroupAddon>
				<Search aria-hidden />
			</InputGroupAddon>
		</InputGroup>
	),
};

export const AllVariants: Story = {
	render: () => (
		<div className='flex flex-col gap-4'>
			<InputGroup>
				<InputGroupInput placeholder='Search projects' aria-label='Search projects' />
				<InputGroupAddon>
					<Search aria-hidden />
				</InputGroupAddon>
			</InputGroup>
			<InputGroup>
				<InputGroupInput placeholder='my-app' aria-label='Subdomain' />
				<InputGroupAddon align='inline-end'>
					<InputGroupText>.archie.app</InputGroupText>
				</InputGroupAddon>
			</InputGroup>
			<InputGroup>
				<InputGroupInput defaultValue='my app' aria-label='Invalid subdomain' aria-invalid />
				<InputGroupAddon align='inline-end'>
					<InputGroupText>.archie.app</InputGroupText>
				</InputGroupAddon>
			</InputGroup>
			<InputGroup data-disabled='true'>
				<InputGroupInput placeholder='Search projects' aria-label='Disabled search' disabled />
				<InputGroupAddon>
					<Search aria-hidden />
				</InputGroupAddon>
			</InputGroup>
			<InputGroup>
				<InputGroupTextarea placeholder='Describe your app' aria-label='Describe your app' />
				<InputGroupAddon align='block-end' className='justify-end'>
					<InputGroupButton size='icon-xs' variant='default' aria-label='Send'>
						<ArrowUp />
					</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
		</div>
	),
};

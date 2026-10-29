import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { Button } from "@/components/buttons/button";

import { PromptAlert, PromptAlertActions, PromptAlertDescription, PromptAlertTitle } from "./prompt-alert";

/** Figma prompt-alert: the ask, what it changes, and Deny (`outline`) / Allow (`neutral`), both `sm`. */
function Prompt({
	description,
	onAllow,
	onDeny,
}: {
	description: string;
	onAllow?: () => void;
	onDeny?: () => void;
}) {
	return (
		<PromptAlert>
			<PromptAlertTitle>Ask permission</PromptAlertTitle>
			<PromptAlertDescription>{description}</PromptAlertDescription>
			<PromptAlertActions>
				<Button variant='outline' size='sm' onClick={onDeny}>
					Deny
				</Button>
				<Button variant='neutral' size='sm' onClick={onAllow}>
					Allow
				</Button>
			</PromptAlertActions>
		</PromptAlert>
	);
}

const meta = {
	title: "Feedback/PromptAlert",
	component: PromptAlert,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div className='w-[424px]'>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof PromptAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

const allow = fn();
const deny = fn();

/**
 * Figma prompt-alert: Archie asks before removing part of the app.
 * Test: it's an alert screen readers hear, with the ask and both choices; Allow and Deny each call their handler.
 */
export const Default: Story = {
	render: () => (
		<Prompt
			description='Remove Cart & Checkout. The store stops taking orders; shoppers can only browse.'
			onAllow={allow}
			onDeny={deny}
		/>
	),
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.getByRole("alert")).toHaveTextContent("Ask permission");
		await userEvent.click(canvas.getByRole("button", { name: "Deny" }));
		await expect(deny).toHaveBeenCalledOnce();
		await userEvent.click(canvas.getByRole("button", { name: "Allow" }));
		await expect(allow).toHaveBeenCalledOnce();
	},
};

/** A longer description wraps; the actions stay at the end of their row. */
export const LongDescription: Story = {
	render: () => (
		<Prompt description='Connect Stripe in live mode. Checkout will charge real cards in USD and CAD, and Stripe will start sending payouts to the bank account on file. You can switch back to test mode at any time.' />
	),
};

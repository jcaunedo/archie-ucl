import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Button } from "@/components/buttons/button";

import { ActivityIndicator } from "./activity-indicator";

const meta = {
	title: "Feedback/ActivityIndicator",
	component: ActivityIndicator,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	args: {
		children: "Thinking…",
	},
} satisfies Meta<typeof ActivityIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma's Thought row. Test: it's a live status region, so screen readers hear "Thinking…". */
export const Default: Story = {
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("status")).toHaveTextContent("Thinking…");
	},
};

const steps = ["Understanding your request…", "Reviewing your data model…", "Comparing relationships…"];

/** PRD FR-02: the status updates in place, never as new messages. Test: the next step replaces the label. */
export const ReplacesInPlace: Story = {
	render: () => {
		const [step, setStep] = useState(0);
		return (
			<div className='flex flex-col items-start gap-4'>
				<ActivityIndicator>{steps[step]}</ActivityIndicator>
				<Button variant='outline' size='md' onClick={() => setStep((current) => (current + 1) % steps.length)}>
					Next step
				</Button>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: "Next step" }));
		await expect(canvas.getAllByRole("status")).toHaveLength(1);
		await expect(canvas.getByRole("status")).toHaveTextContent("Reviewing your data model…");
	},
};

export const AllVariants: Story = {
	render: () => (
		<div className='flex w-80 flex-col gap-3'>
			<ActivityIndicator>Thinking…</ActivityIndicator>
			<ActivityIndicator>Reviewing your data model…</ActivityIndicator>
			<ActivityIndicator>Generating the inventory screens for your ice cream shop…</ActivityIndicator>
		</div>
	),
};

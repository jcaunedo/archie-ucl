import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { Button } from "@/components/buttons/button";

import { Loader } from "./loader";

const meta = {
	title: "Feedback/Loader",
	component: Loader,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Figma "loading": the activity ball bouncing in the 28px frame. Test: it's decorative, hidden from screen readers. */
export const Loading: Story = {
	args: { state: "loading" },
	play: async ({ canvasElement }) => {
		const loader = canvasElement.querySelector("[data-slot='loader']");
		await expect(loader).toHaveAttribute("data-state", "loading");
		await expect(loader).toHaveAttribute("aria-hidden", "true");
	},
};

/**
 * Figma "brand": the Archie A, in brand. The loader switches to it when Archie's status turns to "thought"; it grows in
 * (Swap). Test: the A settles at full size and opacity.
 */
export const Brand: Story = {
	args: { state: "brand" },
	play: async ({ canvasElement }) => {
		const glyph = canvasElement.querySelector<HTMLElement>("[data-slot='loader-brand']")!;
		await waitFor(() => expect(getComputedStyle(glyph).opacity).toBe("1"));
		await waitFor(() => expect(glyph.querySelector("svg")!.getBoundingClientRect().height).toBeCloseTo(27, 0));
	},
};

/**
 * Figma "steps": a step on a timeline, a hollow node on a line that runs past the frame. Stacked 4px apart, the lines
 * join. Test: the line runs past the frame, 5 and 4 of 28 above and below.
 */
export const Steps: Story = {
	args: { state: "steps" },
	render: (args) => (
		<div className='flex flex-col gap-1'>
			<Loader {...args} />
			<Loader {...args} />
			<Loader {...args} />
		</div>
	),
	play: async ({ canvasElement }) => {
		const loader = canvasElement.querySelector<HTMLElement>("[data-slot='loader']")!;
		const box = loader.getBoundingClientRect();
		const node = loader.querySelector("svg")!.getBoundingClientRect();
		await expect(box.top - node.top).toBeCloseTo(5, 0);
		await expect(node.bottom - box.bottom).toBeCloseTo(4, 0);
	},
};

/** Figma "done": the filled check, in success. */
export const Done: Story = {
	args: { state: "done" },
};

/** With an `aria-label`, it's an image with that name. Test: screen readers get "Blueprint generated". */
export const Labelled: Story = {
	args: { state: "done", "aria-label": "Blueprint generated" },
	play: async ({ canvas }) => {
		await expect(canvas.getByRole("img", { name: "Blueprint generated" })).toBeInTheDocument();
	},
};

const order = ["loading", "brand", "done"] as const;

/** The states in the order Archie goes through them. Test: the button moves to the next state in place. */
export const Sequence: Story = {
	render: () => {
		const [step, setStep] = useState(0);
		return (
			<div className='flex flex-col items-center gap-4'>
				<Loader state={order[step]} aria-label={order[step]} />
				<Button variant='outline' size='md' onClick={() => setStep((current) => (current + 1) % order.length)}>
					Next state
				</Button>
			</div>
		);
	},
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.getByRole("img", { name: "loading" })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole("button", { name: "Next state" }));
		await expect(canvas.getByRole("img", { name: "brand" })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole("button", { name: "Next state" }));
		await expect(canvas.getByRole("img", { name: "done" })).toBeInTheDocument();
	},
};

const statusRow = [
	{ state: "loading", label: "Thinking" },
	{ state: "brand", label: "Thought for 7s" },
	{ state: "done", label: "Blueprint generated · 7s" },
] as const;

/**
 * The chat's status row (Figma archie.ds "project" 26:1053): a 16px loader (`size-4`) 6px before the label. "Thinking"
 * bounces the ball; when it turns to "Thought for 7s" the A grows in; "Blueprint generated" shows the check.
 * Test: at 16px everything scales with the frame: the ball is 8px, the A 15.4px tall.
 */
export const InStatusRow: Story = {
	render: () => {
		const [step, setStep] = useState(0);
		const { state, label } = statusRow[step];
		return (
			<div className='flex w-64 flex-col items-start gap-4'>
				<div className='flex items-center gap-1.5 text-sm text-muted-foreground'>
					<Loader state={state} className='size-4' />
					<span>{label}</span>
				</div>
				<Button variant='outline' size='md' onClick={() => setStep((current) => (current + 1) % statusRow.length)}>
					Next status
				</Button>
			</div>
		);
	},
	play: async ({ canvas, canvasElement, userEvent }) => {
		const loader = () => canvasElement.querySelector<HTMLElement>("[data-slot='loader']")!;
		await expect(loader().getBoundingClientRect().width).toBe(16);
		await expect(loader().firstElementChild!.getBoundingClientRect().width).toBe(8);
		await userEvent.click(canvas.getByRole("button", { name: "Next status" }));
		const glyph = canvasElement.querySelector<HTMLElement>("[data-slot='loader-brand'] svg")!;
		await waitFor(() => expect(glyph.getBoundingClientRect().height).toBeCloseTo(15.43, 1));
	},
};

/** Every state, as Figma's set lays them out. */
export const AllVariants: Story = {
	render: () => (
		<div className='flex items-center gap-5'>
			{(["loading", "steps", "brand", "done"] as const).map((state) => (
				<Loader key={state} state={state} />
			))}
		</div>
	),
};

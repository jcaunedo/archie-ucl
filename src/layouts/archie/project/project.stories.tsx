import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, type within } from "storybook/test";

import { Project } from "./project";
import { createSampleArchie } from "./sample-archie";
import { sampleNewProject, sampleProject, sampleProjectWithReply } from "./sample-project";

const meta = {
	title: "Layouts/Archie/Project",
	component: Project,
	parameters: {
		layout: "fullscreen",
	},
	args: {
		data: sampleProject,
	},
} satisfies Meta<typeof Project>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Figma "project": the request sent, Archie thinking, Plan open.
 * Test: picking Design retitles the canvas, and sending a message adds it to the thread with Archie thinking.
 */
export const Default: Story = {
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Plan");
		await userEvent.click(canvas.getByRole("tab", { name: "Design" }));
		await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Design");

		await userEvent.type(canvas.getByRole("textbox", { name: "Message Archie" }), "Add a supplier page{Enter}");
		await expect(canvas.getByRole("log")).toHaveTextContent("Add a supplier page");
		await expect(canvas.getByRole("status")).toHaveTextContent("Thinking…");
	},
};

/** The chat collapsed to its rail, so the canvas gets the width. Test: the rail brings the chat back. */
export const ChatCollapsed: Story = {
	args: {
		defaultChatOpen: false,
	},
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.queryByRole("log")).not.toBeInTheDocument();
		await userEvent.click(canvas.getByRole("button", { name: "Expand chat" }));
		// The thread fades in once the panel has widened.
		await waitFor(() => expect(canvas.getByRole("log")).toBeVisible());
	},
};

/** After Archie answers: its reply below the request, and no "Thinking…". */
export const WithReply: Story = {
	args: {
		data: sampleProjectWithReply,
	},
	play: async ({ canvas }) => {
		await expect(canvas.queryByRole("status")).not.toBeInTheDocument();
	},
};

/**
 * Talk to the sample Archie: it answers the opening request on load, then each message you send, with its status
 * updating in place before the reply streams in. It knows a few scripted turns (`sample-archie.ts`); anything else gets
 * a list of what to try.
 */
export const Conversation: Story = {
	args: {
		respond: createSampleArchie(),
	},
};

/** The person's side of the simulated conversation, in order. Each one matches a turn in `sample-archie.ts`. */
const personTurns = [
	"create an ice cream shop inventory app",
	"We have three shops. Only owners should place supplier orders.",
	"Can you review the data model and suggest improvements?",
	"Apply 1 and 3",
	"Add an end-of-day stock count for staff",
];

/** Waits until Archie has finished answering: the empty composer shows voice mode again in place of a busy Send. */
async function archieFinished(canvas: ReturnType<typeof within>) {
	await waitFor(() => expect(canvas.getByRole("button", { name: "Start voice mode" })).toBeInTheDocument(), {
		timeout: 30_000,
	});
}

/**
 * A whole conversation played out on its own, from an empty chat: a person types at a human pace, waits for Archie,
 * reads, and replies. Watch it in Storybook; it's left out of `npm test` because it runs for about a minute.
 */
export const SimulatedConversation: Story = {
	tags: ["!test"],
	args: {
		data: sampleNewProject,
		respond: createSampleArchie(),
	},
	play: async ({ canvas }) => {
		const person = userEvent.setup({ delay: 45 });
		const composer = canvas.getByRole("textbox", { name: "Message Archie" });
		for (const turn of personTurns) {
			await person.type(composer, `${turn}{Enter}`);
			await archieFinished(canvas);
			// Reading time before the next message.
			await new Promise((resolve) => setTimeout(resolve, 2_000));
		}
	},
};

/**
 * The sample Archie at full speed, for testing the reply flow.
 * Test: sending a question shows the person's message and Archie's answer, then clears the status and frees Send.
 */
export const ArchieReplies: Story = {
	args: {
		data: sampleProjectWithReply,
		respond: createSampleArchie({ statusMs: 0, wordMs: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(canvas.getByRole("textbox", { name: "Message Archie" }), "What's a database relationship?{Enter}");
		await expect(canvas.getByRole("log")).toHaveTextContent("What's a database relationship?");
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent("That's a one-to-many relationship.");
		await expect(canvas.queryByRole("status")).not.toBeInTheDocument();
	},
};

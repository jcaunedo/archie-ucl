import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { blueprint } from "@/sample-data/road-bike-store";

import { Project } from "./project";
import { createSampleArchie, garbledReplies, unclearReplies } from "./sample-archie";
import {
	sampleBlueprintReady,
	sampleNewProject,
	sampleProject,
	sampleProjectWithReply,
	sampleVersionHistory,
} from "./sample-project";

// The chat follows prds/chat-behavior-system.md. Stories that test a turn use the sample Archie at `pace: 0`, so it
// answers at once; Conversation and SimulatedConversation play it at a readable pace.

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

type Canvas = ReturnType<typeof within>;

/** Waits until Archie has finished its turn: the thread is no longer busy. */
async function archieFinished(canvas: Canvas) {
	await waitFor(() => expect(canvas.getByRole("log")).not.toHaveAttribute("aria-busy"), { timeout: 30_000 });
}

/** An option in Archie's current question, by its text (the button also reads its letter, "A."). */
const option = (canvas: Canvas, text: string) => canvas.getByRole("button", { name: new RegExp(`${text}$`) });

/**
 * Figma "Default": the request sent, Archie working on it, Plan open and still empty. Archie is live, so it answers and
 * you can keep chatting.
 * Test: Archie's status shows, the canvas is on Plan, and Plan shows its empty state.
 */
export const Default: Story = {
	args: {
		respond: createSampleArchie(),
	},
	play: async ({ canvas }) => {
		await expect(await canvas.findByRole("status")).toHaveTextContent("Understanding your request…");
		await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Plan");
		await expect(canvas.getByText("Your blueprint will show up here")).toBeInTheDocument();
	},
};

/** Switching phases in MainNav. Test: picking Design retitles the canvas, and picking Plan brings it back. */
export const SwitchPhase: Story = {
	args: {
		respond: createSampleArchie(),
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("tab", { name: "Design" }));
		await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Design");
		await userEvent.click(canvas.getByRole("tab", { name: "Plan" }));
		await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Plan");
	},
};

/** The chat collapsed to its rail, so the canvas gets the width. Test: the rail brings the chat back. */
export const ChatCollapsed: Story = {
	args: {
		defaultChatOpen: false,
		respond: createSampleArchie(),
	},
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.queryByRole("log")).not.toBeInTheDocument();
		await userEvent.click(canvas.getByRole("button", { name: "Expand chat" }));
		// The thread fades in once the panel has widened.
		await waitFor(() => expect(canvas.getByRole("log")).toBeVisible());
	},
};

/**
 * The chat's width can be changed by dragging the handle between the chat and the canvas.
 * Test: the handle is a separator at 440px; → widens the chat by 16px, double-click resets it.
 */
export const ResizeChat: Story = {
	args: {
		respond: createSampleArchie(),
	},
	play: async ({ canvas, userEvent }) => {
		const handle = canvas.getByRole("separator", { name: "Resize chat" });
		await expect(handle).toHaveAttribute("aria-valuenow", "440");
		handle.focus();
		await userEvent.keyboard("{ArrowRight}");
		await expect(handle).toHaveAttribute("aria-valuenow", "456");
		await userEvent.dblClick(handle);
		await expect(handle).toHaveAttribute("aria-valuenow", "440");
	},
};

/** An empty chat (Prompt Starters). Test: picking a starter sends it, and Archie answers. */
export const EmptyChat: Story = {
	args: {
		data: sampleNewProject,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.getByText("What do you want to build?")).toBeInTheDocument();
		await userEvent.click(canvas.getByRole("button", { name: "What's a database relationship?" }));
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent("one-to-many relationship");
	},
};

/**
 * The default flow, as in production: a request to build goes straight to the blueprint, no questions first.
 * Test: picking the build starter drafts the blueprint and fills Plan; Archie says which setup it chose for what the
 * request left open; Plan fills under the feed's last step ("Generating blueprint"), with no progress line after; no
 * clarifying question is asked, and it ends on the overview with no "What's next" card; "Thought
 * for Ns" shows the brand A; opened, its label turns foreground and the A stays brand.
 */
export const PromptToBlueprint: Story = {
	args: {
		data: sampleNewProject,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("button", { name: /^Create an e-commerce store/ }));
		await archieFinished(canvas);
		// Plan fills in under the feed's last step, "Generating blueprint": no progress line after the thinking.
		await expect(canvas.getByRole("log")).toHaveTextContent("Blueprint overview");
		await expect(canvas.queryByText("Blueprint generated", { exact: false })).not.toBeInTheDocument();
		await userEvent.click(canvas.getByRole("button", { name: /^Thought for/ }));
		await expect(canvas.getByRole("log")).toHaveTextContent("Generating blueprint");
		await userEvent.click(canvas.getByRole("button", { name: /^Thought for/ }));
		await expect(canvas.getByRole("log")).toHaveTextContent("I chose a common setup");
		await expect(canvas.queryByText(/^Question 1 of/)).not.toBeInTheDocument();
		for (const module of blueprint.modules) {
			await expect(canvas.getByText(module.name)).toBeInTheDocument();
		}
		// The default flow ends on the overview: no "What's next" card.
		await expect(canvas.queryByRole("group", { name: "What's next" })).not.toBeInTheDocument();
		await expect(canvas.getByRole("log")).toHaveTextContent("A prototype is the quickest way to see it working.");

		// "Thought for Ns" shows the brand A; opening it turns the label to foreground, and the A stays brand.
		const thought = canvas.getByRole("button", { name: /^Thought for/ });
		const mark = thought.querySelector<HTMLElement>("[data-slot='loader']")!;
		await expect(mark).toHaveAttribute("data-state", "brand");
		const brand = getComputedStyle(mark).color;
		const muted = getComputedStyle(thought).color;
		await userEvent.click(thought);
		await waitFor(() => expect(getComputedStyle(thought).color).not.toBe(muted));
		await expect(getComputedStyle(mark).color).toBe(brand);
		await userEvent.click(thought);
	},
};

/**
 * Archie's clarifying questions, one at a time (rule 3): the "Clarification questions" preview interaction
 * (/clarification-questions), opened on the prompt.
 * Test: choosing an option moves to the next question; a typed message answers the one after it; "You decide", the last
 * option, answers the third; typing a letter ("a.") picks that option on the fourth. The blueprint then ends on "What's
 * next", and the thread glides to it.
 */
export const ClarifyingQuestions: Story = {
	args: {
		data: sampleProjectWithReply,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.getByText(`Question 1 of ${blueprint.clarifyingQuestions.length}`)).toBeInTheDocument();
		await userEvent.click(option(canvas, blueprint.clarifyingQuestions[0].options[0]));
		await expect(canvas.getByText(`Question 2 of ${blueprint.clarifyingQuestions.length}`)).toBeInTheDocument();
		await userEvent.type(canvas.getByRole("combobox", { name: "Message Archie" }), "The US and Canada{Enter}");
		await expect(canvas.getByText(`Question 3 of ${blueprint.clarifyingQuestions.length}`)).toBeInTheDocument();

		// "You decide" is the last lettered option.
		const options = within(canvas.getByRole("group", { name: blueprint.clarifyingQuestions[2].question })).getAllByRole("button");
		await expect(options.at(-1)).toHaveAccessibleName(`${String.fromCharCode(64 + options.length)}. You decide`);
		await userEvent.click(options.at(-1)!);
		await expect(canvas.getByText(`Question 4 of ${blueprint.clarifyingQuestions.length}`)).toBeInTheDocument();

		// Typing a letter picks that option.
		await userEvent.type(canvas.getByRole("combobox", { name: "Message Archie" }), "a.{Enter}");
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent(`4. ${blueprint.clarifyingQuestions[3].options[0]}`);

		// The answers draft the blueprint, ending on "What's next": the thread glides to the card, its last line in view.
		const log = canvas.getByRole("log");
		await expect(canvas.getByRole("group", { name: "What's next" })).toBeInTheDocument();
		await waitFor(() => expect(log.scrollHeight - log.scrollTop - log.clientHeight).toBeLessThan(2));
		await expect(canvas.getByText("Or ask for something else below.")).toBeVisible();
	},
};

/**
 * An answer Archie can't read gets asked again (rule 4).
 * Test: an unreadable typed answer makes Archie ask that question again, keeping the others; a clear answer then lets it
 * draft the blueprint.
 */
export const UnreadableAnswer: Story = {
	args: {
		data: sampleProjectWithReply,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		const [first, second, ...rest] = blueprint.clarifyingQuestions;
		await userEvent.click(option(canvas, first.options[0]));
		await userEvent.type(canvas.getByRole("combobox", { name: "Message Archie" }), "sdkfj{Enter}");
		for (const question of rest) {
			await userEvent.click(option(canvas, question.options[0]));
		}
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent("I couldn't read your answer to question 2");
		await expect(canvas.getByText(second.question, { selector: "p" })).toBeInTheDocument();

		await userEvent.click(option(canvas, second.options[0]));
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent("Blueprint overview");
	},
};

/**
 * Changing answers (rule 13).
 * Test: changing an answer keeps the answers below it, unless they depend on it (shipping depends on the seller
 * question), and the active question comes back; Keep my answer cancels a change. Once sent, the answers expand to
 * show their questions.
 */
export const ChangeAnswers: Story = {
	args: {
		data: sampleProjectWithReply,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		const [seller, shipping, accounts, compatibility] = blueprint.clarifyingQuestions;
		const total = blueprint.clarifyingQuestions.length;
		await userEvent.click(option(canvas, seller.options[0]));
		await userEvent.click(option(canvas, shipping.options[0]));
		await expect(canvas.getByText(`Question 3 of ${total}`)).toBeInTheDocument();

		// Nothing depends on shipping: question 3 is still next.
		await userEvent.click(canvas.getByRole("button", { name: "Change answer 2" }));
		await expect(canvas.getByText("Changing question 2")).toBeInTheDocument();
		await userEvent.click(option(canvas, shipping.options[2]));
		await expect(canvas.getByText(`Question 3 of ${total}`)).toBeInTheDocument();

		// Keep my answer cancels a change.
		await userEvent.click(canvas.getByRole("button", { name: "Change answer 1" }));
		await userEvent.click(canvas.getByRole("button", { name: "Keep my answer" }));
		await expect(canvas.getByText(`Question 3 of ${total}`)).toBeInTheDocument();

		// Shipping depends on the seller answer: changing it asks shipping again.
		await userEvent.click(canvas.getByRole("button", { name: "Change answer 1" }));
		await userEvent.click(option(canvas, seller.options[1]));
		await expect(canvas.getByText(`Question 2 of ${total}`)).toBeInTheDocument();

		for (const question of [shipping, accounts, compatibility]) {
			await userEvent.click(option(canvas, question.options[0]));
		}
		await archieFinished(canvas);

		await userEvent.click(canvas.getByRole("button", { name: "Show questions" }));
		await expect(canvas.getByRole("log")).toHaveTextContent(`2. ${shipping.question}`);

	},
};

/**
 * Before anything is generated (the blueprint is ready, nothing built).
 * Test: "how to updated my user types?" gets a guide to editing them in Plan and the order to review the blueprint in;
 * a design change gets "nothing's been generated yet", with next steps, never design options.
 */
export const BeforeBuilding: Story = {
	args: {
		data: sampleBlueprintReady,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		const composer = canvas.getByRole("combobox", { name: "Message Archie" });
		await userEvent.type(composer, "how to updated my user types?{Enter}");
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent("Your user types live in Plan");
		await expect(canvas.getByRole("log")).toHaveTextContent("Before you generate the app");

		await userEvent.type(composer, "Change the accent color to green{Enter}");
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent("Nothing's been generated yet");
		await expect(canvas.queryByRole("button", { name: /Change the design$/ })).not.toBeInTheDocument();
	},
};

/**
 * The blueprint is drafted: Plan is full and Archie proposes two ways to build (rule 5).
 * Test: Plan lists every module; "Review modules" opens Plan on that section, highlighted; choosing Generate Prototype
 * builds Version 1 and ends with a "What's next" card.
 */
export const BlueprintReady: Story = {
	args: {
		data: sampleBlueprintReady,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, canvasElement, userEvent }) => {
		for (const module of blueprint.modules) {
			await expect(canvas.getByText(module.name)).toBeInTheDocument();
		}
		// Reviewing a section opens it in Plan, highlighted, and sends nothing: the card stays open.
		await userEvent.click(canvas.getByRole("tab", { name: "Design" }));
		await userEvent.click(canvas.getByRole("button", { name: "Review modules" }));
		await expect(canvas.getByRole("heading", { level: 1 })).toHaveTextContent("Plan");
		await waitFor(() =>
			expect(canvasElement.querySelector("[data-plan-section='modules']")).toHaveAttribute("data-highlighted", "true"),
		);
		await userEvent.click(canvas.getByRole("button", { name: "Generate Prototype" }));
		await archieFinished(canvas);
		await expect(canvas.getByText("Current version")).toBeInTheDocument();
		// Archie's update ends with what's next: a card with the recommended step first.
		const nextCard = within(canvas.getAllByRole("group", { name: "What's next" }).at(-1)!);
		await expect(nextCard.getAllByRole("button")[0]).toHaveAccessibleName("Connect Stripe");
	},
};

/**
 * Two versions, two days apart (Checkpoints and Restore).
 * Test: restoring Version 1 adds a note and a new current version.
 */
export const VersionHistory: Story = {
	args: {
		data: sampleVersionHistory,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.getByRole("separator", { name: "2 days ago" })).toBeInTheDocument();
		await userEvent.click(canvas.getByRole("button", { name: "Restore this version" }));
		await archieFinished(canvas);
		await expect(canvas.getByText("Restoring to a previous version: 2 → 1")).toBeInTheDocument();
		await expect(canvas.getByText("Restored version 1")).toBeInTheDocument();
	},
};

/**
 * Messages Archie can't act on (rule 4).
 * Test: an unreadable message (even one containing a known word, "red") gets one of the playful replies and no options;
 * a clear message the script doesn't know gets a plain-text reply that says so and asks for more, with no options; a
 * second one in a row gets a different reply.
 */
export const UnclearMessage: Story = {
	args: {
		data: sampleVersionHistory,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		const composer = canvas.getByRole("combobox", { name: "Message Archie" });
		await userEvent.type(composer, "asdf red qwer{Enter}");
		await archieFinished(canvas);
		const log = canvas.getByRole("log").textContent ?? "";
		await expect(garbledReplies.some(({ text }) => log.includes(text))).toBe(true);
		await expect(canvas.queryByRole("group", { name: "What would you like to do?" })).not.toBeInTheDocument();

		// One of the plain-text replies (a short message can be quoted back in it).
		const unclearReply = (message: string) => {
			const replies = unclearReplies.map(({ text }) => text(`"${message}"`));
			const text = canvas.getByRole("log").textContent ?? "";
			return replies.filter((reply) => text.includes(reply));
		};
		await userEvent.type(composer, "Translate the store into French{Enter}");
		await archieFinished(canvas);
		const first = unclearReply("Translate the store into French");
		await expect(first).toHaveLength(1);
		// Plain text: no question with options, and no guessed meanings.
		await expect(canvas.queryByRole("group", { name: "What would you like to do?" })).not.toBeInTheDocument();
		await expect(canvas.queryByRole("button", { name: /Ask about my app$/ })).not.toBeInTheDocument();

		// Another one in a row: a different reply.
		await userEvent.type(composer, "Translate the store into German{Enter}");
		await archieFinished(canvas);
		await expect(unclearReply("Translate the store into German").filter((reply) => reply !== first[0])).toHaveLength(1);
	},
};

/**
 * A question about one part of the blueprint gets its details, from the blueprint itself (rule 4: nothing invented).
 * Test: "give me the details of the Storefront" answers with its description, what it does and who it's for, in plain
 * text with no options.
 */
export const BlueprintDetails: Story = {
	args: {
		data: sampleBlueprintReady,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		const storefront = blueprint.modules.find(({ id }) => id === "storefront")!;
		await userEvent.type(canvas.getByRole("combobox", { name: "Message Archie" }), "give me the details of the Storefront{Enter}");
		await archieFinished(canvas);
		const log = canvas.getByRole("log");
		await expect(log).toHaveTextContent(storefront.description.slice(0, 60));
		await expect(log).toHaveTextContent("What it does");
		await expect(log).toHaveTextContent("Who it's for");
		await expect(log).not.toHaveTextContent("I'm not sure what you mean");
	},
};

/**
 * Archie asks permission before a consequential change (PromptAlert, progress PRD FR-09).
 * Test: an ambiguous request gets options; choosing the destructive one brings an approval prompt above the composer;
 * Deny keeps everything, the prompt leaves, and the thread records the decision.
 */
export const AskPermission: Story = {
	args: {
		data: sampleVersionHistory,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(canvas.getByRole("combobox", { name: "Message Archie" }), "remove the cart{Enter}");
		await archieFinished(canvas);
		await userEvent.click(option(canvas, "Remove the cart and checkout entirely"));
		await archieFinished(canvas);
		const prompt = within(canvas.getByRole("alert"));
		await expect(prompt.getByText("Ask permission")).toBeInTheDocument();
		await expect(prompt.getByRole("button", { name: "Allow" })).toBeInTheDocument();
		// It waits above the composer, not in the thread.
		await expect(canvas.getByRole("log")).not.toContainElement(canvas.getByRole("alert"));
		await userEvent.click(prompt.getByRole("button", { name: "Deny" }));
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent("Okay, nothing changed.");
		await waitFor(() => expect(canvas.queryByRole("alert")).not.toBeInTheDocument());
		await expect(canvas.getByRole("log")).toHaveTextContent("Asked permission: Remove Cart & Checkout · Denied");
	},
};

/**
 * Prototype shortcuts in the "/" menu, under "Preview interactions": each plays its scenario at any stage.
 * Test: with a clarifying question open, /ask-permission isn't taken as an answer; Archie asks permission.
 * /code-generation plays a build; /clarification-questions asks the clarifying questions.
 */
export const PrototypeShortcut: Story = {
	args: {
		data: sampleProjectWithReply,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		const composer = canvas.getByRole("combobox", { name: "Message Archie" });
		await userEvent.type(composer, "/ask");
		await expect(canvas.getByRole("option", { name: /ask-permission/ })).toHaveAttribute("aria-selected", "true");
		// A prototype shortcut sends as soon as it's picked.
		await userEvent.keyboard("{Enter}");
		await archieFinished(canvas);
		// The bubble says what the shortcut does, not the command.
		await expect(canvas.getByRole("log")).toHaveTextContent("Show ask permission interaction");
		await expect(within(canvas.getByRole("alert")).getByText("Ask permission")).toBeInTheDocument();
		await userEvent.click(canvas.getByRole("button", { name: "Deny" }));
		await archieFinished(canvas);

		// Code generation plays a build: files processed and a new version.
		await userEvent.type(composer, "/code");
		await userEvent.keyboard("{Enter}");
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent("Show code generation interaction");
		await expect(canvas.getByRole("button", { name: /files processed/ })).toBeInTheDocument();

		// Clarification questions plays the question-first flow: a new first question waits for an answer.
		const firstQuestion = `Question 1 of ${blueprint.clarifyingQuestions.length}`;
		const asked = canvas.queryAllByText(firstQuestion).length;
		await userEvent.type(composer, "/clar");
		await userEvent.keyboard("{Enter}");
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent("Show clarification questions interaction");
		await expect(canvas.getAllByText(firstQuestion)).toHaveLength(asked + 1);
	},
};

/**
 * A step that fails (Failure Disclosure, rule 9).
 * Test: connecting Stripe fails with an alert; asking "what's the error?" explains what happened and how to fix it;
 * Retry succeeds and adds a version.
 */
export const StepFails: Story = {
	args: {
		data: sampleVersionHistory,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(canvas.getByRole("combobox", { name: "Message Archie" }), "Connect Stripe{Enter}");
		await archieFinished(canvas);
		await expect(canvas.getByRole("alert")).toHaveTextContent("Couldn't connect to Stripe");
		// Asking about it explains what happened, then how to fix it; never "what would you like to do?".
		await userEvent.type(canvas.getByRole("combobox", { name: "Message Archie" }), "what's the error?{Enter}");
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent("What happened");
		await expect(canvas.getByRole("log")).toHaveTextContent("How to fix it");
		await expect(canvas.queryByRole("group", { name: "What would you like to do?" })).not.toBeInTheDocument();

		await userEvent.click(canvas.getAllByRole("button", { name: "Retry connecting Stripe" })[0]);
		await archieFinished(canvas);
		await expect(canvas.getByText("Connected Stripe payments")).toBeInTheDocument();
	},
};

/**
 * Sending while Archie works queues the message, and Stop keeps what's done (rules 7 and 8).
 * Test: the empty box offers Stop; typing turns it into Add to queue; the message waits in the queue; Stop ends the turn
 * and the queued message goes.
 */
export const QueueAndStop: Story = {
	args: {
		respond: createSampleArchie(),
	},
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.getByRole("button", { name: "Stop" })).toBeInTheDocument();
		await userEvent.type(canvas.getByRole("combobox", { name: "Message Archie" }), "What's a database relationship?");
		await expect(canvas.getByRole("button", { name: "Add to queue" })).toBeInTheDocument();
		await userEvent.keyboard("{Enter}");
		await expect(canvas.getByText("In queue (1)")).toBeInTheDocument();

		await userEvent.click(canvas.getByRole("button", { name: "Stop" }));
		await expect(canvas.getByText("Stopped.")).toBeInTheDocument();
		await expect(canvas.queryByText("In queue (1)")).not.toBeInTheDocument();
		await expect(canvas.getByRole("log")).toHaveTextContent("What's a database relationship?");
	},
};

/**
 * Slash commands, as in intercept-ucl's composer. The command set isn't defined yet: two placeholders stand in.
 * Test: "/comm" filters the menu to the two commands, Enter picks the first into the message, and Escape closes it.
 */
export const SlashCommand: Story = {
	args: {
		data: sampleVersionHistory,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		const field = canvas.getByRole("combobox", { name: "Message Archie" });
		await userEvent.type(field, "/comm");
		await expect(canvas.getAllByRole("option")).toHaveLength(2);
		await expect(canvas.getByRole("option", { name: /command-1/ })).toHaveAttribute("aria-selected", "true");
		await userEvent.keyboard("{Enter}");
		await expect(field).toHaveValue("/command-1 ");
		await expect(canvas.queryByRole("listbox")).not.toBeInTheDocument();
	},
};

/** A plain answer (Level 1). Test: Archie's reply streams in, then gets copy, feedback and retry. */
export const ArchieReplies: Story = {
	args: {
		data: sampleVersionHistory,
		respond: createSampleArchie({ pace: 0 }),
	},
	play: async ({ canvas, userEvent }) => {
		await userEvent.type(canvas.getByRole("combobox", { name: "Message Archie" }), "What's a database relationship?{Enter}");
		await archieFinished(canvas);
		await expect(canvas.getByRole("log")).toHaveTextContent("That's a one-to-many relationship.");
		// The latest reply's Copy (the blueprint overview, a Level 2 answer, has its own).
		await expect(canvas.getAllByRole("button", { name: "Copy" }).at(-1)).toBeInTheDocument();
		await expect(canvas.queryByRole("status")).not.toBeInTheDocument();
	},
};

/**
 * Talk to the sample Archie at a readable pace. It answers the opening request on load, then each message you send. It
 * knows the road bike store script (prds/chat-behavior-system.md §7); anything else gets a plain reply asking for more.
 */
export const Conversation: Story = {
	args: {
		respond: createSampleArchie(),
	},
};

/** Types like a person, waits for Archie, reads, then acts. */
async function act(canvas: Canvas, step: () => Promise<void>) {
	await step();
	await archieFinished(canvas);
	// Reading time before the next step.
	await new Promise((resolve) => setTimeout(resolve, 2_000));
}

/**
 * The whole conversation played out on its own, from an empty chat: the prompt, the blueprint (the default flow, no
 * questions first), Generate Prototype, a change, an unclear message and a failure with Retry. Watch it in Storybook;
 * it's left out of `npm test` because it runs for a few minutes.
 */
export const SimulatedConversation: Story = {
	tags: ["!test"],
	args: {
		data: sampleNewProject,
		respond: createSampleArchie(),
	},
	play: async ({ canvas }) => {
		const person = userEvent.setup({ delay: 45 });
		const composer = () => canvas.getByRole("combobox", { name: "Message Archie" });
		const type = (text: string) => person.type(composer(), `${text}{Enter}`);

		await act(canvas, () => type("Create an e-commerce store selling high-end accessories for road bikes."));
		await act(canvas, () => person.click(canvas.getByRole("button", { name: "Generate Prototype" })));
		await act(canvas, () => type("Change the accent color to green"));
		await act(canvas, () => type("make it better"));
		await act(canvas, () => person.click(option(canvas, "Checkout")));
		await act(canvas, () => type("Connect Stripe"));
		await act(canvas, () => person.click(canvas.getByRole("button", { name: "Retry connecting Stripe" })));
	},
};

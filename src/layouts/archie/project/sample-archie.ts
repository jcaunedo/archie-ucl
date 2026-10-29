import type { ArchieEvent, ArchieResponder } from "./project";

// A scripted Archie for the Project stories: it plays the backend's part, sending the events a real run would (PRD
// "Conversational progress feedback" §11). Each turn follows one of the PRD's levels: a question gets "Thinking…" and an
// answer (Level 1), a review moves through a few statuses (Level 2), and a change reports what it did (Level 3, shown
// with the activity indicator until execution progress exists). Statuses use the PRD's FR-03 wording; replies use the
// brand voice (DESIGN.md).

type SampleTurn = {
	/** The messages this turn answers. The first matching turn wins, so the order of `sampleTurns` matters. */
	match: RegExp;
	/** Archie's statuses, in order, while it works. Each one replaces the last. */
	statuses: string[];
	reply: string;
};

const sampleTurns: SampleTurn[] = [
	{
		match: /\b(create|build|make)\b.*\bapp/i,
		statuses: ["Understanding your request…", "Analyzing the requirements…", "Putting it together…"],
		reply: `Here's a first draft of your blueprint.

Modules: Flavors, Freezer stock, Suppliers and Orders.
User types: Owner, who manages everything, and Staff, who log stock counts and receive deliveries.

Two questions before I build the prototype:
1. Do you run one shop or several? That decides whether stock is tracked per location.
2. Who can place orders with suppliers: Owners only, or Staff too?`,
	},
	{
		match: /\b(shops?|locations?|stores?)\b/i,
		statuses: ["Understanding your request…", "Updating your data model…"],
		reply: `Done. Your blueprint now tracks stock per shop:

- A new Locations module. Each freezer and its stock belong to one shop.
- Staff are assigned to one or more shops and only see those.
- Only Owners can place supplier orders. Staff can still receive deliveries and log counts.

Open Plan to review the changes. When it looks right, I'll build the prototype.`,
	},
	{
		match: /\b(review|improve|check)\b/i,
		statuses: ["Understanding your request…", "Reviewing your data model…", "Putting it together…"],
		reply: `Your data model covers the basics. Three changes would make it sturdier:

1. Track stock in batches, each with a made date and a use-by date, so the oldest tubs sell first and expired ones get flagged.
2. Link each flavor to the suppliers of its ingredients. A late delivery then shows which flavors are at risk.
3. Record every stock change with who made it and why: sold, wasted or delivered. Counts can then be checked against sales.

Want me to apply any of these?`,
	},
	{
		match: /\bapply\b/i,
		statuses: ["Updating your data model…", "Validating the changes…"],
		reply: `Done. Stock is now tracked in batches with made and use-by dates, and every stock change records who made it and why.

Freezer stock shows batches oldest first, and anything past its use-by date is flagged for the Owner.`,
	},
	{
		match: /\b(end[- ]of[- ]day|stock count|count)\b/i,
		statuses: ["Understanding your request…", "Building your interface…"],
		reply: `Added an End-of-day count screen for Staff. They pick their shop, see the expected stock for each flavor, and enter what's left.

Counts more than 10% off are flagged for the Owner. You'll find the screen in Design.`,
	},
	{
		match: /\brelationships?\b/i,
		statuses: ["Thinking…"],
		reply: `A relationship connects two kinds of records. In your app, each Order belongs to one Supplier, and a Supplier can have many Orders. That's a one-to-many relationship.

Relationships let the app answer questions like "What have we ordered from this supplier?" without copying data between places.`,
	},
];

/** Anything the script doesn't cover. It says what the sample can answer, so people trying the story aren't stuck. */
const fallbackTurn: SampleTurn = {
	match: /.*/,
	statuses: ["Thinking…"],
	reply: `This is a sample conversation, so I only know a few scripted turns. Try one of these:

- "Create an ice cream shop inventory app"
- "We have three shops"
- "Review the data model"
- "Apply 1 and 3"
- "Add an end-of-day stock count"
- "What's a database relationship?"`,
};

type SampleArchieOptions = {
	/** How long each status stays before the next event, in ms. Real runs vary; this is a calm, readable pace. */
	statusMs?: number;
	/** The gap between streamed words, in ms. */
	wordMs?: number;
};

/** A responder that answers from `sampleTurns`. Pass `{ statusMs: 0, wordMs: 0 }` in tests to answer at once. */
function createSampleArchie({ statusMs = 1400, wordMs = 30 }: SampleArchieOptions = {}): ArchieResponder {
	return (message, emit) => {
		const turn = sampleTurns.find(({ match }) => match.test(message)) ?? fallbackTurn;
		const events: { at: number; event: ArchieEvent }[] = [];
		let at = 0;
		for (const label of turn.statuses) {
			events.push({ at, event: { type: "status", label } });
			at += statusMs;
		}
		// Each chunk is a word with the space or line break after it, so the reply keeps its layout as it streams.
		for (const text of turn.reply.split(/(?<=\s)/)) {
			events.push({ at, event: { type: "reply", text } });
			at += wordMs;
		}
		events.push({ at, event: { type: "done" } });

		const timers = events.map(({ at, event }) => setTimeout(() => emit(event), at));
		return () => timers.forEach(clearTimeout);
	};
}

export { createSampleArchie };

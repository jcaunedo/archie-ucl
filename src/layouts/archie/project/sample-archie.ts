import { blueprint } from "@/sample-data/road-bike-store";

import type { ArchieEvent, ArchieRequest, ArchieResponder, FileChange, NextStep, ProjectStage } from "./chat-model";
import { answersIntro } from "./project";

// A scripted Archie for the Project stories: it plays the backend's part for the road bike store, sending the events a
// real run would. The turns follow prds/chat-behavior-system.md §7: clarifying questions, the blueprint filling Plan,
// builds that end in versions, restore, a failure with Retry, a simple question, and unclear messages answered with a
// question. Statuses use the progress PRD's FR-03 wording; replies use the brand voice (DESIGN.md).

/** One event, sent `after` ms (times `pace`) after the previous one. */
type Step = { after: number; event: ArchieEvent };

type SampleArchieOptions = {
	/** Multiplies every wait. 1 is a calm, readable pace; 0 answers at once (tests). */
	pace?: number;
};

const wait = (after: number, event: ArchieEvent): Step => ({ after, event });

/** Streams text word by word; each chunk keeps its trailing space or line break, so the layout holds as it streams. */
const say = (text: string): Step[] => text.split(/(?<=\s)/).map((chunk) => wait(28, { type: "text", text: chunk }));

/** Steps in the live feed under Archie's status, one every `every` ms (prds/chat-behavior-system.md rule 14). */
const steps = (labels: string[], every = 700): Step[] => labels.map((label) => wait(every, { type: "step", label }));

/** How long the blueprint's thinking lasts, all its feed steps together, in ms (decision 2026-10-29: 12 seconds). */
const blueprintThinkingMs = 12000;

/** The blueprint's feed after its first step (which depends on where it starts: the prompt or the answers). */
const blueprintSteps = [
	"Defining the system description and type",
	"Defining user types and access levels",
	"Identifying services and integrations",
	"Choosing payment, shipping and email providers",
	"Structuring core modules",
	"Defining each module's capabilities",
	"Deciding who reaches what",
	"Mapping user types to modules",
	"Planning the data each module needs",
	"Checking the blueprint for gaps",
	// The last step: Plan fills in, one section every `sectionRevealMs`, while it runs.
	"Generating blueprint",
];

/** While "Generating blueprint" runs, each Plan section appears this long after the one before (5 sections). */
const sectionRevealMs = 900;

/**
 * How long each of `count` steps stays the newest, in ms: uneven, as real work is (some steps go quickly, others take a
 * while), from half to twice the even share, and always adding up to `total`. A new rhythm each time.
 */
function unevenly(total: number, count: number) {
	const weights = Array.from({ length: count }, () => 0.5 + Math.random() * 1.5);
	const sum = weights.reduce((all, weight) => all + weight, 0);
	const times = weights.map((weight) => Math.round((weight / sum) * total));
	times[count - 1] += total - times.reduce((all, time) => all + time, 0);
	return times;
}

/**
 * The blueprint's feed steps after the first: step `index + 1` comes once the one before it has had its time
 * (`times[index]`); the first of them comes `first` ms after what came before it.
 */
const paced = (labels: string[], times: number[], first: number): Step[] =>
	labels.map((label, index) => wait(index === 0 ? first : times[index], { type: "step", label }));

/** "What's next" after an update: the steps the sample can carry out, the first one Archie recommends. */
const next = (steps: NextStep[]): Step => wait(200, { type: "actions", steps });

const nextSteps = {
	prototype: {
		label: "Generate Prototype",
		description: "A clickable frontend with sample data, quick to review",
		recommended: true,
	},
	fullStack: { label: "Generate Full Stack Application", description: "Frontend, backend, database and sign-in" },
	wishlist: { label: "Add a wishlist", description: "Customers save products and hear when they're back in stock" },
	reviews: { label: "Add product reviews", description: "Customers rate and review what they bought" },
	stripe: { label: "Connect Stripe", description: "Take card payments at checkout, in USD and CAD" },
	green: { label: "Change the accent color to green", description: "Try a different look across the store" },
	contrast: { label: "Check color contrast", description: "Make sure text stays readable everywhere" },
} satisfies Record<string, NextStep>;

const recommend = (step: NextStep): NextStep => ({ ...step, recommended: true });


/** Streams a file into the files block line by line. */
const write = (id: string, path: string, code: string): Step[] => [
	wait(120, { type: "writing", id, path }),
	...code.split("\n").map((line) => wait(70, { type: "code", id, text: `${line}\n` })),
];

const files = (id: string, list: FileChange[], every = 60): Step[] =>
	list.map((file) => wait(every, { type: "file", id, file }));

const modified = (...paths: string[]): FileChange[] => paths.map((path) => ({ path, change: "modified" }));

const list = (items: { name: string }[]) =>
	items.length > 1 ? `${items.slice(0, -1).map(({ name }) => name).join(", ")} and ${items.at(-1)!.name}` : items[0].name;

/** A few names, then how many more: "Storefront, Catalog, My Garage and 4 more". */
const brief = (items: { name: string }[], max = 3) =>
	items.length > max
		? `${items
				.slice(0, max)
				.map(({ name }) => name)
				.join(", ")} and ${items.length - max} more`
		: list(items);

/** The blueprint's sections to review before building; each opens in Plan (no message). */
const reviewSteps: NextStep[] = [
	{ label: "Review user types", description: brief(blueprint.userTypes, 4), open: "user-types" },
	{ label: "Review modules", description: brief(blueprint.modules), open: "modules" },
	{ label: "Review core services", description: brief(blueprint.coreServices, 2), open: "core-services" },
	{ label: "Review integrations", description: brief(blueprint.integrations), open: "integrations" },
];

/* -------------------------------------------------------------------------- */
/* Sample content                                                             */
/* -------------------------------------------------------------------------- */

const routesCode = `import { createRouter } from "./lib/router";
import { Storefront } from "./modules/storefront";
import { Catalog, ProductPage } from "./modules/catalog";
import { MyGarage } from "./modules/my-garage";
import { Cart, Checkout } from "./modules/cart-checkout";

export const router = createRouter([
  { path: "/", element: <Storefront /> },
  { path: "/shop/:category", element: <Catalog /> },
  { path: "/product/:slug", element: <ProductPage /> },
  { path: "/garage", element: <MyGarage />, auth: "customer" },
  { path: "/cart", element: <Cart /> },
  { path: "/checkout", element: <Checkout /> },
]);`;

const fitCheckCode = `export function fitsBike(part: Part, bike: Bike): FitResult {
  const checks = [
    part.wheelSize && part.wheelSize !== bike.wheelSize && "wheel size",
    part.seatpost && part.seatpost !== bike.seatpostDiameter && "seatpost diameter",
    part.groupset && !part.groupset.includes(bike.groupset) && "groupset",
  ].filter(Boolean);

  return checks.length === 0
    ? { fits: true }
    : { fits: false, reasons: checks };
}`;

/** The files of the first build: shared setup, then a few per module, and the backend for a full-stack build. */
function buildFiles(fullStack: boolean): FileChange[] {
	const setup = [
		"package.json",
		"tsconfig.json",
		"vite.config.ts",
		"index.html",
		"src/main.tsx",
		"src/app.tsx",
		"src/routes.tsx",
		"src/styles/theme.css",
		"src/lib/router.ts",
		"src/lib/money.ts",
		"src/lib/fit-check.ts",
		"src/components/header.tsx",
		"src/components/footer.tsx",
		"src/components/product-card.tsx",
		"src/components/price.tsx",
	];
	const perModule = blueprint.modules.flatMap(({ id }) => [
		`src/modules/${id}/index.ts`,
		`src/modules/${id}/${id}-page.tsx`,
		`src/modules/${id}/${id}.data.ts`,
		`src/modules/${id}/components.tsx`,
		`src/modules/${id}/${id}.test.tsx`,
	]);
	const server = fullStack
		? [
				"server/schema.graphql",
				"server/permissions.ts",
				"server/functions/create-order.ts",
				"server/functions/check-fit.ts",
				"server/functions/low-stock-alert.ts",
				"server/integrations/stripe.ts",
				"server/integrations/shippo.ts",
				"server/integrations/sendgrid.ts",
			]
		: [];
	return [...setup, ...perModule, "src/assets/logo.svg", "src/assets/hero.jpg", "README.md", "public/favicon.svg", ...server].map(
		(path) => ({ path, change: "new" as const }),
	);
}

/* -------------------------------------------------------------------------- */
/* Turns                                                                      */
/* -------------------------------------------------------------------------- */

const clarify: Step[] = [
	wait(0, { type: "status", label: "Understanding your request…" }),
	...steps(["Reading your request", "Found the goal: an online store for road bike accessories"]),
	wait(500, { type: "status", label: "Analyzing the requirements…" }),
	...steps([
		"Compared it with common e-commerce setups",
		"Listed the decisions the request leaves open",
		`Wrote ${blueprint.clarifyingQuestions.length} questions to settle them`,
	]),
	wait(600, { type: "thought" }),
	...say(
		`Before I draft your blueprint, I have ${blueprint.clarifyingQuestions.length} questions. Answer them here, or choose "You decide" and I'll pick a sensible default.`,
	),
	wait(200, {
		type: "questions",
		questions: blueprint.clarifyingQuestions.map(({ question, options, dependsOn }) => ({
			question,
			options,
			dependsOn: dependsOn?.map((id) => blueprint.clarifyingQuestions.findIndex((other) => other.id === id)),
		})),
	}),
	wait(0, { type: "done" }),
];

/**
 * The blueprint, drafted from the clarifying answers (`answers`, the /clarification-questions flow) or straight from the
 * prompt (`prompt`, the default, as in production). Straight from the prompt, Archie picks a common setup for what the
 * prompt leaves open and says which, so the person can change it.
 */
function draftBlueprint(from: "prompt" | "answers"): Step[] {
	// What Archie is doing, as it does it (production's wording): the first step at once, then each one stays the newest
	// for its own, uneven time (`unevenly()`). The last, "Generating blueprint", fills Plan section by section, so the
	// thinking lasts `blueprintThinkingMs` in all. From the answers it reads them first instead of working out the context.
	// No progress line: Plan filling under "Generating blueprint" is the progress (decision 2026-10-29).
	const times = unevenly(blueprintThinkingMs - 5 * sectionRevealMs, blueprintSteps.length);
	const reading =
		from === "prompt"
			? [
					wait(0, { type: "status", label: "Understanding your request…" }),
					wait(0, { type: "step", label: "Understanding your business context" }),
					wait(times[0], { type: "status", label: "Working through the details…" }),
				]
			: [
					wait(0, { type: "status", label: "Working through the details…" }),
					wait(0, { type: "step", label: "Reading your answers: stock, shipping, checkout and fit checks" }),
				];
	const choices =
		from === "prompt"
			? "\n\nWhere your request left something open, I chose a common setup: your own stock from one warehouse, shipping to the US and Canada, guest checkout with optional accounts, and a fit check against each rider's saved bike. Change any of it in Plan, or tell me here."
			: "";
	return [
		...reading,
		...paced(blueprintSteps, times, from === "prompt" ? 0 : times[0]),
		wait(0, { type: "blueprint", reveal: 0 }),
		wait(sectionRevealMs, { type: "blueprint", reveal: 1 }),
		wait(sectionRevealMs, { type: "blueprint", reveal: 2 }),
		wait(sectionRevealMs, { type: "blueprint", reveal: 3 }),
		wait(sectionRevealMs, { type: "blueprint", reveal: 4 }),
		wait(sectionRevealMs, { type: "blueprint", reveal: 5 }),
		wait(0, { type: "thought" }),
		...say(`The blueprint defines the structure of your store: who uses it, its modules, the services underneath and the integrations it connects to. You can review and edit each part in Plan before anything is built.

**Blueprint overview**

${blueprint.name} sells its own stock from one warehouse to the US and Canada, with guest checkout and a fit check against each rider's saved bike.${choices}

**What's included**

- **${blueprint.userTypes.length} user types:** ${list(blueprint.userTypes)}
- **${blueprint.modules.length} modules:** ${list(blueprint.modules)}
- **${blueprint.coreServices.length} core services:** ${list(blueprint.coreServices)}
- **${blueprint.integrations.length} integrations:** ${list(blueprint.integrations)}

Review and edit it in Plan, or start building. A prototype is the quickest way to see it working.`),
		// "What's next" (review the sections, or build) only in the clarification questions flow; the default flow, as in
		// production, ends on the overview (decision 2026-10-29).
		...(from === "answers" ? [next([...reviewSteps, nextSteps.prototype, nextSteps.fullStack])] : []),
		wait(0, { type: "done" }),
	];
}

function build(fullStack: boolean): Step[] {
	const all = buildFiles(fullStack);
	const half = Math.floor(all.length / 2);
	return [
		wait(0, { type: "status", label: "Preparing your application structure…" }),
		...steps([
			"Set up the project, routes and theme",
			"Created the data model for products, orders and bikes",
			"Connected the fit check to My Garage",
		]),
		wait(500, { type: "status", label: "Building your interface…" }),
		...steps(["Laid out the storefront and catalog", "Built cart and checkout", "Built the admin dashboard"]),
		wait(600, { type: "text", text: "" }),
		...say(
			fullStack
				? "I'm assembling the project and generating the first working version of your store, frontend and backend."
				: "I'm assembling the project and generating the first working version of your store.",
		),
		wait(200, { type: "files", id: "build" }),
		...files("build", all.slice(0, 6)),
		...write("build", "src/routes.tsx", routesCode),
		...files("build", all.slice(6, half)),
		...write("build", "src/lib/fit-check.ts", fitCheckCode),
		...files("build", all.slice(half)),
		wait(400, { type: "finish", id: "build", state: "done", credits: fullStack ? 61 : 34 }),
		wait(200, { type: "version", title: blueprint.name }),
		...say(
			fullStack
				? "Version 1 is ready: the storefront, the catalog with the fit check, My Garage, cart and checkout, and the admin dashboard, on a backend with its database, API and sign-in. Open Frontend to try it."
				: "Version 1 is ready: the storefront, the catalog with the fit check, My Garage, cart and checkout, and the admin dashboard. Open Frontend to try it.",
		),
		...say("\n\nWhen it looks right, here's what I'd do next."),
		next([recommend(nextSteps.stripe), nextSteps.wishlist, nextSteps.green]),
		wait(0, { type: "done" }),
	];
}

/** A change to the app: think, say what will change, write the files, end in a version. */
function change({
	thought,
	intro,
	writing,
	changed,
	title,
	summary,
	credits,
	then = [recommend(nextSteps.stripe), nextSteps.reviews, nextSteps.contrast],
}: {
	thought: string[];
	intro: string;
	writing: { path: string; code: string };
	changed: FileChange[];
	title: string;
	summary: string;
	credits: number;
	/** "What's next" after the change; none when nothing obvious follows. */
	then?: NextStep[];
}): Step[] {
	return [
		wait(0, { type: "status", label: "Thinking…" }),
		...steps([...thought, "Planned the files to change"]),
		wait(500, { type: "thought" }),
		...say(intro),
		wait(200, { type: "files", id: "change" }),
		...files("change", changed.slice(0, 1), 200),
		...write("change", writing.path, writing.code),
		...files("change", changed.slice(1), 300),
		wait(400, { type: "finish", id: "change", state: "done", credits }),
		wait(200, { type: "version", title }),
		...say(summary),
		...(then.length > 0 ? [next(then)] : []),
		wait(0, { type: "done" }),
	];
}

/** One question with options: how Archie answers a message it can't act on with confidence (rule 4). */
const ask = (lead: string, question: string, options: string[], skippable = false): Step[] => [
	wait(0, { type: "status", label: "Thinking…" }),
	wait(900, { type: "text", text: "" }),
	...say(lead),
	wait(200, { type: "questions", single: true, skippable, questions: [{ question, options }] }),
	wait(0, { type: "done" }),
];

/** A plain answer (Level 1): "Thinking…", then the reply streams. */
const answer = (text: string): Step[] => [
	wait(0, { type: "status", label: "Thinking…" }),
	wait(1200, { type: "text", text: "" }),
	...say(text),
	wait(0, { type: "done" }),
];

const feature = (name: string, intro: string, paths: string[], summary: string, then?: NextStep[]): Step[] =>
	change({
		thought: [`Found where ${name} fit in the blueprint`, "Listed the screens and data it touches"],
		intro,
		writing: {
			path: paths[0],
			code: `export function ${name.replace(/\W/g, "")}Page() {\n  const items = useCustomerList("${name}");\n  return <ProductGrid items={items} empty="Nothing here yet" />;\n}`,
		},
		changed: [...paths.map((path) => ({ path, change: "new" as const })), ...modified("src/routes.tsx", "src/components/header.tsx")],
		title: `Added ${name}`,
		summary,
		credits: 9,
		then,
	});

/** Colors `/theme` and "change the color" understand, as oklch hues. Anything else gets green. */
const hues: Record<string, number> = { green: 152, teal: 190, blue: 255, purple: 300, red: 25, orange: 55 };

/** A theme change to the color the message names. */
function recolor(text: string): Step[] {
	const color = Object.keys(hues).find((name) => new RegExp(`\\b${name}\\b`, "i").test(text)) ?? "green";
	const hue = hues[color];
	return change({
		thought: ["Found the brand color in src/styles/theme.css", `Checked the new ${color} against white for contrast`],
		intro: `I'll update the color scheme to ${color} in the design system.`,
		writing: {
			path: "src/styles/theme.css",
			code: `:root {\n  --brand: oklch(0.56 0.15 ${hue});\n  --brand-foreground: oklch(1 0 0);\n  --brand-subtle: oklch(0.96 0.03 ${hue});\n  --link: oklch(0.5 0.14 ${hue});\n  --ring: oklch(0.56 0.15 ${hue});\n}`,
		},
		changed: modified(
			"src/styles/theme.css",
			"src/components/header.tsx",
			"src/modules/storefront/storefront-page.tsx",
			"src/components/product-card.tsx",
		),
		title: `Updated theme to ${color} palette`,
		summary: `Done. The accent is now ${color} across buttons, links and highlights, and text on it still meets AA contrast.`,
		credits: 12,
	});
}

/** The blueprint sections a "how do I refine…" question can be about. */
const sections = {
	"user types": {
		title: "User Types",
		where: `User Types lists ${list(blueprint.userTypes)}`,
		detail: "Select one to open its details: name, description, software proficiency and the devices it uses",
		example: "Add a Wholesale Buyer who orders in bulk",
	},
	modules: {
		title: "Modules",
		where: `Modules lists ${list(blueprint.modules)}`,
		detail:
			"Select one to open its details: name, icon, description, capabilities and \"Who is this module for?\", the user types it's built for",
		example: "Split Orders & Returns into two modules",
	},
	"core services": {
		title: "Core Services",
		where: `Core Services lists ${list(blueprint.coreServices)}`,
		detail: "Select one to open its settings, like the sign-in methods and roles in User Management",
		example: "Turn on Google and Apple sign-in",
	},
	integrations: {
		title: "Integrations",
		where: `Integrations lists ${list(blueprint.integrations)}`,
		detail: "Select one to see what it's used for and which modules and services depend on it",
		example: "Use Mailchimp for marketing emails",
	},
} as const;

type Section = keyof typeof sections;

/** Which part of the blueprint a question is about, if it names one. */
function sectionIn(text: string): Section | undefined {
	if (/\buser ?types?\b|\broles?\b|\bpersonas?\b/i.test(text)) return "user types";
	if (/\bmodules?\b/i.test(text)) return "modules";
	if (/\b(core )?services?\b/i.test(text)) return "core services";
	if (/\bintegrations?\b/i.test(text)) return "integrations";
	return undefined;
}

/**
 * How to refine the blueprint: where the part lives in Plan, how to edit it there or here in the chat, and the order to
 * review it in before generating the app. A detailed answer (Level 1), ending with what's next.
 */
function refineGuide(text: string): Step[] {
	const section = sectionIn(text);
	const how = section
		? `**Your ${section} live in Plan**, in the ${sections[section].title} section. Here's how to update them:

1. **Open Plan** from the top bar. ${sections[section].where}.
2. **${sections[section].detail}.** Edit any field there; the AI rationale explains why I suggested it.
3. **Add or remove:** use + at the end of the section to add one, or × on an item to remove it.
4. **Regenerate** with the sparkle icon to have me redraft one item, or the whole section.
5. **Or ask me here,** for example "${sections[section].example}". I'll update the blueprint and tell you what changed.`
		: `**Your blueprint is your spec**, and you can refine it two ways:

1. **In Plan:** select any user type, module, service or integration to open its details and edit them. Use + to add, × to remove, and the sparkle icon to have me redraft an item or a whole section.
2. **Here in the chat:** describe the change, for example "Customers can only buy after signing up" or "Add a Wholesale Buyer user type". I'll update the blueprint, show you what changed, and keep Plan in step.`;

	return [
		wait(0, { type: "status", label: "Thinking…" }),
		wait(1000, { type: "text", text: "" }),
		...say(`${how}

**Before you generate the app**, I'd review the blueprint in this order:

1. **Description:** it should say what the store is for and who it serves.
2. **User types:** who uses the app, and what each one can do.
3. **Modules:** check each one's audience, so every user type has the screens it needs.
4. **Core services:** sign-in methods, payments and notifications.
5. **Integrations:** confirm ${list(blueprint.integrations)}.

Changes are quick now and take longer once there's code. When it looks right, start with a prototype: it's the fastest way to check the flows.`),
		next([...reviewSteps, nextSteps.prototype, nextSteps.fullStack]),
		wait(0, { type: "done" }),
	];
}

/** Archie asks permission before removing Cart & Checkout (approval checkpoint; also the /ask-permission scenario). */
const askPermission: Step[] = [
	wait(0, { type: "status", label: "Thinking…" }),
	wait(900, { type: "text", text: "" }),
	...say("Removing them changes what the store can do, so I'll check with you first."),
	wait(200, {
		type: "approval",
		description:
			"Remove Cart & Checkout. The store stops taking orders; shoppers can only browse. You can restore the current version later.",
		allow: { label: "Allow", message: "Remove cart and checkout" },
		deny: { label: "Deny", message: "Keep them" },
	}),
	wait(0, { type: "done" }),
];

/** The scripted turns. The first match wins, so the order matters. */
const sampleTurns: {
	match: RegExp;
	steps: (text: string) => Step[];
	/** What has to exist first: a drafted blueprint, or a built app. Without it, Archie says so (rule 4). */
	needs?: "blueprint" | "built";
}[] = [
	{ match: new RegExp(`^${answersIntro}`), steps: () => draftBlueprint("answers") },
	// The default, as in production: a request to build goes straight to the blueprint. /clarification-questions asks first.
	{ match: /\b(create|build|make)\b.*\b(app|store|shop)\b/i, steps: () => draftBlueprint("prompt") },
	{
		// "How do I update my user types?", "how can I refine my specs", "where do I edit the modules?"
		needs: "blueprint",
		match:
			/\b(how|where|what's the best way|can i)\b.*\b(updat|edit|chang|refin|improv|add|remov|renam|review)\w*\b.*\b(user ?types?|roles?|personas?|modules?|services?|integrations?|specs?|blueprint|plan|requirements?)\b|\brefine\b.*\b(specs?|blueprint|plan|requirements?)\b/i,
		steps: (text) => refineGuide(text),
	},
	{ needs: "blueprint", match: /^generate prototype$/i, steps: () => build(false) },
	{ needs: "blueprint", match: /^generate full stack application$/i, steps: () => build(true) },
	{
		needs: "built",
		match: /^retry connecting stripe$/i,
		steps: () => [
			wait(0, { type: "progress", id: "stripe", label: "Connecting Stripe…", doneLabel: "Stripe connected" }),
			wait(1800, { type: "finish", id: "stripe", state: "done" }),
			wait(200, { type: "version", title: "Connected Stripe payments" }),
			...say(
				"Stripe is connected in test mode. Checkout now takes card payments in USD and CAD, and Stripe Tax handles sales tax for both countries.",
			),
			next([recommend(nextSteps.wishlist), nextSteps.reviews]),
			wait(0, { type: "done" }),
		],
	},
	{
		needs: "built",
		match: /\b(stripe|payments?)\b/i,
		steps: () => [
			wait(0, { type: "status", label: "Configuring payments…" }),
			...steps(["Checked the store's payment settings", "Found the Stripe test key", "Sending it to Stripe"]),
			wait(500, {
				type: "progress",
				id: "stripe",
				label: "Connecting Stripe…",
				doneLabel: "Stripe connected",
				failedLabel: "Stripe connection failed",
			}),
			wait(1800, { type: "finish", id: "stripe", state: "failed" }),
			wait(200, {
				type: "error",
				title: "Couldn't connect to Stripe",
				detail: "Stripe didn't accept the test API key. Your store and checkout are unchanged, and no payments were set up.",
				retry: "Retry connecting Stripe",
				help: {
					happened:
						"I tried to connect Stripe with the test API key saved for this project, and Stripe rejected it as invalid. That usually means the key was copied incompletely, it's a live key in a test connection, or it was rolled (replaced) in Stripe. Nothing changed on your side: checkout works as before, and no payment settings were saved.",
					fixes: [
						"**Get a fresh test key:** in your Stripe Dashboard, turn on Test mode, then open Developers → API keys and copy the secret key. It starts with \"sk_test_\".",
						"**Update it in Archie:** open Backend → Integrations → Stripe and paste the key, replacing the old one.",
						"**Retry the connection:** choose Retry below. I'll pick up where I stopped, and nothing gets set up twice.",
						"**Still failing?** Check that your Stripe account is activated and that the key belongs to the same account. Tell me what Stripe shows, and I'll help from there.",
					],
				},
			}),
			wait(0, { type: "done" }),
		],
	},
	{
		needs: "built",
		match: /\bcontrast\b/i,
		steps: () => [
			wait(0, { type: "status", label: "Thinking…" }),
			...steps([
				"Listed every text and button color pair in src/styles/theme.css",
				"Measured each pair's contrast",
				"Compared them with WCAG AA",
			]),
			wait(500, { type: "thought" }),
			wait(0, { type: "progress", id: "contrast", label: "Checking color contrast…", doneLabel: "Contrast checked" }),
			wait(1800, { type: "finish", id: "contrast", state: "done" }),
			...say(`Text and buttons meet WCAG AA across the store. Two pairs are close to the limit:

- Muted text on the product cards: 4.6:1 (AA needs 4.5:1)
- The sale badge's white text on red: 4.7:1

Want me to darken them a little for more room?`),
			wait(0, { type: "done" }),
		],
	},
	{ needs: "built", match: /\b(colou?r|theme|palette|green|teal|blue|purple|red|orange)\b/i, steps: (text) => recolor(text) },
	{
		needs: "built",
		match: /\bwishlist\b/i,
		steps: () =>
			feature(
				"wishlist",
				"I'll add a wishlist: customers save products to their account and get an email when a saved item is back in stock.",
				["src/modules/wishlist/wishlist-page.tsx", "src/modules/wishlist/wishlist.data.ts"],
				"Done. Customers can save products from any product page and find them under Wishlist in their account.",
			),
	},
	{
		needs: "built",
		match: /\breviews?\b/i,
		steps: () =>
			feature(
				"reviews",
				"I'll add product reviews: customers who bought a product can rate it and write a review, and the Store Administrator can hide a review.",
				["src/modules/catalog/reviews.tsx", "src/modules/catalog/reviews.data.ts"],
				"Done. Product pages show the average rating and reviews, newest first.",
				[recommend(nextSteps.stripe), nextSteps.wishlist, nextSteps.contrast],
			),
	},
	{
		needs: "built",
		match: /\bgift cards?\b/i,
		steps: () =>
			feature(
				"gift cards",
				"I'll add gift cards: shoppers buy them in set amounts, and anyone can pay with one at checkout.",
				["src/modules/gift-cards/gift-cards-page.tsx", "src/modules/gift-cards/gift-cards.data.ts"],
				"Done. Gift cards are in the storefront menu, and checkout takes a gift card code.",
			),
	},
	{
		match: /\brelationships?\b/i,
		steps: () =>
			answer(
				"A relationship connects two kinds of records. In your store, each Order belongs to one Customer, and a Customer can have many Orders. That's a one-to-many relationship.\n\nRelationships let the app answer questions like \"What has this customer ordered?\" without copying data between places.",
			),
	},
	{
		needs: "blueprint",
		match: /\bfit check\b/i,
		steps: () =>
			answer(
				"Each product lists what it depends on: wheel size, seatpost diameter or groupset. When a customer has saved a bike in My Garage, the product page compares the two and says whether the part fits, and why not when it doesn't.\n\nGuests can enter their bike once to check a part; it isn't saved.",
			),
	},
	{
		needs: "blueprint",
		match: /^ask about my app$/i,
		steps: () =>
			answer(
				`Ask me anything about ${blueprint.name}: its user types, its modules, or how a part works. For example: "How does the fit check work?"`,
			),
	},
	{
		needs: "built",
		match: /^add a feature$/i,
		steps: () => ask("Happy to.", "Which feature do you want to add?", ["A wishlist", "Product reviews", "Gift cards"]),
	},
	{
		needs: "built",
		match: /^(the visual design|change the design)$/i,
		steps: () =>
			change({
				thought: ["Reviewed the storefront and product page layouts", "Compared spacing and type sizes across modules"],
				intro: "I'll refine the visual design: larger product photos, more space between sections and a calmer type scale.",
				writing: { path: "src/styles/theme.css", code: ":root {\n  --radius: 0.75rem;\n  --space-section: 4rem;\n}" },
				changed: modified(
					"src/styles/theme.css",
					"src/components/product-card.tsx",
					"src/modules/storefront/storefront-page.tsx",
				),
				title: "Refined the visual design",
				summary: "Done. Product photos are larger, sections have more room, and headings use a calmer scale.",
				credits: 10,
			}),
	},
	{
		needs: "built",
		match: /^product pages$/i,
		steps: () =>
			change({
				thought: ["Reviewed the product page", "Checked where the fit check shows"],
				intro: "I'll improve product pages: a spec table, the fit check at the top, and related parts below.",
				writing: {
					path: "src/modules/catalog/catalog-page.tsx",
					code: "<FitCheck product={product} />\n<SpecTable specs={product.specs} />\n<RelatedParts product={product} />",
				},
				changed: modified("src/modules/catalog/catalog-page.tsx", "src/modules/catalog/components.tsx"),
				title: "Improved product pages",
				summary: "Done. The fit check now sits above the price, specs are in a table, and related parts follow.",
				credits: 8,
			}),
	},
	{
		needs: "built",
		match: /^checkout$/i,
		steps: () =>
			change({
				thought: ["Reviewed the checkout steps", "Checked which wallets Stripe supports"],
				intro: "I'll shorten checkout to one page, with Apple Pay and Google Pay at the top.",
				writing: {
					path: "src/modules/cart-checkout/cart-checkout-page.tsx",
					code: '<ExpressPay methods={["apple-pay", "google-pay"]} />\n<ShippingForm />\n<PaymentForm />',
				},
				changed: modified("src/modules/cart-checkout/cart-checkout-page.tsx", "src/modules/cart-checkout/components.tsx"),
				title: "One-page checkout",
				summary: "Done. Checkout is one page now, with express wallets first.",
				credits: 9,
			}),
	},
	{
		needs: "built",
		match: /^remove the cart icon from the header$/i,
		steps: () =>
			change({
				thought: ["Found the cart icon in the header"],
				intro: "I'll remove the cart icon from the header.",
				writing: { path: "src/components/header.tsx", code: "<nav>\n  <Search />\n  <Account />\n</nav>" },
				changed: modified("src/components/header.tsx"),
				title: "Removed the cart icon from the header",
				summary: "Done. The cart is still at /cart, and shoppers reach it after adding a product.",
				credits: 3,
			}),
	},
	{ needs: "built", match: /^remove the cart and checkout entirely$/i, steps: () => askPermission },
	{
		// No `needs`: the /ask-permission scenario can run before anything is built, and Allow should still work.
		match: /^remove cart and checkout$/i,
		steps: () =>
			change({
				thought: ["Listed what depends on Cart & Checkout"],
				intro: "I'll remove Cart & Checkout and the parts that depend on it.",
				writing: { path: "src/routes.tsx", code: '// Cart and checkout removed\n{ path: "/", element: <Storefront /> },' },
				changed: modified("src/routes.tsx", "src/components/header.tsx", "src/modules/catalog/catalog-page.tsx"),
				title: "Removed cart and checkout",
				summary: "Done. The store is browse-only now. Restore the previous version to bring checkout back.",
				credits: 6,
				then: [],
			}),
	},
	{ match: /^keep them$/i, steps: () => answer("Okay, nothing changed.") },
	{
		needs: "built",
		match: /\b(better|improve|nicer)\b/i,
		steps: () => ask("I can improve a few things.", "Which one do you mean?", ["The visual design", "Product pages", "Checkout"]),
	},
	{
		needs: "built",
		match: /\bremove\b.*\bcart\b/i,
		steps: () =>
			ask('"Remove the cart" could mean two different changes.', "Which one do you want?", [
				"Remove the cart icon from the header",
				"Remove the cart and checkout entirely",
			]),
	},
];

/**
 * Whether a message doesn't read as words: no letters, or most of its words are keyboard mashing ("asdf"), have no
 * vowel, or pile up consonants ("sdkfj"). Archie checks this before anything else, so gibberish that happens to contain
 * a known word ("xq red zzk") still gets a question, not a guess (rule 4).
 */
function unreadable(text: string) {
	const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
	if (words.length === 0) {
		return true;
	}
	const odd = words.filter(
		(word) =>
			(word.length > 1 && !/[aeiouy]/.test(word)) ||
			/[^aeiouy]{6,}/.test(word) ||
			/asdf|sdfg|qwer|wert|zxcv|hjkl|jkl;/.test(word),
	);
	return odd.length / words.length >= 0.5;
}

/**
 * What Archie says to a message it can't read: a short, playful reply that asks again, with a hint of what to send. Some
 * play on the project (a bike store). Never blaming the person. One at random, never the same twice in a row, so it
 * doesn't feel canned (rule 4). The one place Archie's voice gets playful (DESIGN.md "Brand voice").
 */
const garbledReplies: { text: string; needs?: "built" }[] = [
	{ text: "That message took the scenic route and arrived in pieces. What would you like to build?" },
	{ text: "I tried every gear and couldn't get that one moving. Tell me what you have in mind?" },
	{ text: "That one slipped its chain. Say it another way, and we'll get rolling again." },
	{ text: "I read that three times and it's still a mystery to me. What should we work on?" },
	{ text: "My decoder ring is out for a tune-up. Could you say that differently? A question, or / for ideas, both work." },
	{
		text: "Interesting mix of letters! What did you mean to ask? Something like \"add a wishlist\" works great.",
		needs: "built",
	},
	{ text: "That one rode off before I could catch it. What would you like to change in Paceline Supply?", needs: "built" },
	{ text: "Even the fit check couldn't match that one to anything. Want to try again in a few words?", needs: "built" },
];

function garbled(memory: Memory, stage: ProjectStage): Step[] {
	// Replies that talk about changing the app only once there's an app to change.
	const choices = garbledReplies
		.filter(({ needs }) => !needs || stage.built)
		.map(({ text }) => text)
		.filter((reply) => reply !== memory.lastGarbled);
	const reply = choices[Math.floor(Math.random() * choices.length)];
	memory.lastGarbled = reply;
	return [wait(0, { type: "status", label: "Thinking…" }), wait(700, { type: "text", text: "" }), ...say(reply), wait(0, { type: "done" })];
}

/** "Details of…", "tell me about…", "what is…": the message asks for information, not a change. */
const asksForDetails =
	/\b(details?|tell me (more )?about|more about|what('s| is| are| does)|explain|describe|show me|info(rmation)?|overview of)\b/i;

/** Names as people type them: lowercase, "&" read as "and". */
const plain = (text: string) => text.toLowerCase().replace(/&/g, "and");

/** The blueprint item a message names (a module, user type, core service or integration), if it names one. */
function itemIn(text: string) {
	const message = plain(text);
	const named = <T extends { name: string }>(items: T[]) => items.find(({ name }) => message.includes(plain(name)));
	const module = named(blueprint.modules);
	if (module) return { kind: "module" as const, item: module };
	const userType = named(blueprint.userTypes);
	if (userType) return { kind: "user type" as const, item: userType };
	const service = named(blueprint.coreServices);
	if (service) return { kind: "core service" as const, item: service };
	const integration = named(blueprint.integrations);
	if (integration) return { kind: "integration" as const, item: integration };
	return undefined;
}

const nameOf = (id: string) =>
	[...blueprint.modules, ...blueprint.userTypes, ...blueprint.coreServices].find((item) => item.id === id)?.name ?? id;

/**
 * The details of one part of the blueprint, as Plan holds them: what it is, what it does, who it's for and why it's in
 * the blueprint. Only what the blueprint says, nothing added (rule 4). Plain text, ending with where to change it.
 */
function itemDetails({ kind, item }: NonNullable<ReturnType<typeof itemIn>>): Step[] {
	const where = { module: "Modules", "user type": "User Types", "core service": "Core Services", integration: "Integrations" }[kind];
	let body: string;
	if (kind === "module") {
		body = `${item.description}

**What it does**

${item.capabilities.map((capability) => `- ${capability}`).join("\n")}

**Who it's for:** ${item.audience.map(nameOf).join(", ")}

**Why it's in the blueprint:** ${item.rationale}`;
	} else if (kind === "user type") {
		const modules = blueprint.modules.filter(({ audience }) => audience.includes(item.id));
		body = `${item.description}

**Software proficiency:** ${item.proficiency}. **Devices:** ${item.devices.join(", ")}.

**Modules built for them:** ${modules.length > 0 ? list(modules) : "none yet"}

**Why it's in the blueprint:** ${item.rationale}`;
	} else if (kind === "core service") {
		body = `${item.description}

**Why it's in the blueprint:** ${item.rationale}`;
	} else {
		body = `${item.purpose}

**Used by:** ${item.usedBy.map(nameOf).join(", ")}

**Why it's in the blueprint:** ${item.rationale}`;
	}
	return answer(`**${item.name}** (${kind})

${body}

You can edit it in Plan, under ${where}, or tell me here what to change.`);
}

/**
 * What Archie says to a clear message it can't place, in plain text: never a question with options, never a guess
 * (rule 4, decision 2026-10-29). Several ways to say it, so it doesn't repeat itself; `again` when the message before
 * wasn't clear either. `quote` puts a short message back in the reply, so the person sees what Archie couldn't place.
 */
const unclearReplies: { text: (quote: string) => string; again?: boolean; quotes?: boolean }[] = [
	{ text: () => "I'm not sure what you mean, and I'd rather not guess. Could you tell me a bit more about what you'd like to do?" },
	{ text: (quote) => `I couldn't place ${quote} in your project. Could you say a little more about what you have in mind?`, quotes: true },
	{ text: () => "I don't want to get this wrong. Can you say it another way, or add a bit more detail?" },
	{ text: () => "I'm missing something here. Could you describe what you're after in a sentence or two?" },
	{ text: () => "Sorry, I still can't tell what you'd like. Could you describe it in a full sentence?", again: true },
	{ text: (quote) => `I'm still not following ${quote}. What would you like to happen?`, again: true, quotes: true },
	{ text: () => "I still don't want to guess. What's the result you're hoping for?", again: true },
];

/**
 * A clear message the script doesn't know: Archie says so in plain text and asks the person to say more, a different
 * way each time (`unclearReplies`). Before a blueprint, it asks what to build.
 */
function unclear(stage: ProjectStage, memory: Memory, text: string): Step[] {
	if (stage.blueprint || stage.built) {
		const again = (memory.unclearStreak ?? 0) > 1;
		// Quote the message only when it's short enough to read back on one line.
		const short = text.trim().length <= 40 && !text.includes("\n");
		const choices = unclearReplies
			.filter((reply) => Boolean(reply.again) === again && (short || !reply.quotes))
			.map((reply) => reply.text(`"${text.trim()}"`))
			.filter((reply) => reply !== memory.lastUnclear);
		const reply = choices[Math.floor(Math.random() * choices.length)];
		memory.lastUnclear = reply;
		return answer(reply);
	}
	return answer(
		"I'm not sure what you mean. Tell me what you'd like to build, like \"An online store for road bike accessories\", and I'll draft its blueprint.",
	);
}

/**
 * A request for something that doesn't exist yet: a design or feature change before anything is generated, or building
 * before there's a blueprint. Archie says what's missing and what to do first (rule 4), never offering design changes
 * on nothing.
 */
function notYet(stage: ProjectStage): Step[] {
	if (stage.blueprint) {
		return [
			wait(0, { type: "status", label: "Thinking…" }),
			wait(800, { type: "text", text: "" }),
			...say(
				"Nothing's been generated yet, so there's no design or code to change. You can shape this in the blueprint now, or generate the app first and then change it.",
			),
			next([...reviewSteps, nextSteps.prototype, nextSteps.fullStack]),
			wait(0, { type: "done" }),
		];
	}
	return answer(
		"There's nothing to change yet. Tell me what you'd like to build, and I'll draft its blueprint.",
	);
}

function restore(version: number, current: number): Step[] {
	return [
		wait(0, { type: "note", text: `Restoring to a previous version: ${current} → ${version}` }),
		wait(0, { type: "status", label: "Restoring your app…" }),
		...steps([`Found version ${version}`, "Copied its files into a new version", "Checked that it builds"], 500),
		wait(500, { type: "version", title: `Restored version ${version}` }),
		...say(`Done. Version ${version} is back as a new version, so the later changes stay in the history if you need them.`),
		wait(0, { type: "done" }),
	];
}

/** "What's the error?", "why did it fail?", "how do I fix it?": a question about an error. */
const errorQuestion =
	/\b(errors?|fail(ed|s|ure)?|went wrong|what happened|why|fix|broken|not working|couldn'?t|problem|issue)\b/i;

/**
 * Asked about an error, Archie explains what happened, then how to resolve it, step by step, and offers the retry when
 * it's safe (rule 9). Never a generic "what would you like to do?".
 */
function explainError(error: NonNullable<ProjectStage["error"]>): Step[] {
	const happened = error.help?.happened ?? `${error.title}. ${error.detail}`;
	const fixes = error.help?.fixes ?? [
		"**Retry:** it often works the second time if the problem was temporary.",
		"**Tell me more:** describe what you expected, and I'll look for another way.",
	];
	return [
		wait(0, { type: "status", label: "Thinking…" }),
		...steps(["Read the error and what was running", "Checked what changed and what didn't"], 500),
		wait(400, { type: "thought" }),
		...say(`**What happened**

${happened}

**How to fix it**

${fixes.map((fix, index) => `${index + 1}. ${fix}`).join("\n")}`),
		...(error.retry ? [next([{ label: error.retry, description: "Try again with the current settings" }])] : []),
		wait(0, { type: "done" }),
	];
}

/** Prototype shortcuts (the commands menu's "prototype" group): each plays one scenario, whatever the stage. */
const scenarios: Record<string, () => Step[]> = {
	"ask-permission": () => askPermission,
	// Clarifying questions before the blueprint, one at a time; the answers then draft it.
	"clarification-questions": () => clarify,
	// The first build: status and live feed, code streaming in, files processed, a version and what's next.
	"code-generation": () => build(false),
};

/** Slash commands, as the request they stand for. */
// Empty until Archie's command set is defined: the menu's /command-1 and /command-2 are placeholders, so sending one
// gets the usual "not sure what you mean".
const commandRequests: Record<string, (rest: string) => string> = {};

function expandCommand(text: string) {
	const command = /^\/(\S+)\s*(.*)$/s.exec(text);
	const expand = command && commandRequests[command[1].toLowerCase()];
	return expand ? expand(command[2].trim()) : text;
}

/**
 * What Archie remembers between requests: answers to the clarifying questions it's still waiting to understand. One
 * memory per conversation (`createSampleArchie`), as a real backend keeps the thread.
 */
type Memory = {
	pendingAnswers?: { answers: string[]; index: number };
	/** The last reply to an unreadable message, so the next one differs. */
	lastGarbled?: string;
	/** The last reply to a message Archie couldn't place, so the next one differs. */
	lastUnclear?: string;
	/** How many messages in a row Archie couldn't place, this one included. */
	unclearStreak?: number;
};

/** Asks again about the one answer Archie couldn't read, with that question's options (rule 4). */
function reaskAnswer(index: number, again: boolean): Step[] {
	const { question, options } = blueprint.clarifyingQuestions[index];
	return ask(
		again
			? "I still couldn't read that one."
			: `Thanks. I couldn't read your answer to question ${index + 1}, so I've kept the others.`,
		question,
		options,
		true,
	);
}

/**
 * The script's steps for a request. Seeded threads replay these (without memory), so they match the live conversation.
 * Unreadable messages and answers get a clarifying question first (rule 4).
 */
function stepsFor(request: ArchieRequest, memory: Memory = {}): Step[] {
	// Messages in a row Archie couldn't place: any other reply ends the streak.
	const streak = memory.unclearStreak ?? 0;
	memory.unclearStreak = 0;
	if (request.kind === "restore") {
		return restore(request.version, request.current);
	}
	const text = expandCommand(request.text);
	const scenario = scenarios[request.text.trim().slice(1).toLowerCase()];
	if (request.text.startsWith("/") && scenario) {
		return scenario();
	}

	// Waiting on one answer: a readable reply fills it in, and the blueprint gets drafted with all of them.
	const pending = memory.pendingAnswers;
	if (pending) {
		if (unreadable(text)) {
			return reaskAnswer(pending.index, true);
		}
		memory.pendingAnswers = undefined;
		return draftBlueprint("answers");
	}

	if (text.startsWith(answersIntro)) {
		const answers = text
			.split("\n")
			.slice(1)
			.map((line) => line.replace(/^- /, ""));
		const index = answers.findIndex((answer) => answer !== "You decide" && unreadable(answer));
		if (index !== -1) {
			memory.pendingAnswers = { answers, index };
			return reaskAnswer(index, false);
		}
		return draftBlueprint("answers");
	}

	// Seeded threads replay without a stage: everything they reach already exists.
	const stage = request.stage ?? { blueprint: true, built: true };
	if (unreadable(text)) {
		return garbled(memory, stage);
	}
	// A question about the latest error gets its explanation and fixes, before anything else is matched.
	if (stage.error && errorQuestion.test(text)) {
		return explainError(stage.error);
	}
	// "Give me the details of the Storefront": a question about a part of the blueprint gets that part's details.
	const named = asksForDetails.test(text) ? itemIn(text) : undefined;
	if (named) {
		return stage.blueprint ? itemDetails(named) : notYet(stage);
	}
	const turn = sampleTurns.find(({ match }) => match.test(text));
	if (!turn) {
		memory.unclearStreak = streak + 1;
		return unclear(stage, memory, text);
	}
	if ((turn.needs === "blueprint" && !stage.blueprint) || (turn.needs === "built" && !stage.built)) {
		return notYet(stage);
	}
	return turn.steps(text);
}

/** A responder that plays the script. Pass `{ pace: 0 }` in tests to answer at once. */
function createSampleArchie({ pace = 1 }: SampleArchieOptions = {}): ArchieResponder {
	const memory: Memory = {};
	return (request: ArchieRequest, emit) => {
		const steps = stepsFor(request, memory);

		let at = 0;
		const timers = steps.map(({ after, event }) => {
			at += after * pace;
			return setTimeout(() => emit(event), at);
		});
		return () => timers.forEach(clearTimeout);
	};
}

export { createSampleArchie, garbledReplies, stepsFor, unclearReplies, type Step };

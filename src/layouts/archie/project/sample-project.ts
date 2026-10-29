import { blueprint } from "@/sample-data/road-bike-store";

import {
	answerQuestion,
	applyEvent,
	newTurn,
	person,
	settleBlock,
	type ArchieRequest,
	type ThreadItem,
} from "./chat-model";
import avatar from "./images/avatar.png";
import { answersIntro, type ProjectData } from "./project";
import { stepsFor } from "./sample-archie";

// Sample data for the Project stories. Each thread is the sample Archie's script replayed on a simulated clock, so a
// story that opens mid-conversation shows exactly what the live conversation would have (times included).

const prompt = "Create an e-commerce store selling high-end accessories for road bikes.";

/** A thread being written: send a person's message, let Archie answer a request, answer its questions, add a day break. */
function conversation() {
	let thread: ThreadItem[] = [];
	let clock = Date.UTC(2026, 9, 27, 15);

	const history = {
		person(text: string) {
			thread = [...thread, person(text)];
			return history;
		},
		archie(request: ArchieRequest) {
			const turn = newTurn(clock);
			thread = [...thread, turn];
			for (const { after, event } of stepsFor(request)) {
				clock += after;
				thread = applyEvent(thread, turn.id, event, clock);
			}
			clock += 4000;
			return history;
		},
		/** The person's message, then Archie's answer to it. */
		ask(text: string) {
			return history.person(text).archie({ kind: "message", text });
		},
		/** Answers the open questions with the blueprint's answers, then sends them as one message (rule 3). */
		answerQuestions() {
			const turn = thread.at(-1);
			const block = turn?.kind === "archie" ? turn.blocks.find((candidate) => candidate.kind === "questions") : undefined;
			for (const { answer } of blueprint.clarifyingQuestions) {
				if (block) {
					thread = answerQuestion(thread, block.id, answer);
				}
			}
			const questions = blueprint.clarifyingQuestions.map(({ question, options }) => ({ question, options }));
			const values = blueprint.clarifyingQuestions.map(({ answer }) => answer);
			const text = [answersIntro, ...values.map((value) => `- ${value}`)].join("\n");
			thread = [...thread, person(text, { questions, values })];
			return history.archie({ kind: "message", text });
		},
		/** Chooses one of the actions Archie proposed in its last turn. */
		choose(option: string) {
			const turn = thread.at(-1);
			const block = turn?.kind === "archie" ? turn.blocks.find((candidate) => candidate.kind === "actions") : undefined;
			if (block) {
				thread = settleBlock(thread, block.id, option);
			}
			return history.ask(option);
		},
		separator(label: string) {
			thread = [...thread, { kind: "separator", id: `separator-${thread.length}`, label }];
			clock += 2 * 24 * 60 * 60 * 1000;
			return history;
		},
		get thread() {
			return thread;
		},
	};
	return history;
}

/** Figma "Default": the request sent, Archie about to answer. */
const sampleProject: ProjectData = {
	org: "Paceline Supply",
	project: "Accessories store",
	credits: 397,
	avatar,
	chatTitle: "Road bike accessories store",
	model: "Auto",
	thread: conversation().person(prompt).thread,
	blueprint,
};

/** Archie has asked its clarifying questions; the first one is waiting for an answer. */
const sampleProjectWithReply: ProjectData = {
	...sampleProject,
	thread: conversation().ask(prompt).thread,
};

/** The blueprint is drafted and Plan is full; Archie waits for "Generate Prototype" or "Generate Full Stack Application". */
const sampleBlueprintReady: ProjectData = {
	...sampleProject,
	thread: conversation().ask(prompt).answerQuestions().thread,
	planRevealed: 5,
};

/** Two days of work: the first build (Version 1), then a theme change (Version 2, current). Version 1 can be restored. */
const sampleVersionHistory: ProjectData = {
	...sampleProject,
	credits: 351,
	thread: conversation()
		.ask(prompt)
		.answerQuestions()
		.choose("Generate Prototype")
		.separator("2 days ago")
		.ask("Change the accent color to green").thread,
	planRevealed: 5,
};

/** A brand-new chat: nothing sent yet, so it shows the prompt starters. The simulated conversation starts here. */
const sampleNewProject: ProjectData = {
	...sampleProject,
	thread: [],
};

export { sampleBlueprintReady, sampleNewProject, sampleProject, sampleProjectWithReply, sampleVersionHistory };

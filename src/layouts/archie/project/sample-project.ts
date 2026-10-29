import type { ProjectData } from "./project";
import avatar from "./images/avatar.png";

/** Sample data for the Project stories. Figma shows placeholders ("Org name", "{current-chat}", "{title}"). */
const sampleProject: ProjectData = {
	org: "Scoops & Co.",
	project: "Ice cream inventory",
	credits: 397,
	avatar,
	chatTitle: "Ice cream inventory app",
	model: "Auto",
	messages: [{ from: "person", text: "create an ice cream shop inventory app" }],
};

/** The same project after Archie has answered: no "Thinking…", Archie's reply below the request. */
const sampleProjectWithReply: ProjectData = {
	...sampleProject,
	messages: [
		...sampleProject.messages,
		{
			from: "archie",
			text: "I've drafted a plan with four modules: Flavors, Freezer stock, Suppliers and Orders. Take a look in Plan, then tell me what to change.",
		},
	],
};

/** A brand-new chat: nothing sent yet. The simulated conversation starts here. */
const sampleNewProject: ProjectData = {
	...sampleProject,
	messages: [],
};

export { sampleNewProject, sampleProject, sampleProjectWithReply };

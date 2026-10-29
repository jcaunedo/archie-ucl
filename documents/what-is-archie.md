<!--
Created: Oct 28, 2026
Created by: Julio Caunedo
Last updated: Oct 28, 2026
Scope: Background on what Archie is, how it works and who it's for. Context for every PRD, layout and copy decision in this repo.
Purpose: Give designers, developers and Claude one shared description of the product, so prototypes (such as the simulated chat in `src/layouts/archie/`) behave and talk like Archie.
-->

# What is Archie

Archie is an **AI-native, full-stack application-building platform** designed to take software from an initial idea all the way to a production system. Its core distinction is that it does not begin by immediately generating code. It begins by **defining and architecting the product**. [Archie](https://www.archie.com/press-kit/)

A useful way to describe it is:

> **Archie is a product architect, designer, and software builder in one platform. It helps define what an application should be, creates its structure and prototype, then builds the frontend, backend, infrastructure, and production environment around that definition.**

## The fundamental idea: clarity before code

Most AI app builders are optimized around a prompt → code loop. You describe something, the system generates an interface or application, and then you keep prompting it to modify the result.

Archie takes a more structured approach. Before generating the production application, it creates a **Blueprint** that describes the system being built: its modules, user types, data model, services, integrations, architecture, and other product requirements. It can also generate a working visual prototype during this definition phase. [Archie](https://www.archie.com/press-kit/)

That makes the workflow closer to:

**Idea → Definition → Architecture → Prototype → Application → Production**

rather than simply:

**Prompt → Code → Prompt → Code**

The premise is that architectural decisions such as permissions, database structure, APIs, and system boundaries should not emerge accidentally while generating individual screens. Archie treats those decisions as part of the product definition. [Archie](https://www.archie.com/en-gb/blog/vibe-coding-broke-its-promise/)

## Archie acts like a product architect

This is probably the most important conceptual distinction.

You can start with something relatively unstructured, such as:

> "I want to build a healthcare platform where clinicians can manage patients and AI agents can monitor their census."

Archie can progressively transform that intent into a structured software definition.

That definition can include concepts such as users and roles, modules and capabilities, workflows, screens, entities and relationships, permissions, services, integrations, backend requirements, and system architecture.

Instead of forcing the person starting the project to already understand databases, APIs, infrastructure, or software architecture, Archie helps translate **product intent into technical structure**.

This is also where the name comes from: **Archie derives from "Architect."** [Archie](https://www.archie.com/company/)

## It creates the product before committing to implementation

The Blueprint gives the user something concrete to inspect before the expensive part of software development begins.

The system can also produce a visual prototype representing the proposed application. That creates an important validation layer: users can evaluate the workflows, structure, navigation, screens, and product direction while changes are still inexpensive.

Conceptually, the Blueprint becomes a source of truth connecting:

**Product intent ↔ UX ↔ data ↔ architecture ↔ implementation**

That is materially different from treating a generated UI as the specification.

## Then Archie builds the real application

After the application has been defined, Archie can generate the full-stack implementation rather than stopping at a prototype.

The current product positioning explicitly covers applications ranging from prototypes through full enterprise systems. [Archie](https://www.archie.com/)

A generated application can include the frontend experience, backend services, database, APIs, authentication, authorization, file storage, integrations, hosting, deployment infrastructure, and other production capabilities.

So when Archie says **"Build the real thing,"** the strategic implication is important: it is positioning itself beyond prototype-generation.

## Archie Core provides the backend foundation

Underneath Archie is **Archie Core**, its AI-native cloud/backend platform.

Archie Core provides infrastructure that applications normally require teams to assemble from multiple services. Its capabilities include databases, authentication, role-based access control, GraphQL and REST APIs, file storage, realtime functionality, custom server-side functions, integrations, deployment infrastructure, and production hosting. [Archie](https://www.archie.com/platform/)

The architecture is deliberately integrated: instead of generating a frontend and expecting the user to separately configure services such as a database, authentication provider, API layer, hosting provider, and storage service, Archie can provide these as part of the same system.

Archie describes Core as **GraphQL-first**, while also supporting REST APIs. [Archie](https://www.archie.com/press-kit/)

## It is intended to support production, not only prototyping

This is another critical part of the positioning.

Many AI development tools are extremely effective at creating an impressive first version. The difficulty often comes later: permissions become complicated, database relationships evolve, multiple user types emerge, integrations accumulate, and changes begin affecting other areas of the application.

Archie's architecture-first model is intended to reduce that failure mode by creating structure before implementation.

That makes its target use case broader than "build an MVP quickly." The ambition is:

**idea → prototype → application → production → continued evolution**

within the same environment.

Archie's own positioning is consequently **"the platform to architect, build, and run production-grade applications."** [Archie](https://www.archie.com/press-kit/)

## AI is operating across the product lifecycle

Archie should not really be understood as simply an AI coding assistant.

The more useful mental model is a collection of AI capabilities operating at different layers of software creation: interpreting the idea, structuring requirements, defining architecture, creating product UX, generating implementation, modifying the system, and helping operate the resulting application.

This is why its positioning around **agentic software development** matters. Rather than one AI producing arbitrary code from a conversation, specialized reasoning can operate against a shared definition of the system.

The resulting model is closer to an **AI software team working from a common specification**.

## There are effectively three layers to the Archie ecosystem

**Archie** is the idea-to-application product. This is where users define, design, build, and evolve applications.

**Archie Core** is the infrastructure/platform layer underneath it. It provides databases, APIs, authentication, permissions, storage, realtime capabilities, custom logic, integrations, deployment, and hosting. [Archie](https://www.archie.com/platform/)

**Archie Labs** is the professional-services layer for organizations that need specialized product strategy, design, software development, or AI implementation support. [Archie](https://www.archie.com/company/)

Together, those create a broader proposition than a standalone app builder:

**software definition + software generation + infrastructure + expert services.**

## Who Archie is for

One of the interesting aspects of the platform is that it is trying to cover a wider technical spectrum than traditional development tools.

A nontechnical founder can describe an idea and progressively define a real application without needing to understand every infrastructure decision.

A product designer can work much closer to the actual system instead of ending with screens and handing everything to engineering.

A product team can align product requirements, architecture, UX, data, and implementation around the same model.

And engineers can still work with real architecture, APIs, databases, custom logic, and source code rather than being constrained to a purely no-code abstraction.

That explains the current homepage proposition:

**"Simple enough for anyone with an idea. Powerful enough to win over your most skeptical engineer."** [Archie](https://www.archie.com/)

## Where Archie fits against vibe coding

I would not position Archie as being "against vibe coding." They solve somewhat different parts of the problem.

Vibe coding demonstrated how dramatically AI can compress the distance between an idea and working software. Archie is essentially asking what happens **after that first breakthrough**.

Once the application becomes a business, the system has to deal with persistent data, permissions, different roles, integrations, security, API contracts, deployment, scale, maintainability, and continued product evolution.

Archie's proposition is that those concerns should be designed into the system rather than retrofitted after the prototype succeeds. [Archie](https://www.archie.com/en-gb/blog/vibe-coding-broke-its-promise/)

So a useful distinction is:

**Vibe coding optimizes for "make this."**

**Archie optimizes for "define what we are building, then build it correctly."**

## From a product-design perspective

Archie is particularly interesting because it potentially changes where product design sits in software development.

Traditionally:

**Requirements → Figma → engineering specification → code**

With an architecture-first AI system, the model becomes closer to:

**Intent → structured product definition → interactive product → production system**

That means design decisions can become executable rather than merely descriptive.

User roles, navigation, permissions, workflows, entities, states, and relationships aren't simply represented in mockups—they can contribute directly to the definition from which the application is generated.

This is why the **Blueprint is strategically more important than any individual generated screen**. It can become the connective tissue between product strategy, UX, system architecture, and implementation.

## The simplest definition

If I had to explain Archie to someone in 30 seconds:

> **Archie is an AI platform that takes an application from idea to production. Instead of immediately generating code, it first works with you to define the product—its users, workflows, data, architecture, services, and interface. Once that foundation is clear, Archie builds the full application, including the frontend, backend, database, APIs, authentication, infrastructure, and hosting. The key idea is clarity before code: define the system first, then generate software against that definition.**

And the shortest version would be:

> **Archie plans the app before it builds the app—and then builds the entire stack.**

That distinction is, in my view, the center of the Archie product narrative.

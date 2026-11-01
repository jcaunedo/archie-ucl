// The blueprint Archie generates for the road bike accessories store, shaped like Archie's Plan: clarifying questions
// first, then the description, user types, modules, core services and integrations. Every item carries the fields its
// detail panel shows (description, AI rationale, and per type: proficiency and devices, capabilities and audience,
// settings). Icons are lucide-react names. See road-bike-store.md for how the project fits together.

type Proficiency = "low" | "medium" | "high";
type Device = "desktop" | "mobile" | "tablet";

/** A question Archie asks before drafting the blueprint, with the person's answer. */
type ClarifyingQuestion = {
	id: string;
	question: string;
	/** Why Archie asks: what the answer decides in the blueprint. */
	why: string;
	options: string[];
	answer: string;
	/**
	 * Earlier questions (by `id`) this one depends on. Changing one of their answers asks this one again; changing any
	 * other answer keeps it.
	 */
	dependsOn?: string[];
};

type UserType = {
	id: string;
	name: string;
	description: string;
	rationale: string;
	proficiency: Proficiency;
	devices: Device[];
};

type Module = {
	id: string;
	name: string;
	icon: string;
	description: string;
	rationale: string;
	capabilities: string[];
	/** The user types the module is built for (Plan: "Who is this module for?"). Not an access rule. */
	audience: UserType["id"][];
};

type ServiceSetting = { name: string; description?: string; icon?: string; enabled: boolean };

type ServiceSection = { title: string; description: string; settings: ServiceSetting[] };

type CoreService = {
	id: string;
	name: string;
	icon: string;
	description: string;
	rationale: string;
	/** The service's settings panel, section by section. Only services whose panel is designed have them. */
	sections?: ServiceSection[];
};

type Integration = {
	id: string;
	name: string;
	purpose: string;
	rationale: string;
	/** The modules and core services that call it. */
	usedBy: (Module["id"] | CoreService["id"])[];
};

type Blueprint = {
	name: string;
	tagline: string;
	description: string;
	clarifyingQuestions: ClarifyingQuestion[];
	userTypes: UserType[];
	modules: Module[];
	coreServices: CoreService[];
	integrations: Integration[];
};

const clarifyingQuestions: ClarifyingQuestion[] = [
	{
		id: "seller",
		question: "Do you sell your own stock, or should other brands and shops list products too?",
		why: "A single seller needs inventory and fulfillment. A marketplace needs seller accounts, payouts and commissions.",
		options: ["Our own stock", "A marketplace of brands and shops"],
		answer: "Our own stock. We buy from brands and ship everything from one warehouse.",
	},
	{
		id: "shipping",
		question: "Where do you ship?",
		why: "Each country adds a currency, tax rules and shipping rates.",
		options: ["One country", "A few countries", "Worldwide"],
		answer: "The US and Canada to start.",
		// In a marketplace each seller ships their own orders, so the seller answer decides what this one means.
		dependsOn: ["seller"],
	},
	{
		id: "accounts",
		question: "Can shoppers check out as guests, or do they need an account?",
		why: "Guest checkout sells more on mobile. Accounts keep order history and saved details.",
		options: ["Guest checkout only", "Account required", "Both: guests can buy, accounts are optional"],
		answer: "Both. Guests can buy, and an account keeps their orders and their bikes.",
	},
	{
		id: "compatibility",
		question: "Should shoppers be able to save their bike, so product pages show which parts fit it?",
		why: "High-end parts depend on the bike: wheel size, groupset, seatpost and handlebar diameter. Saving the bike lets the store check fit for them.",
		options: ["Yes, check fit against a saved bike", "No, list compatibility in the specs only"],
		answer: "Yes. Riders add their bike, and each product page says whether it fits.",
		// Saving a bike needs an account, so the accounts answer decides whether this question still makes sense.
		dependsOn: ["accounts"],
	},
];

const userTypes: UserType[] = [
	{
		id: "guest",
		name: "Guest",
		description:
			"A Guest is a visitor who hasn't signed in. They browse the catalog, read product specs, and can buy without creating an account. Many arrive from search or social posts on a phone, looking for one specific part. They can check whether a part fits by entering their bike once, but nothing is saved after they leave. Guests become Customers when they create an account, often right after their first order.",
		rationale:
			"You chose optional accounts, so buying must work without one. Guests are separate from Customers because they can't save bikes or see past orders.",
		proficiency: "low",
		devices: ["desktop", "mobile"],
	},
	{
		id: "customer",
		name: "Customer",
		description:
			"A Customer is a rider with an account. They know their equipment and compare specs, weights and compatibility before they buy. Their account keeps their order history, their saved addresses and the bikes in their garage, so every product page can tell them whether a part fits. They track deliveries, start returns, and come back when a part wears out or they upgrade.",
		rationale:
			"Saved bikes and order history only work with an account. Customers buy expensive parts, so they need fit checks and clear order status to buy with confidence.",
		proficiency: "medium",
		devices: ["desktop", "mobile"],
	},
	{
		id: "fulfillment-staff",
		name: "Fulfillment Staff",
		description:
			"Fulfillment Staff work in the warehouse. They pick and pack orders, print shipping labels, receive deliveries from brands, and count stock. They work from a tablet or a desktop at the packing station and need short, clear tasks: what to pack next, where it is, and what's running low. They don't manage products, prices or customers.",
		rationale:
			"You ship everything from one warehouse, so someone has to turn orders into parcels. Their access is limited to orders and stock.",
		proficiency: "medium",
		devices: ["desktop", "tablet"],
	},
	{
		id: "store-admin",
		name: "Store Administrator",
		description:
			"The Store Administrator runs the store. They add products and their variants, set prices and promotions, manage stock and staff, handle returns that need a decision, and read sales reports. They hold the broadest access in the app and are the only user type that can change prices or invite staff.",
		rationale:
			"A single-seller store needs one role that owns the catalog, pricing and team. Keeping it separate from Fulfillment Staff protects prices and customer data.",
		proficiency: "high",
		devices: ["desktop"],
	},
];

const modules: Module[] = [
	{
		id: "storefront",
		name: "Storefront",
		icon: "store",
		description:
			"The public home of the store. It shows featured collections, new arrivals and guides, and leads visitors into the catalog. It works without an account.",
		rationale: "Guests and Customers need a starting point that shows what the store is known for before they search.",
		capabilities: ["Featured collections", "New arrivals", "Buying guides"],
		audience: ["guest", "customer"],
	},
	{
		id: "catalog",
		name: "Catalog",
		icon: "layout-grid",
		description:
			"Every product, organized by category: wheels, power meters, bike computers, cockpit, saddles, pedals, lights, bags and tools. Shoppers filter by brand, price and specs, and each product page shows its variants, specs and whether it fits their bike.",
		rationale:
			"High-end parts are chosen on specs, so filtering and detailed product pages are the core of the store.",
		capabilities: ["Category browsing", "Spec filters", "Product detail", "Fit check"],
		audience: ["guest", "customer", "store-admin"],
	},
	{
		id: "my-garage",
		name: "My Garage",
		icon: "bike",
		description:
			"Where Customers save their bikes: frame, size, wheel size, groupset, seatpost and handlebar diameter. The catalog uses the saved bike to check fit and suggest sizes.",
		rationale: "You asked for fit checks against a saved bike. This module holds the bikes the check uses.",
		capabilities: ["Bike profiles", "Fit checks", "Size suggestions"],
		audience: ["customer"],
	},
	{
		id: "cart-checkout",
		name: "Cart & Checkout",
		icon: "shopping-cart",
		description:
			"The cart and the checkout, for Guests and Customers. It calculates shipping and tax for the US and Canada, charges in USD or CAD, and confirms the order by email.",
		rationale: "Guest checkout and two countries decide most of this module: currency, tax and shipping rates per address.",
		capabilities: ["Cart", "Guest checkout", "Shipping rates", "Tax calculation"],
		audience: ["guest", "customer"],
	},
	{
		id: "orders-returns",
		name: "Orders & Returns",
		icon: "package",
		description:
			"Orders from both sides. Customers see their orders, track deliveries and start returns. Fulfillment Staff work through a queue of orders to pick, pack and ship. Orders move through placed, paid, packed, shipped and delivered.",
		rationale:
			"Expensive parts get returned when they don't fit, so returns are part of the order flow rather than a support email.",
		capabilities: ["Order tracking", "Returns", "Fulfillment queue", "Shipping labels"],
		audience: ["customer", "fulfillment-staff", "store-admin"],
	},
	{
		id: "inventory",
		name: "Inventory",
		icon: "warehouse",
		description:
			"Stock for every variant (size, color, length), counted in the one warehouse. Staff receive deliveries and record counts, and low stock is flagged before a product sells out.",
		rationale: "Selling your own stock means the store has to know what's on the shelf before it takes an order.",
		capabilities: ["Stock by variant", "Receiving", "Stock counts", "Low-stock alerts"],
		audience: ["fulfillment-staff", "store-admin"],
	},
	{
		id: "admin-dashboard",
		name: "Admin Dashboard",
		icon: "layout-dashboard",
		description:
			"Where the Store Administrator manages products, prices, promotions, customers and staff, and reads sales by product, category and country.",
		rationale: "The Store Administrator needs one place for every decision only they can make.",
		capabilities: ["Product management", "Pricing and promotions", "Staff management", "Sales reports"],
		audience: ["store-admin"],
	},
];

const coreServices: CoreService[] = [
	{
		id: "user-management",
		name: "User Management",
		icon: "user-cog",
		description:
			"Encompasses processes and actions for handling user information, including authentication, authorization, addition, deletion, and modification of user data.",
		rationale:
			"Customers sign up on their own, and staff are invited. Social sign-in with Google and Apple makes creating an account after a guest order one tap on a phone.",
		sections: [
			{
				title: "User Access Management",
				description: "Manages user roles, permissions across the application.",
				settings: [
					{
						name: "Role-Based Access",
						description: "Controls what users can see and do based on their assigned role.",
						icon: "user-check",
						enabled: true,
					},
					{
						name: "Multiple Roles per User",
						description: "Allow a single user to hold more than one role at the same time.",
						enabled: false,
					},
				],
			},
			{
				title: "Authentication Methods",
				description: "Specifies the methods users can use to sign in and authenticate their account.",
				settings: [
					{ name: "Email/Password", icon: "mail", enabled: true },
					{ name: "Google Auth", enabled: true },
					{ name: "Microsoft Auth", enabled: false },
					{ name: "Facebook Auth", enabled: false },
					{ name: "Apple Auth", enabled: true },
				],
			},
			{
				title: "Registration & Access",
				description: "How accounts get created — self-signup, invitations, verification gates.",
				settings: [
					{ name: "Self sign-up", description: "Customers create their own account.", enabled: true },
					{ name: "Invitation only for staff", description: "Staff join when an administrator invites them.", enabled: true },
					{ name: "Email verification", description: "New accounts confirm their email before they sign in.", enabled: true },
				],
			},
			{
				title: "Onboarding Flow",
				description: "Multi-step wizard shown to new users after registration to guide them through initial setup.",
				settings: [
					{
						name: "Enable Onboarding",
						description: "Show a guided setup wizard to new users after they sign up.",
						enabled: false,
					},
				],
			},
		],
	},
	{
		id: "payment-processing",
		name: "Payment Processing",
		icon: "credit-card",
		description: "Takes card and wallet payments at checkout, in USD and CAD, and handles refunds when a return is accepted.",
		rationale: "Every order is paid at checkout, and returns need refunds to the original payment.",
	},
	{
		id: "notifications",
		name: "Notifications",
		icon: "bell",
		description:
			"Sends order confirmations, shipping and delivery updates, return updates, and low-stock alerts to staff, by email and in the app.",
		rationale: "Customers expect to hear from the store at each step of an order, and staff need to know when stock runs low.",
	},
	{
		id: "file-storage",
		name: "File Storage Services",
		icon: "folder",
		description: "Stores product photos, spec sheets and size charts, and the shipping labels Fulfillment Staff print.",
		rationale: "Product pages for high-end parts depend on good photos and spec sheets.",
	},
	{
		id: "global-search",
		name: "Global Search",
		icon: "search",
		description:
			"Searches products by name, brand, category and spec, and finds orders and customers for staff.",
		rationale: "Riders often know the exact part they want. Search gets them there faster than browsing.",
	},
];

const integrations: Integration[] = [
	{
		id: "stripe",
		name: "Stripe",
		purpose: "Card and wallet payments, refunds, and sales tax for the US and Canada (Stripe Tax).",
		rationale: "One provider covers payments in both currencies and the tax rules of both countries.",
		usedBy: ["cart-checkout", "orders-returns", "payment-processing"],
	},
	{
		id: "shippo",
		name: "Shippo",
		purpose: "Live shipping rates at checkout, shipping labels, and tracking updates.",
		rationale: "Rates and labels for several carriers in the US and Canada, from one place.",
		usedBy: ["cart-checkout", "orders-returns"],
	},
	{
		id: "sendgrid",
		name: "SendGrid",
		purpose: "Order, shipping and return emails.",
		rationale: "Reliable delivery for the emails customers wait for after they pay.",
		usedBy: ["notifications"],
	},
];

const blueprint: Blueprint = {
	name: "Paceline Supply",
	tagline: "Shop high-end accessories for road bikes, with a fit check for every part",
	description:
		"An online store selling high-end accessories for road bikes: wheels, power meters, bike computers, cockpit parts, saddles, pedals, lights, bags and tools. The store sells its own stock and ships from one warehouse to the US and Canada, charging in USD or CAD. Visitors can browse and buy as guests; an account keeps their orders, addresses and bikes. Riders save their bikes in a garage, and every product page says whether a part fits. Orders move through placed, paid, packed, shipped and delivered, and customers can start a return from their order. Staff pick, pack and ship orders and keep stock counts current, while an administrator manages products, prices, promotions and the team.",
	clarifyingQuestions,
	userTypes,
	modules,
	coreServices,
	integrations,
};

export {
	blueprint,
	type Blueprint,
	type ClarifyingQuestion,
	type CoreService,
	type Device,
	type Integration,
	type Module,
	type Proficiency,
	type ServiceSection,
	type ServiceSetting,
	type UserType,
};

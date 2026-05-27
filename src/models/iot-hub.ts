import { z } from 'astro/zod';

export const IOT_HUB_API_URL =
	import.meta.env.IOT_HUB_API_URL ?? 'https://iot-hub.tbqa.cloud';

export const IOT_HUB_CATEGORIES = [
	{
		slug: 'devices',
		itemType: 'DEVICE',
		label: 'Devices',
		tileLabel: 'Device Library',
		card: 'big',
		tileColor: '#ccd5ff',
	},
	{
		slug: 'solution-templates',
		itemType: 'SOLUTION_TEMPLATE',
		label: 'Solution Templates',
		tileLabel: 'Solution Templates',
		card: 'big',
		tileColor: '#b8d9ff',
	},
	{
		slug: 'widgets',
		itemType: 'WIDGET',
		label: 'Widgets',
		tileLabel: 'Widgets',
		card: 'big',
		tileColor: '#a3ffc3',
	},
	{
		slug: 'calculated-fields',
		itemType: 'CALCULATED_FIELD',
		label: 'Calculated Fields',
		tileLabel: 'Calculated Fields',
		card: 'small',
		tileColor: '#bdedff',
	},
	{
		slug: 'alarm-rules',
		itemType: 'ALARM_RULE',
		label: 'Alarm Rules',
		tileLabel: 'Alarm Rules',
		card: 'small',
		tileColor: '#ffe6cc',
	},
	{
		slug: 'rule-chains',
		itemType: 'RULE_CHAIN',
		label: 'Rule Chains',
		tileLabel: 'Rule Chains',
		card: 'small',
		tileColor: '#ecd1ff',
	},
] as const;

export type IotHubCategorySlug = (typeof IOT_HUB_CATEGORIES)[number]['slug'];
export type IotHubItemType = (typeof IOT_HUB_CATEGORIES)[number]['itemType'];
export type IotHubCardVariant = 'big' | 'small';

export const getCardVariant = (itemType: string): IotHubCardVariant => {
	const cat = IOT_HUB_CATEGORIES.find((c) => c.itemType === itemType);
	return cat?.card ?? 'big';
};

export const PAGE_SIZE = 12;
export const HOME_PER_CATEGORY = 4;
export const API_FETCH_PAGE_SIZE = 100;

export const resolveImage = (path: string | null | undefined): string | null =>
	path ? `${IOT_HUB_API_URL}${path}` : null;

export const itemTypeEnum = z.enum([
	'WIDGET',
	'DASHBOARD',
	'SOLUTION_TEMPLATE',
	'CALCULATED_FIELD',
	'RULE_CHAIN',
	'DEVICE',
	'ALARM_RULE',
]);

export const screenshotResourceSchema = z.object({
	id: z.string().uuid(),
	type: z.string().nullable().optional(),
});

// Conservative CSS-color allowlist: `#hex` (3/4/6/8 chars) or bare named color
// (letters only). API values that don't match are coerced to null so we never
// interpolate untrusted strings into inline `style` attributes.
const cssColorSchema = z
	.string()
	.regex(/^(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)$/)
	.nullable()
	.catch(null);

export const listingViewSchema = z.object({
	// Astro keys entries by the outer `id` (set to slug by the loader).
	// We don't model the API's UUID here — use `slug` everywhere instead.
	slug: z.string(),
	itemType: itemTypeEnum,
	name: z.string(),
	description: z.string().nullable(),
	image: z.string().nullable(),
	icon: z.string().nullable(),
	color: cssColorSchema,
	seoTitle: z.string().nullable(),
	seoMetaDescription: z.string().nullable(),
	ogImage: z.string().nullable(),
	categories: z.array(z.string()).default([]),
	useCases: z.array(z.string()).default([]),
	cfType: z.string().nullable(),
	widgetType: z.string().nullable(),
	ruleChainType: z.string().nullable(),
	hardwareType: z.string().nullable(),
	vendor: z.string().nullable(),
	connectivity: z.array(z.string()).default([]),
	tags: z.array(z.string()).default([]),
	installCount: z.number().default(0),
	publishedTime: z.number().nullable(),
	creatorDisplayName: z.string().nullable(),
	creatorVerified: z.boolean().default(false),
	screenshots: z.array(screenshotResourceSchema).default([]),
});

export const listingDetailSchema = listingViewSchema.extend({
	readmeContent: z.string().nullable(),
});

export type ListingView = z.infer<typeof listingViewSchema>;
export type ListingDetail = z.infer<typeof listingDetailSchema>;

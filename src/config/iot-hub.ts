import { z } from 'astro/zod';

export const IOT_HUB_API_URL =
	import.meta.env.IOT_HUB_API_URL ?? 'https://iot-hub.tbqa.cloud';

export const IOT_HUB_CATEGORIES = [
	{ slug: 'devices', itemType: 'DEVICE', label: 'Devices' },
	{ slug: 'solution-templates', itemType: 'SOLUTION_TEMPLATE', label: 'Solution Templates' },
	{ slug: 'widgets', itemType: 'WIDGET', label: 'Widgets' },
	{ slug: 'calculated-fields', itemType: 'CALCULATED_FIELD', label: 'Calculated Fields' },
	{ slug: 'alarm-rules', itemType: 'ALARM_RULE', label: 'Alarm Rules' },
	{ slug: 'rule-chains', itemType: 'RULE_CHAIN', label: 'Rule Chains' },
] as const;

export type IotHubCategorySlug = (typeof IOT_HUB_CATEGORIES)[number]['slug'];
export type IotHubItemType = (typeof IOT_HUB_CATEGORIES)[number]['itemType'];

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

export const listingViewSchema = z.object({
	id: z.string(),
	slug: z.string(),
	itemType: itemTypeEnum,
	name: z.string(),
	description: z.string().nullable(),
	image: z.string().nullable(),
	icon: z.string().nullable(),
	color: z.string().nullable(),
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

class NonRetryableError extends Error {}

export async function fetchWithRetry(url: string): Promise<Response> {
	const attempts = 3;
	const timeoutMs = 30_000;
	let lastError: unknown;
	for (let i = 0; i < attempts; i++) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);
		try {
			const res = await fetch(url, { signal: controller.signal });
			clearTimeout(timer);
			if (res.ok) return res;
			if (res.status < 500) {
				// Fail fast on 4xx — do NOT retry
				const body = await res.text();
				throw new NonRetryableError(`${url} → ${res.status} ${body}`);
			}
			// 5xx — fall through to next iteration
			lastError = new Error(`${url} → ${res.status}`);
		} catch (e) {
			clearTimeout(timer);
			if (e instanceof NonRetryableError) throw e;
			lastError = e;
		}
	}
	throw lastError ?? new Error(`Failed after ${attempts} attempts: ${url}`);
}

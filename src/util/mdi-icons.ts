import { IOT_HUB_API_URL } from '@models/iot-hub';

// Module-scoped cache: each unique MDI icon name is fetched once per build
// worker (and once per dev server lifetime). The promise itself is cached so
// concurrent requests for the same icon share the same in-flight fetch.
const cache = new Map<string, Promise<string | null>>();

/**
 * Fetch a Material Design Icons SVG by name from the IoT Hub asset endpoint
 * (`${IOT_HUB_API_URL}/assets/mdi/{name}.svg`) and return its markup as a
 * string, ready to be inlined via `set:html`. Returns null when the fetch
 * fails (network error, 404, etc.) so callers can render a graceful fallback.
 *
 * The returned markup is normalized so it inlines cleanly inside HTML:
 *  - any leading `<?xml…?>` / `<!DOCTYPE…>` declarations are stripped
 *  - `fill="currentColor"` is added to the root `<svg>` when no fill attribute
 *    exists, so CSS `color` on a parent controls the rendered icon color.
 */
export function getMdiSvg(name: string): Promise<string | null> {
	let p = cache.get(name);
	if (!p) {
		p = fetchMdiSvg(name);
		cache.set(name, p);
	}
	return p;
}

async function fetchMdiSvg(name: string): Promise<string | null> {
	try {
		const res = await fetch(`${IOT_HUB_API_URL}/assets/mdi/${name}.svg`);
		if (!res.ok) {
			if (import.meta.env.DEV) {
				console.warn(`[iot-hub] MDI icon fetch failed for "${name}": ${res.status}`);
			}
			return null;
		}
		const raw = await res.text();
		return normalizeMdiSvg(raw);
	} catch (e) {
		if (import.meta.env.DEV) {
			const msg = e instanceof Error ? e.message : String(e);
			console.warn(`[iot-hub] MDI icon fetch error for "${name}": ${msg}`);
		}
		return null;
	}
}

function normalizeMdiSvg(svg: string): string {
	// Strip XML / DOCTYPE prologue — harmless when inlined but renders as
	// stray text in some parsers / DevTools views.
	let out = svg
		.replace(/<\?xml[^?]*\?>\s*/g, '')
		.replace(/<!DOCTYPE[^>]*>\s*/gi, '')
		.trim();
	// Inject `fill="currentColor"` on the root <svg> when no fill is set, so
	// CSS color on a parent drives the icon hue (matches the Angular
	// MatIconRegistry behaviour for namespaced SVG icons).
	out = out.replace(/<svg\b([^>]*)>/i, (match, attrs: string) => {
		if (/\sfill\s*=/.test(attrs)) return match;
		return `<svg${attrs} fill="currentColor">`;
	});
	return out;
}

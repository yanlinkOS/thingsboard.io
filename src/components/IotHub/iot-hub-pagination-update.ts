// Runtime updater for PaginationLink. When the host (dynamic search page,
// future dynamic category pages) flips a pagination nav into dynamic mode,
// it calls `updatePaginationDynamic(nav, { currentPage, totalPages })` to
// rebuild the page-number list with event-based buttons. Clicks dispatch
// `iot-hub-page:change` { page } bubbling events on the nav root — the
// host listens and refetches.

import { IOT_HUB_STRINGS, formatPageSummary } from '@models/iot-hub';

interface PaginationState {
	currentPage: number;
	totalPages: number;
}

// Same page-list algorithm as the static buildPages() in PaginationLink.astro
// so the dynamic UI keeps the same ellipsis ranges users are used to.
function buildPages(current: number, total: number): Array<number | 'ellipsis'> {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const result: Array<number | 'ellipsis'> = [1];
	if (current > 3) result.push('ellipsis');
	for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
		result.push(p);
	}
	if (current < total - 2) result.push('ellipsis');
	result.push(total);
	return result;
}

const CHEVRON_PATHS = {
	left: 'm15 6-6 6 6 6',
	right: 'm9 6 6 6-6 6',
};

function chevronSvgHtml(direction: 'left' | 'right'): string {
	return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${CHEVRON_PATHS[direction]}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
}

// <button> factories. UA button defaults (font-family, appearance,
// :disabled colour) are reset in `@mixin pagination-btn` so dynamic-mode
// controls render visually identical to their static <a> counterparts.
// `.is-disabled` / `.is-current` classes block clicks via pointer-events
// rather than the `disabled` attribute (which would apply the UA disabled
// colour and fight `.is-current`'s accent background).

function makeChevron(
	direction: 'left' | 'right',
	enabled: boolean,
	targetPage: number,
	label: string
): HTMLElement {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = `iot-hub-pagination__chevron${enabled ? '' : ' is-disabled'}`;
	btn.setAttribute('aria-label', label);
	if (!enabled) btn.setAttribute('aria-disabled', 'true');
	btn.innerHTML = chevronSvgHtml(direction);
	btn.addEventListener('click', () => {
		if (!enabled) return;
		dispatchPageChange(btn, targetPage);
	});
	return btn;
}

function makePageButton(page: number, isCurrent: boolean): HTMLElement {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = `iot-hub-pagination__page${isCurrent ? ' is-current' : ''}`;
	if (isCurrent) btn.setAttribute('aria-current', 'page');
	btn.textContent = String(page);
	btn.addEventListener('click', () => {
		if (isCurrent) return;
		dispatchPageChange(btn, page);
	});
	return btn;
}

function dispatchPageChange(el: HTMLElement, page: number): void {
	el.dispatchEvent(
		new CustomEvent('iot-hub-page:change', {
			detail: { page },
			bubbles: true,
		})
	);
}

export function updatePaginationDynamic(
	nav: HTMLElement,
	{ currentPage, totalPages }: PaginationState
): void {
	nav.dataset.dynamicMode = 'true';

	// Rebuild the "numbers" list (desktop layout).
	const numbersList = nav.querySelector<HTMLUListElement>(
		'.iot-hub-pagination__pages--numbers'
	);
	if (numbersList) {
		numbersList.replaceChildren();
		const prevLi = document.createElement('li');
		prevLi.appendChild(
			makeChevron(
				'left',
				currentPage > 1,
				currentPage - 1,
				IOT_HUB_STRINGS.pagination.prevPageAriaLabel
			)
		);
		numbersList.appendChild(prevLi);
		for (const item of buildPages(currentPage, totalPages)) {
			const li = document.createElement('li');
			if (item === 'ellipsis') {
				li.className = 'iot-hub-pagination__ellipsis';
				li.setAttribute('aria-hidden', 'true');
				li.textContent = '…';
			} else {
				li.appendChild(makePageButton(item, item === currentPage));
			}
			numbersList.appendChild(li);
		}
		const nextLi = document.createElement('li');
		nextLi.appendChild(
			makeChevron(
				'right',
				currentPage < totalPages,
				currentPage + 1,
				IOT_HUB_STRINGS.pagination.nextPageAriaLabel
			)
		);
		numbersList.appendChild(nextLi);
	}

	// Rebuild the compact summary row (mobile layout).
	const compact = nav.querySelector<HTMLElement>(
		'.iot-hub-pagination__pages--compact'
	);
	if (compact) {
		compact.replaceChildren();
		compact.appendChild(
			makeChevron(
				'left',
				currentPage > 1,
				currentPage - 1,
				IOT_HUB_STRINGS.pagination.prevPageAriaLabel
			)
		);
		const summary = document.createElement('span');
		summary.className = 'iot-hub-pagination__summary';
		summary.textContent = formatPageSummary(currentPage, totalPages);
		compact.appendChild(summary);
		compact.appendChild(
			makeChevron(
				'right',
				currentPage < totalPages,
				currentPage + 1,
				IOT_HUB_STRINGS.pagination.nextPageAriaLabel
			)
		);
	}
}

// Set the host-visible "totalResults" line (the host calls
// `updatePaginationDynamic` separately to rebuild the page list).
export function updateResultsCount(countEl: HTMLElement, totalResults: number): void {
	const word =
		totalResults === 1
			? IOT_HUB_STRINGS.searchPage.resultSingular
			: IOT_HUB_STRINGS.searchPage.resultPlural;
	countEl.textContent = `${totalResults} ${word}`;
}

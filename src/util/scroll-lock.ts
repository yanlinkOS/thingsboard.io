import './scroll-lock.css';

// Shared document scroll-lock for modal layers (dialogs, drawers, lightboxes).
// Hides the page scrollbar while a layer is open and compensates the freed
// scrollbar width on the document, the fixed site header, and the chat widget
// so none of them jump wider.
//
// Idempotent + single-flag: repeated lock/unlock calls are no-ops. One overlay
// is expected open at a time; if two ever overlap, the first close unlocks
// (same limitation the inlined copies had).

const HTML_LOCK_CLASS = 'tb-scroll-locked';
const HEADER_SELECTOR = 'header.header';
const CHAT_SELECTOR = '.ygpt-chatbot';
const CHAT_POSITION_VAR = '--yourgptChatbotPositionX';

let locked = false;
let htmlOriginalPadding = '';
let headerOriginalPadding = '';
let chatOriginalX = '';
let headerCompensated = false;
let chatCompensated = false;

// Toggle the transition off around a padding change so the compensation
// applies instantly instead of animating.
function setHeaderPadding(header: HTMLElement, value: string): void {
	header.style.transition = 'none';
	header.style.paddingRight = value;
	requestAnimationFrame(() =>
		requestAnimationFrame(() => {
			header.style.transition = '';
		})
	);
}

export function lockScroll(): void {
	if (locked) return;
	locked = true;

	const html = document.documentElement;
	const sw = window.innerWidth - html.clientWidth;
	htmlOriginalPadding = html.style.paddingRight;

	if (sw > 0) {
		html.style.paddingRight = `${sw}px`;

		// Full-width fixed header: pad from the inside so it stays aligned.
		const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);
		if (header) {
			const cur = parseFloat(getComputedStyle(header).paddingRight) || 0;
			headerOriginalPadding = header.style.paddingRight;
			setHeaderPadding(header, `${cur + sw}px`);
			headerCompensated = true;
		}

		// Chat widget pins itself with a CSS-variable offset — shift it too.
		const chat = document.querySelector<HTMLElement>(CHAT_SELECTOR);
		if (chat) {
			chatOriginalX = chat.style.getPropertyValue(CHAT_POSITION_VAR);
			const cur =
				parseFloat(getComputedStyle(chat).getPropertyValue(CHAT_POSITION_VAR)) || 0;
			chat.style.setProperty(CHAT_POSITION_VAR, `${cur + sw}px`);
			chatCompensated = true;
		}
	}

	html.classList.add(HTML_LOCK_CLASS);
}

export function unlockScroll(): void {
	if (!locked) return;
	locked = false;

	const html = document.documentElement;
	html.classList.remove(HTML_LOCK_CLASS);
	html.style.paddingRight = htmlOriginalPadding;

	if (headerCompensated) {
		const header = document.querySelector<HTMLElement>(HEADER_SELECTOR);
		if (header) setHeaderPadding(header, headerOriginalPadding);
		headerCompensated = false;
	}

	if (chatCompensated) {
		const chat = document.querySelector<HTMLElement>(CHAT_SELECTOR);
		if (chat) {
			if (chatOriginalX) chat.style.setProperty(CHAT_POSITION_VAR, chatOriginalX);
			else chat.style.removeProperty(CHAT_POSITION_VAR);
		}
		chatCompensated = false;
	}
}

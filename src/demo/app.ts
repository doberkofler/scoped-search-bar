import {ScopedSearchBar, type ScopedSearchBarInstance, type SearchScope} from '../lib/index.ts';
import '../styles/scoped-search-bar.css';
import './demo-shell.css';

const SCOPES: readonly SearchScope[] = [
	{id: 'west-coast', label: 'West Coast'},
	{id: 'midwest', label: 'Midwest'},
	{id: 'northeast', label: 'Northeast'},
	{id: 'south', label: 'South'},
	{id: 'international', label: 'International'},
	{id: 'europe', label: 'Europe'},
];

function appendEventLog(message: string): void {
	const log = document.querySelector<HTMLTextAreaElement>('#event-log');
	if (log === null) {
		return;
	}
	const timestamp = new Date().toISOString().slice(11, 19);
	log.value = `${log.value}${log.value.length > 0 ? '\n' : ''}[${timestamp}] ${message}`;
	log.scrollTop = log.scrollHeight;
}

function mountSearchBar(): ScopedSearchBarInstance {
	const host = document.querySelector<HTMLElement>('#scoped-search-bar');
	if (host === null) {
		throw new Error('Missing #scoped-search-bar host');
	}

	return new ScopedSearchBar(host, {
		scopes: SCOPES,
		initialSearchTerm: 'reac...',
		initialSelectedIds: ['west-coast', 'northeast', 'international', 'europe'],
		placeholder: 'Search for topics, articles, users...',
		onSearch: async (term, selectedScopeIds) => {
			appendEventLog(`onSearch | term=${term || '(empty)'} | scopes=${selectedScopeIds.join(',') || '(all)'}`);
			// oxlint-disable-next-line promise/avoid-new -- demo intentionally simulates async search latency
			await new Promise<void>((resolve) => {
				setTimeout(resolve, 220);
			});
			appendEventLog('search resolved');
		},
	});
}

function init(): void {
	let instance = mountSearchBar();
	let disabled = false;
	let darkTheme = false;
	appendEventLog('demo initialized');

	document.querySelector<HTMLButtonElement>('#reset-btn')?.addEventListener('click', () => {
		instance.destroy();
		instance = mountSearchBar();
		disabled = false;
		const disableButton = document.querySelector<HTMLButtonElement>('#disable-btn');
		if (disableButton !== null) {
			disableButton.textContent = 'Disable';
			disableButton.setAttribute('aria-pressed', 'false');
		}
		appendEventLog('reset');
	});

	const disableButton = document.querySelector<HTMLButtonElement>('#disable-btn');
	disableButton?.addEventListener('click', () => {
		disabled = !disabled;
		instance.setDisabled(disabled);
		disableButton.textContent = disabled ? 'Enable' : 'Disable';
		disableButton.setAttribute('aria-pressed', disabled ? 'true' : 'false');
		appendEventLog(`disabled=${String(disabled)}`);
	});

	const themeButton = document.querySelector<HTMLButtonElement>('#theme-btn');
	themeButton?.addEventListener('click', () => {
		darkTheme = !darkTheme;
		document.documentElement.dataset['theme'] = darkTheme ? 'dark' : 'light';
		themeButton.textContent = darkTheme ? 'Light Theme' : 'Dark Theme';
		themeButton.setAttribute('aria-pressed', darkTheme ? 'true' : 'false');
		appendEventLog(`theme=${darkTheme ? 'dark' : 'light'}`);
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}

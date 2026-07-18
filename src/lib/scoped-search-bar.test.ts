import {afterEach, describe, expect, it, vi} from 'vitest';

import {createScopedSearchBar, ScopedSearchBar, type SearchScope} from './scoped-search-bar.ts';

const SCOPES: readonly SearchScope[] = [
	{id: 'west-coast', label: 'West Coast'},
	{id: 'midwest', label: 'Midwest'},
	{id: 'northeast', label: 'Northeast'},
	{id: 'south', label: 'South'},
	{id: 'international', label: 'International'},
	{id: 'europe', label: 'Europe'},
];

let container: HTMLDivElement | null = null;

function mount(options: Partial<ConstructorParameters<typeof ScopedSearchBar>[1]> = {}): ScopedSearchBar {
	container = document.createElement('div');
	document.body.append(container);
	return new ScopedSearchBar(container, {
		scopes: SCOPES,
		onSearch: vi.fn<ConstructorParameters<typeof ScopedSearchBar>[1]['onSearch']>(),
		...options,
	});
}

describe('ScopedSearchBar', () => {
	afterEach(() => {
		container?.remove();
		container = null;
	});

	it('renders initial term, selected scope label, and menu items', () => {
		mount({initialSearchTerm: 'react', initialSelectedIds: ['west-coast', 'northeast', 'international', 'europe']});

		expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.value).toBe('react');
		expect(document.querySelector('.scoped-search-bar__scope-chip')?.textContent).toBe('4 Areas');
		expect(document.querySelectorAll('.scoped-search-bar__menu-item')).toHaveLength(SCOPES.length);
	});

	it('renders singular labels and custom option text', () => {
		mount({
			id: 'global-search',
			className: 'demo-search',
			initialSelectedIds: ['europe'],
			placeholder: 'Find records',
			inputLabel: 'Global search',
			searchButtonLabel: 'Go',
			searchingButtonLabel: 'Running...',
			scopeSelectorLabel: 'Pick filters',
			clearScopesLabel: 'Remove filters',
			menuMaxHeight: 120,
		});

		expect(document.querySelector('.scoped-search-bar')?.classList.contains('demo-search')).toBe(true);
		expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.placeholder).toBe('Find records');
		expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.getAttribute('aria-label')).toBe('Global search');
		expect(document.querySelector<HTMLButtonElement>('.scoped-search-bar__scope-chip')?.textContent).toBe('1 Area');
		expect(document.querySelector<HTMLButtonElement>('.scoped-search-bar__scope-chip')?.getAttribute('aria-label')).toBe('Pick filters');
		expect(document.querySelector<HTMLButtonElement>('.scoped-search-bar__scope-chip')?.getAttribute('aria-controls')).toBe('global-search-menu');
		expect(document.querySelector<HTMLButtonElement>('.scoped-search-bar__clear-scopes')?.getAttribute('aria-label')).toBe('Remove filters');
		expect(document.querySelector<HTMLButtonElement>('.scoped-search-bar__submit')?.textContent).toBe('Go');
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.style.maxHeight).toBe('120px');
	});

	it('uses a custom scope label formatter', () => {
		mount({
			initialSelectedIds: ['west-coast', 'europe'],
			scopeLabel: ({count, total}) => `${count}/${total} markets`,
		});

		expect(document.querySelector('.scoped-search-bar__scope-chip')?.textContent).toBe('2/6 markets');
	});

	it('normalizes unknown and duplicate selected ids', () => {
		const instance = mount({initialSelectedIds: ['missing', 'europe', 'europe', 'midwest']});

		expect(instance.getSelectedIds()).toStrictEqual(['europe', 'midwest']);

		instance.setSelectedIds(['south', 'missing', 'south']);

		expect(instance.getSelectedIds()).toStrictEqual(['south']);
	});

	it('rejects duplicate scope ids', () => {
		const host = document.createElement('div');
		container = host;
		document.body.append(host);

		expect(
			() =>
				new ScopedSearchBar(host, {
					scopes: [
						{id: 'dup', label: 'One'},
						{id: 'dup', label: 'Two'},
					],
					onSearch: vi.fn<ConstructorParameters<typeof ScopedSearchBar>[1]['onSearch']>(),
				}),
		).toThrow('Duplicate search scope id: dup');
	});

	it('opens the menu and toggles selected scopes', () => {
		const instance = mount({initialSelectedIds: ['west-coast']});
		document.querySelector<HTMLButtonElement>('.scoped-search-bar__scope-chip')?.click();

		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(false);
		document.querySelector<HTMLButtonElement>('[data-scope-id="northeast"]')?.click();

		expect(instance.getSelectedIds()).toStrictEqual(['west-coast', 'northeast']);
		expect(document.querySelector('.scoped-search-bar__scope-chip')?.textContent).toBe('2 Areas');
		expect(document.querySelector('[data-scope-id="northeast"]')?.getAttribute('aria-checked')).toBe('true');

		document.querySelector<HTMLButtonElement>('[data-scope-id="west-coast"]')?.click();
		expect(instance.getSelectedIds()).toStrictEqual(['northeast']);
	});

	it('closes the menu on outside click and input Escape', () => {
		const instance = mount();
		instance.openMenu();
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(false);

		document.body.dispatchEvent(new MouseEvent('click', {bubbles: true}));
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(true);

		instance.openMenu();
		document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(true);
	});

	it('supports menu keyboard navigation', () => {
		mount();
		const chip = document.querySelector<HTMLButtonElement>('.scoped-search-bar__scope-chip');
		chip?.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}));

		const items = [...document.querySelectorAll<HTMLButtonElement>('.scoped-search-bar__menu-item')];
		expect(document.activeElement).toBe(items[0]);

		items[0]?.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}));
		expect(document.activeElement).toBe(items.at(-1));

		items.at(-1)?.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}));
		expect(document.activeElement).toBe(items[0]);

		items[0]?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
		expect(document.activeElement).toBe(chip);
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(true);
	});

	it('clears selected scopes with the delete action', () => {
		const instance = mount({initialSelectedIds: ['west-coast', 'europe']});

		document.querySelector<HTMLButtonElement>('.scoped-search-bar__clear-scopes')?.click();

		expect(instance.getSelectedIds()).toStrictEqual([]);
		expect(document.querySelector('.scoped-search-bar__scope-chip')?.textContent).toBe('All Areas');
	});

	it('updates state through public setters', () => {
		const instance = mount({initialSelectedIds: ['west-coast']});

		instance.setSearchTerm('docs');
		instance.setScopes([
			{id: 'docs', label: 'Docs'},
			{id: 'users', label: 'Users'},
		]);
		instance.setSelectedIds(['users']);

		expect(instance.getSearchTerm()).toBe('docs');
		expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.value).toBe('docs');
		expect(instance.getSelectedIds()).toStrictEqual(['users']);
		expect(document.querySelectorAll('.scoped-search-bar__menu-item')).toHaveLength(2);
	});

	it('submits the current term and selected ids from the button', async () => {
		const onSearch = vi.fn<ConstructorParameters<typeof ScopedSearchBar>[1]['onSearch']>();
		mount({initialSearchTerm: 'react', initialSelectedIds: ['europe'], onSearch});

		document.querySelector<HTMLButtonElement>('.scoped-search-bar__submit')?.click();
		await vi.waitFor(() => {
			expect(onSearch).toHaveBeenCalledWith('react', ['europe']);
		});
	});

	it('submits with Enter from the input', async () => {
		const onSearch = vi.fn<ConstructorParameters<typeof ScopedSearchBar>[1]['onSearch']>();
		mount({onSearch});
		const input = document.querySelector<HTMLInputElement>('.scoped-search-bar__input');
		if (input === null) {
			throw new Error('Missing input');
		}

		input.value = 'billing';
		input.dispatchEvent(new Event('input', {bubbles: true}));
		input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));

		await vi.waitFor(() => {
			expect(onSearch).toHaveBeenCalledWith('billing', []);
		});
	});

	it('disables controls while async search is pending', async () => {
		let resolveSearch!: () => void;
		// oxlint-disable-next-line promise/avoid-new -- controlled pending promise for deterministic pending-state assertions
		const pendingSearch = new Promise<void>((resolve) => {
			resolveSearch = resolve;
		});
		const onSearch = vi.fn<ConstructorParameters<typeof ScopedSearchBar>[1]['onSearch']>(async () => {
			await pendingSearch;
		});
		mount({onSearch});

		document.querySelector<HTMLButtonElement>('.scoped-search-bar__submit')?.click();

		await vi.waitFor(() => {
			expect(document.querySelector('.scoped-search-bar')?.classList.contains('scoped-search-bar--searching')).toBe(true);
		});
		expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.disabled).toBe(true);

		resolveSearch();
		await vi.waitFor(() => {
			expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.disabled).toBe(false);
		});
	});

	it('guards actions while disabled', async () => {
		const onSearch = vi.fn<ConstructorParameters<typeof ScopedSearchBar>[1]['onSearch']>();
		const instance = mount({initialSelectedIds: ['europe'], onSearch});

		instance.setDisabled(true);
		instance.openMenu();
		instance.clearScopes();
		await instance.search();

		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(true);
		expect(instance.getSelectedIds()).toStrictEqual(['europe']);
		expect(onSearch).not.toHaveBeenCalled();
	});

	it('recovers disabled state when search rejects', async () => {
		const onSearch = vi.fn<ConstructorParameters<typeof ScopedSearchBar>[1]['onSearch']>(async () => {
			await Promise.resolve();
			throw new Error('Network failed');
		});
		const instance = mount({onSearch});

		await expect(instance.search()).rejects.toThrow('Network failed');

		expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.disabled).toBe(false);
	});

	it('creates instances through the factory helper', () => {
		container = document.createElement('div');
		document.body.append(container);

		const instance = createScopedSearchBar(container, {
			scopes: SCOPES,
			onSearch: vi.fn<ConstructorParameters<typeof ScopedSearchBar>[1]['onSearch']>(),
		});

		expect(instance.element.classList.contains('scoped-search-bar')).toBe(true);
	});

	it('throws after destroy to surface lifecycle misuse', () => {
		const instance = mount();
		instance.destroy();
		instance.destroy();

		expect(() => instance.getSearchTerm()).toThrow('ScopedSearchBar instance has been destroyed');
	});
});

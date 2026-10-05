import {afterEach, describe, expect, it, vi} from 'vitest';

import {createScopedSearchBar, ScopedSearchBar, type SearchScope} from './widget.ts';

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
			selectAllLabel: 'Everything',
			unselectAllLabel: 'Nothing',
			menuMaxHeight: 120,
		});

		expect(document.querySelector('.scoped-search-bar')?.classList.contains('demo-search')).toBe(true);
		expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.placeholder).toBe('Find records');
		expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.getAttribute('aria-label')).toBe('Global search');
		expect(document.querySelector<HTMLButtonElement>('.scoped-search-bar__scope-chip')?.textContent).toBe('1 Area');
		expect(document.querySelector<HTMLButtonElement>('.scoped-search-bar__scope-chip')?.getAttribute('aria-label')).toBe('Pick filters');
		expect(document.querySelector<HTMLButtonElement>('.scoped-search-bar__scope-chip')?.getAttribute('aria-controls')).toBe('global-search-menu');
		expect(document.querySelector('.scoped-search-bar__clear-scopes')).toBeNull();
		expect(document.querySelector<HTMLButtonElement>('.scoped-search-bar__submit')?.textContent).toBe('Go');
		expect(document.querySelector<HTMLButtonElement>('[data-action="select-all"]')?.textContent).toBe('Everything');
		expect(document.querySelector<HTMLButtonElement>('[data-action="unselect-all"]')?.textContent).toBe('Nothing');
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

	it('renders initialSelectedIds as checked checkboxes', () => {
		mount({initialSelectedIds: ['europe']});

		const europe = document.querySelector<HTMLButtonElement>('[data-scope-id="europe"]');
		const midwest = document.querySelector<HTMLButtonElement>('[data-scope-id="midwest"]');

		expect(europe?.getAttribute('aria-checked')).toBe('true');
		expect(europe?.querySelector('.scoped-search-bar__check-icon')).not.toBeNull();
		expect(midwest?.getAttribute('aria-checked')).toBe('false');
		expect(midwest?.querySelector('.scoped-search-bar__check-icon')).toBeNull();
		expect(document.querySelector('.scoped-search-bar__scope-chip')?.textContent).toBe('1 Area');
	});

	it('updates rendered checkbox state through setSelectedIds and setScopes', () => {
		const instance = mount({initialSelectedIds: ['west-coast']});

		instance.setSelectedIds(['europe']);

		const westCoast = document.querySelector<HTMLButtonElement>('[data-scope-id="west-coast"]');
		const europe = document.querySelector<HTMLButtonElement>('[data-scope-id="europe"]');
		expect(westCoast?.getAttribute('aria-checked')).toBe('false');
		expect(westCoast?.querySelector('.scoped-search-bar__check-icon')).toBeNull();
		expect(europe?.getAttribute('aria-checked')).toBe('true');
		expect(europe?.querySelector('.scoped-search-bar__check-icon')).not.toBeNull();
		expect(document.querySelector('.scoped-search-bar__scope-chip')?.textContent).toBe('1 Area');

		instance.setSelectedIds([]);
		expect(document.querySelectorAll('[aria-checked="true"]')).toHaveLength(0);
		expect(document.querySelector('.scoped-search-bar__scope-chip')?.textContent).toBe('All Areas');

		instance.setSelectedIds(['europe']);
		instance.setScopes([{id: 'users', label: 'Users'}]);

		expect(instance.getSelectedIds()).toStrictEqual([]);
		expect(document.querySelector('.scoped-search-bar__check-icon')).toBeNull();
		expect(document.querySelectorAll('.scoped-search-bar__menu-item')).toHaveLength(1);
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
		const northeast = document.querySelector<HTMLButtonElement>('[data-scope-id="northeast"]');
		northeast?.focus();
		northeast?.click();

		expect(instance.getSelectedIds()).toStrictEqual(['west-coast', 'northeast']);
		expect(document.querySelector('.scoped-search-bar__scope-chip')?.textContent).toBe('2 Areas');
		expect(document.querySelector('[data-scope-id="northeast"]')?.getAttribute('aria-checked')).toBe('true');
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(false);
		expect(document.activeElement).toBe(northeast);

		document.querySelector<HTMLButtonElement>('[data-scope-id="west-coast"]')?.click();
		expect(instance.getSelectedIds()).toStrictEqual(['northeast']);
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(false);
	});

	it('closes the menu without reverting selection changes', () => {
		const instance = mount({initialSelectedIds: ['west-coast']});
		instance.openMenu();
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(false);
		document.querySelector<HTMLButtonElement>('[data-scope-id="northeast"]')?.click();

		document.body.dispatchEvent(new MouseEvent('click', {bubbles: true}));
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(true);
		expect(instance.getSelectedIds()).toStrictEqual(['west-coast', 'northeast']);

		instance.openMenu();
		document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(true);

		const chip = document.querySelector<HTMLButtonElement>('.scoped-search-bar__scope-chip');
		chip?.click();
		chip?.click();
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(true);
		expect(instance.getSelectedIds()).toStrictEqual(['west-coast', 'northeast']);
	});

	it('supports menu keyboard navigation', () => {
		mount();
		const chip = document.querySelector<HTMLButtonElement>('.scoped-search-bar__scope-chip');
		chip?.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}));

		const commands = [...document.querySelectorAll<HTMLButtonElement>('.scoped-search-bar__menu-command')];
		expect(document.activeElement).toBe(commands[0]);

		commands[0]?.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowUp', bubbles: true}));
		expect(document.activeElement).toBe(commands.at(-1));

		commands.at(-1)?.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown', bubbles: true}));
		expect(document.activeElement).toBe(commands[0]);

		commands[0]?.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
		expect(document.activeElement).toBe(chip);
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(true);
	});

	it('selects and unselects all scopes without closing the menu', () => {
		const instance = mount({initialSelectedIds: ['west-coast', 'europe']});
		instance.openMenu();

		document.querySelector<HTMLButtonElement>('[data-action="select-all"]')?.click();

		expect(instance.getSelectedIds()).toStrictEqual(SCOPES.map((scope) => scope.id));
		expect(document.querySelectorAll('[aria-checked="true"]')).toHaveLength(SCOPES.length);
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(false);

		document.querySelector<HTMLButtonElement>('[data-action="unselect-all"]')?.click();

		expect(instance.getSelectedIds()).toStrictEqual([]);
		expect(document.querySelectorAll('[aria-checked="true"]')).toHaveLength(0);
		expect(document.querySelector('.scoped-search-bar__scope-chip')?.textContent).toBe('All Areas');
		expect(document.querySelector<HTMLDivElement>('.scoped-search-bar__menu')?.hidden).toBe(false);
	});

	it('clears selected scopes through the public API', () => {
		const instance = mount({initialSelectedIds: ['west-coast', 'europe']});

		instance.clearScopes();

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

	it('defaults data-theme to "system" on the root element', () => {
		mount();

		expect(document.querySelector<HTMLElement>('.scoped-search-bar')?.dataset['theme']).toBe('system');
	});

	it('sets data-theme="dark" on the root element when theme is "dark"', () => {
		mount({theme: 'dark'});

		expect(document.querySelector<HTMLElement>('.scoped-search-bar')?.dataset['theme']).toBe('dark');
	});

	it('sets data-theme="light" on the root element when theme is "light"', () => {
		mount({theme: 'light'});

		expect(document.querySelector<HTMLElement>('.scoped-search-bar')?.dataset['theme']).toBe('light');
	});

	it('setTheme() updates the data-theme attribute', () => {
		const instance = mount({theme: 'light'});

		instance.setTheme('dark');
		expect(document.querySelector<HTMLElement>('.scoped-search-bar')?.dataset['theme']).toBe('dark');

		instance.setTheme('system');
		expect(document.querySelector<HTMLElement>('.scoped-search-bar')?.dataset['theme']).toBe('system');
	});
});

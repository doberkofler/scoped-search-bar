export type MaybePromise<T> = T | Promise<T>;

/** A selectable search scope shown in the dropdown menu. */
export type SearchScope = {
	readonly id: string;
	readonly label: string;
};

export type ScopeLabelFormatterContext = {
	readonly count: number;
	readonly total: number;
	readonly selectedIds: readonly string[];
};

export type ScopeLabelFormatter = (context: ScopeLabelFormatterContext) => string;
export type OnSearch = (term: string, selectedScopeIds: readonly string[]) => MaybePromise<void>;

export type ScopedSearchBarOptions = {
	/** Scopes available in the selector menu. IDs must be unique. */
	readonly scopes: readonly SearchScope[];
	/** Scope IDs selected on initial render. Unknown IDs are ignored. */
	readonly initialSelectedIds?: readonly string[];
	/** Initial search input value. */
	readonly initialSearchTerm?: string;
	/** Called when the user clicks Search or presses Enter in the input. */
	readonly onSearch: OnSearch;
	/** Placeholder shown in the search input. */
	readonly placeholder?: string;
	/** Accessible label for the search input. */
	readonly inputLabel?: string;
	/** Text shown in the submit button while idle. */
	readonly searchButtonLabel?: string;
	/** Text shown in the submit button while onSearch is pending. */
	readonly searchingButtonLabel?: string;
	/** Accessible label for the scope selector chip. */
	readonly scopeSelectorLabel?: string;
	/** Accessible label for the scope clear action. */
	readonly clearScopesLabel?: string;
	/** Formats the selector chip label. */
	readonly scopeLabel?: ScopeLabelFormatter;
	/** Disables all interactive controls. */
	readonly disabled?: boolean;
	/** Adds an extra class to the root element. */
	readonly className?: string;
	/** Optional id prefix used for input/menu ARIA relationships. */
	readonly id?: string;
	/** Maximum menu height in pixels before vertical scrolling. */
	readonly menuMaxHeight?: number;
};

export type ScopedSearchBarInstance = {
	readonly element: HTMLElement;
	destroy: () => void;
	search: () => Promise<void>;
	clearScopes: () => void;
	closeMenu: () => void;
	openMenu: () => void;
	setDisabled: (disabled: boolean) => void;
	setScopes: (scopes: readonly SearchScope[]) => void;
	setSearchTerm: (term: string) => void;
	setSelectedIds: (ids: readonly string[]) => void;
	getSearchTerm: () => string;
	getSelectedIds: () => readonly string[];
};

export type RequiredVisualOptions = Required<
	Pick<
		ScopedSearchBarOptions,
		'placeholder' | 'inputLabel' | 'searchButtonLabel' | 'searchingButtonLabel' | 'scopeSelectorLabel' | 'clearScopesLabel' | 'menuMaxHeight'
	>
>;

export const DEFAULT_SCOPED_SEARCH_BAR_OPTIONS: RequiredVisualOptions = {
	placeholder: 'Search for topics, articles, users...',
	inputLabel: 'Search',
	searchButtonLabel: 'Search',
	searchingButtonLabel: 'Searching...',
	scopeSelectorLabel: 'Choose search scopes',
	clearScopesLabel: 'Clear selected scopes',
	menuMaxHeight: 320,
};

let instanceCounter = 0;

function defaultScopeLabel({count}: ScopeLabelFormatterContext): string {
	if (count === 0) {
		return 'All Areas';
	}
	return `${count} ${count === 1 ? 'Area' : 'Areas'}`;
}

function createSvgIcon(pathData: string, className: string): SVGSVGElement {
	const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	icon.setAttribute('class', className);
	icon.setAttribute('viewBox', '0 0 24 24');
	icon.setAttribute('aria-hidden', 'true');
	icon.setAttribute('focusable', 'false');

	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d', pathData);
	icon.append(path);
	return icon;
}

function uniqueScopes(scopes: readonly SearchScope[]): SearchScope[] {
	const seen = new Set<string>();
	const result: SearchScope[] = [];
	for (const scope of scopes) {
		if (seen.has(scope.id)) {
			throw new Error(`Duplicate search scope id: ${scope.id}`);
		}
		seen.add(scope.id);
		result.push(scope);
	}
	return result;
}

function normalizeIds(ids: readonly string[], scopes: readonly SearchScope[]): string[] {
	const validIds = new Set(scopes.map((scope) => scope.id));
	const normalized: string[] = [];
	for (const id of ids) {
		if (validIds.has(id) && !normalized.includes(id)) {
			normalized.push(id);
		}
	}
	return normalized;
}

/** Native, dependency-free scoped search input with multi-select filtering. */
export class ScopedSearchBar implements ScopedSearchBarInstance {
	public readonly element: HTMLElement;

	readonly #anchorButton: HTMLButtonElement;
	readonly #clearButton: HTMLButtonElement;
	readonly #input: HTMLInputElement;
	readonly #menu: HTMLDivElement;
	readonly #options: ScopedSearchBarOptions;
	readonly #searchButton: HTMLButtonElement;
	#scopes: SearchScope[];
	#selectedIds: string[];
	#term: string;
	#isDisabled: boolean;
	#isDestroyed = false;
	#isMenuOpen = false;
	#isSearching = false;
	readonly #documentClickController = new AbortController();

	public constructor(container: HTMLElement, options: ScopedSearchBarOptions) {
		this.#options = options;
		this.#scopes = uniqueScopes(options.scopes);
		this.#selectedIds = normalizeIds(options.initialSelectedIds ?? [], this.#scopes);
		this.#term = options.initialSearchTerm ?? '';
		this.#isDisabled = options.disabled ?? false;

		const idPrefix = options.id ?? `scoped-search-bar-${++instanceCounter}`;
		this.element = document.createElement('div');
		this.element.className = ['scoped-search-bar', options.className].filter(Boolean).join(' ');
		this.element.dataset['component'] = 'ScopedSearchBar';

		const control = document.createElement('div');
		control.className = 'scoped-search-bar__control';

		const searchIcon = createSvgIcon(
			'M9.5 3a6.5 6.5 0 0 1 5.17 10.44l4.45 4.44-1.42 1.42-4.44-4.45A6.5 6.5 0 1 1 9.5 3Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z',
			'scoped-search-bar__search-icon',
		);

		this.#input = document.createElement('input');
		this.#input.id = `${idPrefix}-input`;
		this.#input.className = 'scoped-search-bar__input';
		this.#input.type = 'search';
		this.#input.autocomplete = 'off';
		this.#input.placeholder = options.placeholder ?? DEFAULT_SCOPED_SEARCH_BAR_OPTIONS.placeholder;
		this.#input.setAttribute('aria-label', options.inputLabel ?? DEFAULT_SCOPED_SEARCH_BAR_OPTIONS.inputLabel);
		this.#input.value = this.#term;

		const actions = document.createElement('div');
		actions.className = 'scoped-search-bar__actions';

		this.#anchorButton = document.createElement('button');
		this.#anchorButton.className = 'scoped-search-bar__scope-chip';
		this.#anchorButton.type = 'button';
		this.#anchorButton.setAttribute('aria-haspopup', 'menu');
		this.#anchorButton.setAttribute('aria-controls', `${idPrefix}-menu`);
		this.#anchorButton.setAttribute('aria-expanded', 'false');
		this.#anchorButton.setAttribute('aria-label', options.scopeSelectorLabel ?? DEFAULT_SCOPED_SEARCH_BAR_OPTIONS.scopeSelectorLabel);

		this.#clearButton = document.createElement('button');
		this.#clearButton.className = 'scoped-search-bar__clear-scopes';
		this.#clearButton.type = 'button';
		this.#clearButton.setAttribute('aria-label', options.clearScopesLabel ?? DEFAULT_SCOPED_SEARCH_BAR_OPTIONS.clearScopesLabel);
		this.#clearButton.append(
			createSvgIcon('M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z', 'scoped-search-bar__clear-icon'),
		);

		this.#searchButton = document.createElement('button');
		this.#searchButton.className = 'scoped-search-bar__submit';
		this.#searchButton.type = 'button';
		this.#searchButton.append(
			createSvgIcon(
				'M9.5 3a6.5 6.5 0 0 1 5.17 10.44l4.45 4.44-1.42 1.42-4.44-4.45A6.5 6.5 0 1 1 9.5 3Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z',
				'scoped-search-bar__submit-icon',
			),
			document.createTextNode(options.searchButtonLabel ?? DEFAULT_SCOPED_SEARCH_BAR_OPTIONS.searchButtonLabel),
		);

		actions.append(this.#anchorButton, this.#clearButton, this.#searchButton);
		control.append(searchIcon, this.#input, actions);

		this.#menu = document.createElement('div');
		this.#menu.id = `${idPrefix}-menu`;
		this.#menu.className = 'scoped-search-bar__menu';
		this.#menu.role = 'menu';
		this.#menu.hidden = true;
		this.#menu.style.maxHeight = `${options.menuMaxHeight ?? DEFAULT_SCOPED_SEARCH_BAR_OPTIONS.menuMaxHeight}px`;

		this.element.append(control, this.#menu);
		container.replaceChildren(this.element);

		this.#bindEvents();
		this.#render();
	}

	public openMenu(): void {
		this.#assertActive();
		if (this.#isDisabled || this.#isSearching) {
			return;
		}
		this.#isMenuOpen = true;
		this.#renderMenuState();
	}

	public closeMenu(): void {
		this.#assertActive();
		this.#isMenuOpen = false;
		this.#renderMenuState();
	}

	public clearScopes(): void {
		this.#assertActive();
		if (this.#isDisabled || this.#isSearching) {
			return;
		}
		this.#selectedIds = [];
		this.#render();
	}

	public async search(): Promise<void> {
		this.#assertActive();
		if (this.#isDisabled || this.#isSearching) {
			return;
		}
		this.#isSearching = true;
		this.#renderDisabledState();
		try {
			await this.#options.onSearch(this.#term, [...this.#selectedIds]);
		} finally {
			this.#isSearching = false;
			this.#renderDisabledState();
		}
	}

	public setDisabled(disabled: boolean): void {
		this.#assertActive();
		this.#isDisabled = disabled;
		if (disabled) {
			this.#isMenuOpen = false;
		}
		this.#render();
	}

	public setScopes(scopes: readonly SearchScope[]): void {
		this.#assertActive();
		this.#scopes = uniqueScopes(scopes);
		this.#selectedIds = normalizeIds(this.#selectedIds, this.#scopes);
		this.#render();
	}

	public setSearchTerm(term: string): void {
		this.#assertActive();
		this.#term = term;
		this.#input.value = term;
	}

	public setSelectedIds(ids: readonly string[]): void {
		this.#assertActive();
		this.#selectedIds = normalizeIds(ids, this.#scopes);
		this.#render();
	}

	public getSearchTerm(): string {
		this.#assertActive();
		return this.#term;
	}

	public getSelectedIds(): readonly string[] {
		this.#assertActive();
		return [...this.#selectedIds];
	}

	public destroy(): void {
		if (this.#isDestroyed) {
			return;
		}
		this.#documentClickController.abort();
		this.element.remove();
		this.#isDestroyed = true;
	}

	#bindEvents(): void {
		this.#input.addEventListener('input', () => {
			this.#term = this.#input.value;
		});
		this.#input.addEventListener('keydown', (event) => {
			if (event.key === 'Enter') {
				event.preventDefault();
				void this.search();
			}
			if (event.key === 'Escape' && this.#isMenuOpen) {
				this.closeMenu();
			}
		});

		this.#anchorButton.addEventListener('click', () => {
			if (this.#isMenuOpen) {
				this.closeMenu();
				return;
			}
			this.openMenu();
		});
		this.#anchorButton.addEventListener('keydown', (event) => {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				this.openMenu();
				this.#focusMenuItem(0);
			}
		});

		this.#clearButton.addEventListener('click', (event) => {
			event.stopPropagation();
			this.clearScopes();
		});
		this.#searchButton.addEventListener('click', () => {
			void this.search();
		});

		document.addEventListener(
			'click',
			(event) => {
				if (!this.element.contains(event.target as Node)) {
					this.closeMenu();
				}
			},
			{signal: this.#documentClickController.signal},
		);
	}

	#render(): void {
		this.#renderChipLabel();
		this.#renderMenuItems();
		this.#renderDisabledState();
		this.#renderMenuState();
	}

	#renderChipLabel(): void {
		const formatter = this.#options.scopeLabel ?? defaultScopeLabel;
		this.#anchorButton.textContent = formatter({count: this.#selectedIds.length, total: this.#scopes.length, selectedIds: [...this.#selectedIds]});
		this.#clearButton.hidden = this.#selectedIds.length === 0;
	}

	#renderMenuItems(): void {
		this.#menu.replaceChildren();
		for (const [index, scope] of this.#scopes.entries()) {
			const item = document.createElement('button');
			item.className = 'scoped-search-bar__menu-item';
			item.type = 'button';
			item.role = 'menuitemcheckbox';
			item.dataset['scopeId'] = scope.id;
			item.setAttribute('aria-checked', this.#selectedIds.includes(scope.id) ? 'true' : 'false');
			item.tabIndex = -1;

			const checkbox = document.createElement('span');
			checkbox.className = 'scoped-search-bar__checkbox';
			checkbox.setAttribute('aria-hidden', 'true');
			if (this.#selectedIds.includes(scope.id)) {
				checkbox.append(createSvgIcon('M8.6 15.6 4.4 11.4 3 12.8 8.6 18.4 21 6 19.6 4.6 8.6 15.6Z', 'scoped-search-bar__check-icon'));
			}

			const label = document.createElement('span');
			label.className = 'scoped-search-bar__menu-label';
			label.textContent = scope.label;

			item.append(checkbox, label);
			item.addEventListener('click', () => {
				this.#toggleScope(scope.id);
			});
			item.addEventListener('keydown', (event) => {
				this.#handleMenuKeydown(event, index);
			});
			this.#menu.append(item);
		}
	}

	#renderDisabledState(): void {
		const disabled = this.#isDisabled || this.#isSearching;
		this.element.classList.toggle('scoped-search-bar--disabled', disabled);
		this.element.classList.toggle('scoped-search-bar--searching', this.#isSearching);
		this.#input.disabled = disabled;
		this.#anchorButton.disabled = disabled;
		this.#clearButton.disabled = disabled;
		this.#searchButton.disabled = disabled;
		this.#searchButton.replaceChildren(
			createSvgIcon(
				'M9.5 3a6.5 6.5 0 0 1 5.17 10.44l4.45 4.44-1.42 1.42-4.44-4.45A6.5 6.5 0 1 1 9.5 3Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z',
				'scoped-search-bar__submit-icon',
			),
			document.createTextNode(
				this.#isSearching
					? (this.#options.searchingButtonLabel ?? DEFAULT_SCOPED_SEARCH_BAR_OPTIONS.searchingButtonLabel)
					: (this.#options.searchButtonLabel ?? DEFAULT_SCOPED_SEARCH_BAR_OPTIONS.searchButtonLabel),
			),
		);
		if (disabled) {
			this.#isMenuOpen = false;
			this.#renderMenuState();
		}
	}

	#renderMenuState(): void {
		this.#menu.hidden = !this.#isMenuOpen;
		this.element.classList.toggle('scoped-search-bar--menu-open', this.#isMenuOpen);
		this.#anchorButton.setAttribute('aria-expanded', this.#isMenuOpen ? 'true' : 'false');
	}

	#toggleScope(id: string): void {
		this.#selectedIds = this.#selectedIds.includes(id) ? this.#selectedIds.filter((selectedId) => selectedId !== id) : [...this.#selectedIds, id];
		this.#render();
	}

	#handleMenuKeydown(event: KeyboardEvent, index: number): void {
		if (event.key === 'Escape') {
			event.preventDefault();
			this.closeMenu();
			this.#anchorButton.focus();
			return;
		}
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			this.#focusMenuItem(index + 1);
			return;
		}
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			this.#focusMenuItem(index - 1);
		}
	}

	#focusMenuItem(index: number): void {
		const items = [...this.#menu.querySelectorAll<HTMLButtonElement>('.scoped-search-bar__menu-item')];
		if (items.length === 0) {
			return;
		}
		const normalizedIndex = (index + items.length) % items.length;
		items[normalizedIndex]?.focus();
	}

	#assertActive(): void {
		if (this.#isDestroyed) {
			throw new Error('ScopedSearchBar instance has been destroyed');
		}
	}
}

export function createScopedSearchBar(container: HTMLElement, options: ScopedSearchBarOptions): ScopedSearchBarInstance {
	return new ScopedSearchBar(container, options);
}

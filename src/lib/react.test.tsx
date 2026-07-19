import {act, createElement, createRef, type ComponentPropsWithRef} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {ScopedSearchBar, type ScopedSearchBarReactProps} from './react.tsx';
import {type ScopedSearchBarInstance, type SearchScope} from './scoped-search-bar.ts';

type RenderProps = Partial<ComponentPropsWithRef<typeof ScopedSearchBar>>;

const SCOPES: readonly SearchScope[] = [
	{id: 'articles', label: 'Articles'},
	{id: 'users', label: 'Users'},
	{id: 'docs', label: 'Docs'},
];

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function renderComponent(props: RenderProps = {}): void {
	if (container === null) {
		container = document.createElement('div');
		document.body.append(container);
		root = createRoot(container);
	}

	act(() => {
		root?.render(createElement(ScopedSearchBar, {scopes: SCOPES, onSearch: vi.fn<ScopedSearchBarReactProps['onSearch']>(), ...props}));
	});
}

describe('ScopedSearchBar React adapter', () => {
	afterEach(() => {
		act(() => {
			root?.unmount();
		});
		container?.remove();
		container = null;
		root = null;
	});

	it('renders the native component with initial props', () => {
		renderComponent({initialSearchTerm: 'react', initialSelectedIds: ['articles', 'docs']});

		expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.value).toBe('react');
		expect(document.querySelector('.scoped-search-bar__scope-chip')?.textContent).toBe('2 Areas');
	});

	it('submits through the latest onSearch callback', async () => {
		const firstSearch = vi.fn<ScopedSearchBarReactProps['onSearch']>();
		const secondSearch = vi.fn<ScopedSearchBarReactProps['onSearch']>();

		renderComponent({initialSearchTerm: 'react', initialSelectedIds: ['docs'], onSearch: firstSearch});
		renderComponent({initialSearchTerm: 'react', initialSelectedIds: ['docs'], onSearch: secondSearch});

		document.querySelector<HTMLButtonElement>('.scoped-search-bar__submit')?.click();

		await vi.waitFor(() => {
			expect(secondSearch).toHaveBeenCalledWith('react', ['docs']);
		});
		expect(firstSearch).not.toHaveBeenCalled();
	});

	it('syncs setter-backed props after mount', () => {
		renderComponent({searchTerm: 'react', selectedIds: ['articles'], disabled: false});
		renderComponent({searchTerm: 'docs', selectedIds: ['users'], disabled: true});

		expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.value).toBe('docs');
		expect(document.querySelector('.scoped-search-bar__scope-chip')?.textContent).toBe('1 Area');
		expect(document.querySelector<HTMLInputElement>('.scoped-search-bar__input')?.disabled).toBe(true);
	});

	it('exposes and clears the native instance ref on unmount', () => {
		const ref = createRef<ScopedSearchBarInstance | null>();

		renderComponent({ref});

		expect(ref.current?.element.classList.contains('scoped-search-bar')).toBe(true);

		act(() => {
			root?.unmount();
		});

		expect(ref.current).toBeNull();
	});
});

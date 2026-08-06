# ScopedSearchBar Usage Guide

`ScopedSearchBar` is a native TypeScript component for search UIs that need a query string plus a multi-select scope filter.

## Quick Start

```html
<div id="search"></div>
```

```ts
import {ScopedSearchBar} from 'scoped-search-bar';
import 'scoped-search-bar/styles.css';

const instance = new ScopedSearchBar(document.querySelector('#search')!, {
	scopes: [
		{id: 'articles', label: 'Articles'},
		{id: 'users', label: 'Users'},
		{id: 'docs', label: 'Docs'},
	],
	onSearch: async (term, selectedScopeIds) => {
		await fetch('/search', {
			method: 'POST',
			body: JSON.stringify({term, selectedScopeIds}),
		});
	},
});
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `scopes` | `readonly SearchScope[]` | required | Available scope choices. IDs must be unique. |
| `initialSelectedIds` | `readonly string[]` | `[]` | Initially selected scope IDs. Unknown IDs are ignored. |
| `initialSearchTerm` | `string` | `''` | Initial input value. |
| `onSearch` | `(term, ids) => void \| Promise<void>` | required | Submit callback fired by button click, Enter, or `search()`. |
| `placeholder` | `string` | `Search for topics, articles, users...` | Input placeholder. |
| `inputLabel` | `string` | `Search` | Input ARIA label. |
| `searchButtonLabel` | `string` | `Search` | Idle submit button label. |
| `searchingButtonLabel` | `string` | `Searching...` | Pending submit button label. |
| `scopeSelectorLabel` | `string` | `Choose search scopes` | Scope chip ARIA label. |
| `clearScopesLabel` | `string` | `Clear selected scopes` | Clear button ARIA label. |
| `scopeLabel` | `ScopeLabelFormatter` | built-in `All Areas` / `N Areas` | Custom chip label formatter. |
| `disabled` | `boolean` | `false` | Disables all controls. |
| `className` | `string` | `undefined` | Extra class added to the root. |
| `id` | `string` | generated | Prefix for input/menu IDs. |
| `menuMaxHeight` | `number` | `320` | Menu max height in pixels. |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Controls light/dark mode. `'system'` follows the OS preference. |

## React Adapter

The package includes a thin React adapter at `scoped-search-bar/react`. Import styles separately, as with the native component:

```tsx
import {useRef} from 'react';
import {ScopedSearchBar} from 'scoped-search-bar/react';
import type {ScopedSearchBarInstance} from 'scoped-search-bar';
import 'scoped-search-bar/styles.css';

const scopes = [
	{id: 'articles', label: 'Articles'},
	{id: 'users', label: 'Users'},
	{id: 'docs', label: 'Docs'},
];

export function Search() {
	const searchRef = useRef<ScopedSearchBarInstance | null>(null);

	return (
		<ScopedSearchBar
			ref={searchRef}
			scopes={scopes}
			initialSearchTerm="react"
			initialSelectedIds={['articles']}
			onSearch={async (term, selectedScopeIds) => {
				await fetch('/search', {
					method: 'POST',
					body: JSON.stringify({term, selectedScopeIds}),
				});
			}}
		/>
	);
}
```

The adapter creates the native `ScopedSearchBar` when the React component mounts and calls `destroy()` when it unmounts. It exposes the native instance through `ref` for imperative methods such as `search()`, `clearScopes()`, and `setSelectedIds()`.

Most props mirror `ScopedSearchBarOptions` and are captured when the native instance is created. The adapter also supports these setter-backed props after mount:

- `scopes`
- `disabled`
- `searchTerm`
- `selectedIds`

`searchTerm` and `selectedIds` are one-way synchronization props. User edits remain inside the native component unless React sends a new prop value or you read the current state through the instance ref.

## Search Flow

When the user clicks `Search`, presses Enter in the input, or calls `instance.search()`:

1. The component captures the current `term` and a copy of selected IDs.
2. Controls are disabled and the root receives `.scoped-search-bar--searching`.
3. `onSearch(term, selectedIds)` is awaited.
4. Controls are re-enabled even if the callback rejects.

Handle errors in your callback if you want to show user-facing messages.

## Accessibility

- The input uses an `aria-label` from `inputLabel`.
- The scope chip uses `aria-haspopup="menu"`, `aria-controls`, and `aria-expanded`.
- Menu options use `role="menuitemcheckbox"` with `aria-checked`.
- `ArrowDown` opens the menu from the chip.
- `ArrowUp` and `ArrowDown` move focus between menu items.
- `Escape` closes the menu and returns focus to the chip.
- Clicking outside closes the menu.

## Styling

Import the stylesheet once:

```ts
import 'scoped-search-bar/styles.css';
```

Override CSS custom properties from your app:

```css
.my-search-theme {
	--scoped-search-bar-primary: #6336d8;
	--scoped-search-bar-primary-strong: #4f2aa8;
	--scoped-search-bar-primary-soft: #ece7ff;
	--scoped-search-bar-border: #6336d8;
	--scoped-search-bar-radius: 18px;
}
```

### Dark Mode

Set the `theme` option to `'dark'`, `'light'`, or `'system'` (default). The component applies a `data-theme` attribute on its root element. CSS custom property overrides handle the color swap automatically.

```ts
new ScopedSearchBar(host, {
	scopes: [...],
	onSearch: ...,
	theme: 'dark',
});
```

Change the theme at runtime with `instance.setTheme('light')`.

The available CSS custom properties are listed below. Override them to customize the color scheme further:

| Property | Light default | Dark default |
|---|---|---|
| `--scoped-search-bar-bg` | `#fff` | `#1a1b23` |
| `--scoped-search-bar-bg-muted` | `#f6f8fb` | `#212231` |
| `--scoped-search-bar-border` | `#0876d8` | `#2d3044` |
| `--scoped-search-bar-border-muted` | `#d7dee8` | `#252738` |
| `--scoped-search-bar-text` | `#17212f` | `#e2e4e9` |
| `--scoped-search-bar-text-muted` | `#677489` | `#8b8fa3` |
| `--scoped-search-bar-primary` | `#0a4f8f` | `#5b9bd5` |
| `--scoped-search-bar-primary-strong` | `#073b6f` | `#3d7fc8` |
| `--scoped-search-bar-primary-soft` | `#d9ecff` | `#1a2740` |
| `--scoped-search-bar-primary-soft-hover` | `#c5e1ff` | `#253354` |
| `--scoped-search-bar-shadow` | `0 14px 32px rgb(9,30,66,0.16)` | `0 14px 32px rgb(0,0,0,0.4)` |
| `--scoped-search-bar-focus` | `0 0 0 3px rgb(8,118,216,0.22)` | `0 0 0 3px rgb(91,155,213,0.3)` |
| `--scoped-search-bar-icon` | `#7a8492` | `#8b8fa3` |
| `--scoped-search-bar-icon-secondary` | `#4f647a` | `#8b8fa3` |
| `--scoped-search-bar-submit-text` | `#fff` | `#e2e4e9` |
| `--scoped-search-bar-submit-shadow` | `0 8px 18px rgb(10,79,143,0.28)` | `0 8px 18px rgb(0,0,0,0.45)` |
| `--scoped-search-bar-checkbox-border` | `#707987` | `#4a4d66` |
| `--scoped-search-bar-checkbox-bg` | `#fff` | `#1a1b23` |
| `--scoped-search-bar-check-icon` | `#fff` | `#e2e4e9` |

Useful state classes:

- `.scoped-search-bar--menu-open`
- `.scoped-search-bar--searching`
- `.scoped-search-bar--disabled`

## Lifecycle

Call `destroy()` before removing the host if your framework does not own the component DOM lifecycle.

```ts
const instance = new ScopedSearchBar(host, options);

// later
instance.destroy();
```

After destruction, public methods throw so lifecycle misuse is visible during development.

## Demo And Validation

- `pnpm run dev` - start the Vite demo.
- `pnpm run test` - run Vitest browser unit tests.
- `pnpm run integration-test` - run Playwright e2e tests.
- `pnpm run screenshot` - refresh `docs/images/scoped-search-bar-demo.png`.
- `pnpm run ci` - run the full validation pipeline.

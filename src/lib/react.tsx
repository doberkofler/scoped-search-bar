import {forwardRef, useEffect, useRef, type ForwardedRef, type ReactElement} from 'react';

import {ScopedSearchBar as NativeScopedSearchBar, type OnSearch, type ScopedSearchBarInstance, type ScopedSearchBarOptions} from './scoped-search-bar.ts';

export type ScopedSearchBarReactProps = ScopedSearchBarOptions & {
	/** Search term synced into the native input after mount. User edits remain internal unless this prop changes. */
	readonly searchTerm?: string;
	/** Selected scope IDs synced into the native selector after mount. User edits remain internal unless this prop changes. */
	readonly selectedIds?: readonly string[];
};

function setForwardedRef(ref: ForwardedRef<ScopedSearchBarInstance>, value: ScopedSearchBarInstance | null): void {
	if (typeof ref === 'function') {
		ref(value);
		return;
	}
	if (ref !== null) {
		ref.current = value;
	}
}

/** React adapter for the native ScopedSearchBar component. */
export const ScopedSearchBar = forwardRef<ScopedSearchBarInstance, ScopedSearchBarReactProps>((props, ref): ReactElement => {
	const {searchTerm, selectedIds, scopes, disabled, onSearch, ...mountOptions} = props;
	const hostRef = useRef<HTMLDivElement | null>(null);
	const instanceRef = useRef<ScopedSearchBarInstance | null>(null);
	const onSearchRef = useRef<OnSearch>(onSearch);

	useEffect((): void => {
		onSearchRef.current = onSearch;
	}, [onSearch]);

	useEffect(() => {
		const host = hostRef.current;
		if (host === null) {
			return;
		}
		const options: ScopedSearchBarOptions = {
			...mountOptions,
			...(disabled === undefined ? {} : {disabled}),
			...(searchTerm === undefined ? {} : {initialSearchTerm: searchTerm}),
			...(selectedIds === undefined ? {} : {initialSelectedIds: selectedIds}),
			scopes,
			onSearch: async (term, selectedScopeIds) => {
				await onSearchRef.current(term, selectedScopeIds);
			},
		};

		const instance = new NativeScopedSearchBar(host, options);
		instanceRef.current = instance;
		setForwardedRef(ref, instance);

		return (): void => {
			instanceRef.current = null;
			setForwardedRef(ref, null);
			instance.destroy();
		};
		// Mount-only options are intentionally captured once. Mutable props are synced below through native setters.
		// oxlint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		instanceRef.current?.setScopes(scopes);
	}, [scopes]);

	useEffect(() => {
		if (disabled !== undefined) {
			instanceRef.current?.setDisabled(disabled);
		}
	}, [disabled]);

	useEffect(() => {
		if (searchTerm !== undefined) {
			instanceRef.current?.setSearchTerm(searchTerm);
		}
	}, [searchTerm]);

	useEffect(() => {
		if (selectedIds !== undefined) {
			instanceRef.current?.setSelectedIds(selectedIds);
		}
	}, [selectedIds]);

	return <div ref={hostRef} />;
});

ScopedSearchBar.displayName = 'ScopedSearchBar';

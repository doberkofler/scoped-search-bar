import {forwardRef, useEffect, useRef, type ForwardedRef, type ReactElement} from 'react';

import {ScopedSearchBar as NativeScopedSearchBar, type OnSearch, type ScopedSearchBarInstance, type ScopedSearchBarOptions} from './widget.ts';

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
	const mountPropsRef = useRef({mountOptions, disabled, searchTerm, selectedIds, scopes});
	const forwardedRef = useRef(ref);

	useEffect((): void => {
		onSearchRef.current = onSearch;
	}, [onSearch]);

	useEffect(() => {
		const host = hostRef.current;
		if (host === null) {
			return;
		}
		const mountProps = mountPropsRef.current;
		const mountedRef = forwardedRef.current;
		const options: ScopedSearchBarOptions = {
			...mountProps.mountOptions,
			...(mountProps.disabled === undefined ? {} : {disabled: mountProps.disabled}),
			...(mountProps.searchTerm === undefined ? {} : {initialSearchTerm: mountProps.searchTerm}),
			...(mountProps.selectedIds === undefined ? {} : {initialSelectedIds: mountProps.selectedIds}),
			scopes: mountProps.scopes,
			onSearch: async (term, selectedScopeIds) => {
				await onSearchRef.current(term, selectedScopeIds);
			},
		};

		const instance = new NativeScopedSearchBar(host, options);
		instanceRef.current = instance;
		setForwardedRef(mountedRef, instance);

		return (): void => {
			instanceRef.current = null;
			setForwardedRef(mountedRef, null);
			instance.destroy();
		};
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

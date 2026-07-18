import {expect, test} from '@playwright/test';

test.describe('ScopedSearchBar demo', () => {
	test.beforeEach(async ({page}) => {
		await page.goto('/');
	});

	test('renders the search component and initial state', async ({page}) => {
		await expect(page.locator('.scoped-search-bar')).toBeVisible();
		await expect(page.locator('.scoped-search-bar__input')).toHaveValue('reac...');
		await expect(page.locator('.scoped-search-bar__scope-chip')).toHaveText('4 Areas');
		await expect(page.locator('#event-log')).toHaveValue(/demo initialized/u);
	});

	test('opens menu and toggles a scope', async ({page}) => {
		await page.locator('.scoped-search-bar__scope-chip').click();
		await expect(page.locator('.scoped-search-bar__menu')).toBeVisible();
		await expect(page.locator('[data-scope-id="midwest"]')).toHaveAttribute('aria-checked', 'false');

		await page.locator('[data-scope-id="midwest"]').click();

		await expect(page.locator('[data-scope-id="midwest"]')).toHaveAttribute('aria-checked', 'true');
		await expect(page.locator('.scoped-search-bar__scope-chip')).toHaveText('5 Areas');
	});

	test('clears scopes and submits from the button', async ({page}) => {
		await page.locator('.scoped-search-bar__clear-scopes').click();
		await expect(page.locator('.scoped-search-bar__scope-chip')).toHaveText('All Areas');

		await page.locator('.scoped-search-bar__input').fill('react server components');
		await page.locator('.scoped-search-bar__submit').click();

		await expect(page.locator('#event-log')).toHaveValue(/onSearch \| term=react server components \| scopes=\(all\)/u);
		await expect(page.locator('#event-log')).toHaveValue(/search resolved/u);
	});

	test('submits from Enter and exposes pending state', async ({page}) => {
		await page.locator('.scoped-search-bar__input').fill('billing');
		await page.locator('.scoped-search-bar__input').press('Enter');

		await expect(page.locator('.scoped-search-bar')).toHaveClass(/scoped-search-bar--searching/u);
		await expect(page.locator('.scoped-search-bar__submit')).toBeDisabled();
		await expect(page.locator('#event-log')).toHaveValue(/onSearch \| term=billing/u);
	});

	test('supports disabled and theme demo controls', async ({page}) => {
		await page.locator('#disable-btn').click();
		await expect(page.locator('.scoped-search-bar__input')).toBeDisabled();
		await expect(page.locator('#event-log')).toHaveValue(/disabled=true/u);

		await page.locator('#theme-btn').click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
		await expect(page.locator('#event-log')).toHaveValue(/theme=dark/u);
	});

	test('stays usable on mobile width', async ({page}) => {
		await page.setViewportSize({width: 390, height: 760});
		await expect(page.locator('.scoped-search-bar')).toBeVisible();
		await page.locator('.scoped-search-bar__scope-chip').click();
		await expect(page.locator('.scoped-search-bar__menu')).toBeVisible();
	});
});

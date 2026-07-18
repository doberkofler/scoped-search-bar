import path from 'node:path';

import {playwright} from '@vitest/browser-playwright';
import {defineConfig} from 'vitest/config';

export default defineConfig({
	server: {port: 5173, open: true},
	build: {target: 'es2022', sourcemap: true, outDir: 'dist-demo', emptyOutDir: true},
	resolve: {
		alias: {
			'scoped-search-bar': path.resolve('./src/lib'),
		},
	},
	test: {
		include: ['src/lib/scoped-search-bar.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
		},
		browser: {
			enabled: true,
			headless: true,
			screenshotDirectory: path.resolve('./temp/vitest/__screenshots__'),
			instances: [
				{
					browser: 'chromium',
					provider: playwright({
						launchOptions: {
							args: ['--disable-web-security'],
						},
					}),
				},
			],
		},
	},
});

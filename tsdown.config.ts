import {defineConfig} from 'tsdown';

export default defineConfig({
	entry: {
		index: 'src/lib/index.ts',
	},
	format: ['esm'],
	dts: true,
	fixedExtension: true,
	outDir: 'dist',
	clean: true,
	target: 'es2022',
	platform: 'neutral',
	sourcemap: true,
	copy: [{from: 'src/styles/scoped-search-bar.css', to: 'dist/styles', flatten: true}],
});

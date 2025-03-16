import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Using adapter-static for a static website with no SSR
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html',
			precompress: false,
			strict: true
		}),

		prerender: {
			handleHttpError: ({ path, referrer, message }) => {
				// Ignore certain errors or handle them differently
				if (path.startsWith('/api')) {
					return;
				}
				// Otherwise throw the error
				throw new Error(message);
			},
			handleMissingId: 'ignore'
		},
		alias: {
			'@/*': './src/lib/*'
		}
	}
};

export default config;

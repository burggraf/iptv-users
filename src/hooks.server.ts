import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // Handle API routes
    if (event.url.pathname.startsWith('/api/')) {
        const response = await resolve(event);
        return response;
    }

    return await resolve(event);
};
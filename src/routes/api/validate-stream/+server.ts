import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST = (async ({ request }) => {
    const { streamId, providerUrl, username, password } = await request.json();

    // Construct the stream URL
    const streamUrl = `${providerUrl}/live/${username}/${password}/${streamId}`;

    try {
        // Test if the stream is accessible using AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(streamUrl, {
            method: 'HEAD',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            return json({ valid: true, status: response.status });
        } else {
            return json({ valid: false, status: response.status });
        }
    } catch (error) {
        return json({
            valid: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}) satisfies RequestHandler;
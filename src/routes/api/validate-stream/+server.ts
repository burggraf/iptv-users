import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
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
            return new Response(JSON.stringify({ valid: true, status: response.status }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            return new Response(JSON.stringify({ valid: false, status: response.status }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
    } catch (error) {
        return new Response(JSON.stringify({
            valid: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
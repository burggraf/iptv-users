import { pb } from '$lib/pocketbase';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    const { channelId } = await request.json();

    try {
        // Fetch the channel and its provider
        const channel = await pb.collection('channels').getOne(channelId, {
            expand: 'provider_id'
        });

        if (!channel || !channel.expand?.provider_id) {
            return new Response(JSON.stringify({
                error: 'Channel or provider not found'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const provider = channel.expand.provider_id;
        const streamId = channel.metadata.stream_id;

        // Test the stream
        const validationResponse = await fetch('/api/validate-stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                streamId,
                providerUrl: `${provider.server_protocol}://${provider.server_url}${provider.server_port ? ':' + provider.server_port : ''}/live`,
                username: provider.username,
                password: provider.password
            })
        });

        const validationResult = await validationResponse.json();

        // Update the channel with validation results
        await pb.collection('channels').update(channelId, {
            validation_date: new Date().toISOString(),
            validation_result: validationResult
        });

        return new Response(JSON.stringify(validationResult), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Channel validation error:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
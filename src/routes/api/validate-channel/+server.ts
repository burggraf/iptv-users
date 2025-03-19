import { pb } from '$lib/pocketbase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST = (async ({ request }) => {
    console.log('Validate channel request received');

    try {
        // Get the auth token from the Authorization header
        const authToken = request.headers.get('Authorization');
        console.log('Auth token received:', authToken ? 'yes' : 'no');

        if (!authToken) {
            console.error('No auth token provided');
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Set the auth token in PocketBase
        pb.authStore.save(authToken);

        if (!pb.authStore.isValid) {
            console.error('Invalid auth token');
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        console.log('Request body:', body);
        const { channelId } = body;

        if (!channelId) {
            console.error('No channelId provided in request');
            return json({ error: 'Channel ID is required' }, { status: 400 });
        }

        // Fetch the channel and its provider
        console.log('Fetching channel:', channelId);
        const channel = await pb.collection('channels').getOne(channelId, {
            expand: 'provider_id'
        });
        console.log('Channel data:', channel);

        if (!channel || !channel.expand?.provider_id) {
            console.error('Channel or provider not found');
            return json({ error: 'Channel or provider not found' }, { status: 404 });
        }

        const provider = channel.expand.provider_id;
        const streamId = channel.metadata.stream_id;

        // Construct the stream URL
        const streamUrl = `${provider.server_protocol}://${provider.server_url}${provider.server_port ? ':' + provider.server_port : ''}/live/${provider.username}/${provider.password}/${streamId}`;
        console.log('Constructed stream URL (sensitive data masked):',
            streamUrl.replace(provider.password, '***').replace(provider.username, '***')
        );

        // Test if the stream is accessible using AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('Request timeout - aborting');
            controller.abort();
        }, 5000);

        try {
            console.log('Testing stream accessibility...');
            const response = await fetch(streamUrl, {
                method: 'HEAD',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const validationResult = {
                valid: response.ok,
                status: response.status,
                url: streamUrl
            };
            console.log('Stream validation result:', {
                ...validationResult,
                url: validationResult.url.replace(provider.password, '***').replace(provider.username, '***')
            });

            // Update the channel with validation results
            console.log('Updating channel with validation results');
            await pb.collection('channels').update(channelId, {
                validation_date: new Date().toISOString(),
                validation_result: validationResult
            });

            return json(validationResult);
        } catch (error) {
            console.error('Stream validation error:', error);
            const validationResult = {
                valid: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                url: streamUrl
            };

            // Update the channel with validation results even if validation failed
            console.log('Updating channel with failed validation results');
            await pb.collection('channels').update(channelId, {
                validation_date: new Date().toISOString(),
                validation_result: validationResult
            });

            return json(validationResult);
        }
    } catch (error) {
        console.error('Channel validation error:', error);
        return json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}) satisfies RequestHandler;
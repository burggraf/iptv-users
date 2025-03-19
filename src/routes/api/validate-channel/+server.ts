import { pb } from '$lib/pocketbase';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const TIMEOUT_MS = 5000; // 5 seconds timeout

export const POST = (async ({ request }) => {
    console.log('Validate channel request received');
    
    try {
        const authToken = request.headers.get('Authorization');
        console.log('Auth token received:', authToken ? 'yes' : 'no');
        
        if (!authToken) {
            console.error('No auth token provided');
            return json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        const streamUrl = `${provider.server_protocol}://${provider.server_url}${provider.server_port ? ':' + provider.server_port : ''}/live/${provider.username}/${provider.password}/${streamId}`;
        console.log('Constructed stream URL (sensitive data masked):', 
            streamUrl.replace(provider.password, '***').replace(provider.username, '***')
        );

        console.log('Testing stream accessibility...');
        
        // Create AbortController with proper timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('Stream validation timed out after', TIMEOUT_MS, 'ms');
            controller.abort();
        }, TIMEOUT_MS);

        try {
            const response = await fetch(streamUrl, {
                method: 'HEAD',
                signal: controller.signal,
                // Add additional fetch options to prevent hanging
                headers: {
                    'Connection': 'close',
                },
                // Add timeout to fetch request options
                timeout: TIMEOUT_MS
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

            await pb.collection('channels').update(channelId, {
                validation_date: new Date().toISOString(),
                validation_result: validationResult
            });

            return json(validationResult);
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Stream validation error:', error);
            
            const validationResult = {
                valid: false,
                error: error instanceof Error ? 
                    (error.name === 'AbortError' ? 'Connection timed out after 5 seconds' : error.message) 
                    : 'Unknown error',
                url: streamUrl
            };

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
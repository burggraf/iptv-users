import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { pb } from '$lib/pocketbase';

export async function POST({ request }: RequestEvent) {
    const { providerId, categoryIds } = await request.json();

    try {
        // Get all channels for the provider, requesting minimal fields
        const result = await pb.collection('channels').getFullList({
            filter: `provider_id = "${providerId}"`,
            fields: 'category_id'
        });

        // Count channels per category
        const counts = result.reduce((acc, channel) => {
            acc[channel.category_id] = (acc[channel.category_id] || 0) + 1;
            return acc;
        }, {});

        return json(counts);
    } catch (error) {
        console.error('Error getting channel counts:', error);
        return json({ error: 'Failed to get channel counts' }, { status: 500 });
    }
}
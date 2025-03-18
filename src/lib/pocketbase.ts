import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import type { IPTVUser, IPTVProvider } from './types';

// Create a Pocketbase client
export const pb = new PocketBase('http://127.0.0.1:8090');

// Create stores for user and authentication state
export const currentUser = writable(pb.authStore.model);
export const providers = writable<IPTVProvider[]>([]);

// Subscribe to auth state changes
pb.authStore.onChange((auth) => {
    currentUser.set(pb.authStore.model);
});

// Helper functions for common Pocketbase operations
export const login = async (email: string, password: string) => {
    return await pb.collection('users').authWithPassword(email, password);
};

export const logout = () => {
    pb.authStore.clear();
};

export const register = async (email: string, password: string, passwordConfirm: string, name: string) => {
    return await pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        name,
    });
};

// IPTV Provider Management Functions
export const getProviders = async () => {
    const result = await pb.collection('iptv_providers').getList(1, 50, {
        sort: '-time_now',
    });
    // Convert PocketBase records to IPTVProvider type
    providers.set(result.items.map(item => ({
        ...item,
        id: item.id,
        name: item.name,
        username: item.username,
        password: item.password,
        message: item.message,
        auth: item.auth,
        status: item.status,
        exp_date: item.exp_date,
        is_trial: item.is_trial,
        active_cons: item.active_cons,
        created_at: item.created_at,
        max_connections: item.max_connections,
        allowed_output_formats: item.allowed_output_formats,
        server_url: item.server_url,
        server_port: item.server_port,
        https_port: item.https_port,
        server_protocol: item.server_protocol,
        rtmp_port: item.rtmp_port,
        timezone: item.timezone,
        user_id: item.user_id,
        xui: item.xui,
        version: item.version,
        revision: item.revision,
        timestamp_now: item.timestamp_now,
        time_now: item.time_now
    }) as IPTVProvider));
    return result;
};

export const getProvider = async (id: string) => {
    return await pb.collection('iptv_providers').getOne(id);
};

export const createProvider = async (providerData: Partial<IPTVProvider>) => {
    // Add the current user's ID to the provider data
    const result = await pb.collection('iptv_providers').create({
        ...providerData,
        user_id: pb.authStore.model?.id
    });
    // Update the store after creating a provider
    await getProviders();
    return result;
};

export const updateProvider = async (id: string, providerData: Partial<IPTVProvider>) => {
    const result = await pb.collection('iptv_providers').update(id, providerData);
    // Update the store after updating a provider
    await getProviders();
    return result;
};

export const deleteProvider = async (id: string) => {
    const result = await pb.collection('iptv_providers').delete(id);
    // Update the store after deleting a provider
    await getProviders();
    return result;
};

export const checkProviderUserInfo = async (provider: IPTVProvider) => {
    // Construct base URL with port if it exists
    const baseUrl = `${provider.server_protocol}://${provider.server_url}`;
    const port = provider.server_protocol === 'https' ? provider.https_port : provider.server_port;
    const urlWithPort = port ? `${baseUrl}:${port}` : baseUrl;

    const url = new URL('/player_api.php', urlWithPort);
    url.searchParams.append('username', provider.username);
    url.searchParams.append('password', provider.password);
    url.searchParams.append('action', 'user');
    url.searchParams.append('sub', 'info');

    console.log('Calling IPTV API URL:', url.toString());

    try {
        const response = await fetch(url.toString());
        let updateData: Partial<IPTVProvider> = {};

        if (!response.ok) {
            updateData.status = 'Invalid Credentials';
            await updateProvider(provider.id, updateData);
            throw new Error(`Invalid credentials - HTTP status: ${response.status}`);
        }

        const data = await response.json();
        console.log('IPTV API Response:', JSON.stringify(data, null, 2));

        // Check if the response indicates an error or invalid credentials
        if (!data || !data.user_info || !data.server_info) {
            updateData.status = 'Invalid Credentials';
            await updateProvider(provider.id, updateData);
            throw new Error('Invalid response format - likely invalid credentials');
        }

        // Update the provider with the new information
        updateData = {
            ...data.user_info,
            ...data.server_info,
            // Ensure these fields are properly typed
            auth: Number(data.user_info.auth),
            active_cons: String(data.user_info.active_cons),
            max_connections: Number(data.user_info.max_connections),
            xui: Boolean(data.server_info.xui),
            revision: Number(data.server_info.revision),
            timestamp_now: Number(data.server_info.timestamp_now),
            status: 'Active' // Set status to Active when successful
        };

        await updateProvider(provider.id, updateData);
        return data;
    } catch (error) {
        console.error('Error checking provider user info:', error);
        console.error('Failed URL:', url.toString());

        // Handle domain-related errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
            await updateProvider(provider.id, { status: 'Invalid Domain' });
            throw new Error('Invalid domain or server not reachable');
        }

        // Re-throw the error to be handled by the caller
        throw error;
    }
};

// IPTV Categories Management Functions
export const syncCategories = async (provider: IPTVProvider) => {
    // Construct base URL with port
    const baseUrl = `${provider.server_protocol}://${provider.server_url}`;
    const port = provider.server_protocol === 'https' ? provider.https_port : provider.server_port;
    const urlWithPort = port ? `${baseUrl}:${port}` : baseUrl;

    const url = new URL('/player_api.php', urlWithPort);
    url.searchParams.append('username', provider.username);
    url.searchParams.append('password', provider.password);
    url.searchParams.append('action', 'get_live_categories');

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to fetch categories - HTTP status: ${response.status}`);
        }

        const categories = await response.json();

        // Process categories sequentially instead of in parallel to avoid auto-cancellation
        for (const cat of categories) {
            try {
                await pb.collection('categories').create({
                    provider_id: provider.id,
                    category_type: 'live',
                    name: cat.category_name,
                    metadata: {
                        category_id: cat.category_id,
                        parent_id: cat.parent_id
                    }
                });
            } catch (error) {
                // If it's not a duplicate entry error, throw it
                if (!error.message?.includes('Failed to create category')) {
                    throw error;
                }
                console.warn(`Skipping duplicate category ${cat.category_name}`);
            }
        }

    } catch (error) {
        console.error('Error syncing categories:', error);
        throw error;
    }
};

// IPTV Channels Management Functions
export const syncChannels = async (provider: IPTVProvider) => {
    const baseUrl = `${provider.server_protocol}://${provider.server_url}`;
    const port = provider.server_protocol === 'https' ? provider.https_port : provider.server_port;
    const urlWithPort = port ? `${baseUrl}:${port}` : baseUrl;

    const url = new URL('/player_api.php', urlWithPort);
    url.searchParams.append('username', provider.username);
    url.searchParams.append('password', provider.password);
    url.searchParams.append('action', 'get_live_streams');

    try {
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to fetch channels - HTTP status: ${response.status}`);
        }

        const channels = await response.json();

        // Get all categories for this provider for lookup
        const categoriesResult = await pb.collection('categories').getFullList({
            filter: `provider_id = "${provider.id}"`
        });

        const categoryMap = new Map(
            categoriesResult.map(cat => [cat.metadata.category_id, cat.id])
        );

        // Process channels sequentially instead of in batches
        const results = [];
        for (const ch of channels) {
            try {
                const channel = await pb.collection('channels').create({
                    provider_id: provider.id,
                    category_id: categoryMap.get(ch.category_id),
                    name: ch.name,
                    icon_url: ch.stream_icon || '',
                    metadata: {
                        stream_id: ch.stream_id,
                        category_id: ch.category_id,
                        stream_type: ch.stream_type,
                        tv_archive: ch.tv_archive,
                        direct_source: ch.direct_source,
                        added: ch.added,
                        custom_sid: ch.custom_sid,
                        epg_id: ch.epg_channel_id
                    }
                });
                results.push(channel);
            } catch (error) {
                // If it's not an auto-cancellation error, log it
                if (!error.message?.includes('autocancelled')) {
                    console.error(`Failed to create channel ${ch.name}:`, error);
                }
                continue;
            }
        }

        return results;

    } catch (error) {
        console.error('Error syncing channels:', error);
        throw error;
    }
};

// IPTV User Management Functions
export const getIptvUsers = async () => {
    return await pb.collection('iptv_users').getList(1, 50, {
        sort: '-created',
    });
};

export const getIptvUser = async (id: string) => {
    return await pb.collection('iptv_users').getOne(id);
};

export const createIptvUser = async (userData: Partial<IPTVUser>) => {
    return await pb.collection('iptv_users').create(userData);
};

export const updateIptvUser = async (id: string, userData: Partial<IPTVUser>) => {
    return await pb.collection('iptv_users').update(id, userData);
};

export const deleteIptvUser = async (id: string) => {
    return await pb.collection('iptv_users').delete(id);
};

export const getActiveUsers = async () => {
    const now = new Date().toISOString();
    return await pb.collection('iptv_users').getList(1, 50, {
        filter: `subscriptionExpiry > "${now}"`,
    });
};

export const getExpiredUsers = async () => {
    const now = new Date().toISOString();
    return await pb.collection('iptv_users').getList(1, 50, {
        filter: `subscriptionExpiry < "${now}"`,
    });
};
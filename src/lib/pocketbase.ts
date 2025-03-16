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
        sort: '-created_at',
    });
    providers.set(result.items);
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
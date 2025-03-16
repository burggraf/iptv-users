import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import type { IPTVUser } from './types';

// Create a Pocketbase client
export const pb = new PocketBase('http://127.0.0.1:8090');

// Create stores for user and authentication state
export const currentUser = writable(pb.authStore.model);

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
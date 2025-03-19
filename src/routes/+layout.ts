import { redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ url }) => {
    // Public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/register'];
    const isPublicRoute = publicRoutes.includes(url.pathname);
    const isApiRoute = url.pathname.startsWith('/api/');

    // Check if the user is authenticated
    const isAuthenticated = pb.authStore.isValid;

    // Redirect to login if trying to access a protected route while not authenticated
    // Skip the redirect for API routes as they handle their own auth
    if (!isPublicRoute && !isApiRoute && !isAuthenticated) {
        throw redirect(303, '/login');
    }

    return {};
};
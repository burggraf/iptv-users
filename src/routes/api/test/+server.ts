import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = () => {
    console.log('Test endpoint called');
    return json({ message: 'Hello, world!' });
};
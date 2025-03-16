export interface IPTVUser {
    id: string;
    username: string;
    email: string;
    fullName?: string;
    subscriptionExpiry: string; // ISO date string
    createdAt: string; // ISO date string
    active: boolean;
    notes?: string;
    allowedDevices?: number;
    packageType?: string; // Basic, Standard, Premium, etc.
}

export interface PocketbaseUser {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
    created: string;
    updated: string;
}
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

export interface IPTVProvider {
    id: string;
    name: string;
    username: string;
    password: string;
    message: string;
    auth: number;
    status: string;
    exp_date: string;
    is_trial: string;
    active_cons: string;
    created_at: string;
    max_connections: number;
    allowed_output_formats: string[];
    server_url: string;
    server_port: string;
    https_port: string;
    server_protocol: string;
    rtmp_port: string;
    timezone: string;
    user_id: string;
    // New server info fields
    xui: boolean;
    version: string;
    revision: number;
    timestamp_now: number;
    time_now: string;
}

export interface IPTVCategory {
    id: string;
    provider_id: string;
    category_type: 'live' | 'movie' | 'series';
    name: string;
    metadata: {
        category_id: string;
        parent_id?: string;
    };
    created: string;
    updated: string;
}

export interface IPTVChannel {
    id: string;
    provider_id: string;
    category_id?: string;
    name: string;
    icon_url: string;
    metadata: {
        stream_id: string;
        category_id: string;
        stream_type: string;
        tv_archive: number;
        direct_source: number;
        added: string;
        custom_sid: string;
        epg_id: string;
    };
    created: string;
    updated: string;
}
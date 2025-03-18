interface XtreamConfig {
    baseUrl: string;
    username: string;
    password: string;
}

const API_ENDPOINTS = {
    LIVE_CATEGORIES: (c: XtreamConfig) =>
        `${c.baseUrl}/player_api.php?username=${c.username}&password=${c.password}&action=get_live_categories`,

    LIVE_STREAMS: (c: XtreamConfig, categoryId: string) =>
        `${c.baseUrl}/player_api.php?username=${c.username}&password=${c.password}&action=get_live_streams&category_id=${categoryId}`,

    VOD_CATEGORIES: (c: XtreamConfig) =>
        `${c.baseUrl}/player_api.php?username=${c.username}&password=${c.password}&action=get_vod_categories`,

    VOD_STREAMS: (c: XtreamConfig, categoryId: string) =>
        `${c.baseUrl}/player_api.php?username=${c.username}&password=${c.password}&action=get_vod_streams&category_id=${categoryId}`,

    EPG_DATA: (c: XtreamConfig, streamId: string) =>
        `${c.baseUrl}/player_api.php?username=${c.username}&password=${c.password}&action=get_short_epg&stream_id=${streamId}&limit=500`,

    STREAM_URL: (c: XtreamConfig, streamId: number, type: 'live' | 'movie' | 'series') =>
        `${c.baseUrl}/${type}/${c.username}/${c.password}/${streamId}`
};
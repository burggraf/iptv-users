CREATE TABLE providers(
    id integer PRIMARY KEY,
    name text NOT NULL,
    server_url text NOT NULL,
    username text NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories(
    id integer PRIMARY KEY,
    provider_id integer REFERENCES providers(id),
    category_type text CHECK (category_type IN ('live', 'vod_movie', 'vod_series')),
    category_id text NOT NULL,
    name text NOT NULL,
    UNIQUE (provider_id, category_type, category_id)
);

CREATE TABLE channels(
    id integer PRIMARY KEY,
    category_id integer REFERENCES categories(id),
    stream_id text NOT NULL,
    name text NOT NULL,
    icon_url text,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata json
);

CREATE TABLE epg_data(
    channel_id integer REFERENCES channels(id),
    start TIMESTAMP NOT NULL,
    end TIMESTAMP NOT NULL,
    title text NOT NULL,
    description text,
    PRIMARY KEY (channel_id, START)
);


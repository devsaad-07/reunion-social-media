DO $do$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'reunion_write') THEN
        CREATE ROLE reunion_write;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'reunion_read') THEN
        CREATE ROLE reunion_read;
        GRANT reunion_read TO reunion_write;
    END IF;
END
$do$;

ALTER ROLE reunion_read WITH LOGIN PASSWORD 'password';
ALTER ROLE reunion_write WITH LOGIN PASSWORD 'password';
GRANT CONNECT ON DATABASE reunion TO reunion_read;
GRANT ALL PRIVILEGES ON DATABASE reunion TO reunion_write;

\connect reunion;

GRANT USAGE ON SCHEMA public TO reunion_read;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reunion_read;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO reunion_read;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO reunion_read;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO reunion_read;
ALTER DEFAULT PRIVILEGES FOR USER reunion_write IN SCHEMA public GRANT SELECT ON TABLES TO reunion_read;
ALTER DEFAULT PRIVILEGES FOR USER postgres IN SCHEMA public GRANT SELECT ON TABLES TO reunion_read;

GRANT CREATE ON SCHEMA public TO reunion_write;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO reunion_write;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO reunion_write;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO reunion_write;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO reunion_write;
ALTER DEFAULT PRIVILEGES FOR USER postgres IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO reunion_write;

BEGIN;
    CREATE TABLE IF NOT EXISTS public.reunion_users (
        id SERIAL PRIMARY KEY,
        userName TEXT,
        email VARCHAR (50),
        passw VARCHAR (50),
        CONSTRAINT unique_email UNIQUE (email)
    );

    CREATE TABLE IF NOT EXISTS public.follow (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        followUserId INTEGER NOT NULL,
        CONSTRAINT unique_follow UNIQUE (userId, followUserId),
        CONSTRAINT follow_reunion_users_id FOREIGN KEY(userId) REFERENCES public.reunion_users(id) ON DELETE CASCADE,
        CONSTRAINT follow_reunion_follower_user_id FOREIGN KEY(followUserId) REFERENCES public.reunion_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS public.post (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT post_reunion_users_id FOREIGN KEY(userId) REFERENCES public.reunion_users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS public.comment (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        postId INTEGER NOT NULL,
        comment TEXT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT comment_reunion_users_id FOREIGN KEY(userId) REFERENCES public.reunion_users(id) ON DELETE CASCADE,
        CONSTRAINT comment_post_id FOREIGN KEY(postId) REFERENCES public.post(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS public.like (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        postId INTEGER NOT NULL,
        CONSTRAINT unique_like UNIQUE (userId, postId),
        CONSTRAINT like_reunion_users_id FOREIGN KEY(userId) REFERENCES public.reunion_users(id) ON DELETE CASCADE,
        CONSTRAINT like_post_id FOREIGN KEY(postId) REFERENCES public.post(id) ON DELETE CASCADE
    );
END;

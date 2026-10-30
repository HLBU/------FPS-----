CREATE TABLE rooms (
 code TEXT PRIMARY KEY NOT NULL,
 token TEXT NOT NULL,
 offer TEXT NOT NULL,
 answer TEXT,
 expires INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX rooms_expiry ON rooms (expires);

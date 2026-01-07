CREATE TABLE "recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"duration" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"file_size" integer NOT NULL
);

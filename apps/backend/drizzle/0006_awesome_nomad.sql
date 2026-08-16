CREATE TABLE "youtube_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"comment_id" text NOT NULL,
	"author_name" text,
	"text" text NOT NULL,
	"like_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "youtube_comments_comment_id_unique" UNIQUE("comment_id")
);
--> statement-breakpoint
ALTER TABLE "youtube_comments" ADD CONSTRAINT "youtube_comments_video_id_youtube_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."youtube_videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_youtube_comments_video_id" ON "youtube_comments" USING btree ("video_id");
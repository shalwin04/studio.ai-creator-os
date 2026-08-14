CREATE TABLE "video_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"date" date NOT NULL,
	"views" integer DEFAULT 0,
	"watch_time_minutes" integer DEFAULT 0,
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"shares" integer DEFAULT 0,
	"subscribers_gained" integer DEFAULT 0,
	"ctr" real,
	"avg_view_duration" real,
	"avg_view_percentage" real,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "video_analytics" ADD CONSTRAINT "video_analytics_video_id_youtube_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."youtube_videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_video_analytics_video_date" ON "video_analytics" USING btree ("video_id","date");
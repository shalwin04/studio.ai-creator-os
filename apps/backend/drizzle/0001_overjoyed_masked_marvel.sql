CREATE TABLE "sponsorship_deliverables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsorship_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text,
	"due_date" timestamp,
	"status" text DEFAULT 'pending',
	"linked_video_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sponsorship_deliverables" ADD CONSTRAINT "sponsorship_deliverables_sponsorship_id_sponsorships_id_fk" FOREIGN KEY ("sponsorship_id") REFERENCES "public"."sponsorships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsorship_deliverables" ADD CONSTRAINT "sponsorship_deliverables_linked_video_id_youtube_videos_id_fk" FOREIGN KEY ("linked_video_id") REFERENCES "public"."youtube_videos"("id") ON DELETE no action ON UPDATE no action;
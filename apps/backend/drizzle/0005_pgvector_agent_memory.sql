CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
ALTER TABLE "agent_memory" ADD COLUMN IF NOT EXISTS "embedding" vector(768);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_agent_memory_embedding" ON "agent_memory" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

-- CreateTable seller_events
CREATE TABLE "seller_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventType" TEXT NOT NULL,
    "seller_id" UUID NOT NULL,
    "customer_id" UUID,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "source" TEXT NOT NULL DEFAULT 'app',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable leads
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seller_id" UUID NOT NULL,
    "customer_id" UUID,
    "phone" TEXT,
    "phone_hash" TEXT,
    "phone_validated" BOOLEAN NOT NULL DEFAULT false,
    "customer_name" TEXT,
    "product_id" UUID,
    "catalog_slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable follow_ups
CREATE TABLE "follow_ups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "marked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable daily_metrics_rollup
CREATE TABLE "daily_metrics_rollup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seller_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "conversation_rate" NUMERIC(5,2) NOT NULL DEFAULT 0,
    "avg_response_time" NUMERIC(8,2),
    "follow_up_rate" NUMERIC(5,2) NOT NULL DEFAULT 0,
    "post_follow_conv" NUMERIC(5,2),
    "performance_score" NUMERIC(5,2) NOT NULL DEFAULT 0,
    "visits_count" INTEGER NOT NULL DEFAULT 0,
    "leads_count" INTEGER NOT NULL DEFAULT 0,
    "checkouts_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_metrics_rollup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_seller_events_seller_created" ON "seller_events"("seller_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_seller_events_type" ON "seller_events"("eventType");

-- CreateIndex
CREATE INDEX "idx_leads_seller_status" ON "leads"("seller_id", "status");

-- CreateIndex
CREATE INDEX "idx_leads_created" ON "leads"("created_at");

-- CreateIndex
CREATE INDEX "idx_follow_ups_seller_marked" ON "follow_ups"("seller_id", "marked_at");

-- CreateIndex
CREATE UNIQUE INDEX "uq_metrics_seller_date" ON "daily_metrics_rollup"("seller_id", "date");

-- CreateIndex
CREATE INDEX "idx_metrics_seller_date" ON "daily_metrics_rollup"("seller_id", "date");

-- AddForeignKey
ALTER TABLE "seller_events" ADD CONSTRAINT "seller_events_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_ups" ADD CONSTRAINT "follow_ups_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_metrics_rollup" ADD CONSTRAINT "daily_metrics_rollup_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

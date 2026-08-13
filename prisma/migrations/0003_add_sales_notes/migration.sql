-- CreateTable sales_notes
CREATE TABLE "sales_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "seller_id" UUID NOT NULL,
    "quotation_id" UUID,
    "order_id" UUID,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "amount" NUMERIC(10,2) NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invoiced_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_sales_notes_seller_registered" ON "sales_notes"("seller_id", "registered_at");

-- CreateIndex
CREATE INDEX "idx_sales_notes_quotation" ON "sales_notes"("quotation_id");

-- CreateIndex
CREATE INDEX "idx_sales_notes_order" ON "sales_notes"("order_id");

-- AddForeignKey
ALTER TABLE "sales_notes" ADD CONSTRAINT "sales_notes_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_notes" ADD CONSTRAINT "sales_notes_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_notes" ADD CONSTRAINT "sales_notes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "sales_notes" ENABLE ROW LEVEL SECURITY;

-- RLS Policy: seller_read_own_notes
CREATE POLICY "seller_read_own_notes" ON "sales_notes"
  FOR SELECT USING (seller_id = auth.uid());

-- RLS Policy: seller_insert_notes
CREATE POLICY "seller_insert_notes" ON "sales_notes"
  FOR INSERT WITH CHECK (seller_id = auth.uid());

-- RLS Policy: seller_update_own_notes
CREATE POLICY "seller_update_own_notes" ON "sales_notes"
  FOR UPDATE USING (seller_id = auth.uid());

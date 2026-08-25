CREATE TABLE "installment_group" (
	"id" text PRIMARY KEY NOT NULL,
	"financial_space_id" text NOT NULL,
	"total_cents" integer NOT NULL,
	"installment_count" integer NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurrence" (
	"id" text PRIMARY KEY NOT NULL,
	"financial_space_id" text NOT NULL,
	"account_id" text NOT NULL,
	"category_id" text NOT NULL,
	"description" text NOT NULL,
	"source" text,
	"amount_cents" integer NOT NULL,
	"kind" text NOT NULL,
	"frequency" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"next_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "recurrence_id" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "installment_group_id" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "installment_number" integer;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "installment_count" integer;--> statement-breakpoint
ALTER TABLE "installment_group" ADD CONSTRAINT "installment_group_financial_space_id_financial_space_id_fk" FOREIGN KEY ("financial_space_id") REFERENCES "public"."financial_space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrence" ADD CONSTRAINT "recurrence_financial_space_id_financial_space_id_fk" FOREIGN KEY ("financial_space_id") REFERENCES "public"."financial_space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrence" ADD CONSTRAINT "recurrence_account_id_financial_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrence" ADD CONSTRAINT "recurrence_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_recurrence_id_recurrence_id_fk" FOREIGN KEY ("recurrence_id") REFERENCES "public"."recurrence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_installment_group_id_installment_group_id_fk" FOREIGN KEY ("installment_group_id") REFERENCES "public"."installment_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_recurrence_occurrence_unique" ON "transaction" USING btree ("recurrence_id","competence_date");
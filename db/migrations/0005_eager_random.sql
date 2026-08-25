CREATE TABLE "income_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"financial_space_id" text NOT NULL,
	"owner_user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"payment_day" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "space_member" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "space_member" ADD COLUMN "permissions" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "income_profile" ADD CONSTRAINT "income_profile_financial_space_id_financial_space_id_fk" FOREIGN KEY ("financial_space_id") REFERENCES "public"."financial_space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_profile" ADD CONSTRAINT "income_profile_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_profile" ADD CONSTRAINT "income_profile_account_id_financial_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_account"("id") ON DELETE no action ON UPDATE no action;
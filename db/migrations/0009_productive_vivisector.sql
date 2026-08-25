CREATE TABLE "investment_position" (
	"id" text PRIMARY KEY NOT NULL,
	"financial_space_id" text NOT NULL,
	"symbol" text NOT NULL,
	"quantity_milli" integer NOT NULL,
	"average_price_cents" integer NOT NULL,
	"acquired_at" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "investment_position" ADD CONSTRAINT "investment_position_financial_space_id_financial_space_id_fk" FOREIGN KEY ("financial_space_id") REFERENCES "public"."financial_space"("id") ON DELETE cascade ON UPDATE no action;
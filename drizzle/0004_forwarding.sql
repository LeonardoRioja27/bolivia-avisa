ALTER TABLE `reports` ADD `entity` text;--> statement-breakpoint
ALTER TABLE `reports` ADD `forward_status` text DEFAULT 'no' NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `forward_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `forwarded_at` integer;--> statement-breakpoint
ALTER TABLE `reports` ADD `forward_error` text;
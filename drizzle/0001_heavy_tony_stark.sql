CREATE TABLE `flags` (
	`id` text PRIMARY KEY NOT NULL,
	`target_id` text NOT NULL,
	`kind` text NOT NULL,
	`reason` text NOT NULL,
	`user_id` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `write_limits` (
	`user_id` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `comments` ADD `owner_id` text;--> statement-breakpoint
ALTER TABLE `comments` ADD `hidden` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `owner_id` text;--> statement-breakpoint
ALTER TABLE `reports` ADD `hidden` integer DEFAULT 0 NOT NULL;
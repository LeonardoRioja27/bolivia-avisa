CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`report_id` text NOT NULL,
	`body` text NOT NULL,
	`author` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`report_id`) REFERENCES `reports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`location` text NOT NULL,
	`category` text NOT NULL,
	`author` text NOT NULL,
	`status` text NOT NULL,
	`created` integer NOT NULL
);

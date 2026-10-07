-- Associate each email signup with the page where it was submitted.
-- Preserve existing subscribers under the default page; their original page
-- cannot be inferred because earlier rows did not store it.
CREATE TABLE `subscribers_new` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`page_id` integer REFERENCES `pages`(`id`) ON DELETE SET NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`consent_at` text,
	`consent_text` text
);
--> statement-breakpoint
INSERT INTO `subscribers_new` (`id`, `email`, `page_id`, `created_at`, `consent_at`, `consent_text`)
SELECT `id`, `email`,
	(SELECT `id` FROM `pages` WHERE `is_default` = 1 LIMIT 1),
	`created_at`, `consent_at`, `consent_text`
FROM `subscribers`;
--> statement-breakpoint
DROP TABLE `subscribers`;
--> statement-breakpoint
ALTER TABLE `subscribers_new` RENAME TO `subscribers`;
--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_page_email_unique` ON `subscribers` (`page_id`, `email`);

-- Amaji: shoppable photo grid layout for the public page.
-- `grid` lays rich/image cards out as square tiles instead of a vertical list.
ALTER TABLE `themes` ADD `link_layout` text DEFAULT 'list' NOT NULL;--> statement-breakpoint
ALTER TABLE `themes` ADD `grid_columns` integer DEFAULT 3 NOT NULL;

CREATE TABLE `level_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_name` text NOT NULL,
	`level` real NOT NULL,
	`changed_at` text DEFAULT (datetime('now')) NOT NULL,
	`reason` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_name` text NOT NULL,
	`language` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`story_title` text NOT NULL,
	`story_text` text NOT NULL,
	`story_grade_level` real NOT NULL,
	`total_flashcard_words` integer NOT NULL,
	`rating_breakdown` text DEFAULT '{"again":0,"hard":0,"good":0,"easy":0}' NOT NULL,
	`new_words_added` integer DEFAULT 0 NOT NULL,
	`difficulty_feedback` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);

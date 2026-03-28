CREATE TABLE `chat_conversations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_name` text,
	`language` text DEFAULT 'Korean' NOT NULL,
	`mode` text DEFAULT 'mixed' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`message_count` integer DEFAULT 0 NOT NULL,
	`corrections_count` integer DEFAULT 0 NOT NULL,
	`messages` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cloze_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_name` text,
	`language` text DEFAULT 'Korean' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`source_type` text DEFAULT 'custom' NOT NULL,
	`passage` text NOT NULL,
	`blanks` text DEFAULT '[]' NOT NULL,
	`total_blanks` integer DEFAULT 0 NOT NULL,
	`correct_count` integer DEFAULT 0 NOT NULL,
	`score` real
);
--> statement-breakpoint
CREATE TABLE `dictation_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_name` text,
	`language` text DEFAULT 'Korean' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`source_type` text DEFAULT 'custom' NOT NULL,
	`exercises` text DEFAULT '[]' NOT NULL,
	`total_exercises` integer DEFAULT 0 NOT NULL,
	`average_accuracy` real
);
--> statement-breakpoint
CREATE TABLE `imported_texts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_name` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`title` text,
	`text` text NOT NULL,
	`analysis` text,
	`translation` text,
	`times_studied` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_name` text NOT NULL,
	`language` text DEFAULT 'Korean' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`total_cards` integer DEFAULT 0 NOT NULL,
	`rating_breakdown` text DEFAULT '{"again":0,"hard":0,"good":0,"easy":0}' NOT NULL,
	`card_ratings` text,
	`duration_seconds` integer
);
--> statement-breakpoint
CREATE TABLE `writing_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_name` text NOT NULL,
	`language` text DEFAULT 'Korean' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`exercises` text DEFAULT '[]' NOT NULL,
	`total_exercises` integer DEFAULT 0 NOT NULL,
	`average_score` real
);

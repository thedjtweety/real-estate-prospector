CREATE TABLE `searchCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`searchHash` varchar(64) NOT NULL,
	`searchInput` json NOT NULL,
	`result` json NOT NULL,
	`confidence` int NOT NULL,
	`cacheVersion` int NOT NULL DEFAULT 1,
	`hitCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `searchCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `searchCache_searchHash_unique` UNIQUE(`searchHash`)
);

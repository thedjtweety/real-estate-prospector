CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(500) NOT NULL,
	`phone` varchar(50),
	`email` varchar(320),
	`website` varchar(500),
	`address` text,
	`city` varchar(200),
	`state` varchar(100),
	`zipCode` varchar(20),
	`verified` boolean NOT NULL DEFAULT false,
	`verificationScore` decimal(3,2),
	`verificationDate` timestamp,
	`dataSource` text,
	`rawData` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(300) NOT NULL,
	`title` varchar(300),
	`role` enum('broker','owner','office_manager','admin','transaction_coordinator','technology_poc','other'),
	`email` varchar(320),
	`phone` varchar(50),
	`roleConfidence` decimal(3,2),
	`inferredFrom` text,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`dataSource` text,
	`rawData` json,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mlsAssociations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`name` varchar(500) NOT NULL,
	`type` enum('state','local','regional','national') NOT NULL,
	`mlsId` varchar(200),
	`website` varchar(500),
	`state` varchar(100),
	`region` varchar(200),
	`verified` boolean NOT NULL DEFAULT false,
	`verificationDate` timestamp,
	`dataSource` text,
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mlsAssociations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('high_value_prospect','criteria_match','team_share','verification_complete') NOT NULL,
	`title` varchar(500) NOT NULL,
	`message` text NOT NULL,
	`businessId` int,
	`searchId` int,
	`read` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedSearchCriteria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(300) NOT NULL,
	`criteria` json NOT NULL,
	`notifyOnMatch` boolean NOT NULL DEFAULT true,
	`active` boolean NOT NULL DEFAULT true,
	`lastChecked` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedSearchCriteria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`searchType` varchar(50) NOT NULL,
	`searchQuery` json NOT NULL,
	`businessId` int,
	`resultsCount` int NOT NULL DEFAULT 0,
	`resultsSummary` json,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`processingTime` int,
	`shared` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `searches_id` PRIMARY KEY(`id`)
);

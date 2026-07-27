CREATE DATABASE game_server;
USE game_server;

CREATE TABLE user
(
    `user_id` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`user_id`),
    UNIQUE KEY(`username`),
    UNIQUE KEY(`token`)
);

CREATE TABLE stats
(
    `user_id` VARCHAR(255) NOT NULL,
    `kills` INT NOT NULL DEFAULT 0,
    `deaths` INT NOT NULL DEFAULT 0,
    `kd` DECIMAL(5, 2) GENERATED ALWAYS AS (
        IF (`deaths` = 0, `kills`, ROUND(`kills` / `deaths`, 2))
        ),
    `deathmatchWins` INT NOT NULL DEFAULT 0,
    `teamDeathmatchWins` INT NOT NULL DEFAULT 0,
    `eliminationWins` INT NOT NULL DEFAULT 0,
    `deathmatchLose` INT NOT NULL DEFAULT 0,
    `teamDeathmatchLose` INT NOT NULL DEFAULT 0,
    `eliminationLose` INT NOT NULL DEFAULT 0,
    PRIMARY KEY(`user_id`),
    FOREIGN KEY(`user_id`) REFERENCES user(`user_id`)
);

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
    `wins` INT NOT NULL,
    `loses` INT NOT NULL,
    PRIMARY KEY(`user_id`),
    FOREIGN KEY(`user_id`) REFERENCES user(`user_id`)
);
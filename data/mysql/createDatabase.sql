CREATE DATABASE game_server;
USE game_server;

CREATE TABLE user
(
    `user_id` INT NOT NULL AUTO_INCREMENT,
    `nickname` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`user_id`),
    UNIQUE KEY(`username`)
);

CREATE TABLE stats
(
    `user_id` INT NOT NULL,
    `wins` INT NOT NULL,
    `loses` INT NOT NULL,
    PRIMARY KEY(`user_id`),
    FOREIGN KEY(`user_id`) REFERENCES user(`user_id`)
);
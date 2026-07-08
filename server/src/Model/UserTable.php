<?php

namespace App\Model;

use PDO;
use RuntimeException;

class UserTable
{
    private PDO $connection;

    public function __construct(ConnectionProvider $provider)
    {
        $this->connection = $provider->connectDatabase();
    }

    public function saveUserToDatabase(User $user): string
    {
        $userId = bin2hex(random_bytes(32));
        $token = bin2hex(random_bytes(32));

        $queryUser = "INSERT INTO `user` (`user_id`, `nickname`, `username`, `password`, `token`) VALUES (:user_id, :nickname, :username, :password, :token);";
        $stmt = $this->connection->prepare($queryUser);
        $this->connection->beginTransaction();
        try {
            $stmt->execute([
                'user_id' => $userId,
                'nickname' => $user->getNickname(),
                'username' => $user->getUsername(),
                'password' => password_hash($user->getPassword(), PASSWORD_DEFAULT),
                'token' => $token,
            ]);

            $queryStats = "INSERT INTO `stats` (`user_id`, `wins`, `loses`) VALUES (:user_id, :wins, :loses);";
            $stmt = $this->connection->prepare($queryStats);
            $stmt->execute([
                'user_id' => $userId,
                'wins' => $user->getStats()->getWins(),
                'loses' => $user->getStats()->getLoses(),
            ]);
            $this->connection->commit();
        }catch (\PDOException $error) {
            $this->connection->rollBack();
            if ($error->getCode() === '23000') {
                throw new RuntimeException('Логин занят');
            }
            throw $error;
        }
        return $token;
    }

    public function getUserByToken(string $token): ?User
    {
        $queryUser = "SELECT * FROM `user` WHERE `token` = :token";
        $stmt = $this->connection->prepare($queryUser);
        $stmt->execute([
            'token' => $token,
        ]);
        $arrayUser = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($arrayUser) {
            $userId = $arrayUser["user_id"];
            $stats = $this->getStatsByUserId($userId);
            return new User($arrayUser['nickname'], $arrayUser['username'], $arrayUser['password'], $arrayUser['user_id'], $arrayUser['token'], $stats);
        }
        return null;
    }

    public function getUserByUsername(string $username): ?User
    {
        $queryUser = "SELECT * FROM `user` WHERE `username` = :username";
        $stmt = $this->connection->prepare($queryUser);
        $stmt->execute([
            'username' => $username
        ]);
        $arrayUser = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($arrayUser) {
            $userId = $arrayUser["user_id"];
            $stats = $this->getStatsByUserId($userId);
            return new User($arrayUser['nickname'], $arrayUser['username'], $arrayUser['password'], $arrayUser['user_id'], $arrayUser['token'], $stats);
        }
        return null;
    }

    private function getStatsByUserId(string $userId): Stats
    {
        $queryStats = "SELECT * FROM `stats` WHERE `user_id` = :user_id";
        $stmt = $this->connection->prepare($queryStats);
        $stmt->execute([
            'user_id' => $userId
        ]);
        $arrayStats = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($arrayStats) {
            return new Stats($arrayStats['wins'], $arrayStats['loses']);
        }
        return throw new RuntimeException("Stats not found for user_id: $userId");
    }
}
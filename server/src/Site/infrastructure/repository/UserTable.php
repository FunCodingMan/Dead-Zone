<?php

namespace App\Site\infrastructure\repository;

use App\Realtime\Domain\Map\GameConfig;
use App\Site\app\model\Stats;
use App\Site\app\model\User;
use App\Site\app\repository\IConnectionProvider;
use App\Site\app\repository\IUserRepository;
use PDO;
use RuntimeException;

class UserTable implements IUserRepository
{
    private PDO $connection;

    public function __construct(IConnectionProvider $provider)
    {
        $this->connection = $provider->connectDatabase();
    }

    public function saveUser(User $user): string
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

            $queryStats = "INSERT INTO `stats` (`user_id`, `kills`, `deaths`, `deathmatchWins`, `teamDeathmatchWins`, `eliminationWins`, `deathmatchLose`, `teamDeathmatchLose`, `eliminationLose`) 
                            VALUES (:user_id, :kills, :deaths, :deathmatchWins, :teamDeathmatchWins, :eliminationWins, :deathmatchLose, :teamDeathmatchLose, :eliminationLose);";
            $stmt = $this->connection->prepare($queryStats);
            $stmt->execute([
                'user_id' => $userId,
                'kills' => $user->getStats()->getKills(),
                'deaths' => $user->getStats()->getDeaths(),
                'deathmatchWins' => $user->getStats()->getDeathMatchWins(),
                'teamDeathmatchWins' => $user->getStats()->getTeamDeathMatchWins(),
                'eliminationWins' => $user->getStats()->getEliminationWins(),
                'deathmatchLose' => $user->getStats()->getDeathMatchLose(),
                'teamDeathmatchLose' => $user->getStats()->getTeamDeathMatchLose(),
                'eliminationLose' => $user->getStats()->getEliminationLose(),
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
            return new Stats($arrayStats['kills'], $arrayStats['deaths'], $arrayStats['kd'], $arrayStats['deathmatchWins'], $arrayStats['teamDeathmatchWins'], $arrayStats['eliminationWins'], $arrayStats['deathmatchLose'], $arrayStats['teamDeathmatchLose'], $arrayStats['eliminationLose']);
        }
        return throw new RuntimeException("Stats not found for user_id: $userId");
    }

    public function updateDataUser(string $userId, int $kills, int $deaths, bool $isWin, string $mode): void
    {
//        $deathmatchWins = $isDeathmatch ? 1 : 0;
//        $teamDeathmatchWins = $isTeamDeathmatch ? 1 : 0;
//        $eliminationWins = $isElimination ? 1 : 0;
//
//        $deathmatchLose = !$isDeathmatch ? 1 : 0;
//        $teamDeathmatchLose = !$isTeamDeathmatch ? 1 : 0;
//        $eliminationLose = !$isElimination ? 1 : 0;

        $query = "UPDATE `stats` SET
            `kills` = `kills` + :kills,
            `deaths` = `deaths` + :deaths,
            `deathmatchWins` = `deathmatchWins` + :deathmatchWins,
            `teamDeathmatchWins` = `teamDeathmatchWins` + :teamDeathmatchWins,
            `eliminationWins` = `eliminationWins` + :eliminationWins,
            `deathmatchLose` = `deathmatchLose` + :deathmatchLose,
            `teamDeathmatchLose` = `teamDeathmatchLose` + :teamDeathmatchLose,
            `eliminationLose` = `eliminationLose` + :eliminationLose,
        WHERE `user_id` = :user_id";

        $stmt = $this->connection->prepare($query);
        $stmt->execute([
            'kills' => $kills,
            'deaths' => $deaths,
            'user_id' => $userId,
            'deathmatchWins' => $deathmatchWins,
            'teamDeathmatchWins' => $teamDeathmatchWins,
            'eliminationWins' => $eliminationWins,
            'deathmatchLose' => $deathmatchLose,
            'teamDeathmatchLose' => $teamDeathmatchLose,
            'eliminationLose' => $eliminationLose,
        ]);
    }
}
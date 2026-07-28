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

    public function getLeaderboard(): array
    {
        $query = "SELECT `user`.`nickname`, `user`.`user_id`
                FROM `user`
                JOIN `stats` ON `user`.`user_id` = `stats`.`user_id`
                ORDER BY 
                `stats`.`kills` DESC, 
                `stats`.`deaths` ASC, 
                `stats`.`kd` DESC
                LIMIT :limit";
        $stmt = $this->connection->prepare($query);
        $stmt->bindValue(':limit', GameConfig::LIMIT_LEADER_BOARD, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateDataUser(string $userId, int $kills, int $deaths, bool $isWin, string $mode): void
    {
        match ($mode) {
            GameConfig::MODE_DEATHMATCH => $this->saveStatsForDeathmatch($userId, $kills, $deaths, $isWin),
            GameConfig::MODE_TEAM_DEATHMATCH => $this->saveStatsForTeamDeathmatch($userId, $kills, $deaths, $isWin),
            GameConfig::MODE_ELIMINATION => $this->saveStatsForElimination($userId, $kills, $deaths, $isWin),
        };
    }

    private function saveStatsForDeathmatch(string $userId, int $kills, int $deaths, bool $isWin): void
    {
        $query = "UPDATE `stats` SET
            `kills` = `kills` + :kills,
            `deaths` = `deaths` + :deaths,
            `deathmatchWins` = `deathmatchWins` + :deathmatchWins,
            `deathmatchLose` = `deathmatchLose` + :deathmatchLose
        WHERE `user_id` = :user_id";

        $stmt = $this->connection->prepare($query);
        $stmt->execute([
            'kills' => $kills,
            'deaths' => $deaths,
            'user_id' => $userId,
            'deathmatchWins' => $isWin,
            'deathmatchLose' => !$isWin,
        ]);
    }

    private function saveStatsForTeamDeathmatch(string $userId, int $kills, int $deaths, bool $isWin,): void
    {
        $query = "UPDATE `stats` SET
            `kills` = `kills` + :kills,
            `deaths` = `deaths` + :deaths,
            `teamDeathmatchWins` = `teamDeathmatchWins` + :teamDeathmatchWins,
            `teamDeathmatchLose` = `teamDeathmatchLose` + :teamDeathmatchLose
        WHERE `user_id` = :user_id";

        $stmt = $this->connection->prepare($query);
        $stmt->execute([
            'kills' => $kills,
            'deaths' => $deaths,
            'user_id' => $userId,
            'teamDeathmatchWins' => $isWin,
            'teamDeathmatchLose' => !$isWin,
        ]);
    }

    private function saveStatsForElimination(string $userId, int $kills, int $deaths, bool $isWin,): void
    {
        $query = "UPDATE `stats` SET
            `kills` = `kills` + :kills,
            `deaths` = `deaths` + :deaths,
            `eliminationWins` = `eliminationWins` + :eliminationWins,
            `eliminationLose` = `eliminationLose` + :eliminationLose
            WHERE `user_id` = :user_id";

        $stmt = $this->connection->prepare($query);
        $stmt->execute([
            'kills' => $kills,
            'deaths' => $deaths,
            'user_id' => $userId,
            'eliminationWins' => $isWin,
            'eliminationLose' => !$isWin,
        ]);
    }

    public function getUserByUserId(string $userId): ?User
    {
        $queryUser = "SELECT * FROM `user` WHERE `user_id` = :user_id";
        $stmt = $this->connection->prepare($queryUser);
        $stmt->execute([
            'user_id' => $userId,
        ]);
        $arrayUser = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($arrayUser) {
            $userId = $arrayUser["user_id"];
            $stats = $this->getStatsByUserId($userId);
            return new User($arrayUser['nickname'], $arrayUser['username'], $arrayUser['password'], $arrayUser['user_id'], $arrayUser['token'], $stats);
        }
        return null;
    }
}
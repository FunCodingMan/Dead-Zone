<?php

namespace App\infrastructure\controller;

use App\infrastructure\repository\IConnectionProvider;
use PDO;
use RuntimeException;

class ConnectionProvider implements IConnectionProvider
{
    private string $pathConf;

    public function __construct(string $pathConf = __DIR__ . "/../../../../config.ini")
    {
        $this->pathConf = $pathConf;
    }

    public function connectDatabase(): PDO
    {
        $config = $this->readConfig();
        $dsn = 'mysql:host=' . $config['host'] . ';dbname=' . $config['dbname'] . ';';
        $user = $config['user'];
        $password = $config['password'];
        $option = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ];
        return new PDO($dsn, $user, $password, $option);
    }

    private function readConfig(): array
    {
        if (!file_exists($this->pathConf)) {
            throw new RuntimeException('The ' . $this->pathConf . ' does not exist');
        }
        $config = parse_ini_file($this->pathConf);
        $requiredKeysConf = ['host', 'dbname', 'user', 'password'];
        foreach ($requiredKeysConf as $key) {
            if (!isset($config[$key])) {
                throw new RuntimeException("The $key field is missing in the config.");
            }
        }
        return $config;
    }
}
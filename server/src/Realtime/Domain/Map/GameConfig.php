<?php


namespace App\Realtime\Domain\Map;

class GameConfig
{
    public const int CELL_SIZE = 64;
    public const int PLAYER_WIDTH = 28;
    public const int PLAYER_HEIGHT = 48;
    public const int HITBOX_SIZE = 28;
    public const float SOLDIER_SPEED = 8.0;
    public const float FLAME_THROWER_SPEED = 6.0;
    public const string SYMBOL_WALL = '#';
    public const string SYMBOL_BOX = 'B';
    public const string SYMBOL_PLAYER = 'P';
    public const string SYMBOL_SPAWN_RED = 'R';
    public const string SYMBOL_SPAWN_BLUE = 'U';
    public const string SYMBOL_ENEMY = 'E';
    public const string SYMBOL_TARGET = 'T';
    public const int VISIBILITY_RADIUS = 800;
    public const float FOV_ANGLE = M_PI * 0.25;
    public const int RAY_STEP = 10;
    public const float PLAYER_SHOOT_COOLDOWN_S = 0.15;
    public const int DIFF_GUN_FORWARD = 1;
    public const int DIFF_GUN_SIDE = 5;
    public const int HEARING_RADIUS = 1500;
    public const int SPREAD_FACTOR = 10;
    public const bool IS_FOG_ACTIVE = true;
    public const float RELOAD_TIME_S = 2.0;
    public const int MAX_SOLDIER_BULLETS = 50;
    public const int HP_SIZE = 100;
    public const float RESPAWN_TIME_S = 5.0;
    public const float MATCH_DURATION_S = 30;
    public const float MIN_MATCH_DURATION_S = 10;
    public const float MAX_MATCH_DURATION_S = 3600;
    public const int MAX_COUNT_USERS = 15;
    public const int RADIUS_OF_CLOSE_OBSERVE = 200;
    public const int MAX_HEALTH_PLAYER = 100;
    public const float SPREAD_RECOVERY_TIME_S = 0.4;
    public const int SOLDIER_DAMAGE = 20;
    public const int FLAME_THROWER_DAMAGE = 40;
    public const string MODE_DEATHMATCH = 'deathmatch';
    public const string MODE_TEAM_DEATHMATCH = 'team_deathmatch';
    public const string MODE_ELIMINATION = 'elimination';
    public const string TEAM_NONE = 'none';
    public const string TEAM_RED = 'red';
    public const string TEAM_BLUE = 'blue';
    public const string WINNER_DRAW = 'DRAW';
    public const string WINNER_RED = 'RED';
    public const string WINNER_BLUE = 'BLUE';
    public const float PAUSE_BETWEEN_ROUNDS_S = 5.0;
    public const string SOLDIER_CLASS = 'soldier';
    public const string FLAME_THROWER_CLASS = 'flamethrower';
    public const int MAX_FLAME_THROWER_BULLETS = 125;
    public const float FLAME_THROWER_SHOOT_COOLDOWN_S = 0.12;
    public const int FLAME_THROWER_RANGE_ATTACK = 250;
    public const float LIMIT_LEADER_BOARD = 10;
    public const int MEDKIT_SIZE = 20;
    public const int MEDKIT_HEAL = 50;
    public const float DEATHMATCH_MEDKIT_SPAWN_INTERVAL = 30.0;
    public const int DEATHMATCH_MAX_MEDKITS = 5;
    public const float ELIMINATION_MEDKIT_DELAY_AFTER_START = 10.0;
    public const int ELIMINATION_MAX_MEDKITS= 3;

}
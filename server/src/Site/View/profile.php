<?php
/** @var \App\Site\app\model\User $user */
?>
<!DOCTYPE html>
<html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Мёртвая зона — Профиль</title>
        <link rel="stylesheet" href="/styles/menu.css">
        <link href="/styles/fonts-styles.css" rel="stylesheet">
        <script src="/scripts/pages/profile/exitProfile.js" defer></script>
    </head>
    <body>
        <div class="menu-screen">
            <h2 class="menu-title">ПРОФИЛЬ</h2>
            <div class="stats">
                <div class="stats-block stats-block-first">
                    <p class="stats-text">Имя:</p>
                    <span id="stats-name" class="stats-result"><?php echo htmlspecialchars($user->getNickname()) ?></span>
                </div>

                <div class="stats-block">
                    <p class="stats-text">Убийств:</p>
                    <span id="stats-kills" class="stats-result"><?php echo htmlspecialchars($user->getStats()->getKills()) ?></span>
                </div>

                <div class="stats-block">
                    <p class="stats-text">Смертей:</p>
                    <span id="stats-deaths" class="stats-result"><?php echo htmlspecialchars($user->getStats()->getDeaths()) ?></span>
                </div>

                <div class="stats-block">
                    <p class="stats-text">КД:</p>
                    <span id="stats-kd" class="stats-result"><?php echo htmlspecialchars($user->getStats()->getKd()) ?></span>
                </div>

                <div class="stats-block">
                    <p class="stats-text">Победы в "Сам за себя":</p>
                    <span id="stats-deathmatch-wins" class="stats-result">
                        <?php echo htmlspecialchars($user->getStats()->getDeathMatchWins()) ?>
                    </span>
                </div>

                <div class="stats-block">
                    <p class="stats-text">Победы в "Командный бой":</p>
                    <span id="stats-teamdeathmatch-wins" class="stats-result">
                        <?php echo htmlspecialchars($user->getStats()->getTeamDeathmatchWins()) ?>
                    </span>
                </div>

                <div class="stats-block">
                    <p class="stats-text">Победы в "Командный бой (раунды)":</p>
                    <span id="stats-elimination-wins" class="stats-result">
                        <?php echo htmlspecialchars($user->getStats()->getEliminationWins()) ?>
                    </span>
                </div>

                <div class="stats-block">
                    <p class="stats-text">Поражения в "Сам за себя":</p>
                    <span id="stats-deathmatch-losses" class="stats-result">
                        <?php echo htmlspecialchars($user->getStats()->getDeathMatchLose()) ?>
                    </span>
                </div>

                <div class="stats-block">
                    <p class="stats-text">Поражения в "Командный бой":</p>
                    <span id="stats-teamdeathmatch-losses" class="stats-result">
                        <?php echo htmlspecialchars($user->getStats()->getTeamDeathmatchLose()) ?>
                    </span>
                </div>

                <div class="stats-block stats-block-last">
                    <p class="stats-text">Поражения в "Командный бой (раунды)":</p>
                    <span id="stats-elimination-losses" class="stats-result">
                        <?php echo htmlspecialchars($user->getStats()->getEliminationLose()) ?>
                    </span>
                </div>
            </div>
            <button class="btn" data-target="show">НАЗАД</button>
        </div>
    </body>
</html>
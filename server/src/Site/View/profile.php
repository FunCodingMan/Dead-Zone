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
            <div class="profile-stats">
                <p class="stats-text">Имя: <span id="stats-name"><?php echo htmlspecialchars($user->getNickname()) ?></span></p>
                <p class="stats-text">Логин: <span id="stats-kills"><?php echo htmlspecialchars($user->getUsername()) ?></span></p>
                <p class="stats-text">Победы: <span id="stats-kills"><?php echo htmlspecialchars($user->getStats()->getWins()) ?></span></p>
                <p class="stats-text">Поражения: <span id="stats-kills"><?php echo htmlspecialchars($user->getStats()->getLoses()) ?></span></p>
                <p class="stats-text">Убийств: <span id="stats-kills"></span><?php echo htmlspecialchars($user->getStats()->getKills()) ?></p>
                <p class="stats-text">Смертей: <span id="stats-kills"></span><?php echo htmlspecialchars($user->getStats()->getDeaths()) ?></p>
                <p class="stats-text">КД: <span id="stats-kills"><?php echo htmlspecialchars($user->getStats()->getKd()) ?></span></p>
                <p class="stats-text">Победы в 1: <span id="stats-kills">-</span></p>
                <p class="stats-text">Победы в 2: <span id="stats-kills">-</span></p>
                <p class="stats-text">Победы в 3: <span id="stats-kills">-</span></p>
                <p class="stats-text">Дата регистрации: <span id="stats-kills">-</span></p>
            </div>
            <button class="btn" data-target="show">НАЗАД</button>
        </div>
    </body>
</html>
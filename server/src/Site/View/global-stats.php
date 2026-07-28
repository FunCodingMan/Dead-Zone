    <!DOCTYPE html>
    <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Мёртвая зона — Таблица лидеров</title>
            <link rel="stylesheet" href="/styles/menu.css">exitLid
            <link href="/styles/fonts-styles.css" rel="stylesheet">
            <script src="/scripts/pages/lid/openSearchUsers.js" defer></script>
            <script src="/scripts/pages/lid/exitLid.js" defer></script>
        </head>
        <body>
            <div class="menu-screen">
                <h2 class="menu-title">ЛИДЕРЫ</h2>
                <div class="stats">
                    <?php foreach ($stats as $index => $stat): ?>
                        <div class="stats-block <?= $index === 0 ? 'stats-block-first' : ($index === array_key_last($stats) ? 'stats-block-last' : '') ?>">
                            <a href="/global-stats/profile?user_id=<?= $stat['user_id'] ?>">
                                <p class="stats-text"><?= htmlspecialchars($stat['nickname']) ?></p>
                            </a>
                        </div>
                    <?php endforeach; ?>
                </div>
                <button class="btn btn-search-users">ПОИСК ИГРОКА</button>
                <button class="btn btn-exit">НАЗАД</button>
            </div>
        </body>
    </html>
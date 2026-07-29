<!DOCTYPE html>
<html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Мёртвая зона — Поиск игрока</title>
        <link rel="stylesheet" href="/styles/menu.css">
        <link href="/styles/fonts-styles.css" rel="stylesheet">
        <link rel="stylesheet" href="/styles/playerSearch.css">
        <script src="/scripts/pages/lid/player-search.js" defer></script>
    </head>
    <body>
        <div class="menu-screen">
            <h2 class="menu-title">ПОИСК ИГРОКА</h2>

            <form class="search-form" onsubmit="return false;">
                <input
                    type="text"
                    id="player-search-input"
                    class="search-input"
                    placeholder="Введите ник..."
                    autocomplete="off"
                    autofocus
                >
            </form>

            <div class="player-list">
                <?php if ($users === null) : ?>
                    <p class="player-list-empty">Игроки не найдены</p>
                <?php else: ?>
                    <?php foreach ($users as $user): ?>
                        <div class="stats-block" data-nickname="<?= htmlspecialchars($user['nickname']) ?>">
                            <a href="/global-stats/profile?user_id=<?= htmlspecialchars($user['user_id']) ?>">
                                <p class="stats-text"><?= htmlspecialchars($user['nickname']) ?></p>
                            </a>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
                <p class="player-list-empty hidden" id="player-list-empty">Ничего не найдено</p>
            </div>

            <button class="btn btn-exit" onclick="window.location.href='/global-stats'">НАЗАД</button>
        </div>
    </body>
</html>
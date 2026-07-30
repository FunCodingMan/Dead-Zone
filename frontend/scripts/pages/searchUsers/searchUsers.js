{
    const input = document.getElementById('player-search-input');
    const blocks = document.querySelectorAll('.player-list .stats-block');
    const emptyMessage = document.getElementById('player-list-empty');

    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        let visibleCount = 0;

        blocks.forEach(block => {
            const nickname = (block.dataset.nickname || '').toLowerCase();
            const isMatch = nickname.includes(query);
            block.classList.toggle('hidden-by-search', !isMatch);
            if (isMatch) visibleCount++;
        });

        if (emptyMessage) {
            emptyMessage.classList.toggle('hidden', visibleCount > 0);
        }
    });
}

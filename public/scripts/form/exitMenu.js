{
    let button = document.getElementById('btn-exit');
    button.addEventListener('click', async () => {
        try {
            let response = await fetch('/api/users/logout', {
                method: 'POST'
            });
            const data = await response.json();
            if (data.redirect) {
                window.location.href = data.redirect;
            }
        } catch (error) {
            console.error('Ошибка запроса:', error);
        }
    });
}
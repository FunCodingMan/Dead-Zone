{
    document.addEventListener('DOMContentLoaded', () => {
        const params = new URLSearchParams(window.location.search);
        const requestedId = params.get('user_id');
        const idBlock = document.getElementById('requested-id');

        if (requestedId) {
            idBlock.textContent = 'ID: ' + requestedId;
        } else {
            idBlock.remove();
        }
    });
}
{
    let formDelete = document.querySelector('.delete-form');
    let errorMessage = document.querySelector('.error__message');

    formDelete.addEventListener('submit', async function (event) {
        event.preventDefault();

        let formData = new FormData(formDelete);
        const formDataObj = {};
        formData.forEach((value, key) => {
            formDataObj[key] = value;
        });
        let formDataJson = JSON.stringify(formDataObj);

        console.log(formDataJson);

        try {
            let response = await fetch('/api/users/delete-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8'
                },
                body: formDataJson
            });
            const data = await response.json();
            if (data.redirect) {
                window.location.href = data.redirect;
            }
            if (!response.ok) {
                errorMessage.textContent = data.error;
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Ошибка запроса:', error);
        }
    });
}
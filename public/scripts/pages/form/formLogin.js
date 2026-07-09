{
    let formLog = document.querySelector('.form-login');
    let errorMessage = document.querySelector('.error__message');

    formLog.addEventListener('submit', async function(event) {
       event.preventDefault();

       let formData = new FormData(formLog);
       const formDataObj = {};
        formData.forEach((value, key) => {
            formDataObj[key] = value;
        });
        let formDataJson = JSON.stringify(formDataObj);

        try {
            let response = await fetch('/api/users/login', {
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
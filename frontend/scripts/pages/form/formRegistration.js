{
    let formReg = document.querySelector('.form-registration');
    let errorMessage = document.querySelector('.error__message');

    formReg.addEventListener('submit', async function (event) {
       event.preventDefault();
       let formData = new FormData(formReg);
       const formDataObj = {};
       formData.forEach((value, key) => {
           formDataObj[key] = value;
       });
       let formDataJson = JSON.stringify(formDataObj);

       try {
           let response = await fetch('/api/users/registration', {
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
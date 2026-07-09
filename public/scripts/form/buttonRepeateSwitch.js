{
    let button = document.querySelector('.button__repeat-switch');
    let formReg = document.querySelector('.form-registration');
    let formLog = document.querySelector('.form-login');
    let errorMessage = document.querySelector('.error__message');

    button.addEventListener('click', () => {
        formReg.classList.toggle('hidden');
        formLog.classList.toggle('hidden');
        errorMessage.classList.add('hidden');

        if (formReg.classList.contains(('hidden'))) {
            button.textContent = 'Перейти к регистрации';
        } else {
            button.textContent = 'Перейти к логину';
        }
    })
}
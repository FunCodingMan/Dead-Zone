{
    let buttonOpenTraining = document.querySelector('.btn-openTraining');
    buttonOpenTraining.addEventListener('click', () => {
        window.location.href = '/mode-selection/singleplayer/training';
    });

    let buttonOpenWaves = document.querySelector('.btn-openWaves');
    buttonOpenWaves.addEventListener('click', () => {
        window.location.href = '/mode-selection/singleplayer/waves';
    });


}
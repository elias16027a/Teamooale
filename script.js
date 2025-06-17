document.addEventListener('DOMContentLoaded', () => {
    const songItems = document.querySelectorAll('.song-item');
    const audioPlayer = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const currentSongTitle = document.getElementById('current-song-title');
    const currentSongArtist = document.getElementById('current-song-artist');
    const currentCover = document.getElementById('current-cover');
    const progressBar = document.querySelector('.progress-bar');
    const hiddenPhraseDiv = document.querySelector('.hidden-phrase');

    // Configuración para el desbloqueo (Hora de Buenos Aires: 16:20)
    const targetUnlockHour = 16; // 4 PM
    const targetUnlockMinute = 20; // 20 minutes

    // Función para obtener la fecha y hora actual en la zona horaria de Buenos Aires
    // NOTA: Para una precisión estricta de zona horaria sin librerías,
    // se recomienda que el servidor envíe la hora o que el usuario tenga
    // su sistema bien configurado. Esto es una aproximación.
    function getBuenosAiresTime() {
        const now = new Date();
        // Ajuste manual para el offset de Buenos Aires (GMT-3) si el navegador no lo maneja
        // bien con getDate, getHours, etc., para la zona específica.
        // Simplificado: asumimos que new Date() ya está en la hora local del usuario.
        // Si el usuario está en otra zona horaria, esto no mostrará la hora de BA.
        // Una solución robusta requeriría una librería como Luxon o Moment.js.
        return now;
    }

    function checkAndUnlockSongs() {
        const nowInBA = getBuenosAiresTime(); // Fecha y hora actual en Buenos Aires
        let allSongsUnlocked = true;

        songItems.forEach(item => {
            const unlockDateString = item.dataset.unlockDate; // YYYY-MM-DD
            const [year, month, day] = unlockDateString.split('-').map(Number);

            // Crear el objeto Date para la hora de desbloqueo específica
            // Los meses en JavaScript son 0-indexados (Enero es 0, Diciembre es 11)
            const unlockDateTime = new Date(year, month - 1, day, targetUnlockHour, targetUnlockMinute, 0);

            if (nowInBA >= unlockDateTime) {
                item.classList.remove('locked');
                item.classList.add('unlocked');
                item.querySelector('.locked-icon').classList.remove('fa-lock');
                item.querySelector('.locked-icon').classList.add('fa-play-circle'); // Icono de play
            } else {
                item.classList.remove('unlocked');
                item.classList.add('locked');
                item.querySelector('.locked-icon').classList.remove('fa-play-circle');
                item.querySelector('.locked-icon').classList.add('fa-lock'); // Icono de candado
                allSongsUnlocked = false; // Al menos una canción sigue bloqueada
            }
        });

        // Mostrar la frase oculta si todas las canciones están desbloqueadas
        if (allSongsUnlocked) {
            hiddenPhraseDiv.style.display = 'block';
        } else {
            hiddenPhraseDiv.style.display = 'none';
        }
    }

    // Inicializar el estado de las canciones al cargar la página
    checkAndUnlockSongs();

    // Actualizar el estado de las canciones cada minuto
    setInterval(checkAndUnlockSongs, 60 * 1000); // Cada minuto

    let currentPlayingSong = null;

    songItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('unlocked')) {
                const songSrc = item.dataset.songSrc;
                const songTitle = item.querySelector('.song-title').textContent;
                const songArtist = item.querySelector('.song-artist').textContent;
                const songCover = item.dataset.cover;

                // Si es la misma canción y está sonando, pausar/reanudar
                if (currentPlayingSong === songSrc) {
                    if (audioPlayer.paused) {
                        audioPlayer.play();
                        playPauseBtn.classList.remove('fa-play');
                        playPauseBtn.classList.add('fa-pause');
                    } else {
                        audioPlayer.pause();
                        playPauseBtn.classList.remove('fa-pause');
                        playPauseBtn.classList.add('fa-play');
                    }
                } else {
                    // Cargar y reproducir la nueva canción
                    audioPlayer.src = songSrc;
                    audioPlayer.play();
                    currentPlayingSong = songSrc;
                    playPauseBtn.classList.remove('fa-play');
                    playPauseBtn.classList.add('fa-pause');

                    currentSongTitle.textContent = songTitle;
                    currentSongArtist.textContent = songArtist;
                    currentCover.src = songCover;

                    // Remover la clase 'playing' de la canción anterior y añadirla a la actual
                    document.querySelectorAll('.song-item.playing').forEach(s => s.classList.remove('playing'));
                    item.classList.add('playing');
                }
            } else {
                // Calcular el tiempo restante para el desbloqueo
                const unlockDateString = item.dataset.unlockDate;
                const [year, month, day] = unlockDateString.split('-').map(Number);
                const unlockDateTime = new Date(year, month - 1, day, targetUnlockHour, targetUnlockMinute, 0);
                const now = getBuenosAiresTime();
                const timeLeft = unlockDateTime.getTime() - now.getTime(); // Tiempo en milisegundos

                if (timeLeft > 0) {
                    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

                    let message = 'Amoor .';
                    if (days > 0) {
                        message += ` Faltan ${days} día${days !== 1 ? 's' : ''}, `;
                    }
                    if (hours > 0) {
                        message += `${hours} hora${hours !== 1 ? 's' : ''} y `;
                    }
                    message += `${minutes} minuto${minutes !== 1 ? 's' : ''}. Esperaa no seas desesperada`;
                    alert(message);
                } else {
                    // Si el tiempo es 0 o negativo, pero por alguna razón no se desbloqueó,
                    // forzar un re-chequeo. Esto debería ser raro si el setInterval funciona.
                    checkAndUnlockSongs();
                    alert('Parece que esta canción debería estar desbloqueada, recargando...');
                }
            }
        });
    });

    playPauseBtn.addEventListener('click', () => {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseBtn.classList.remove('fa-play');
            playPauseBtn.classList.add('fa-pause');
        } else {
            audioPlayer.pause();
            playPauseBtn.classList.remove('fa-pause');
            playPauseBtn.classList.add('fa-play');
        }
    });

    audioPlayer.addEventListener('timeupdate', () => {
        if (!isNaN(audioPlayer.duration)) { // Asegúrate de que la duración sea un número válido
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            progressBar.style.width = `${progress}%`;
        }
    });

    audioPlayer.addEventListener('ended', () => {
        playPauseBtn.classList.remove('fa-pause');
        playPauseBtn.classList.add('fa-play');
        currentPlayingSong = null;
        document.querySelectorAll('.song-item.playing').forEach(s => s.classList.remove('playing'));
        // Puedes poner lógica aquí para reproducir la siguiente canción si lo deseas
    });
});

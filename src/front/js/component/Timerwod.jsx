// Importa los módulos necesarios de React
import React, { useState, useEffect } from 'react';
// Importa el componente de barra de progreso circular y los estilos para construirla
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
// Importa los estilos predeterminados para la barra de progreso circular
import 'react-circular-progressbar/dist/styles.css';
// Importa los estilos CSS específicos para este componente
import styles from './Timerwod.module.css';
// Importa componentes de iconos de FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Importa los iconos específicos de reproducción y pausa
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
// Importa componentes de modal y botón de React Bootstrap
import { Modal, Button } from 'react-bootstrap';

// Define el componente Timerwod
const Timerwod = () => {
    // Define estados para gestionar el temporizador y sus configuraciones
    const [totalSeconds, setTotalSeconds] = useState(0); // Estado para los segundos totales
    const [isRunning, setIsRunning] = useState(false); // Estado para saber si el temporizador está en funcionamiento
    const [rounds, setRounds] = useState(1); // Estado para el número de rondas
    const [restTime, setRestTime] = useState(0); // Estado para el tiempo de descanso
    const [currentRound, setCurrentRound] = useState(1); // Estado para la ronda actual
    const [countType, setCountType] = useState('countdown'); // Estado para el tipo de conteo (countdown o countup)
    const [roundDuration, setRoundDuration] = useState(0); // Estado para la duración de cada ronda
    const [restDuration, setRestDuration] = useState(0); // Estado para la duración del descanso
    const [isResting, setIsResting] = useState(false); // Estado para saber si está en descanso
    const [restSeconds, setRestSeconds] = useState(0); // Estado para los segundos de descanso
    const [timerMode, setTimerMode] = useState('ForTime'); // Estado para el modo del temporizador (ForTime, AMRAP, etc.)
    const [showModal, setShowModal] = useState(false); // Estado para mostrar el modal
    const [preCountdown, setPreCountdown] = useState(5); // Estado para la cuenta regresiva antes de empezar
    const [showPreCountdown, setShowPreCountdown] = useState(false); // Estado para mostrar la cuenta regresiva

    // useEffect para manejar el temporizador cuando está en funcionamiento
    useEffect(() => {
        let timer;
        if (isRunning) { // Si el temporizador está en funcionamiento
            timer = setInterval(() => {
                if (isResting) { // Si está en descanso
                    if (countType === 'countdown') { // Si el tipo de conteo es cuenta regresiva
                        setRestSeconds(prev => prev - 1); // Decrementa los segundos de descanso
                    } else { // Si el tipo de conteo es cuenta ascendente
                        setRestSeconds(prev => prev + 1); // Incrementa los segundos de descanso
                    }
                } else { // Si no está en descanso
                    if (countType === 'countdown') { // Si el tipo de conteo es cuenta regresiva
                        setTotalSeconds(prevTotalSeconds => prevTotalSeconds - 1); // Decrementa los segundos totales
                    } else { // Si el tipo de conteo es cuenta ascendente
                        setTotalSeconds(prevTotalSeconds => prevTotalSeconds + 1); // Incrementa los segundos totales
                    }
                }
            }, 100); // Ejecuta cada segundo
        }
        return () => clearInterval(timer); // Limpia el temporizador cuando el componente se desmonta
    }, [isRunning, countType, isResting]); // Dependencias del useEffect

    // useEffect para manejar el fin de la ronda y el temporizador
    useEffect(() => {
        if (isRunning) { // Si el temporizador está en funcionamiento
            if (countType === 'countdown' && totalSeconds <= 0) { // Si el tipo de conteo es cuenta regresiva y los segundos totales son 0 o menos
                handleRoundEnd(); // Maneja el fin de la ronda
            } else if (countType === 'countup' && !isResting && totalSeconds >= roundDuration) { // Si el tipo de conteo es cuenta ascendente, no está en descanso y los segundos totales son mayores o iguales a la duración de la ronda
                handleRoundEnd(); // Maneja el fin de la ronda
            } else if (countType === 'countup' && isResting && restSeconds >= restDuration) { // Si el tipo de conteo es cuenta ascendente, está en descanso y los segundos de descanso son mayores o iguales a la duración del descanso
                handleRoundEnd(); // Maneja el fin de la ronda
            } else if (countType === 'countdown' && isResting && restSeconds <= 0) { // Si el tipo de conteo es cuenta regresiva, está en descanso y los segundos de descanso son 0 o menos
                handleRoundEnd(); // Maneja el fin de la ronda
            }
        }
    }, [totalSeconds, restSeconds, isRunning, countType, roundDuration, restDuration, isResting]); // Dependencias del useEffect

    // useEffect para manejar la cuenta regresiva antes de empezar el temporizador
    useEffect(() => {
        if (showPreCountdown && preCountdown > 0) { // Si se muestra la cuenta regresiva y el valor de la cuenta regresiva es mayor que 0
            const timer = setTimeout(() => { // Configura un temporizador para contar hacia abajo
                setPreCountdown(preCountdown - 1); // Decrementa la cuenta regresiva
                playSound('beep.mp3'); // Reproduce un sonido de bip
            }, 1000); // Ejecuta cada segundo
            return () => clearTimeout(timer); // Limpia el temporizador cuando el componente se desmonta
        } else if (showPreCountdown && preCountdown === 0) { // Si se muestra la cuenta regresiva y el valor de la cuenta regresiva es 0
            setShowPreCountdown(false); // Deja de mostrar la cuenta regresiva
            setIsRunning(true); // Inicia el temporizador
            playSound('start.mp3'); // Reproduce un sonido de inicio
        }
    }, [showPreCountdown, preCountdown]); // Dependencias del useEffect

    // Función para manejar el fin de la ronda
    const handleRoundEnd = () => {
        if (isResting) { // Si está en descanso
            setIsResting(false); // Deja de estar en descanso
            setRestSeconds(countType === 'countdown' ? restDuration : 0); // Reinicia los segundos de descanso según el tipo de conteo
            setCurrentRound(prevRound => prevRound + 1); // Incrementa la ronda actual
            if (currentRound < rounds) { // Si la ronda actual es menor que el número total de rondas
                setTotalSeconds(countType === 'countdown' ? roundDuration : 0); // Reinicia los segundos totales según el tipo de conteo
            } else { // Si la ronda actual es igual o mayor que el número total de rondas
                setIsRunning(false); // Detiene el temporizador
                playSound('alarm.mp3'); // Reproduce un sonido de alarma
            }
        } else { // Si no está en descanso
            if (currentRound < rounds) { // Si la ronda actual es menor que el número total de rondas
                if (restDuration > 0) { // Si la duración del descanso es mayor que 0
                    setIsResting(true); // Inicia el descanso
                    setRestSeconds(countType === 'countdown' ? restDuration : 0); // Reinicia los segundos de descanso según el tipo de conteo
                    setTotalSeconds(countType === 'countdown' ? restDuration : 0); // Reinicia los segundos totales según el tipo de conteo
                    playSound('rest.mp3'); // Reproduce un sonido de descanso
                } else { // Si la duración del descanso es 0
                    setCurrentRound(prevRound => prevRound + 1); // Incrementa la ronda actual
                    setTotalSeconds(countType === 'countdown' ? roundDuration : 0); // Reinicia los segundos totales según el tipo de conteo
                }
            } else { // Si la ronda actual es igual o mayor que el número total de rondas
                setIsRunning(false); // Detiene el temporizador
                playSound('alarm.mp3'); // Reproduce un sonido de alarma
            }
        }
    };

    // Función para iniciar o detener el temporizador
    const startStopTimer = () => {
        if (isRunning) { // Si el temporizador está en funcionamiento
            setIsRunning(false); // Detiene el temporizador
        } else { // Si el temporizador no está en funcionamiento
            setShowPreCountdown(true); // Muestra la cuenta regresiva
            setPreCountdown(5); // Establece la cuenta regresiva en 5
        }
    };

    // Función para reiniciar el temporizador
    const resetTimer = () => {
        setIsRunning(false); // Detiene el temporizador
        setTotalSeconds(0); // Reinicia los segundos totales
        setRestSeconds(0); // Reinicia los segundos de descanso
        setCurrentRound(1); // Reinicia la ronda actual
        setIsResting(false); // Deja de estar en descanso
        setShowModal(false); // Oculta el modal
    };

    // Función para manejar el clic en el botón "Next"
    const handleNext = () => {
        // Obtiene los valores de los inputs y los convierte a enteros
        const selectedMinutes = parseInt(document.getElementById('minutesInput').value, 10) || 0;
        const selectedSeconds = parseInt(document.getElementById('secondsInput').value, 10) || 0;
        const selectedRounds = parseInt(document.getElementById('roundsInput').value, 10) || 1;
        const selectedRestMinutes = parseInt(document.getElementById('restTimeInput').value, 10) || 0;
        // Calcula el tiempo inicial en segundos
        const initialTime = (selectedMinutes * 60) + selectedSeconds;

        setTotalSeconds(countType === 'countdown' ? initialTime : 0); // Establece los segundos totales según el tipo de conteo
        setRounds(selectedRounds); // Establece el número de rondas
        setRestTime(selectedRestMinutes); // Establece el tiempo de descanso en minutos
        setRoundDuration(initialTime); // Establece la duración de la ronda
        setRestDuration(selectedRestMinutes * 60); // Convierte el tiempo de descanso a segundos
        setCurrentRound(1); // Reinicia la ronda actual
        setIsResting(false); // Deja de estar en descanso
        setRestSeconds(countType === 'countdown' ? selectedRestMinutes * 60 : 0); // Reinicia los segundos de descanso según el tipo de conteo
        setShowModal(true); // Muestra el modal
    };

    // Función para actualizar la visualización del tiempo
    const updateDisplay = () => {
        // Calcula los minutos y segundos para mostrar
        const displayMinutes = Math.floor((isResting ? restSeconds : totalSeconds) / 60);
        const displaySeconds = (isResting ? restSeconds : totalSeconds) % 60;
        // Formatea los minutos y segundos para que siempre tengan dos dígitos
        return `${displayMinutes < 10 ? '0' : ''}${displayMinutes}:${displaySeconds < 10 ? '0' : ''}${displaySeconds}`;
    };

    // Función para manejar el cambio del modo del temporizador
    const handleModeChange = (event) => {
        setTimerMode(event.target.value); // Establece el modo del temporizador
    };

    // Función para manejar el cambio del tipo de conteo
    const handleCountTypeChange = (event) => {
        setCountType(event.target.value); // Establece el tipo de conteo
    };

    // Función para reproducir un sonido
    const playSound = (sound) => {
        const audio = new Audio(`/sounds/${sound}`); // Crea un nuevo objeto de audio con el sonido especificado
        audio.play(); // Reproduce el sonido
    };

    // Calcula el porcentaje para la barra de progreso
    const percentage = (isResting ? restSeconds : totalSeconds) / (isResting ? restDuration : roundDuration) * 100;

    // Determina el color de la barra de progreso
    const progressBarColor = isResting ? '#ffd966' : '#46b246';

    // Renderiza el componente
    return (
        <div className={styles.timerContainer}>
            {!showModal && ( // Si no se muestra el modal, muestra el formulario de configuración
                <div className={styles.setupContainer}>
                    <h2>Set up your workout</h2>
                    <div className={styles.formGroup}>
                        <label htmlFor="timerMode">Timer Mode:</label>
                        <select id="timerMode" className={styles.input} value={timerMode} onChange={handleModeChange}>
                            <option value="ForTime">ForTime</option>
                            <option value="AMRAP">AMRAP</option>
                            <option value="EMOM">EMOM</option>
                            <option value="Tabata">Tabata</option>
                        </select>
                    </div>
                    <div className={`${styles.formGroup} ${styles.inlineFormGroup}`}>
                        <label htmlFor="minutesInput">Minutes:</label>
                        <input type="number" id="minutesInput" className={styles.input} min="0" step="1" defaultValue="0" />
                        <label htmlFor="secondsInput">Seconds:</label>
                        <input type="number" id="secondsInput" className={styles.input} min="0" max="59" step="1" defaultValue="0" />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="roundsInput">Rounds:</label>
                        <input type="number" id="roundsInput" className={styles.input} min="1" step="1" defaultValue="1" />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="restTimeInput">Rest Time (minutes):</label>
                        <input type="number" id="restTimeInput" className={styles.input} min="0" step="1" defaultValue="0" />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="countType">Count Type:</label>
                        <select id="countType" className={styles.input} value={countType} onChange={handleCountTypeChange}>
                            <option value="countdown">Countdown</option>
                            <option value="countup">Countup</option>
                        </select>
                    </div>
                    <div className={styles.buttonGroup}>
                        <Button variant="primary" onClick={handleNext}>Next <i class="fa-solid fa-stopwatch-20"></i></Button>
                    </div>
                </div>
            )}

            <Modal show={showModal} onHide={resetTimer} className={`${styles.modal} ${styles.customModal}`}>
                <Modal.Header closeButton className={styles.modalContent}>
                    <Modal.Title className={styles.modalTitle}>{timerMode}</Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalContent}>
                    <>
                        <div className={styles.roundText}>
                            {showPreCountdown ? `Starting in ${preCountdown}` : (isResting ? 'Rest Time' : `Round ${currentRound}/${rounds}`)}
                        </div>
                        <div className={styles.timeText}>
                            <CircularProgressbar
                                value={percentage}
                                text={showPreCountdown ? `${preCountdown}` : (isResting ? 'Rest Time' : updateDisplay())}
                                styles={buildStyles({
                                    pathColor: progressBarColor,
                                    textColor: showPreCountdown ? 'red' : '#6c757d',
                                    trailColor: '#d6d6d6',
                                    backgroundColor: '#3e98c7',
                                })}
                            />
                        </div>
                    </>
                </Modal.Body>
                <Modal.Footer className={styles.modalContent}>
                    <Button variant="secondary" onClick={resetTimer}>Reset</Button>
                    <Button variant="primary" onClick={startStopTimer}>
                        {isRunning ? <FontAwesomeIcon icon={faPause} /> : <FontAwesomeIcon icon={faPlay} />}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

// Exporta el componente Timerwod como exportación por defecto
export default Timerwod;

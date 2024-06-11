import React, { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import styles from './Timerwod.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause } from '@fortawesome/free-solid-svg-icons';
import { Modal, Button } from 'react-bootstrap';

const Timerwod = () => {
    const [totalSeconds, setTotalSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [rounds, setRounds] = useState(1);
    const [restTime, setRestTime] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [countType, setCountType] = useState('countdown');
    const [roundDuration, setRoundDuration] = useState(0);
    const [restDuration, setRestDuration] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [restSeconds, setRestSeconds] = useState(0);
    const [timerMode, setTimerMode] = useState('ForTime');
    const [showModal, setShowModal] = useState(false);
    const [preCountdown, setPreCountdown] = useState(5);
    const [showPreCountdown, setShowPreCountdown] = useState(false);

    useEffect(() => {
        let timer;
        if (isRunning) {
            timer = setInterval(() => {
                if (isResting) {
                    if (countType === 'countdown') {
                        setRestSeconds(prev => prev - 1);
                    } else {
                        setRestSeconds(prev => prev + 1);
                    }
                } else {
                    if (countType === 'countdown') {
                        setTotalSeconds(prevTotalSeconds => prevTotalSeconds - 1);
                    } else {
                        setTotalSeconds(prevTotalSeconds => prevTotalSeconds + 1);
                    }
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isRunning, countType, isResting]);

    useEffect(() => {
        if (isRunning) {
            if (countType === 'countdown' && totalSeconds <= 0) {
                handleRoundEnd();
            } else if (countType === 'countup' && !isResting && totalSeconds >= roundDuration) {
                handleRoundEnd();
            } else if (countType === 'countup' && isResting && restSeconds >= restDuration) {
                handleRoundEnd();
            } else if (countType === 'countdown' && isResting && restSeconds <= 0) {
                handleRoundEnd();
            }
        }
    }, [totalSeconds, restSeconds, isRunning, countType, roundDuration, restDuration, isResting]);

    useEffect(() => {
        if (showPreCountdown && preCountdown > 0) {
            const timer = setTimeout(() => {
                setPreCountdown(preCountdown - 1);
                playSound('beep.mp3');
            }, 1000);
            return () => clearTimeout(timer);
        } else if (showPreCountdown && preCountdown === 0) {
            setShowPreCountdown(false);
            setIsRunning(true);
            playSound('start.mp3');
        }
    }, [showPreCountdown, preCountdown]);

    const handleRoundEnd = () => {
        if (isResting) {
            setIsResting(false);
            setRestSeconds(countType === 'countdown' ? restDuration : 0);
            setCurrentRound(prevRound => prevRound + 1);
            if (currentRound < rounds) {
                setTotalSeconds(countType === 'countdown' ? roundDuration : 0);
            } else {
                setIsRunning(false);
                playSound('alarm.mp3');
            }
        } else {
            if (currentRound < rounds) {
                if (restDuration > 0) {
                    setIsResting(true);
                    setRestSeconds(countType === 'countdown' ? restDuration : 0);
                    setTotalSeconds(countType === 'countdown' ? restDuration : 0);
                    playSound('rest.mp3');
                } else {
                    setCurrentRound(prevRound => prevRound + 1);
                    setTotalSeconds(countType === 'countdown' ? roundDuration : 0);
                }
            } else {
                setIsRunning(false);
                playSound('alarm.mp3');
            }
        }
    };

    const startStopTimer = () => {
        if (isRunning) {
            setIsRunning(false);
        } else {
            setShowPreCountdown(true);
            setPreCountdown(5);
        }
    };

    const resetTimer = () => {
        setIsRunning(false);
        setTotalSeconds(0);
        setRestSeconds(0);
        setCurrentRound(1);
        setIsResting(false);
        setShowModal(false);
    };

    const handleNext = () => {
        const selectedMinutes = parseInt(document.getElementById('minutesInput').value, 10) || 0;
        const selectedSeconds = parseInt(document.getElementById('secondsInput').value, 10) || 0;
        const selectedRounds = parseInt(document.getElementById('roundsInput').value, 10) || 1;
        const selectedRestMinutes = parseInt(document.getElementById('restTimeInput').value, 10) || 0;
        const initialTime = (selectedMinutes * 60) + selectedSeconds;

        setTotalSeconds(countType === 'countdown' ? initialTime : 0);
        setRounds(selectedRounds);
        setRestTime(selectedRestMinutes);
        setRoundDuration(initialTime);
        setRestDuration(selectedRestMinutes * 60); // Convertir minutos a segundos
        setCurrentRound(1);
        setIsResting(false);
        setRestSeconds(countType === 'countdown' ? selectedRestMinutes * 60 : 0);
        setShowModal(true);
    };

    const updateDisplay = () => {
        const displayMinutes = Math.floor((isResting ? restSeconds : totalSeconds) / 60);
        const displaySeconds = (isResting ? restSeconds : totalSeconds) % 60;
        return `${displayMinutes < 10 ? '0' : ''}${displayMinutes}:${displaySeconds < 10 ? '0' : ''}${displaySeconds}`;
    };

    const handleModeChange = (event) => {
        setTimerMode(event.target.value);
    };

    const handleCountTypeChange = (event) => {
        setCountType(event.target.value);
    };

    const playSound = (sound) => {
        const audio = new Audio(`/sounds/${sound}`);
        audio.play();
    };

    const percentage = (isResting ? restSeconds : totalSeconds) / (isResting ? restDuration : roundDuration) * 100;

    const progressBarColor = isResting ? '#ffd966' : '#46b246';

    return (
        <div className={styles.timerContainer}>
            {!showModal && (
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

export default Timerwod;

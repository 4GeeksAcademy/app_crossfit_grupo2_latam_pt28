import React, { useContext, useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import Modal from 'react-modal';
import moment from 'moment';
import { Context } from '../store/appContext'; // Asegúrate de ajustar la ruta al contexto
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './Calendar.module.css'; // Asegúrate de que la ruta al CSS es correcta

const localizer = momentLocalizer(moment);

const MyCalendar = () => {
    const { store, actions } = useContext(Context);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const events = store.trainingClasses.map(event => ({
        ...event,
        start: new Date(event.dateTime_class),
        end: moment(new Date(event.dateTime_class)).add(event.duration_minutes, 'minutes').toDate(),
        title: `${event.name} (${event.available_slots} slots)`
    }));

    const handleEventClick = (event) => {
        setSelectedEvent(event);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedEvent(null);
    };

    return (
        <div className={styles.container}>
            <h2>Calendario Publico</h2>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{
                    height: '500px',
                    background: '#bebebe',
                    borderRadius: '5px',
                    color: 'gray'
                }}
                onSelectEvent={handleEventClick}
            />
            {selectedEvent && (
                <Modal
                    isOpen={modalIsOpen}
                    onRequestClose={closeModal}
                    contentLabel="Class Details"
                    className={`${styles.modal} ${styles.customModal}`}
                    overlayClassName={styles.overlay}
                    shouldCloseOnOverlayClick={true}
                    shouldReturnFocusAfterClose={true}
        
                >
                    <h2>{selectedEvent.title}</h2>
                    <p>Description: {selectedEvent.description}</p>
                    <p>Instructor: {selectedEvent.instructor}</p>
                    <p>Duration: {selectedEvent.start_time} minutes</p>
                    <p>Duration: {selectedEvent.duration_minutes} minutes</p>
                    <p>Available slots: {selectedEvent.available_slots}</p>
                    <button className={styles.loginButton} onClick={closeModal}>Close</button>
                </Modal>
            )}
        </div>
    );
};

export default MyCalendar;

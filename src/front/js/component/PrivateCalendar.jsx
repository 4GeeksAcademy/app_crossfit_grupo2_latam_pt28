import React, { useContext, useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import Modal from 'react-modal';
import moment from 'moment';
import { Context } from '../store/appContext'; // Asegúrate de ajustar la ruta al contexto
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './PrivateCalendar.module.css'; // Asegúrate de que la ruta al CSS es correcta

const localizer = momentLocalizer(moment);

const PrivateCalendar = () => {
    const { store, actions } = useContext(Context);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    

    useEffect(() => {
        actions.loadTrainingClasses(); // Carga las clases al montar el componente
    }, []);

    const events = store.trainingClasses.map(event => ({
        ...event,
        start: new Date(event.dateTime_class),
        end: moment(new Date(event.dateTime_class)).add(event.duration_minutes, 'minutes').toDate(),
        title: `${event.name} (${event.available_slots} slots)`
    }));

    //console.log("estructura_eventos",events); // Esto mostrará la estructura de los eventos transformados en la consola
    
    const handleEventClick = (event) => {
      //  console.log("Evento seleccionado:", event);  // Esto te mostrará los detalles del evento en la consola
        setSelectedEvent(event);
        setModalIsOpen(true);
    };
    
    // useEffect(() => {
    //     console.log("Evento actualmente seleccionado:", selectedEvent);
    // }, [selectedEvent]);

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedEvent(null);
    };

    const [bookingMessage, setBookingMessage] = useState("");
    const [showMessage, setShowMessage] = useState(false);


    const handleBookClass = async (classId) => {
        console.log("Intentando reservar clase con ID:", classId);
        try {
            const result = await actions.book_class(classId);
            if (result.success) {
                setBookingMessage("Reserva realizada con éxito");
                setShowMessage(true);
            } else {
                setBookingMessage(result.error || "Error al reservar la clase");
                setShowMessage(true);
            }
        } catch (error) {
            console.error('Error en handleBookClass:', error);
            setBookingMessage("Error en el sistema: " + error.message);
            setShowMessage(true);
        } finally {
            setTimeout(() => {
                setShowMessage(false);
                setBookingMessage("");
            }, 5000); // Oculta el mensaje después de 3 segundos
        }
    };
    
    
    

    return (
        <div className={styles.container}>
            <div className={styles.myCalendar}>
                <h2>Calendario Privado</h2>
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
            </div>

            {selectedEvent && (
                <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                contentLabel="Class Details"
                className={styles.modal}
                overlayClassName={styles.overlay}
                shouldCloseOnOverlayClick={true}
                shouldReturnFocusAfterClose={true}
            >
                    <h2>{selectedEvent.title}</h2>
                    {showMessage && (
                        <h3 id='bookigMenssage'>{bookingMessage}</h3>
                    )}
                    <p>Description: {selectedEvent.description}</p>
                    <p>Instructor: {selectedEvent.instructor}</p>
                    <p>Duration: {selectedEvent.start_time} minutes</p>
                    <p>Duration: {selectedEvent.duration_minutes} minutes</p>
                    <p>Available slots: {selectedEvent.available_slots}</p>
                    
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        <h3>Personas en clase:</h3>
                        {(() => {
                            const uniqueBookings = new Set();
                            const filteredBookings = selectedEvent.bookings.flatMap(booking => 
                                booking.bookings.filter(b => 
                                    b.class_id === selectedEvent.id && 
                                    b.booking_status === "reserved" &&
                                    !uniqueBookings.has(b.booking_id) && // Verifica si el booking_id ya fue procesado
                                    uniqueBookings.add(b.booking_id) // Añade el booking_id al Set
                                )
                            );
                            return filteredBookings.map((booking, index) => {
                               // console.log("Reservas filtradas por evento y estado sin duplicados:", booking); // Esto mostrará en consola cada booking que cumpla las condiciones
                                return (
                                    <div key={index}>
                                        {/* <p><i className="fa-solid fa-circle-user"></i> {booking.booking_status} {booking.class_id} {booking.booking_id}</p> */}
                                        <p><i className="fa-solid fa-circle-user"></i> {booking.booking_user_name}</p>
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    <div className={styles.buttonContainer}>
                        <button onClick={closeModal} className={styles.buttonback}>
                            <i className="fa-solid fa-angle-left"></i> Close
                        </button>
                        <button onClick={() => handleBookClass(selectedEvent.id)} className={styles.buttonadd}>
                            <i className="fa-solid fa-plus icon"></i> Book Class
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default PrivateCalendar;

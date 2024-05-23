import React, { useState, useEffect, useContext } from "react"; // Importación de React y algunos hooks
import { Link } from "react-router-dom"; // Importación de Link para la navegación
import { Context } from "../store/appContext"; // Importación del contexto
import styles from "./UserBooking.module.css"; // Importación de estilos CSS
import moment from "moment";

const UserBooking = () => {
    const { store, actions } = useContext(Context); // Usar useContext para acceder al contexto global
    const { uploadedUserData } = store; // Suponiendo que uploadedUserData contiene el objeto del usuario

    // estados para el modal
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    // Verificar si uploadedUserData contiene datos
    if (!uploadedUserData) {
        return <div className={styles.loading}>Cargando datos del usuario...</div>;
    }

    const FormattedDate = ({ dateTime }) => {
        return <span>{moment(dateTime).format('LL')}</span>;
        };

    const handleCancelBooking = async (bookingId) => {
        await actions.cancel_booking(bookingId);
        if (store.cancelBooking.message) {
            setModalMessage(store.cancelBooking.message);
            setModalVisible(true);
        }else{
            setModalMessage(store.cancelBooking.error); 
            setModalVisible(true);
        }
    };


    const handleModalClose = () => {
        setModalVisible(false);
        // SI QUEREMOS QUE HAGA ALGO DESPUES
        // if (store.creationState.message) {
        //     navigate("/Login");
        // }
    };

    // useEffect(() => {
    //     actions.loadUserData(); // Carga las clases al montar el componente
    // }, []);



    

    // Renderizar los detalles del usuario
    return (
        <>
            <div className={styles.userDetailsContainer}>
                <div className={styles.bookingsContainer}>
                    <h3>Clases Reservadas:</h3>
                    <div className={styles.bookingsList}>
                    {uploadedUserData.bookings && uploadedUserData.bookings
                        .filter(booking => booking.booking_status === "reserved") // Filtra solo las reservas con status "reserved"
                        .map((booking, index) => (
                            <div key={index} className={styles.bookingDetail}>
                                <div className={styles.bookingInfo}>
                                    <h4>{booking.class_name}</h4>
                                    <p><strong>Coach: </strong>{booking.class_instructor}</p>
                                    <p><strong>Fecha: </strong><FormattedDate dateTime={booking.dateTime_class}/></p>
                                    <p><strong>Hora: </strong>{booking.class_start_time}</p>
                                </div>
                                <button onClick={() => handleCancelBooking(booking.booking_id)} className={styles.deleteButton}>
                                    <i className="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        ))
                     }

                    </div>
                </div>
            </div>
            {/* Modal */}
            <div className={`modal fade ${modalVisible ? 'show' : ''}`} style={{ display: modalVisible ? 'block' : 'none' }} tabIndex="-1" id={styles["modal"]}>
                <div className="modal-dialog">
                    <div className={styles["modal-content"]}>
                        <div className="modal-header">
                            <h5 className="modal-title">Registration Status</h5>
                        </div>
                        <div className="modal-body">
                            <p>{modalMessage}</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleModalClose}>Close</button>
                        </div>
                    </div>
                </div>
            </div> 

        </>
    );
};

export default UserBooking;



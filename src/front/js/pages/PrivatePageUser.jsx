import React, { useState, useEffect, useContext } from "react"; // Importación de React y algunos hooks
import { Link } from "react-router-dom"; // Importación de Link para la navegación
import { Context } from "../store/appContext"; // Importación del contexto
import styles from "./PrivatePageUser.module.css"; // Importación de estilos CSS

import PrivateCalendar from "../component/PrivateCalendar.jsx";
import MembershipPurchase from "../component/MembershipPurchase.jsx";
import EditProfile from "../component/EditProfile.jsx";


const PrivatePageUser = () => {
    const { store, actions } = useContext(Context); // Usar useContext para acceder al contexto global
    const { uploadedUserData } = store; // Suponiendo que uploadedUserData contiene el objeto del usuario

    // Verificar si uploadedUserData contiene datos
    if (!uploadedUserData) {
        return <div className={styles.loading}>Cargando datos del usuario...</div>;
    }

    // useEffect(() => {
    //     actions.loadUserData(); // Carga las clases al montar el componente
    // }, []);

    return (
        <>
            {/* <div className={styles.userDetailsContainer}>
                <div className={styles.userDetailsCard}>
                    <h2>Detalles del Usuario</h2>
                    <p><strong>ID:</strong> {uploadedUserData.id}</p>
                    <p><strong>Email:</strong> {uploadedUserData.email}</p>
                    <p><strong>Nombre:</strong> {uploadedUserData.name} {uploadedUserData.last_name}</p>
                    <p><strong>Usuario:</strong> {uploadedUserData.username}</p>
                    <p><strong>Rol:</strong> {uploadedUserData.role}</p>
                    <p><strong>Registro:</strong> {uploadedUserData.register_date}</p>
                    <p><strong>Última Actualización:</strong> {uploadedUserData.account_update}</p>
                    <p><strong>Membresía:</strong> {uploadedUserData.membership_description}</p>
                    <p><strong>Inicio de Membresía:</strong> {uploadedUserData.membership_start_date}</p>
                    <p><strong>Fin de Membresía:</strong> {uploadedUserData.membership_end_date}</p>
                    <p><strong>Membresía Activa:</strong> {uploadedUserData.active_membership_is_active}</p>
                    <p><strong>Clases Restantes:</strong> {uploadedUserData.membership_remaining_classes}</p>
                </div>
                <div className={styles.securityQuestions}>
                    <h3>Preguntas de Seguridad</h3>
                    <p><strong>1:</strong> {uploadedUserData.security_questions_question1} - {uploadedUserData.security_questions_answer1}</p>
                    <p><strong>2:</strong> {uploadedUserData.security_questions_question2} - {uploadedUserData.security_questions_answer2}</p>
                </div>
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
                                    <p><strong>Fecha: </strong>{booking.dateTime_class}</p>
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
            </div> */}
            <PrivateCalendar />

        </>
    );
};

export default PrivatePageUser;



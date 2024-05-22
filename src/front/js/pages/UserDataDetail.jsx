import React, { useState, useEffect, useContext } from "react"; // Importación de React y algunos hooks
import { Link } from "react-router-dom"; // Importación de Link para la navegación
import { Context } from "../store/appContext"; // Importación del contexto
import styles from "./UserDataDetail.module.css"; // Importación de estilos CSS
import moment from 'moment';

const userDataDetail = () => {
    const { store, actions } = useContext(Context); // Usar useContext para acceder al contexto global
    const { uploadedUserData } = store; // Suponiendo que uploadedUserData contiene el objeto del usuario

    // Verificar si uploadedUserData contiene datos
    if (!uploadedUserData) {
        return <div className={styles.loading}>Cargando datos del usuario...</div>;
    }



    const FormattedDate = ({ dateTime }) => {
    return <span>{moment(dateTime).format('LL')}</span>;
    };



    useEffect(() => {
        actions.loadUserData(); // Carga las clases al montar el componente
    }, []);



    

    // Renderizar los detalles del usuario
    return (
        <>
            <div className={styles.userDetailsContainer}>
                <div className={styles.userDetailsCard}>
                    <h2>Detalles del Usuario</h2>
                    <p><strong>Usuario:</strong> {uploadedUserData.username}</p>
                    <p><strong>Email:</strong> {uploadedUserData.email}</p>
                    <p><strong>Nombre:</strong> {uploadedUserData.name} {uploadedUserData.last_name}</p>
                    <p><strong>Membresía:</strong> {uploadedUserData.membership_description}</p>
                    <p><strong>Inicio de Membresía:</strong> <FormattedDate dateTime={uploadedUserData.membership_start_date}/></p>
                    <p><strong>Fin de Membresía:</strong> <FormattedDate dateTime={uploadedUserData.membership_end_date}/></p>
                    <p><strong>Clases Restantes:</strong> {uploadedUserData.membership_remaining_classes}</p>
                </div>
                {/* <div className={styles.securityQuestions}>
                    <h3>Preguntas de Seguridad</h3>
                    <p><strong>1:</strong> {uploadedUserData.security_questions_question1} - {uploadedUserData.security_questions_answer1}</p>
                    <p><strong>2:</strong> {uploadedUserData.security_questions_question2} - {uploadedUserData.security_questions_answer2}</p>
                </div> */}
            </div> 

        </>
    );
};

export default userDataDetail;



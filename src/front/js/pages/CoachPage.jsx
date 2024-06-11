import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from 'react-bootstrap';
import styles from "./ModulePage.module.css"; // Asegúrate que el path de importación es correcto

import { Context } from "../store/appContext";
import PrivateCalendar from "../component/PrivateCalendar.jsx";
import CreateClasses from "../component/CreateClasses.jsx";

import BookingView from "../component/BookingView.jsx";


import ClassesView from "../component/ClassesView.jsx";

import Sidebar from "../component/Sidebar.jsx";

import ReceiveMessages from "../component/ReceiveMessages.jsx";
import SendMessage from "../component/SendMessage.jsx";
import Timerwod from "../component/Timerwod.jsx";

const CoachPage = () => {
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();
    const [show, setShow] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const isAuthenticated = JSON.parse(localStorage.getItem("isAuthenticated"));
        const dataRole = localStorage.getItem("dataRole");

        if (!isAuthenticated || dataRole !== "coach") {
            navigate("/");
        }
    }, [navigate]);

    const handleOpenModal = (index) => {
        setCurrentSlide(index);
        setShow(true);
    };

    const handleCloseModal = () => setShow(false);

    const components = [
        { component: <CreateClasses />, name: "Create Classes" },
        { component: <BookingView />, name: "BookingView " },
        { component: <ClassesView />, name: "ClassesView " },


        { component: <PrivateCalendar showModal={!show} />, name: "Private Calendar" },

        { component: <ReceiveMessages />, name: "Receive Messages" },
        { component: <SendMessage />, name: "SendMessage " },
        { component: <Timerwod />, name: "Timerwod " },
    ];

    useEffect(() => {
        actions.checkUnreadMessages();
    }, []);

    return (
        <>
            <Sidebar />
            <h1>Coach Page</h1>
            <div className={styles.userDetailsContainer}>
                {components.map((entry, index) => (
                    <div key={index} className={`${styles.securityQuestions} ${entry.name === "Receive Messages" && store.hasUnreadMessages ? styles.unreadHighlight : ''}`} onClick={() => handleOpenModal(index)}>
                        <h3>{entry.name}</h3>
                        <p>Click to view more...</p>
                    </div>
                ))}
            </div>

            <Modal show={show} onHide={handleCloseModal} centered size="lg" className={styles.modalCustom}>
                <Modal.Header closeButton className={styles.modalHeader}>
                    <Modal.Title className={styles.modalTitle}>{components[currentSlide].name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    {components[currentSlide].component}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default CoachPage;

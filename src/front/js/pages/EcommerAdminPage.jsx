import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from 'react-bootstrap';
import styles from "./ModulePage.module.css"; // Asegúrate que el path de importación es correcto

import { Context } from "../store/appContext";
import Sidebar from "../component/Sidebar.jsx";

import CreateCategoryForm from "../component/ecommer/CreateCategoryForm.jsx";
import CreateProductForm from "../component/ecommer/CreateProductForm.jsx";


const EcommerAdminPage = () => {
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();
    const [show, setShow] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const isAuthenticated = JSON.parse(localStorage.getItem("isAuthenticated"));
        const dataRole = localStorage.getItem("dataRole");

        if (!isAuthenticated || dataRole !== "master") {
            navigate("/");
        }
    }, [navigate]);

    const handleOpenModal = (index) => {
        setCurrentSlide(index);
        setShow(true);
    };

    const handleCloseModal = () => setShow(false);

    const components = [
        { component: <CreateCategoryForm />, name: "Create Category" },
        { component: <CreateProductForm />, name: "Create Product" },

    ];

    useEffect(() => {
        actions.checkUnreadMessages();
    }, []);

    return (
        <>
            <Sidebar />
            <h1>Ecommer Module Page</h1>
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

export default EcommerAdminPage;

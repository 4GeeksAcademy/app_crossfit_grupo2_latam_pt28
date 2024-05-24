import React, { useState } from "react";
import { Modal } from 'react-bootstrap';
import Slider from 'react-slick';
import styles from "./ModulePage.module.css"; // Asegúrate que el path de importación es correcto

import PrivateCalendar from "/workspaces/app_gestion_gym_crossfit_proyecto_final_pt28/src/front/js/component/PrivateCalendar.jsx"
import CreateClasses from "../component/CreateClasses.jsx";
import MyCalendar from "../component/Calendar.jsx";
import UserBooking from "./UserBooking.jsx";
import PrivatePageUser from "./PrivatePageUser.jsx";
import Breadcrumbs from "../component/Breadcrumb.jsx";
import SingupMaster from "../component/SingupMaster.jsx";
import Singup from "../component/Singup.jsx";
import ConfirmarEmail from "../component/ConfirmEmail.jsx";
import Home from "./Home.jsx";
import Login from "../component/Login.jsx";
import Navbar from "../component/Navbar.jsx";
import BookingView from "../component/BookingView.jsx";
import MembershipPurchase from "../component/MembershipPurchase.jsx";
import Oneuser from "./Oneuser.jsx";
import Users from "./Users.jsx";
import Homeadmin from "./Homeadmin.jsx";
import UploadForm from "../component/UploadForm.jsx";
import ImageGallery from "../component/ImageGallery.jsx";

const ModulePage = () => {
    const [show, setShow] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleOpenModal = (index) => {
        setCurrentSlide(index);
        setShow(true);
    };

    const handleCloseModal = () => setShow(false);

    const components = [
        { component: <CreateClasses />, name: "Create Classes" },
        { component: <MyCalendar />, name: "My Calendar" },
        { component: <PrivateCalendar showModal={!show} />, name: "Private Calendar" },
        { component: <UserBooking />, name: "User Booking" },
        { component: <PrivatePageUser />, name: "Private Page User" },
        { component: <SingupMaster />, name: "Singup Master" },
        { component: <Singup />, name: "Singup " },
        { component: <ConfirmarEmail />, name: "Confirmar Email " },
        { component: <Home />, name: "Home " },
        { component: <Login />, name: "Login " },
        { component: <Navbar />, name: "Navbar " },
        { component: <BookingView />, name: "BookingView " },
        { component: <MembershipPurchase />, name: "MembershipPurchase " },
        { component: <Oneuser />, name: "Oneuser " },
        { component: <Users />, name: "Users " },
        { component: <Homeadmin />, name: "Homeadmin " },
        { component: <UploadForm />, name: "UploadForm " },
        { component: <ImageGallery />, name: "ImageGallery " },




    ];

    return (
        <>
            <h1> Module Page</h1>
            <Breadcrumbs/>
            <div className={styles.userDetailsContainer}>
                {components.map((entry, index) => (
                    <div key={index} className={styles.securityQuestions} onClick={() => handleOpenModal(index)}>
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

export default ModulePage
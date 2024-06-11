import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from 'react-bootstrap';
import styles from "./ModulePage.module.css"; // Asegúrate que el path de importación es correcto

import { Context } from "../store/appContext";
import PrivateCalendar from "../component/PrivateCalendar.jsx";
import CreateClasses from "../component/CreateClasses.jsx";
import MyCalendar from "../component/Calendar.jsx";
import UserBooking from "../component/UserBooking.jsx";
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
import Users from "../component/Users.jsx";
import UploadForm from "../component/UploadForm.jsx";
import ImageGallery from "../component/ImageGallery.jsx";
import TransactionsTable from "../component/TransactionsTable.jsx";
import UserCreator from "../component/UserCreator.jsx";

import MembershipManager from "../component/MembershipManager.jsx";

import PRRecord from "../component/PRRecord.jsx";
import AdminMembershipPurchase from "../component/AdminMembershipPurchase.jsx";
import ResetPassword from "../component/ResetPassword.jsx";
import ClassFrequencyChart from "../component/ClassFrequencyChart.jsx";

import ClassesView from "../component/ClassesView.jsx";

import Sidebar from "../component/Sidebar.jsx";

import ReceiveMessages from "../component/ReceiveMessages.jsx";
import SendMessage from "../component/SendMessage.jsx";

import Timerwod from "../component/Timerwod.jsx";

const ModulePage = () => {
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
        { component: <CreateClasses />, name: "Create Classes" },
        { component: <MembershipManager />, name: "MembershipManager" },
        { component: <BookingView />, name: "BookingView " },
        { component: <ClassesView />, name: "ClassesView " },
        { component: <ClassFrequencyChart />, name: "ClassFrequencyChart " },
        { component: <Users />, name: "Users " },
        { component: <TransactionsTable />, name: "TransactionsTable " },
        // { component: <MembershipPurchase />, name: "MembershipPurchase " },
        { component: <AdminMembershipPurchase />, name: "AdminMembershipPurchase " },


        { component: <MyCalendar />, name: "My Calendar" },
        { component: <PrivateCalendar showModal={!show} />, name: "Private Calendar" },
        // { component: <PrivatePageUser />, name: "Private Page User" },
        // { component: <SingupMaster />, name: "Singup Master" },
        { component: <UserCreator />, name: "UserCreator " },
        { component: <UploadForm />, name: "UploadForm " },
        { component: <ImageGallery />, name: "ImageGallery " },

        // { component: <UserBooking />, name: "User Booking" },
        { component: <PRRecord />, name: "PRRecord " },
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
            <h1>Master Page</h1>
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

export default ModulePage;

import React, { useState, useEffect, useContext } from "react";
import { Context } from "../store/appContext";
import styles from "./EditProfile.module.css"; // Importación de estilos CSS
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const EditProfile = () => {
    const { store, actions } = useContext(Context);
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        last_name: "",
        username: "",
        password: "",
        security_questions: [{ question: "", answer: "" }, { question: "", answer: "" }]
    });

    useEffect(() => {
        if (store.uploadedUserData) {
            setFormData({
                email: store.uploadedUserData.email || "",
                name: store.uploadedUserData.name || "",
                last_name: store.uploadedUserData.last_name || "",
                username: store.uploadedUserData.username || "",
                password: "",
                security_questions: [
                    { question: store.uploadedUserData.security_questions_question1 || "", answer: store.uploadedUserData.security_questions_answer1 || "" },
                    { question: store.uploadedUserData.security_questions_question2 || "", answer: store.uploadedUserData.security_questions_answer2 || "" }
                ]
            });
        }
    }, [store.uploadedUserData]);

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('question') || name.startsWith('answer')) {
            const index = name.endsWith('1') ? 0 : 1;
            const key = name.includes('question') ? 'question' : 'answer';
            const updatedQuestions = [...formData.security_questions];
            updatedQuestions[index][key] = value;
            setFormData({ ...formData, security_questions: updatedQuestions });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async () => {
        const updatedData = Object.keys(formData).reduce((acc, key) => {
            if (formData[key] && (formData[key] !== store.uploadedUserData[key] || key === 'password' && formData[key])) {
                acc[key] = formData[key];
            }
            return acc;
        }, {});
        await actions.updateUserData(updatedData);
    };

    const handleConfirm = async () => {
        const confirm = window.confirm("¿Estás seguro de que deseas guardar los cambios?");
        if (confirm) {
            await handleSubmit();
            handleClose();
        }
    };

    return (
        <>
            <Button variant="primary" onClick={handleShow} className={styles.editButton}>
                Editar Perfil
            </Button>

            <Modal show={show} onHide={handleClose} centered className={styles.modal}>
                <Modal.Header closeButton className={styles.modalHeader}>
                    <Modal.Title className={styles.modalTitle}>Editar Perfil</Modal.Title>
                </Modal.Header>
                <Modal.Body className={styles.modalBody}>
                    <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
                        <label>Email</label>
                        <input type="text" name="email" placeholder="Email" className="form-control" value={formData.email} onChange={handleChange} />
                        <label>name</label>
                        <input type="text" name="name" placeholder="Nombre" className="form-control" value={formData.name} onChange={handleChange} />
                        <label>last_name</label>
                        <input type="text" name="last_name" placeholder="Apellido" className="form-control" value={formData.last_name} onChange={handleChange} />
                        <label>username</label>
                        <input type="text" name="username" placeholder="Nombre de usuario" className="form-control" value={formData.username} onChange={handleChange} />
                        <label>password</label>
                        <input type="password" name="password" placeholder="Contraseña nueva" className="form-control" value={formData.password} onChange={handleChange} />
                        <label><strong>Segurity questions: </strong></label>
                        <label>question 1</label>
                        <input type="text" name="question1" placeholder="Pregunta de seguridad 1" className="form-control" value={formData.security_questions[0].question} onChange={handleChange} />
                        <label>answer 1</label>
                        <input type="text" name="answer1" placeholder="Respuesta 1" className="form-control" value={formData.security_questions[0].answer} onChange={handleChange} />
                        <label>question 2</label>
                        <input type="text" name="question2" placeholder="Pregunta de seguridad 2" className="form-control" value={formData.security_questions[1].question} onChange={handleChange} />
                        <label>answer 2</label>
                        <input type="text" name="answer2" placeholder="Respuesta 2" className="form-control" value={formData.security_questions[1].answer} onChange={handleChange} />
                    </form>
                </Modal.Body>
                <Modal.Footer className={styles.modalFooter}>
                    <Button variant="secondary" onClick={handleClose} className={styles.closeButton}>
                        Cerrar
                    </Button>
                    <Button variant="primary" onClick={handleConfirm} className={styles.saveButton}>
                        Guardar Cambios
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default EditProfile;

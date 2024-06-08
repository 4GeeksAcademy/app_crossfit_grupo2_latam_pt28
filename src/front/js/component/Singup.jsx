import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";
import { Modal, Button } from "react-bootstrap";
import styles from "./Singup.module.css"; // Importa los estilos CSS


const Signup = () => {
    const { store, actions } = useContext(Context);
    const { creationState } = store;
    const navigate = useNavigate();

    const [userDetails, setUserDetails] = useState({
        email: "",
        username: "",
        password: "",
        name: "",
        last_name: "",
        role: "athlete",
        security_questions: [
            { question: "", answer: "" },
            { question: "", answer: "" }
        ]
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState(""); // Estado para almacenar el mensaje de error
    const [showPassword, setShowPassword] = useState(false); // Estado para manejar la visibilidad de la contraseña


    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith("security_question_") || name.startsWith("security_answer_")) {
            const [type, index] = name.split("_").slice(-2);
            const newSecurityQuestions = [...userDetails.security_questions];
            newSecurityQuestions[index][type] = value;

            setUserDetails({ ...userDetails, security_questions: newSecurityQuestions });
        } else {
            setUserDetails({ ...userDetails, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación del email utilizando una expresión regular
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Se define una expresión regular para validar el formato del email
        if (!emailRegex.test(userDetails.email)) { // Se verifica si el email cumple con el formato esperado
            setErrorMessage("Please enter a valid email address."); // Muestra un mensaje de error si el email no es válido
            setTimeout(() => {
                setErrorMessage("")
            }, 2000);
            return; // Se detiene el proceso si el email no es válido
        }

        // Restricciones adicionales para la contraseña (8 caracteres alfanuméricos, una mayúscula y un carácter especial)
        const passwordRegex = /^(?=.*[A-Z])(?=.*[@#$%^&+=*])(?=.*[0-9a-zA-Z]).{8,}$/; // Se define una expresión regular para validar la contraseña
        if (!passwordRegex.test(userDetails.password)) { // Se verifica si la contraseña cumple con los requisitos
            setErrorMessage("Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character (#, @, $, %, ^, &, +, =, *)."); // Muestra un mensaje de error si la contraseña no cumple con los requisitos
            setTimeout(() => {
                setErrorMessage("")
            }, 2000);
            return; // Se detiene el proceso si la contraseña no cumple con los requisitos
        }

        const result = await actions.createUser(userDetails);
        if (result) {
            setModalMessage(store.creationState.message);
            setModalVisible(true);
        } else {
            setModalMessage(store.creationState.error);
            setModalVisible(true);
        }
    };

    const handleModalClose = () => {
        setModalVisible(false);
        if (store.creationState.message) {
            navigate("/Login");
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword); // Cambiar el estado de visibilidad de la contraseña
    };


    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <h1>REGISTER</h1>
                {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>} {/* Muestra el mensaje de error */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>First Name</label>
                    <input type="text" className={styles.input} name="name" value={userDetails.name} onChange={handleChange} required />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Last Name</label>
                    <input type="text" className={styles.input} name="last_name" value={userDetails.last_name} onChange={handleChange} required />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Email</label>
                    <input type="email" className={styles.input} name="email" value={userDetails.email} onChange={handleChange} required />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Username</label>
                    <input type="text" className={styles.input} name="username" autoComplete="off" value={userDetails.username} onChange={handleChange} required />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Password</label>
                    <div className={styles.passwordContainer}>
                        <input
                            type={showPassword ? "text" : "password"} // Cambiar el tipo de input según el estado de visibilidad
                            className={styles.input}
                            name="password"
                            value={userDetails.password}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={togglePasswordVisibility}
                        >
                            <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i> {/* Ícono de visibilidad */}
                        </button>
                    </div>
                </div>
                {userDetails.security_questions.map((sq, index) => (
                    <div key={index} className={styles.inputGroup}>
                        <label className={styles.label}>{`Security Question ${index + 1}`}</label>
                        <select name={`security_question_${index}`} value={sq.question} onChange={handleChange} required className={styles.securityQuestion}>
                            <option value="" disabled>Choose a question</option>
                            <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                            <option value="What is the name of your first pet?">What is the name of your first pet?</option>
                            <option value="What is the name of the city where you were born?">What is the name of the city where you were born?</option>
                        </select>
                        <input type="text" name={`security_answer_${index}`} value={sq.answer} onChange={handleChange} required className={styles.input} />
                    </div>
                ))}
                <button type="submit" className={styles.buttonSave}>Sign up</button>
                <p>
                    Have an account? <Link to="/Login" className={styles.link}>Login Here</Link>
                </p>
            </form>

            {/* Modal */}
            <Modal show={modalVisible} onHide={handleModalClose} className={styles.modalContent}>
                <Modal.Header closeButton>
                    <Modal.Title>Registration Status</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{modalMessage}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Signup;

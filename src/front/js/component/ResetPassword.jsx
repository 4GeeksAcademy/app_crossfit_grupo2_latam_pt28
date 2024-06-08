import React, { useState, useEffect } from 'react'; // Importa React y los hooks useState y useEffect
import { Modal, Button, Form, Alert } from 'react-bootstrap'; // Importa componentes de react-bootstrap
import styles from "./ResetPassword.module.css"; // Importa los estilos CSS
import { useNavigate, useLocation } from "react-router-dom"; // Importa useNavigate y useLocation para la navegación programática y acceso a la ubicación URL

// Define un hook personalizado para obtener parámetros de búsqueda de URL.
function useQuery() {
    return new URLSearchParams(useLocation().search); // Retorna una instancia de URLSearchParams basada en la query actual.
}

const ResetPassword = () => {
    const navigate = useNavigate(); // Obtiene el hook navigate para redirigir al usuario

    const query = useQuery(); // Obtiene los parámetros de búsqueda de la URL.
    const token = query.get('token'); // Extrae el token de los parámetros de búsqueda.

    const [password, setPassword] = useState(''); // Estado para almacenar la nueva contraseña
    const [confirmPassword, setConfirmPassword] = useState(''); // Estado para confirmar la nueva contraseña
    const [message, setMessage] = useState(''); // Estado para almacenar mensajes de éxito
    const [error, setError] = useState(''); // Estado para almacenar mensajes de error
    const [showModal, setShowModal] = useState(false); // Estado para controlar la visibilidad del modal
    const [userId, setUserId] = useState(null); // Estado para almacenar el ID del usuario
    const [showPassword, setShowPassword] = useState(false); // Estado para manejar la visibilidad de la contraseña
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Estado para manejar la visibilidad de la confirmación de la contraseña

    // useEffect para verificar el token cuando el componente se monta
    useEffect(() => {
        const verifyToken = async () => {
            try {
                // Realiza una solicitud POST para verificar el token
                const response = await fetch(`${process.env.BACKEND_URL}/api/verify_reset_token/${token}`, { method: 'POST' });
                const result = await response.json();
                if (response.ok) { // Si la respuesta es exitosa
                    setUserId(result.user_id); // Almacena el ID del usuario
                } else {
                    setError(result.message); // Almacena el mensaje de error
                }
            } catch (error) {
                console.error('Error verifying token', error); // Muestra el error en la consola
                setError('Invalid or expired token'); // Almacena un mensaje de error genérico
            }
        };
        verifyToken(); // Llama a la función para verificar el token
    }, [token]); // Dependencia del useEffect, se ejecuta cuando el token cambia

    const handleSubmit = async (e) => {
        e.preventDefault(); // Previene el comportamiento predeterminado del formulario

        // Validación de la contraseña utilizando una expresión regular
        const passwordRegex = /^(?=.*[A-Z])(?=.*[@#$%^&+=*])(?=.*[0-9a-zA-Z]).{8,}$/; // Se define una expresión regular para validar la contraseña
        if (!passwordRegex.test(password)) { // Se verifica si la contraseña cumple con los requisitos
            setError("Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character (#, @, $, %, ^, &, +, =, *)."); // Muestra un mensaje de error si la contraseña no cumple con los requisitos
            setTimeout(() => {
                setError(""); // borra el mensaje de error
            }, 3000);
            return; // Se detiene el proceso si la contraseña no cumple con los requisitos
        }

        if (password !== confirmPassword) { // Verifica si las contraseñas coinciden
            setError('Passwords do not match'); // Almacena un mensaje de error si no coinciden
            setTimeout(() => {
                setError(""); // borra el mensaje de error
            }, 3000);
            return;
        }
        try {
            // Realiza una solicitud PUT para actualizar la contraseña
            const response = await fetch(`${process.env.BACKEND_URL}/api/reset_password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json' // Define el tipo de contenido como JSON
                },
                body: JSON.stringify({ user_id: userId, password }) // Enviar la nueva contraseña y el ID del usuario en el cuerpo de la solicitud
            });
            const result = await response.json();
            if (response.ok) { // Si la respuesta es exitosa
                setMessage(result.message); // Almacena el mensaje de éxito
                setError(''); // Limpia cualquier mensaje de error previo
                setShowModal(true); // Muestra el modal

                // Redirige al usuario a la página de login después de 1.5 segundos
                setTimeout(() => {
                    navigate('/Login');
                }, 1500);

            } else {
                setError(result.error); // Almacena el mensaje de error
                setMessage(''); // Limpia cualquier mensaje de éxito previo
            }
        } catch (error) {
            console.error('Error reset request', error); // Muestra el error en la consola
            setError('An error occurred while resetting password'); // Almacena un mensaje de error genérico
            setMessage(''); // Limpia cualquier mensaje de éxito previo
        }
    };

    if (!userId && !error) { // Si no hay userId y no hay error, muestra un mensaje de carga
        return <div>Loading...</div>;
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword); // Cambiar el estado de visibilidad de la contraseña
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword); // Cambiar el estado de visibilidad de la confirmación de la contraseña
    };

    return (
        <div className={styles.resetPassword}> {/* Aplica estilos CSS */}
            <h2 className={styles.h2}>Reset Password</h2> {/* Título del formulario */}
            <Form onSubmit={handleSubmit} className={styles.form}>
                <Form.Group>
                    <Form.Label className={styles.label}>New Password:</Form.Label> {/* Etiqueta para la nueva contraseña */}
                    <div className={styles.passwordContainer}>
                        <Form.Control
                            type={showPassword ? "text" : "password"} // Cambiar el tipo de input según el estado de visibilidad
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} // Actualiza el estado de password
                            className={styles.input}
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
                </Form.Group>
                <Form.Group>
                    <Form.Label className={styles.label}>Confirm Password:</Form.Label> {/* Etiqueta para confirmar la contraseña */}
                    <div className={styles.passwordContainer}>
                        <Form.Control
                            type={showConfirmPassword ? "text" : "password"} // Cambiar el tipo de input según el estado de visibilidad
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} // Actualiza el estado de confirmPassword
                            className={styles.input}
                            required
                        />
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={toggleConfirmPasswordVisibility}
                        >
                            <i className={showConfirmPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i> {/* Ícono de visibilidad */}
                        </button>
                    </div>
                </Form.Group>
                <Button variant="primary" type="submit" className={styles.button}>Reset Password</Button> {/* Botón para enviar el formulario */}
            </Form>
            {message && <Alert variant="success" className={styles.message}>{message}</Alert>} {/* Muestra el mensaje de éxito */}
            {error && <Alert variant="danger" className={styles.error}>{error}</Alert>} {/* Muestra el mensaje de error */}
            <Modal show={showModal} onHide={() => setShowModal(false)} className={styles.modal}>
                <div className={styles.modalNotification}>
                    <Modal.Header>
                        <Modal.Title>Password Reset Successful</Modal.Title> {/* Título del modal */}
                    </Modal.Header>
                    <Modal.Body>
                        <p>{message}</p> {/* Muestra el mensaje de éxito en el modal */}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={() => setShowModal(false)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </div>
            </Modal>
        </div>
    );
};

export default ResetPassword; // Exporta el componente para su uso en otros archivos

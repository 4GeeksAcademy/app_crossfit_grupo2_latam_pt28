import React, { useContext, useEffect, useState } from 'react'; // Importa las funciones necesarias de React.
import styles from "./Login.module.css"; // Importa los estilos específicos para este componente.
import { Link, useNavigate } from "react-router-dom"; // Importa Link para la navegación declarativa y useNavigate para la programática.
import { Context } from "../store/appContext"; // Importa el contexto que contiene tu estado global y acciones.

const Login = () => {
    const { actions, store } = useContext(Context); // Utiliza useContext para acceder al contexto y obtener las acciones y el estado del store.
    const navigate = useNavigate(); // Inicializa navigate para poder redirigir al usuario.

    const [email, setEmail] = useState(""); // Estado local para el correo electrónico con su respectivo setter.
    const [password, setPassword] = useState(""); // Estado local para la contraseña con su respectivo setter.
    const [showPassword, setShowPassword] = useState(false); // Estado para manejar la visibilidad de la contraseña.

    const handleLogin = async (e) => {
        e.preventDefault(); // Previene el comportamiento por defecto del formulario (recargar la página).
        await actions.loginUserV2(email, password); // Llama a la acción de inicio de sesión pasando el correo y la contraseña.
        await actions.loadUserData(); // Carga los datos del usuario tras el inicio de sesión.

        // Verifica el estado de autenticación y el rol del usuario almacenados en localStorage.
        const isAuthenticated = JSON.parse(localStorage.getItem('isAuthenticated'));
        const dataRole = localStorage.getItem('dataRole');

        // Redirecciona según el rol del usuario.
        if (isAuthenticated && dataRole) {
            if (dataRole === "athlete") {
                navigate("/Userpage");
            } else if (dataRole === "coach") {
                navigate("/CoachPage");
            } else if (dataRole === "admin") {
                navigate("/AdminPage");
            } else if (dataRole === "master") {
                navigate("/ModulePage");
            } else {
                navigate("/");
            }
        }
    };

    useEffect(() => {
        // Verifica si el usuario ya está autenticado y lo redirige automáticamente según su rol.
        const isAuthenticated = JSON.parse(localStorage.getItem("isAuthenticated"));
        const dataRole = localStorage.getItem("dataRole");

        if (isAuthenticated && dataRole) {
            if (dataRole === "athlete") {
                navigate("/Userpage");
            } else if (dataRole === "coach") {
                navigate("/CoachPage");
            } else if (dataRole === "admin") {
                navigate("/AdminPage");
            } else if (dataRole === "master") {
                navigate("/ModulePage");
            } else {
                navigate("/");
            }
        }
    }, [navigate]); // El hook useEffect depende de navigate para asegurar que se use el último disponible.

    const renderLoginResponse = () => {
        if (store.isAuthenticatedMessage != null) {
            if (store.isAuthenticatedMessage === false) {
                return (
                    <div className="alert alert-danger" role="alert">
                        <p>{store.loginError}</p>
                    </div>
                );
            } else {
                return (
                    <div className="alert alert-success" role="alert">
                        <p>Correct password</p>
                    </div>
                );
            }
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword); // Cambia el estado de visibilidad de la contraseña.
    };

    return (
        <div className={styles.loginform} id="login">
            <h2>Log in</h2>
            <div>
                {renderLoginResponse()}
            </div>
            <form onSubmit={handleLogin}>
                <label className="labels">
                    Email:
                    <input type="email" name="email" className="inputs" value={email.trim()} onChange={e => setEmail(e.target.value)} required />
                </label>
                <label className="labels">
                    Password:
                    <div className={styles.passwordContainer}>
                        <input
                            type={showPassword ? "text" : "password"} // Cambiar el tipo de input según el estado de visibilidad
                            name="password"
                            value={password.trim()}
                            onChange={e => setPassword(e.target.value)}
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
                </label>
                <button type="submit" className={styles.submitButtonLogin}>Log in</button>
                <Link to="/PasswordResetRequest">
                    Forgot your password?
                </Link>
                <div className="rememberMe">
                    <input type="checkbox" />
                    <span>Remember me</span>
                    <p>
                        Is this your first time here? <Link to="/Singup">
                            Register now.
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default Login;


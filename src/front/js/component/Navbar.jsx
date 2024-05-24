import React, { useState, useEffect, useContext } from 'react';
import { Offcanvas, Nav, Navbar, NavDropdown, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Context } from '../store/appContext';

import EditProfile from './EditProfile.jsx';
import UserDataDetail from '../pages/UserDataDetail.jsx';
import UserBooking from '../pages/UserBooking.jsx';
import MembershipPurchase from './MembershipPurchase.jsx';
import styles from './Navbar.module.css';  // Asegúrate de que el path es correcto

const NavigationBar = () => {
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                await actions.validateToken(token);
            }
        };
        checkAuthStatus();
    }, []);

    const handleCloseSession = async () => {
        await actions.closeSession();
        localStorage.removeItem('token');
        navigate('/');
    };

    return (
        <>
            <Navbar bg="light" expand="lg" className={styles.navbar}>
                <Navbar.Brand className={styles.logonavbar}>MOMENTUM360</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="/" className={styles.logonavbar}>Home</Nav.Link>
                        <Nav.Link href="/plans" className={styles.logonavbar}>Plans</Nav.Link>
                        <Nav.Link href="/Benefits" className={styles.logonavbar}>About</Nav.Link>
                        <Nav.Link href="/BookingView" className={styles.logonavbar}>Calendar</Nav.Link>
                    </Nav>
                    {store.isAuthenticated && (
                        <>
                            <Button onClick={handleCloseSession} className={styles.logoutButton}>Cerrar sesión</Button>
                            <Link to="/PrivatePageUser">
                                <Button className={styles.ProfileButton}>Ir al perfil</Button>
                            </Link>
                            {store.dataRole === 'master' && (
                                <Link to="/ModulePage">
                                    <Button className={styles.logoutButton}>Modulos</Button>
                                </Link>
                            )}
                            <Button onClick={handleShow} className={styles.ProfileButton}><i className="fa-regular fa-user"></i></Button>
                        </>
                    )}
                    {!store.isAuthenticated && (
                        <Link to="/Login">
                            <Button className={styles.loginButton}>Login</Button>
                        </Link>
                    )}
                </Navbar.Collapse>
            </Navbar>

            <Offcanvas show={show} onHide={handleClose} placement="end">
                <Offcanvas.Header closeButton className={styles.offcanvasHeader}>
                    <Offcanvas.Title>Bienvenido: {store.uploadedUserData.name}</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <EditProfile />
                    <MembershipPurchase />
                    <UserDataDetail />
                    <UserBooking />
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );

//   const handleCloseSession = async () => { // Función para cerrar la sesión del usuario
//     await actions.closeSession(); // Llamada a la acción closeSession para cerrar sesión
//     localStorage.removeItem("token"); // Eliminación del token del localStorage
//     navigate("/"); // Redirección a la página de inicio
//     // window.location.reload(); // Recarga la página
//   };

//   return ( // Renderizado del componente Navbar
//     <nav className={styles.navbar}> {/* Definición de la barra de navegación con estilos dinámicos */}

//       <div className="container-fluid d-flex justify-content-between align-items-center"> {/* Contenedor principal de la barra de navegación */}

//         <nav className={`navbar navbar-expand-lg navbar-light  ${styles.navbar}`}>
//           <div className="container-fluid">
//             <a className="navbar-brand"><h4 className="bg-danger"><strong>No Name</strong></h4></a>
//             <div className="collapse navbar-collapse" id="navbarNav">
//               <ul className="navbar-nav">
//                 <li className="nav-item">
//                   <a className="nav-link active" aria-current="page" href="/">Home</a>
//                 </li>
//                 <li className="nav-item">
//                   <a className="nav-link" href="/plans">plans</a>
//                 </li>
//                 <li className="nav-item">
//                   <a className="nav-link" href="/Benefits">about</a>
//                 </li>
//                 <li className="nav-item">
//                   <a className="nav-link" href="/BookingView">Calendar</a>
//                 </li>
//               </ul>
//             </div>
//           </div>
//         </nav>

//         <div> {/* Contenedor de los elementos de la barra de navegación */}
//           {store.isAuthenticated && ( // Condición para renderizar el botón de cierre de sesión si el usuario ha iniciado sesión
//             <button className={styles.logoutButton} onClick={handleCloseSession}>Cerrar sesión</button>
//           )}
//             {store.isAuthenticated && (  
//             <Link to="/PrivatePageUser">
//             <button className={styles.logoutButton}>Ir al perfil</button>
//             </Link>
//           )}
//           {!store.isAuthenticated && ( // Condición para renderizar el botón de inicio de sesión si el usuario no ha iniciado sesión
//             <Link to="/Login">
//               <button className={styles.loginButton}>Login</button>
//             </Link>
//           )}
//           {store.isAuthenticated && ( // Condición para renderizar el botón de perfil si el usuario ha iniciado sesión
//             <button className={styles.ProfileButton} type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar">
//               <i class="fa-regular fa-user"></i> {/* Icono de perfil */}
//             </button>
//           )}
//         </div>
//       </div>
//       <div className="offcanvas offcanvas-end" tabIndex="-1" id="offcanvasNavbar" aria-labelledby="offcanvasNavbarLabel"> {/* Menú desplegable para el perfil del usuario */}
//         <div className="offcanvas-header"> {/* Cabecera del menú desplegable */}
//           <h3 className={styles["offcanvas-title"]} id="offcanvasNavbarLabel">Bienvenido: {uploadedUserData.name}</h3> {/* Título del menú desplegable */}
//           <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button> {/* Botón para cerrar el menú desplegable */}
//         </div>
//         <EditProfile />
//         <MembershipPurchase />
//         <div className="offcanvas-body" style={{ maxHeight: '700px', overflowY: 'auto' }}> {/* Cuerpo del menú desplegable */}
//           <UserDataDetail />
//           <UserBooking />


//         </div>
//       </div>
//     </nav>
//   );
};

export default NavigationBar;

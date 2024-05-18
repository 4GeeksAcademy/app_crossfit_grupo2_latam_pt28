import React, { useState, useEffect, useContext } from "react"; // Importación de React y algunos hooks
import styles from "./Footer.module.css"; // Importación de estilos CSS
import { Link } from "react-router-dom"; // Importación de Link para la navegación
import { Context } from "../store/appContext"; // Importación del contexto
import { useNavigate } from "react-router-dom"; // Importación de useNavigate para la navegación programática


const Footer = () => {
  return (
    <footer className={styles.footer}>
    <div className="container">
        <p>&copy; 2023 CrossFit Gym. All rights reserved.</p>
    </div>
    </footer>

  );
};

export default Footer;
 

import React, { useState, useEffect, useContext } from "react"; // Importación de React y algunos hooks
import { Link } from "react-router-dom"; // Importación de Link para la navegación
import { Context } from "../store/appContext"; // Importación del contexto
import styles from "./Benefits.module.css"; // Importación de estilos CSS

const Benefits = () => {
  return (
    <>
      <div className={styles["container"]}>
        <div className="row">
          <div className={`col ${styles.features}`}>
            <h2 className={styles["text-uppercase"]}>Descubre los beneficios</h2>
            <p className="crossfy-texto-home">
              La Herramienta Completa para tu Box
            </p>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 col-lg-4 text-center">
            <div className="icon-block mb-md-5 mb-sm-4">
            <i className="fa-solid fa-group-arrows-rotate" id={styles.icons}></i>
              <h3>Comunidad</h3>
              <p className="crossfy-texto-home">
                El orgullo de pertenecer a una comunidad con identidad propia,
                con una imagen y estética diferente.
              </p>
            </div>
          </div>
          <div className="col-md-4 col-lg-4 text-center">
            <div className="icon-block mb-md-5 mb-sm-4">
            <i className="fa-regular fa-bell" id={styles.icons}></i>
              <h3>Notificaciones</h3>
              <p className="crossfy-texto-home">
                Basta de intermediarios y grupos de Whatsapp. Con Crossfy,
                comunícate en tiempo real con tus socios.
              </p>
            </div>
          </div>
          <div className="col-md-4 col-lg-4 text-center">
            <div className="icon-block mb-md-5 mb-sm-4">
            <i className="fa-regular fa-calendar" id={styles.icons}></i>
              <h3>Reserva de Clases</h3>
              <p className="crossfy-texto-home">
                Gestión integral de clases y turnos. Reservar una clase nunca
                fue tan fácil. QR Check in.
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 col-lg-4 text-center">
            <div className="icon-block mb-md-0 mb-sm-4">
              <i class="fa-solid fa-dumbbell" id={styles.icons}></i>
              <h3>WODs y Rutinas</h3>
              <p className="crossfy-texto-home">
                Entrenamientos a distancia y WODs personalizados por programas.
              </p>
            </div>
          </div>
          <div className="col-md-4 col-lg-4 text-center">
            <div className="icon-block mb-md-0 mb-sm-4">
            <i className="fa-solid fa-scale-balanced" id={styles.icons}></i>
              <h3>Control de Caja y Productos</h3>
              <p className="crossfy-texto-home">
                Maneja con precisión el flujo de dinero y controla tu inventario
                de productos de manera eficiente.
              </p>
            </div>
          </div>
          <div className="col-md-4 col-lg-4 text-center">
            <div className="icon-block">
            <i className="fa-solid fa-microchip" id={styles.icons}></i>
              <h3>Tecnología de Punta</h3>
              <p className="crossfy-texto-home">
                Mejoramos constantemente nuestra plataforma basándonos en el
                feedback de nuestros clientes. El
                <strong>software para gimnasio</strong> que has estado
                esperando.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center">
        <p>
          <a
            className="btn btn-success btn-lg"
            href=""
            title="Quiero saber más!"
          >
            <i class="fa-brands fa-whatsapp"></i> Quiero saber más!
          </a>
        </p>
      </div>
      </>
  );
};

export default Benefits;

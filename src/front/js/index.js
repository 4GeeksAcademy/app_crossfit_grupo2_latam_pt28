//import react into the bundle
import React from "react";
import ReactDOM from "react-dom";
import Modal from 'react-modal';
// Modal.setAppElement('#root');



//include your index.scss file into the bundle
import "../styles/index.css";

//import your own components
import Layout from "./layout";

//render your react application
ReactDOM.render(<Layout />, document.querySelector("#app"));
Modal.setAppElement('#app'); // Asume que el ID del elemento raíz de tu aplicación es 'root'

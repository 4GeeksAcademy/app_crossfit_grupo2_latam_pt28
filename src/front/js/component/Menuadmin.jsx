import React, { useState, useEffect, useContext } from "react"; // Importación de React y algunos hooks

import { Link } from "react-router-dom"; // Importación de Link para la navegación
import { Context } from "../store/appContext"; // Importación del contexto
import { useNavigate } from "react-router-dom"; // Importación de useNavigate para la navegación programática


const Menuadmin = () => {
    return (

        <div className="">
            <button className="btn btn-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasWithBothOptions" aria-controls="offcanvasWithBothOptions">Enable both scrolling & backdrop</button>

            <div className="offcanvas offcanvas-start" data-bs-scroll="true" tabindex="-1" id="offcanvasWithBothOptions" aria-labelledby="offcanvasWithBothOptionsLabel">
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title text-dark" id="offcanvasWithBothOptionsLabel">Backdrop with scrolling</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                
                <ul className="list-group">
                    
                    <li className="list-group-item"><Link to="/users">Users</Link></li>
                    <li className="list-group-item"><Link to="/membership">Membership</Link></li>
                    <li className="list-group-item"><Link to="/class">Class</Link></li>
                    <li className="list-group-item"><Link to="/reservation">Reservations</Link></li>
                </ul>
            </div>
        </div>


    );
};

export default Menuadmin;


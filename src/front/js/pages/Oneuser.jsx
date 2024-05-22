import React, { useState, useEffect, useContext, useSyncExternalStore } from "react"; // Importación de React y algunos hooks
import { Link, useParams } from "react-router-dom"; // Importación de Link para la navegación
import { Context } from "../store/appContext"; // Importación del contexto
import styles from "./Home.module.css"; // Importación de estilos CSS






const Oneuser = () => {
  const params = useParams()
  const { store, actions } = useContext(Context)
  useEffect(() => {
    actions.getOneuser(params.id)
  }, [])
  console.log(store.user)
  return (
    <div className="container d-flex justify-content-center">

      <div className="card mb-3" style={{ maxWidth: "740px" }}>
        <div className="row g-0">
          <div className="col-md-4">
            <img src="https://th.bing.com/th/id/OIP.iPvPGJG166ivZnAII4ZS8gHaHa?w=194&h=194&c=7&r=0&o=5&dpr=1.5&pid=1.7..." className="img-fluid rounded-start" alt="..." />
          </div>
          <div className="col-md-8">
            <div className="card-body text-black">
              <h3 className="card-title">{store.user.name} {store.user.last_name}</h3>
              <h5>User Role: {store.user.role}</h5>
              <h5>User name: {store.user.username}</h5>
              <h5>Email: {store.user.email}</h5>
              <h5>Register date: {store.user.register_date}</h5>
              <h5>Membership start date: {store.user.membership_start_date}</h5>
              <h5>Membership end date: {store.user.membership_end_date}</h5>
              <h5>Membership description: {store.user.membership_description}</h5>
            </div>
          </div>
          <div className="d-grid gap-2 d-md-flex justify-content-md-end">
            <Link to="/users"><button className="btn btn-primary me-md-2" type="button">Users</button></Link>
            
          </div>
        </div>
      </div>




    </div>
  );
};

export default Oneuser;
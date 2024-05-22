import React, { useState, useEffect, useContext } from "react"; // Importación de React y algunos hooks
import { Link } from "react-router-dom"; // Importación de Link para la navegación
import { Context } from "../store/appContext"; // Importación del contexto
import styles from "./Home.module.css"; // Importación de estilos CSS


const Users = () => {
  const { store, actions } = useContext(Context)
  useEffect(() => {
    actions.getUsers()
  }, [])
  console.log(store.users)
  return (
    <div className="container">
      <h3 className="d-flex justify-content-center">Users List</h3>
      <div className="d-flex justify-content-center">
        
        <table class="table table-dark table-striped-columns">
          <thead>
            <tr>
              <th scope="col">Id</th>
              <th scope="col">Email</th>
              <th scope="col">Last name</th>
              <th scope="col">Name</th>
              <th scope="col">Username</th>
              <th scope="col">Register date</th>
              <th scope="col">Role</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            {store.users.map((users,index)=>(
            <tr key={index}>
              <th scope="row">{users.id}</th>
              <td>{users.email}</td>
              <td>{users.last_name}</td>
              <td>{users.name}</td>
              <td>{users.username}</td>
              <td>{users.register_date}</td>
              <td>{users.role}</td>
              <td><Link to ={`/user/${users.id}`}>learn more</Link></td>
              
            </tr>
          ))}
          </tbody>
        </table>
      </div>





    </div>
  );
};

export default Users;
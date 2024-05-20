import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";

const AdminCoachView = () => {
    const { actions, store } = useContext(Context);
    const navigate = useNavigate();

    useEffect(() => {
        actions.getClasses()
    }, [])
    console.log(store.training_classes_Data)

    return (

        <div>
            <section className="intro">
                <div className="bg-image h-100" style={{ backgroundColor: "#f5f7fa" }}>
                    <div className="mask d-flex align-items-center h-100">
                        <div className="container">
                            <div className="row justify-content-center">
                                <div className="col-12">
                                    <div className="card shadow-2-strong">
                                        <div className="card-body p-0">
                                            <div className="table-responsive table-scroll" data-mdb-perfect-scrollbar="true" style={{ position: "relative", height: "700px" }}>
                                                <table className="table table-dark mb-0">
                                                    <thead style={{ backgroundColor: "#393939" }}>
                                                        <tr className="text-uppercase text-success">
                                                            <th scope="col">Training ID</th>
                                                            <th scope="col">Name</th>
                                                            <th scope="col">Description</th>
                                                            <th scope="col">Instructor</th>
                                                            <th scope="col">Instructor ID</th>
                                                            <th scope="col">Date class</th>
                                                            <th scope="col">Start time</th>
                                                            <th scope="col">Duration minutes</th>
                                                            <th scope="col">Available slots</th>
                                                            
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td>Like a butterflies</td>
                                                            <td>Boxing</td>
                                                            <td>9:00 AM - 11:00 AM</td>
                                                            <td>Aaron Chapman</td>
                                                            <td>10</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}

export default AdminCoachView;



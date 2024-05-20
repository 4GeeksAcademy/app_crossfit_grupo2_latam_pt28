import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";

const BookingView = () => {
    const { actions, store } = useContext(Context);
    const navigate = useNavigate();

    useEffect(() => {
        actions.getBookings()
    }, [])
    console.log(store.bookingData)

    return (

        <div>



            <table className="table table-dark table-striped table-responsive">
                <thead>
                    <tr>
                        <th scope="col">Booking Date</th>
                        <th scope="col">Booking Id</th>
                        <th scope="col">Class Id </th>
                        <th scope="col">Class Instructor </th>
                        <th scope="col">Class Name </th>
                        <th scope="col">Class Start Time </th>
                        <th scope="col">Class Date </th>

                    </tr>
                </thead>


                <tbody>
                    {store.bookingData.map((item) => (
                        <tr key={item.booking_id}>

                            <td>{item.booking_date}</td>
                            <td>{item.booking_id}</td>
                            <td>{item.class_id}</td>
                            <td>{item.class_instructor}</td>
                            <td>{item.class_user}</td>
                            <td>{item.class_name}</td>
                            <td>{item.class_start_time}</td>
                            <td>{item.date_class}</td>
                        </tr>
                          ))}
                    </tbody>
            </table>
        </div>
    )
}

export default BookingView;

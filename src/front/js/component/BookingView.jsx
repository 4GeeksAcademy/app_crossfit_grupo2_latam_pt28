
import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";



const BookingView = () => {
    const { actions, store } = useContext(Context);
    const [formData, setFormData] = useState({
        name: "",
        booking_user_name: "",
        class_id: "",
        class_name: "",
        dateTime_class: "",
        class_start_time: "",
        class_instructor: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }; 
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
                        <th scope="col">booking status </th>
                        <th scope="col">Class Id </th>
                        <th scope="col">Class Instructor </th>
                        <th scope="col">Class user </th>
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
                            <td>{item.class_name}</td>
                            <td>{item.booking_user_name}</td>
                            <td>{item.class_start_time}</td>
                            <td>{item.dateTime_class}</td>
                            <td>{item.booking_status}</td>

                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
};
export default BookingView;
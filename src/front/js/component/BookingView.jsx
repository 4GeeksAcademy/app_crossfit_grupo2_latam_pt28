import React, { useState, useEffect, useContext } from "react";
import { Context } from "../store/appContext";
import { Table, Form, InputGroup, FormControl, Button } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import styles from './BookingView.module.css';
import moment from "moment";


const BookingView = () => {
    const { actions, store } = useContext(Context);
    const [search, setSearch] = useState('');
    const [filteredBookings, setFilteredBookings] = useState([]);

    useEffect(() => {
        actions.getBookings();
    }, []);

    const FormattedDate = ({ dateTime }) => {
        return <span>{moment(dateTime).format('LL')}</span>;
    };


    useEffect(() => {
        if (store.bookingData) {
            setFilteredBookings(store.bookingData.filter(booking =>
                booking.booking_user_name.toLowerCase().includes(search.toLowerCase()) ||
                booking.class_name.toLowerCase().includes(search.toLowerCase()) ||
                booking.class_instructor.toLowerCase().includes(search.toLowerCase()) ||
                booking.booking_date.toLowerCase().includes(search.toLowerCase())
            ));
        }
    }, [search, store.bookingData]);

    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredBookings);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
        XLSX.writeFile(wb, 'Bookings.xlsx');
    };

    return (
        <div className={styles.tableContainer}>
            <h1 className={styles.titleComponent}>Bookings</h1>
            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Search by user, class name, instructor, date"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </InputGroup>
            <Button variant="outline-secondary" onClick={downloadExcel} className={styles.buttonExcel} title='Download .xlsx'>
                <i className="fa-solid fa-file-excel"></i> Download Excel
            </Button>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th scope="col">Booking Date</th>
                        <th scope="col">Booking Id</th>
                        <th scope="col">Booking Status</th>
                        <th scope="col">Class Id</th>
                        <th scope="col">Class Instructor</th>
                        <th scope="col">Class User</th>
                        <th scope="col">Class Name</th>
                        <th scope="col">Class Start Time</th>
                        <th scope="col">Class Date</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredBookings.map((item) => (
                        <tr key={item.booking_id}>
                            <td><FormattedDate dateTime={item.booking_date} /></td>
                            <td>{item.booking_id}</td>
                            <td>{item.booking_status}</td>
                            <td>{item.class_id}</td>
                            <td>{item.class_instructor}</td>
                            <td>{item.booking_user_name}</td>
                            <td>{item.class_name}</td>
                            <td>{item.class_start_time}</td>
                            <td><FormattedDate dateTime={item.dateTime_class} /></td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default BookingView;

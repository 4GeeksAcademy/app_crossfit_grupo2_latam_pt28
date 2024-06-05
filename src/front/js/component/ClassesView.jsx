import React, { useState, useContext, useEffect } from "react";
import { Context } from "../store/appContext";
import { Form, Row, Col, Button, Modal, InputGroup, FormControl } from "react-bootstrap";
import * as XLSX from 'xlsx';
import styles from "./ClassesView.module.css";
import EditClasses from "./EditClasses.jsx";
import moment from 'moment';

const ClassesView = () => {
    const { actions, store } = useContext(Context);
    const [showModal, setShowModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [filter, setFilter] = useState(""); // Estado para almacenar el texto de búsqueda

    useEffect(() => {
        actions.getClasses();
    }, []);

    const FormattedDate = ({ dateTime }) => {
        return <span>{moment(dateTime).format('LL')}</span>;
    };

    const handlerEdit = (item) => {
        setSelectedClass(item);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedClass(null);
    };

    const formatDateTime = (dateTime) => {
        const date = new Date(dateTime);
        const formattedDate = date.toISOString().slice(0, 16);
        return formattedDate;
    };

    // Función para filtrar las clases basadas en el estado de búsqueda
    const filteredClasses = (classes, isActive) => {
        return classes
            .filter(item => item.Class_is_active === isActive)
            .filter(item => item.name.toLowerCase().includes(filter.toLowerCase()) ||
                item.instructor.toLowerCase().includes(filter.toLowerCase()) ||
                item.description.toLowerCase().includes(filter.toLowerCase()) ||

                moment(item.dateTime_class).format('LL').toLowerCase().includes(filter.toLowerCase()));
    }

    const downloadExcel = () => {
        const dataToExport = store.classesData.map(item => ({
            Name: item.name,
            Description: item.description,
            Instructor: item.instructor,
            Date: moment(item.dateTime_class).format('LL'),
            'Start Time': item.start_time,
            'Duration (minutes)': item.duration_minutes,
            'Available Slots': item.available_slots
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Classes');
        XLSX.writeFile(wb, 'Classes.xlsx');
    };

    return (
        <div className={`container-fluid ${styles.classesViewContainer}`}>
            <h1 className={styles.titleComponent}>Active Classes</h1>
            <InputGroup className="mb-3">
                <FormControl
                    placeholder="Search: Class name, Coach, Description, Date"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </InputGroup>
            <Button variant="outline-secondary" onClick={downloadExcel} className={styles.buttonExcel} title='Download .xlsx'>
                <i className="fa-solid fa-file-excel"></i> Download Excel
            </Button>
            <div className="table-responsive">
                <table className={`table ${styles.table}`}>
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Description</th>
                            <th scope="col">Coach</th>
                            <th className="text-center" scope="col">Date class</th>
                            <th className="text-center" scope="col">Start time</th>
                            <th className="text-center" scope="col">Duration minutes</th>
                            <th className="text-center" scope="col">Available slots</th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {store.classesData && filteredClasses(store.classesData, true).map((item) => (
                            <tr key={item.id} className={styles.tableRow}>
                                <td>{item.name}</td>
                                <td>{item.description}</td>
                                <td>{item.instructor}</td>
                                <td className="text-center"><FormattedDate dateTime={item.dateTime_class} /></td>
                                <td className="text-center">{item.start_time}</td>
                                <td className="text-center">{item.duration_minutes}</td>
                                <td className="text-center">{item.available_slots}</td>
                                <td>
                                    <Button
                                        variant="secondary"
                                        className={styles.editButton}
                                        onClick={() => handlerEdit(item)}
                                    >
                                        Edit class
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h1 className={styles.title}>Canceled Classes</h1>
            <div className="table-responsive">
                <table className={`table ${styles.table}`}>
                    <thead>
                        <tr>
                            <th scope="col">Name</th>
                            <th scope="col">Description</th>
                            <th className="text-center" scope="col">Date class</th>
                            <th className="text-center" scope="col">Start time</th>
                            <th className="text-center" scope="col">Duration minutes</th>
                            <th className="text-center" scope="col">Available slots</th>
                        </tr>
                    </thead>
                    <tbody>
                        {store.classesData && filteredClasses(store.classesData, false).map((item) => (
                            <tr key={item.id} className={styles.tableRow}>
                                <td>{item.name}</td>
                                <td>{item.description}</td>
                                <td className="text-center">{formatDateTime(item.dateTime_class)}</td>
                                <td className="text-center">{item.start_time}</td>
                                <td className="text-center">{item.duration_minutes}</td>
                                <td className="text-center">{item.available_slots}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title className={styles.titlemodal}>Edit class</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedClass && (
                        <EditClasses
                            classData={selectedClass}
                            onClose={handleCloseModal}
                        />
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default ClassesView;

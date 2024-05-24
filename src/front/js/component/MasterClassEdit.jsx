import React, { useState, useContext } from "react";
import { Context } from "../store/appContext";
import { Button, Form, Container, Row, Col } from 'react-bootstrap';
import styles from "./CreateClasses.module.css";



const ClassEdit = () => {
    const { actions, store } = useContext(Context);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        instructor_id: "",
        dateTime_class: "",
        start_time: "",
        duration_minutes: "",
        available_slots: ""

    });

    //useEffect(() => {
    //actions.editClasses(data)
    //}, [])




    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = () => {
        setFormData({ ...formData, createBatch: !formData.createBatch });
    };

    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.createBatch && formData.endDate) {
            const result = await actions.editBatchClasses(formData);
            if (result) {
                setModalMessage(result.message);
                setModalVisible(true);
            } else {
                setModalMessage(result.messageError);
                setModalVisible(true);
            }
        } else {
            const result = await actions.editClasses(formData);
            if (result) {
                setModalMessage(store.creationTrainingClasses.message);
                setModalVisible(true);
            } else {
                setModalMessage(store.creationTrainingClasses.error);
                setModalVisible(true);
            }

        }
        setFormData({
            name: "",
            description: "",
            instructor_id: "",
            dateTime_class: "",
            start_time: "",
            duration_minutes: "",
            available_slots: ""
        });

    };

    const handleModalClose = () => {
        setModalVisible(false);
        actions.resetCreationBooking(); // Acción dedicada para resetear el estado

    };

    return (
        <>
            <Container className={styles.formContainer}>
                <h2>Crear/Modificar clases existentes</h2>
                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control type="text" placeholder="Nombre de clase" name="name" value={formData.name} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Descripcion</Form.Label>
                                <Form.Control type="text" placeholder="Descripcion de la clase" name="description" value={formData.description} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Numero de identificacion del instructor</Form.Label>
                                <Form.Control type="number" placeholder="ID del instructor" name="instructor_id" value={formData.instructor_id} onChange={handleChange} required />
                            </Form.Group>
                        </Col>

                        <Col>
                            <Form.Group>
                                <Form.Label>Fecha y hora de clases</Form.Label>
                                <Form.Control type="datetime-local" name="dateTime_class" value={formData.dateTime_class} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Hora de inicio</Form.Label>
                                <Form.Control type="time" name="class_start_time" value={formData.class_start_time} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">

                        <Col>
                            <Form.Group>
                                <Form.Label>Duracion en minutos</Form.Label>
                                <Form.Control type="time" name="duration_minutes" value={formData.duration_minutes} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Form.Group>
                                <Form.Label>Cupones disponibles</Form.Label>
                                <Form.Control type="number" name="available_slots" value={formData.available_slots} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                    </Row>


                    <Row className="mb-3">
                        <Col xs={6}>
                            <Form.Check type="checkbox" label="Crear lote de clases" checked={formData.createBatch} onChange={handleCheckboxChange} />
                        </Col>
                        {formData.createBatch && (
                            <Col xs={6}>
                                <Form.Group>
                                    <Form.Label>Hasta fecha</Form.Label>
                                    <Form.Control type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                        )}
                    </Row>
                    <Button variant="primary" type="submit">Crear Clase(s)</Button>
                </Form>
            </Container>
            {/* Modal */}
            <div className={`modal fade ${modalVisible ? 'show' : ''}`} style={{ display: modalVisible ? 'block' : 'none' }} tabIndex="-1" id={styles["modal"]}>
                <div className="modal-dialog">
                    <div className={styles["modal-content"]}>
                        <div className="modal-header">
                            <h5 className="modal-title">Registration Status</h5>
                        </div>
                        <div className="modal-body">
                            <p>{modalMessage}</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleModalClose}>Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}



export default ClassEdit;
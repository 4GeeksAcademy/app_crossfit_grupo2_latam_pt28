import React, { useState, useContext } from "react";
import { Context } from "../store/appContext";
import styles from "./MembershipManager.css";
import { Button, Form, Container, Row, Col } from 'react-bootstrap';

const MembershipManager = () => {
    const { actions, store } = useContext(Context);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: 0,
        duration_days: null,
        classes_per_month: null
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const myToken = localStorage.getItem("token");
        const url = `${process.env.BACKEND_URL}/api/memberships`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${myToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setModalMessage(data.message);
                setModalVisible(true);
                setFormData({
                    name: "",
                    description: "",
                    price: 0,
                    duration_days: null,
                    classes_per_month: null
                });
            } else {
                setModalMessage(data.error || "Error al crear la membresía");
                setModalVisible(true);
            }
        } catch (error) {
            console.error("Error creating membership:", error);
            setModalMessage("Error al crear la membresía");
            setModalVisible(true);
        }
    };

    const handleModalClose = () => {
        setModalVisible(false);
    };

    return (
        <>
            <Container className={styles.formContainer}>
                <h2>Administrar Membresías</h2>
                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Nombre"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Descripción</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Descripción"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Precio</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Precio"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Duración (días)</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Duración"
                                    name="duration_days"
                                    value={formData.duration_days}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Clases por mes</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Clases por mes"
                                    name="classes_per_month"
                                    value={formData.classes_per_month}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Button variant="primary" type="submit">
                        Crear Membresía
                    </Button>
                </Form>
            </Container>
            <div
                className={`modal fade ${modalVisible ? 'show' : ''}`}
                style={{ display: modalVisible ? 'block' : 'none' }}
                tabIndex="-1"
                id={styles["modal"]}
            >
                <div className="modal-dialog">
                    <div className={styles["modal-content"]}>
                        <div className="modal-header">
                            <h5 className="modal-title">Membership</h5>
                        </div>
                        <div className="modal-body">
                            <p>{modalMessage}</p>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleModalClose}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MembershipManager;
import React, { useState, useContext } from 'react';
import { Context } from "../store/appContext";
import { Form, Button, Container, Row, Col, Alert } from 'react-bootstrap';
import styles from './UploadForm.module.css';

const UploadForm = () => {
    const { store, actions } = useContext(Context);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setMessage('Please select a file.');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('file', file);

        try {
            const response = await actions.uploadImage(formData);
            if (response.success) {
                setMessage(response.message);
            } else {
                setMessage('Error uploading file.');
            }
        } catch (error) {
            setMessage('Error uploading file.');
        }
    };

    return (
        <Container className={styles.uploadFormContainer}>
            <Row className="justify-content-md-center">
                <Col md={6}>
                    <Form className={styles.uploadForm} onSubmit={handleSubmit}>
                        <h2 className={styles.heading}>Upload Images</h2>
                        {message && <Alert className={styles.message}>{message}</Alert>}
                        <Form.Group controlId="name">
                            <Form.Label className={styles.uploadlabel}>Name:</Form.Label>
                            <Form.Control
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="description">
                            <Form.Label className={styles.uploadlabel}>Description:</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="file">
                            <Form.Label className={styles.uploadlabel}>Choose a file:</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={handleFileChange}
                                accept="image/*"
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit" className={styles.uploadButton}>
                            Upload
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default UploadForm;

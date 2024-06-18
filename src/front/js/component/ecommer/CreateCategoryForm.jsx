import React, { useState, useContext, useEffect } from "react"; // Importa las funciones y hooks de React
import { Context } from "../../store/appContext"; // Importa el contexto de la aplicación
import styles from "./CreateCategoryForm.module.css"; // Importa los estilos CSS
import { Button, Form, Container, Row, Col, Modal, Table } from 'react-bootstrap'; // Importa componentes de React Bootstrap

const CreateCategoryForm = () => {
    const { actions, store } = useContext(Context); // Usa el contexto para acceder a acciones y el store global
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    }); // Define el estado para los datos del formulario
    const [showModal, setShowModal] = useState(false); // Estado para mostrar u ocultar el modal
    const [modalMessage, setModalMessage] = useState(""); // Estado para el mensaje del modal
    const [editingCategory, setEditingCategory] = useState(null); // Estado para la categoría en edición
    const [subcategories, setSubcategories] = useState([]); // Estado para las subcategorías
    const [newSubcategory, setNewSubcategory] = useState(""); // Estado para la nueva subcategoría

    useEffect(() => {
        actions.loadCategories(); // Carga las categorías desde el servidor
        actions.loadSubcategories(); // Carga las subcategorías desde el servidor
    }, []); // El array vacío asegura que esto se ejecute solo una vez al montar el componente

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value }); // Actualiza el estado del formulario según el cambio en los inputs
    };

    const handleSubcategoryChange = (e) => {
        setNewSubcategory(e.target.value); // Actualiza el estado de la nueva subcategoría según el cambio en el input
    };

    const handleAddSubcategory = () => {
        if (newSubcategory.trim() === "") {
            setModalMessage("Subcategory name cannot be empty."); // Muestra un mensaje si el nombre de la subcategoría está vacío
            setShowModal(true); // Muestra el modal
            return;
        }
        setSubcategories([...subcategories, { subcategory_name: newSubcategory }]); // Añade la nueva subcategoría al estado de subcategorías
        setNewSubcategory(""); // Limpia el input de la nueva subcategoría
    };

    const handleRemoveSubcategory = (index) => {
        setSubcategories(subcategories.filter((_, sidx) => index !== sidx)); // Elimina una subcategoría del estado según su índice
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Previene el comportamiento por defecto del formulario
        if (!formData.name) {
            setModalMessage("Category name is required."); // Muestra un mensaje si el nombre de la categoría está vacío
            setShowModal(true); // Muestra el modal
            return;
        }
        const categoryData = { name: formData.name, description: formData.description }; // Crea un objeto con los datos de la categoría

        const result = editingCategory
            ? await actions.editCategory(editingCategory.category_id, categoryData) // Edita la categoría si está en modo edición
            : await actions.createCategory(categoryData); // Crea una nueva categoría si no está en modo edición

        if (result.success) {
            const createdCategoryId = editingCategory ? editingCategory.category_id : result.data.category; // Obtiene el ID de la categoría creada o editada
            if (!editingCategory) {
                for (let subcategory of subcategories) {
                    if (subcategory.subcategory_name !== "") {
                        const subcategoryResult = await actions.createSubCategory({
                            name: subcategory.subcategory_name,
                            description: subcategory.description || "",
                            category_id: createdCategoryId,
                        });

                        if (!subcategoryResult.success) {
                            setModalMessage(subcategoryResult.error); // Muestra un mensaje de error si la creación de la subcategoría falla
                            setShowModal(true); // Muestra el modal
                            return;
                        }
                    }
                }
            } else if (editingCategory) {
                // Eliminar todas las subcategorías existentes para esta categoría
                const existingSubcategories = store.subcategories.filter(sub => sub.category_id === editingCategory.category_id);
                for (let subcategory of existingSubcategories) {
                    await actions.deleteSubCategory(subcategory.subcategory_id);
                }
            }
            setModalMessage(editingCategory ? "Category edited successfully" : "Category created successfully"); // Muestra un mensaje de éxito
            setSubcategories([]); // Limpia las subcategorías
            actions.loadCategories(); // Recarga las categorías
            actions.loadSubcategories(); // Recarga las subcategorías
        } else {
            setModalMessage(result.error); // Muestra un mensaje de error
        }
        setShowModal(true); // Muestra el modal
        setFormData({ name: "", description: "" }); // Limpia los datos del formulario
        setEditingCategory(null); // Limpia la categoría en edición
    };

    const handleCloseModal = () => {
        setShowModal(false); // Oculta el modal
        setModalMessage(""); // Limpia el mensaje del modal
    };

    const handleEditCategory = (category) => {
        setFormData({
            name: category.category_name,
            description: category.category_description,
        }); // Establece los datos del formulario con los datos de la categoría seleccionada
        setEditingCategory(category); // Establece la categoría en edición
        setSubcategories(store.subcategories.filter(sub => sub.category_id === category.category_id)); // Filtra las subcategorías para la categoría seleccionada
    };

    const handleDeleteCategory = async (categoryId) => {
        try {
            const response = await actions.deleteCategory(categoryId); // Elimina la categoría
            if (response.success) {
                setModalMessage("Category successfully deleted"); // Muestra un mensaje de éxito
                actions.loadCategories(); // Recarga las categorías
                actions.loadSubcategories(); // Recarga las subcategorías
            } else {
                setModalMessage(response.error || "An unknown error occurred"); // Muestra un mensaje de error
            }
            setShowModal(true); // Muestra el modal
        } catch (error) {
            setModalMessage(`Error deleting category: ${error.message}`); // Muestra un mensaje de error
            setShowModal(true); // Muestra el modal
        }
    };

    return (
        <Container className={styles.formContainer}>
            <h1 className={styles.titleComponent}>Category Manager</h1>
            <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label className={styles.label}>Category Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className={styles.label}>Description</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label className={styles.label}>Add Subcategory</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Subcategory Name"
                                value={newSubcategory}
                                onChange={handleSubcategoryChange}
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                    <Col xs="auto" className="d-flex align-items-end">
                        <Button variant="secondary" onClick={handleAddSubcategory} className={styles.button}>Add</Button>
                    </Col>
                </Row>
                {subcategories.length > 0 && (
                    <Row className="mb-3">
                        <Col>
                            <ul className={styles.subcategoryList}>
                                {subcategories.map((subcategory, index) => (
                                    <li key={index}>
                                        {subcategory.subcategory_name}
                                        <Button variant="danger" onClick={() => handleRemoveSubcategory(index)} className={styles.removeButton}>Remove</Button>
                                    </li>
                                ))}
                            </ul>
                        </Col>
                    </Row>
                )}
                <Button variant="primary" type="submit" className={styles.button}>
                    {editingCategory ? 'Edit Category' : 'Create Category'}
                </Button>
            </Form>

            <div className="table-responsive">
                <Table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Subcategories</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {store.categories.map((category) => (
                            <tr key={category.category_id} className={styles.tableRow}>
                                <td>{category.category_name}</td>
                                <td>{category.category_description}</td>
                                <td>
                                    <ul>
                                        {store.subcategories
                                            .filter(sub => sub.category_id === category.category_id)
                                            .map(sub => <li key={sub.subcategory_id}>{sub.subcategory_name}</li>)}
                                    </ul>
                                </td>
                                <td>
                                    <Button
                                        variant="primary"
                                        onClick={() => handleEditCategory(category)}
                                        className={styles.editButton}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleDeleteCategory(category.category_id)}
                                        className={styles.deleteButton}
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <Modal show={showModal} onHide={handleCloseModal}>
                <div className={styles.titleModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Category Status</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{modalMessage}</Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Close
                        </Button>
                    </Modal.Footer>
                </div>
            </Modal>
        </Container>
    );
};

export default CreateCategoryForm;

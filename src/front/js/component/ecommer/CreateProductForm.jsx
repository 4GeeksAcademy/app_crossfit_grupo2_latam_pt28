import React, { useState, useContext, useEffect } from "react"; // Importa React y hooks necesarios
import { Context } from "../../store/appContext"; // Importa el contexto de la aplicación
import styles from "./CreateProductForm.module.css"; // Importa los estilos del componente
import { Button, Form, Container, Row, Col, Modal, Table, Image, InputGroup, FormControl } from 'react-bootstrap'; // Importa componentes de react-bootstrap
import Cropper from 'react-easy-crop'; // Importa el componente de recorte de imagen
import * as XLSX from 'xlsx'; // Importa XLSX para exportar a Excel

const CreateProductForm = () => {
    const { actions, store } = useContext(Context); // Obtiene acciones y estado del contexto
    const [formData, setFormData] = useState({ // Define el estado para los datos del formulario
        name: "",
        description: "",
        purchase_price: "",
        price: "",
        stock: "",
        subcategory_id: "",
        is_active: true,
    });
    const [showModal, setShowModal] = useState(false); // Estado para controlar la visibilidad del modal
    const [modalMessage, setModalMessage] = useState(""); // Estado para el mensaje del modal
    const [editingProduct, setEditingProduct] = useState(null); // Estado para el producto en edición
    const [images, setImages] = useState([]); // Estado para las URLs de las imágenes
    const [productImages, setProductImages] = useState([]); // Estado para las imágenes del producto con IDs
    const [croppedAreas, setCroppedAreas] = useState([]); // Estado para las áreas recortadas de las imágenes
    const [currentImageIndex, setCurrentImageIndex] = useState(0); // Estado para el índice de la imagen actual
    const [currentPage, setCurrentPage] = useState(1); // Estado para la página actual de productos
    const [totalPages, setTotalPages] = useState(1); // Estado para el total de páginas
    const [crop, setCrop] = useState({ x: 0, y: 0 }); // Estado para la posición de recorte
    const [zoom, setZoom] = useState(1); // Estado para el zoom de recorte
    const [croppedImages, setCroppedImages] = useState([]); // Estado para los blobs de las imágenes recortadas
    const [hoveredImage, setHoveredImage] = useState(null); // Estado para la imagen ampliada al pasar el mouse
    const [deletedImages, setDeletedImages] = useState([]); // Estado para almacenar los IDs de imágenes eliminadas
    const [search, setSearch] = useState(''); // Estado para la búsqueda de productos
    const [filteredProducts, setFilteredProducts] = useState([]); // Estado para los productos filtrados

    useEffect(() => {
        actions.loadCategories(); // Carga las categorías al montar el componente
        actions.loadSubcategories(); // Carga las subcategorías al montar el componente
        loadProducts(currentPage); // Carga los productos de la página actual
    }, [currentPage]);

    useEffect(() => {
        if (store.products.products) {
            setFilteredProducts(store.products.products.filter(product =>
                product.product_name.toLowerCase().includes(search.toLowerCase()) ||
                product.product_category.toLowerCase().includes(search.toLowerCase()) ||
                product.product_subcategory.toLowerCase().includes(search.toLowerCase())

            ));
        }
    }, [search, store.products.products]);

    const loadProducts = async (page) => {
        try {
            const result = await actions.loadProducts(page); // Llama a la acción para cargar productos
            // console.log(result)
            if (result && result.success) {
                setTotalPages(result.data.pages); // Actualiza el total de páginas si la carga es exitosa
            } else {
                throw new Error('Failed to load products'); // Lanza un error si la carga falla
            }
        } catch (error) {
            console.error('Error loading products:', error); // Muestra un error en la consola si falla la carga
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value }); // Actualiza los datos del formulario en el estado
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files); // Convierte los archivos en un array
        const imageUrls = files.map(file => URL.createObjectURL(file)); // Crea URLs para los archivos
        setImages(imageUrls); // Actualiza el estado de las imágenes
        setCroppedImages([]); // Reinicia las imágenes recortadas
        setCurrentImageIndex(0); // Reinicia el índice de la imagen actual
    };

    const handleCropComplete = (croppedAreaPercentage, croppedAreaPixels) => {
        const newCroppedAreas = [...croppedAreas]; // Copia las áreas recortadas actuales
        newCroppedAreas[currentImageIndex] = croppedAreaPixels; // Actualiza el área recortada de la imagen actual
        setCroppedAreas(newCroppedAreas); // Actualiza el estado de las áreas recortadas
    };

    const handleCropChange = (newCrop) => {
        setCrop(newCrop); // Actualiza la posición de recorte
    };

    const handleZoomChange = (newZoom) => {
        setZoom(newZoom); // Actualiza el zoom de recorte
    };

    const handleCropAccept = async () => {
        if (images[currentImageIndex] && croppedAreas[currentImageIndex]) {
            const croppedImg = await getCroppedImg(images[currentImageIndex], croppedAreas[currentImageIndex]); // Obtiene la imagen recortada
            const newCroppedImages = [...croppedImages]; // Copia las imágenes recortadas actuales
            newCroppedImages[currentImageIndex] = croppedImg; // Actualiza la imagen recortada actual
            setCroppedImages(newCroppedImages); // Actualiza el estado de las imágenes recortadas
            setCurrentImageIndex(currentImageIndex + 1); // Pasa a la siguiente imagen
        }
    };

    const handleCropCancel = () => {
        const newImages = [...images]; // Copia las imágenes actuales
        newImages.splice(currentImageIndex, 1); // Elimina la imagen actual
        setImages(newImages); // Actualiza el estado de las imágenes
        setCroppedAreas([]); // Reinicia las áreas recortadas
        setCroppedImages([]); // Reinicia las imágenes recortadas
        setCurrentImageIndex(0); // Reinicia el índice de la imagen actual
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price || !formData.stock) {
            setModalMessage("Name, price, and stock are required."); // Muestra un mensaje si faltan campos obligatorios
            setShowModal(true); // Muestra el modal
            return;
        }
        const productData = {
            name: formData.name,
            description: formData.description,
            purchase_price: parseFloat(formData.purchase_price),
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            subcategory_id: formData.subcategory_id,
            is_active: formData.is_active,
        };

        try {
            const result = editingProduct
                ? await actions.editProduct(editingProduct.product_id, productData) // Edita el producto si está en modo edición
                : await actions.createProduct(productData); // Crea el producto si no está en modo edición

            if (result && result.success) {
                const createdProductId = editingProduct ? editingProduct.product_id : result.data.product;

                for (const croppedImage of croppedImages) {
                    await actions.uploadProductImage(createdProductId, croppedImage); // Sube las imágenes recortadas
                }

                for (const imageId of deletedImages) {
                    await actions.deleteProductImage(imageId); // Elimina las imágenes seleccionadas para eliminación
                }

                setModalMessage(editingProduct ? "Product edited successfully" : "Product created successfully");
                loadProducts(currentPage);
            } else {
                setModalMessage(result ? result.error : "An unknown error occurred");
            }
            setShowModal(true);
            setFormData({
                name: "",
                description: "",
                purchase_price: "",
                price: "",
                stock: "",
                subcategory_id: "",
                is_active: true,
            });
            setEditingProduct(null);
            setImages([]);
            setCroppedImages([]);
            setDeletedImages([]);
        } catch (error) {
            setModalMessage(`Error: ${error.message}`);
            setShowModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false); // Cierra el modal
        setModalMessage(""); // Reinicia el mensaje del modal
    };

    const handleEditProduct = (product) => {
        setFormData({
            name: product.product_name,
            description: product.product_description,
            purchase_price: product.product_purchase_price,
            price: product.product_price,
            stock: product.product_stock,
            subcategory_id: product.subcategory_id,
            is_active: product.is_active,
        });
        setEditingProduct(product);
        setProductImages(product.product_images.map((url, index) => ({
            id: product.product_image_id[index],
            url: url
        }))); // Carga las imágenes del producto en edición
    };

    const handleDeleteProduct = async (productId) => {
        try {
            const response = await actions.deleteProduct(productId); // Llama a la acción para eliminar el producto
            if (response && response.success) {
                setModalMessage("Product successfully deleted");
                loadProducts(currentPage);
            } else {
                setModalMessage(response ? response.error : "An unknown error occurred");
            }
            setShowModal(true);
        } catch (error) {
            setModalMessage(`Error deleting product: ${error.message}`);
            setShowModal(true);
        }
    };

    // Funciones auxiliares para manejar el recorte de imagen
    const createImage = (url) => {
        return new Promise((resolve, reject) => {
            const image = new window.Image(); // Crea un nuevo objeto de imagen
            image.addEventListener('load', () => resolve(image)); // Resuelve la promesa cuando la imagen se carga
            image.addEventListener('error', (error) => reject(error)); // Rechaza la promesa en caso de error
            image.setAttribute('crossOrigin', 'anonymous'); // Evita problemas de CORS
            image.src = url; // Asigna la URL de la imagen
        });
    };

    const getRadianAngle = (degreeValue) => {
        return (degreeValue * Math.PI) / 180; // Convierte grados a radianes
    };

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc); // Crea un objeto de imagen a partir de la URL
        const canvas = document.createElement('canvas'); // Crea un elemento de canvas
        const ctx = canvas.getContext('2d'); // Obtiene el contexto 2D del canvas

        canvas.width = pixelCrop.width; // Establece el ancho del canvas
        canvas.height = pixelCrop.height; // Establece el alto del canvas

        ctx.drawImage(
            image,            // La imagen fuente que queremos recortar
            pixelCrop.x,      // La coordenada x de la esquina superior izquierda del área de recorte en la imagen fuente
            pixelCrop.y,      // La coordenada y de la esquina superior izquierda del área de recorte en la imagen fuente
            pixelCrop.width,  // El ancho del área de recorte en la imagen fuente
            pixelCrop.height, // El alto del área de recorte en la imagen fuente
            0,                // La coordenada x de la esquina superior izquierda en el canvas donde queremos dibujar la imagen recortada
            0,                // La coordenada y de la esquina superior izquierda en el canvas donde queremos dibujar la imagen recortada
            pixelCrop.width,  // El ancho del área en el canvas donde queremos dibujar la imagen recortada
            pixelCrop.height  // El alto del área en el canvas donde queremos dibujar la imagen recortada
        ); // Dibuja la imagen recortada en el canvas

        return new Promise((resolve) => {
            canvas.toBlob((file) => {
                resolve(file); // Resuelve la promesa con el blob de la imagen
            }, 'image/jpeg');
        });
    };

    const handleMouseEnter = (image) => {
        setHoveredImage(image); // Establece la imagen para mostrar ampliada
    };

    const handleMouseLeave = () => {
        setHoveredImage(null); // Elimina la imagen ampliada
    };

    const handleImageDelete = (imageId) => {
        setDeletedImages([...deletedImages, imageId]); // Agrega la imagen a eliminar al array
        setProductImages(productImages.filter(image => image.id !== imageId)); // Elimina la imagen del estado
    };

    const toggleActiveStatus = () => {
        setFormData({ ...formData, is_active: !formData.is_active });
    };

    const handleCancelEdit = () => {
        setEditingProduct(null); // Reinicia el estado de edición
        setFormData({
            name: "",
            description: "",
            purchase_price: "",
            price: "",
            stock: "",
            subcategory_id: "",
            is_active: true,
        });
        setImages([]);
        setCroppedImages([]);
        setDeletedImages([]);
    };

    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredProducts);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        XLSX.writeFile(wb, 'Products.xlsx');
    };

    return (
        <Container className={styles.formContainer}>
            <h1 className={styles.titleComponent}>Product Manager</h1>
            <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label className={styles.label}>Product Name</Form.Label>
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
                            <Form.Label className={styles.label}>Purchase Price</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Purchase Price"
                                name="purchase_price"
                                value={formData.purchase_price}
                                onChange={handleChange}
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className={styles.label}>Price</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Price"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className={styles.label}>Stock</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Stock"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                required
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label className={styles.label}>Subcategory</Form.Label>
                            <Form.Control
                                as="select"
                                name="subcategory_id"
                                value={formData.subcategory_id}
                                onChange={handleChange}
                                className={styles.input}
                            >
                                <option value="">Select Subcategory</option>
                                {store.categories && store.categories.map(category => (
                                    <optgroup key={category.category_id} label={category.category_name}>
                                        {store.subcategories
                                            .filter(sub => sub.category_id === category.category_id)
                                            .map(sub => (
                                                <option key={sub.subcategory_id} value={sub.subcategory_id}>
                                                    {sub.subcategory_name}
                                                </option>
                                            ))}
                                    </optgroup>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className={styles.label}>Product Images</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                {images.length > 0 && currentImageIndex < images.length && (
                    <>
                        <Row className="mb-3">
                            <Col>
                                <div className={styles.cropContainer}>
                                    <Cropper
                                        image={images[currentImageIndex]}
                                        crop={crop}
                                        zoom={zoom}
                                        aspect={4 / 3}
                                        onCropChange={handleCropChange}
                                        onCropComplete={handleCropComplete}
                                        onZoomChange={handleZoomChange}
                                    />
                                </div>
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Col className="d-flex justify-content-center">
                                <Button onClick={handleCropAccept} variant="success" className="mr-2">Accept</Button>
                                <Button onClick={handleCropCancel} variant="danger">Cancel</Button>
                            </Col>
                        </Row>
                    </>
                )}
                {croppedImages.length > 0 && (
                    <Row className="mb-3">
                        <Col className="text-center">
                            {croppedImages.map((croppedImage, index) => (
                                <img key={index} src={URL.createObjectURL(croppedImage)} alt={`Cropped ${index}`} className={styles.croppedImage} />
                            ))}
                        </Col>
                    </Row>
                )}
                {editingProduct && (
                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label className={styles.label}>Product Status</Form.Label>
                                <div onClick={toggleActiveStatus} style={{ cursor: 'pointer' }}>
                                    {formData.is_active ? (
                                        <i className="fa-solid fa-toggle-on" style={{ color: 'green', fontSize: '24px' }}></i>
                                    ) : (
                                        <i className="fa-solid fa-toggle-off" style={{ color: 'red', fontSize: '24px' }}></i>
                                    )}
                                </div>
                            </Form.Group>
                        </Col>
                    </Row>
                )}
                {editingProduct && productImages.length > 0 && (
                    <div className="edit-images-section">
                        <h5>Product Images</h5>
                        <div className={styles.pillImageList}>
                            {productImages.map((image, index) => (
                                <div key={index} className={styles.pillImageContainer}>
                                    <Image
                                        src={image.url}
                                        thumbnail
                                        className={styles.pillImage}
                                        onMouseEnter={() => handleMouseEnter(image.url)}
                                        onMouseLeave={handleMouseLeave}
                                    />
                                    <i
                                        className={`fa-regular fa-trash-can ${styles.deleteIcon}`}
                                        onClick={() => handleImageDelete(image.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <Button variant="primary" type="submit" className={styles.button}>
                    {editingProduct ? 'Edit Product' : 'Create Product'}
                </Button>
                {editingProduct && (
                    <Button variant="secondary" onClick={handleCancelEdit} className={styles.buttonCancelEdit}>
                        Cancel Edit
                    </Button>
                )}
            </Form>

            <div className="table-responsive">
                <InputGroup>
                    <FormControl
                        placeholder="Search by product name, category, subcategory"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button variant="outline-secondary" onClick={downloadExcel} className={styles.buttonExcel} title='Download .xlsx'>
                        <i className="fa-solid fa-file-excel"></i> Download Excel
                    </Button>
                </InputGroup>
                <Table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Category</th>
                            <th>Subcategory</th>
                            <th>Images</th>
                            <th>Status</th> {/* Nueva columna para el estado */}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.product_id} className={styles.tableRow}>
                                <td>{product.product_name}</td>
                                <td className={styles.tablecolumn}>{product.product_description}</td>
                                <td>{product.product_price}</td>
                                <td>{product.product_stock}</td>
                                <td>{product.product_category}</td>
                                <td>{product.product_subcategory}</td>
                                <td>
                                    {product.product_images && product.product_images.map((image, index) => (
                                        <Image
                                            key={index}
                                            src={image}
                                            thumbnail
                                            className={styles.pillImage}
                                            onMouseEnter={() => handleMouseEnter(image)}
                                            onMouseLeave={handleMouseLeave}
                                        />
                                    ))}
                                </td>
                                <td>
                                    {product.is_active ? (
                                        <i className="fa-solid fa-power-off" style={{ color: 'green' }}></i>
                                    ) : (
                                        <i className="fa-solid fa-power-off" style={{ color: 'red' }}></i>
                                    )}
                                </td>
                                <td>
                                    <Button
                                        variant="primary"
                                        onClick={() => handleEditProduct(product)}
                                        className={styles.editButton}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleDeleteProduct(product.product_id)}
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

            <div className="pagination">
                <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <span> Page {currentPage} of {totalPages} </span>
                <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>

            <Modal show={showModal} onHide={handleCloseModal}>
                <div className={styles.titleModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>Product Status</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{modalMessage}</Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Close
                        </Button>
                    </Modal.Footer>
                </div>
            </Modal>

            {hoveredImage && (
                <div className={styles.hoveredImageContainer}>
                    <Image src={hoveredImage} className={styles.hoveredImage} />
                </div>
            )}
        </Container>
    );
};

export default CreateProductForm;

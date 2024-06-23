import React, { useState, useContext, useEffect } from "react";
import { Context } from "../../store/appContext";
import styles from "./CreateProductForm.module.css";
import { Button, Form, Container, Row, Col, Modal, Table, Image, InputGroup, FormControl, OverlayTrigger, Tooltip } from 'react-bootstrap';
import Cropper from 'react-easy-crop';
import * as XLSX from 'xlsx';

const CreateProductForm = () => {
    const { actions, store } = useContext(Context);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        purchase_price: "",
        price: "",
        stock: "",
        subcategory_id: "",
        is_active: true,
    });
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingVariant, setEditingVariant] = useState(null);
    const [images, setImages] = useState([]);
    const [productImages, setProductImages] = useState([]);
    const [variantImages, setVariantImages] = useState([]);
    const [croppedAreas, setCroppedAreas] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedImages, setCroppedImages] = useState([]);
    const [croppedVariantImages, setCroppedVariantImages] = useState([]);
    const [hoveredImage, setHoveredImage] = useState(null);
    const [deletedImages, setDeletedImages] = useState([]);
    const [deletedVariantImages, setDeletedVariantImages] = useState([]);
    const [search, setSearch] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [attributeName, setAttributeName] = useState("");
    const [attributeValue, setAttributeValue] = useState("");
    const [selectedAttribute, setSelectedAttribute] = useState(null);
    const [attributes, setAttributes] = useState([]);
    const [sku, setSku] = useState("");
    const [variantPrice, setVariantPrice] = useState("");
    const [variantStock, setVariantStock] = useState("");
    const [showAttributeForm, setShowAttributeForm] = useState(false);
    const [showVariants, setShowVariants] = useState({}); // Estado para controlar la visibilidad de las variantes


    useEffect(() => {
        actions.loadCategories();
        actions.loadSubcategories();
        actions.loadAttributes();
        loadProducts(currentPage);
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
            const result = await actions.loadProducts(page);
            if (result && result.success) {
                setTotalPages(result.data.pages);
            } else {
                throw new Error('Failed to load products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const imageUrls = files.map(file => URL.createObjectURL(file));
        setImages(imageUrls);
        setCroppedImages([]);
        setCurrentImageIndex(0);
    };

    const handleVariantImageChange = (e) => {
        const files = Array.from(e.target.files);
        const imageUrls = files.map(file => URL.createObjectURL(file));
        setVariantImages(imageUrls);
        setCroppedVariantImages([]);
        setCurrentImageIndex(0);
    };

    const handleCropComplete = (croppedAreaPercentage, croppedAreaPixels) => {
        const newCroppedAreas = [...croppedAreas];
        newCroppedAreas[currentImageIndex] = croppedAreaPixels;
        setCroppedAreas(newCroppedAreas);
    };

    const handleCropChange = (newCrop) => {
        setCrop(newCrop);
    };

    const handleZoomChange = (newZoom) => {
        setZoom(newZoom);
    };

    const handleCropAccept = async () => {
        const targetImages = editingVariant ? variantImages : images; // Decide based on if you're editing a variant or not
        const targetCroppedImages = editingVariant ? croppedVariantImages : croppedImages;
        const setCroppedFunction = editingVariant ? setCroppedVariantImages : setCroppedImages;

        if (targetImages[currentImageIndex] && croppedAreas[currentImageIndex]) {
            try {
                const croppedImg = await getCroppedImg(targetImages[currentImageIndex], croppedAreas[currentImageIndex]);
                const newCroppedImages = [...targetCroppedImages, croppedImg];
                setCroppedFunction(newCroppedImages);
                if (currentImageIndex + 1 < targetImages.length) {
                    setCurrentImageIndex(currentImageIndex + 1);
                } else {
                    // Reset or handle end of cropping
                    setCurrentImageIndex(0);
                    if (editingVariant) {
                        setVariantImages([]); // or handle as needed
                    } else {
                        setImages([]); // or handle as needed
                    }
                }
            } catch (error) {
                console.error("Error cropping image:", error);
            }
        }
    };

    const handleCropCancel = () => {
        const targetImages = editingVariant ? variantImages : images;
        const setImagesFunction = editingVariant ? setVariantImages : setImages;

        const newImages = targetImages.filter((_, index) => index !== currentImageIndex);
        setImagesFunction(newImages);

        if (currentImageIndex + 1 < targetImages.length) {
            setCurrentImageIndex(currentImageIndex + 1);
        } else {
            setCurrentImageIndex(0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.price || !formData.stock) {
            setModalMessage("Name, price, and stock are required.");
            setShowModal(true);
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
                ? await actions.editProduct(editingProduct.product_id, productData)
                : await actions.createProduct(productData);

            if (result && result.success) {
                const createdProductId = editingProduct ? editingProduct.product_id : result.data.product;

                for (const croppedImage of croppedImages) {
                    await actions.uploadProductImage(createdProductId, croppedImage);
                }

                for (const imageId of deletedImages) {
                    await actions.deleteProductImage(imageId);
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

    const handleVariantSubmit = async (e) => {
        e.preventDefault();
        if (!sku || !variantPrice || !variantStock) {
            setModalMessage("SKU, price, and stock are required for variants.");
            setShowModal(true);
            return;
        }

        try {
            // Crear valor del atributo si es necesario
            let attribute_value_id;
            if (attributeValue) {
                const valueResponse = await actions.createAttributeValue(selectedAttribute, { value: attributeValue });
                if (valueResponse.success) {
                    attribute_value_id = valueResponse.data.value.attribute_value_id;
                } else {
                    setModalMessage(valueResponse.error);
                    setShowModal(true);
                    return;
                }
            }

            const variantData = {
                product_id: editingProduct.product_id,
                sku,
                price: parseFloat(variantPrice),
                stock: parseInt(variantStock),
                attributes: [
                    {
                        attribute_id: selectedAttribute,
                        attribute_value_id
                    }
                ]
            };

            const result = editingVariant
                ? await actions.editProductVariant(editingVariant.variant_id, variantData)
                : await actions.createProductVariant(editingProduct.product_id, variantData);

            if (result && result.success) {
                const createdVariantId = editingVariant ? editingVariant.variant_id : result.data.variant;

                for (const croppedImage of croppedVariantImages) {
                    await actions.uploadVariantImage(createdVariantId, croppedImage);
                }

                for (const imageId of deletedVariantImages) {
                    await actions.deleteVariantImage(imageId);
                }

                setModalMessage(editingVariant ? "Variant edited successfully" : "Variant created successfully");
                actions.loadProductVariants(editingProduct.product_id);
            } else {
                setModalMessage(result ? result.error : "An unknown error occurred");
            }
            setShowModal(true);
            setSku("");
            setVariantPrice("");
            setVariantStock("");
            setAttributes([]);
            setEditingVariant(null);
            setVariantImages([]);
            setCroppedVariantImages([]);
            setDeletedVariantImages([]);
        } catch (error) {
            setModalMessage(`Error: ${error.message}`);
            setShowModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setModalMessage("");
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
        })));

        actions.loadProductVariants(product.product_id);
    };

    const handleDeleteProduct = async (productId) => {
        try {
            const response = await actions.deleteProduct(productId);
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
            const image = new window.Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => reject(error));
            image.setAttribute('crossOrigin', 'anonymous');
            image.src = url;
        });
    };

    const getRadianAngle = (degreeValue) => {
        return (degreeValue * Math.PI) / 180;
    };

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        return new Promise((resolve) => {
            canvas.toBlob((file) => {
                resolve(file);
            }, 'image/jpeg');
        });
    };

    const handleMouseEnter = (image) => {
        setHoveredImage(image);
    };

    const handleMouseLeave = () => {
        setHoveredImage(null);
    };

    const handleImageDelete = (imageId) => {
        setDeletedImages([...deletedImages, imageId]);
        setProductImages(productImages.filter(image => image.id !== imageId));
    };

    const handleVariantImageDelete = (imageId) => {
        setDeletedVariantImages([...deletedVariantImages, imageId]);
        setVariantImages(variantImages.filter(image => image.id !== imageId));
    };

    const toggleActiveStatus = () => {
        setFormData({ ...formData, is_active: !formData.is_active });
    };

    const handleCancelEdit = () => {
        setEditingProduct(null);
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

    const handleCancelEditVariant = () => {
        setEditingVariant(null);
        setSku("");
        setVariantPrice("");
        setVariantStock("");
        setAttributes([]);
        setVariantImages([]);
        setCroppedVariantImages([]);
        setDeletedVariantImages([]);
        setCurrentImageIndex(0); // Asegurarse de resetear el índice de la imagen
    };


    const downloadExcel = () => {
        const ws = XLSX.utils.json_to_sheet(filteredProducts);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Products');
        XLSX.writeFile(wb, 'Products.xlsx');
    };

    const handleAddAttribute = async () => {
        if (attributeName) {
            const response = await actions.createAttribute({ name: attributeName });
            setModalMessage(response.success ? "Attribute created successfully" : response.error);
            setShowModal(true);
            setAttributeName("");
            actions.loadAttributes();
        }
    };

    const handleAddAttributeValue = async () => {
        if (selectedAttribute && attributeValue) {
            const response = await actions.createAttributeValue(selectedAttribute, { value: attributeValue });
            setModalMessage(response.success ? "Attribute value created successfully" : response.error);
            setShowModal(true);
            setAttributeValue("");
            actions.loadAttributeValues(selectedAttribute);
        }
    };

    const handleAttributeChange = (index, field, value) => {
        const updatedAttributes = [...attributes];
        updatedAttributes[index][field] = value;
        setAttributes(updatedAttributes);
    };

    const handleEditVariant = (variant) => {
        setSku(variant.sku);
        setVariantPrice(variant.price);
        setVariantStock(variant.stock);
        setAttributes(variant.attributes);
        setEditingVariant(variant);
        setVariantImages(variant.images.map((url, index) => ({
            id: variant.variant_image_id[index],
            url: url
        })));
    };

    const handleDeleteVariant = async (variantId) => {
        try {
            const response = await actions.deleteProductVariant(variantId);
            if (response && response.success) {
                setModalMessage("Variant successfully deleted");
                actions.loadProductVariants(editingProduct.product_id);
            } else {
                setModalMessage(response ? response.error : "An unknown error occurred");
            }
            setShowModal(true);
        } catch (error) {
            setModalMessage(`Error deleting variant: ${error.message}`);
            setShowModal(true);
        }
    };

    const toggleVariantVisibility = async (productId) => {
        setShowVariants(prevState => ({
            ...prevState,
            [productId]: !prevState[productId]
        }));

        if (!showVariants[productId]) {
            await actions.loadProductVariants(productId);
        }
    };
    const toggleAttributeForm = () => {
        setShowAttributeForm(!showAttributeForm);
    };

    const renderTooltip = (message) => (
        <Tooltip>
            {message}
        </Tooltip>
    );

    return (
        <Container className={styles.formContainer}>
            <h1 className={styles.titleComponent}>Product Manager</h1>
            <Button onClick={toggleAttributeForm} className={styles.button}>
                <i className="fa-brands fa-product-hunt"></i> Crear nuevo Atributo
            </Button>
            {showAttributeForm && (
                <Row className="mb-3">
                    <Col>
                        <Form.Group>
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip("Ingrese el nombre del atributo. Ejemplo: Color, Tamaño, Material, Talla")}
                            >
                                <Form.Label className={styles.label}>Nombre del Atributo</Form.Label>
                            </OverlayTrigger>
                            <Form.Control
                                type="text"
                                placeholder="Nombre del Atributo"
                                value={attributeName}
                                onChange={(e) => setAttributeName(e.target.value)}
                                className={styles.input}
                            />
                            <Button onClick={handleAddAttribute} className={styles.button}>Agregar Atributo</Button>
                        </Form.Group>
                    </Col>
                </Row>
            )}
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

            <div>
                <h3>Variantes de producto</h3>
                <Row className="mb-3">
                    <Col>
                        <Form.Group>
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip("Ingrese el SKU de la variante del producto. Ejemplo: SHOE-BLK-42-CUERO-XXL")}
                            >
                                <Form.Label className={styles.label}>SKU</Form.Label>
                            </OverlayTrigger>
                            <Form.Control
                                type="text"
                                placeholder="SKU"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip("Ingrese el precio de la variante del producto")}
                            >
                                <Form.Label className={styles.label}>Precio de la Variante</Form.Label>
                            </OverlayTrigger>
                            <Form.Control
                                type="number"
                                placeholder="Precio"
                                value={variantPrice}
                                onChange={(e) => setVariantPrice(e.target.value)}
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip("Ingrese el stock de la variante del producto")}
                            >
                                <Form.Label className={styles.label}>Stock de la Variante</Form.Label>
                            </OverlayTrigger>
                            <Form.Control
                                type="number"
                                placeholder="Stock"
                                value={variantStock}
                                onChange={(e) => setVariantStock(e.target.value)}
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <Form.Label className={styles.label}>Variant Images</Form.Label>
                            <Form.Control
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleVariantImageChange}
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <Row className="mb-3">
                    <Col>
                        <Form.Group>
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip("Seleccione un atributo existente")}
                            >
                                <Form.Label className={styles.label}>Seleccionar Atributo</Form.Label>
                            </OverlayTrigger>
                            <Form.Control
                                as="select"
                                value={selectedAttribute}
                                onChange={(e) => setSelectedAttribute(e.target.value)}
                                className={styles.input}
                            >
                                <option value="">Seleccionar Atributo</option>
                                {store.attributes.map(attr => (
                                    <option key={attr.attribute_id} value={attr.attribute_id}>{attr.attribute_name}</option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    </Col>
                    <Col>
                        <Form.Group>
                            <OverlayTrigger
                                placement="top"
                                overlay={renderTooltip("Ingrese el valor del atributo. Ejemplo: Negro (para el atributo Color), 42 (para el atributo Tamaño), Cuero (para el atributo Material), xxl (para el atributo Talla)")}
                            >
                                <Form.Label className={styles.label}>Valor del Atributo</Form.Label>
                            </OverlayTrigger>
                            <Form.Control
                                type="text"
                                placeholder="Valor del Atributo"
                                value={attributeValue}
                                onChange={(e) => setAttributeValue(e.target.value)}
                                className={styles.input}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                {variantImages.length > 0 && currentImageIndex < variantImages.length && (
                    <>
                        <Row className="mb-3">
                            <Col>
                                <div className={styles.cropContainer}>
                                    <Cropper
                                        image={variantImages[currentImageIndex]}
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
                {croppedVariantImages.length > 0 && (
                    <Row className="mb-3">
                        <Col className="text-center">
                            {croppedVariantImages.map((croppedImage, index) => (
                                <img key={index} src={URL.createObjectURL(croppedImage)} alt={`Cropped ${index}`} className={styles.croppedImage} />
                            ))}
                        </Col>
                    </Row>
                )}
                {editingVariant && variantImages.length > 0 && (
                    <div className="edit-images-section">
                        <h5>Variant Images</h5>
                        <div className={styles.pillImageList}>
                            {variantImages.map((image, index) => (
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
                                        onClick={() => handleVariantImageDelete(image.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {attributes.map((attr, index) => (
                    <Form.Group key={index}>
                        <Form.Label className={styles.label}>{attr.attribute_name}</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Valor del Atributo"
                            value={attr.attribute_value}
                            onChange={(e) => handleAttributeChange(index, 'attribute_value', e.target.value)}
                            className={styles.input}
                        />
                    </Form.Group>
                ))}

                <Button onClick={handleVariantSubmit} className={styles.button}>
                    {editingVariant ? 'Actualizar Variante' : 'Agregar Variante'}
                </Button>
                {editingVariant && (
                    <Button variant="secondary" onClick={handleCancelEditVariant} className={styles.buttonCancelEdit}>
                        Cancel Edit
                    </Button>
                )}
                {editingProduct && (
                    <Table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>SKU</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Atributos</th>
                                <th>Imágenes</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {store.variants.map((variant, index) => (
                                <tr key={index}>
                                    <td>{variant.product_name}</td>
                                    <td>{variant.sku}</td>
                                    <td>{variant.price}</td>
                                    <td>{variant.stock}</td>
                                    <td>
                                        {variant.attributes.map(attr => (
                                            <span key={attr.attribute_id}>{attr.attribute_name}: {attr.attribute_value}, </span>
                                        ))}
                                    </td>
                                    <td>
                                        {variant.images && variant.images.map((image, index) => (
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
                                        <Button
                                            variant="primary"
                                            onClick={() => handleEditVariant(variant)}
                                            className={styles.editButton}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => handleDeleteVariant(variant.variant_id)}
                                            className={styles.deleteButton}
                                        >
                                            Eliminar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </div>

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
                            <th>Variants</th> {/* Nueva columna para el botón de variantes */}
                            <th>Category</th>
                            <th>Subcategory</th>
                            <th>Images</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <React.Fragment key={product.product_id}>
                                <tr className={styles.tableRow}>
                                    <td>{product.product_name}</td>
                                    <td className={styles.tablecolumn}>{product.product_description}</td>
                                    <td>{product.product_price}</td>
                                    <td>{product.product_stock}</td>
                                    <td>
                                        <Button
                                            variant="link"
                                            onClick={() => toggleVariantVisibility(product.product_id)}
                                            className={styles.button}
                                        >
                                            {showVariants[product.product_id] ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
                                        </Button>
                                    </td>
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
                                            Editar
                                        </Button>
                                        <Button
                                            variant="danger"
                                            onClick={() => handleDeleteProduct(product.product_id)}
                                            className={styles.deleteButton}
                                        >
                                            Eliminar
                                        </Button>
                                    </td>
                                </tr>
                                {showVariants[product.product_id] && (
                                    <tr>
                                        <td colSpan="10">
                                            <Table className={`${styles.table} ${styles.variantTable}`}>
                                                <thead>
                                                    <tr>
                                                        <th>SKU</th>
                                                        <th>Precio</th>
                                                        <th>Stock</th>
                                                        <th>Atributos</th>
                                                        <th>Imágenes</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {store.variants
                                                        .filter(variant => variant.product_id === product.product_id)
                                                        .map((variant, index) => (
                                                            <tr key={index}>
                                                                <td>{variant.sku}</td>
                                                                <td>{variant.price}</td>
                                                                <td>{variant.stock}</td>
                                                                <td>
                                                                    {variant.attributes.map(attr => (
                                                                        <span key={attr.attribute_id}>{attr.attribute_name}: {attr.attribute_value}, </span>
                                                                    ))}
                                                                </td>
                                                                <td>
                                                                    {variant.images && variant.images.map((image, index) => (
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
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </Table>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
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

import React, { useEffect, useContext } from 'react';
import { Context } from '../store/appContext';
import Card from 'react-bootstrap/Card';
import styles from './ImageGallery.module.css'; // Asegúrate de crear este archivo CSS y definir los estilos

const ImageGallery = () => {
    const { store, actions } = useContext(Context);

    useEffect(() => {
        actions.fetchImages();
    }, [actions]);

    return (
        <div className={styles.galleryContainer}>
            {store.images.map((image, index) => (
                <Card key={index} className={styles.card}>
                    <Card.Img variant="top" src={image.img_url} alt={image.name} className={styles.image} />
                    <Card.Body>
                        <Card.Title className={styles.title}>{image.name}</Card.Title>
                        <Card.Text className={styles.description}>{image.description}</Card.Text>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default ImageGallery;

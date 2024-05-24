// Importa las dependencias necesarias de React y React-Bootstrap
import React, { useState, useContext, useEffect } from 'react';
import { Modal, Button, Form, DropdownButton, Dropdown, Alert } from 'react-bootstrap';
import { Context } from '../store/appContext';
import styles from "./MembershipPurchase.module.css"; // Importa los estilos CSS

// Define el componente de compra de membresía
const MembershipPurchase = () => {
    const { store, actions } = useContext(Context); // Obtiene el estado global y las acciones del contexto
    const [showSelectionModal, setShowSelectionModal] = useState(false); // Estado para mostrar el modal de selección de membresía
    const [selectedMembership, setSelectedMembership] = useState(null); // Estado para la membresía seleccionada
    const [paymentMethod, setPaymentMethod] = useState(''); // Estado para el método de pago seleccionado
    const [creditCardDetails, setCreditCardDetails] = useState({
        cardNumber: '',
        cardHolderName: '',
        expirationDate: '',
        cvv: '',
        cardType: ''
    }); // Estado para los detalles de la tarjeta de crédito
    const [processing, setProcessing] = useState(false); // Estado para indicar si se está procesando el pago
    const [purchaseResult, setPurchaseResult] = useState(null); // Estado para el resultado de la compra

    // Descomentar si necesitas cargar las membresías desde una API
    // useEffect(() => {
    //     actions.loadMemberships();
    // }, []);

    // Maneja el clic del botón para comprar una membresía
    const handleBuyClick = () => {
        // Verifica si el usuario ya tiene una membresía activa
        if (store.uploadedUserData.active_membership_is_active !== "No Activa") {
            alert('You already have an active membership!'); // Alerta al usuario si ya tiene una membresía activa
        } else {
            setShowSelectionModal(true); // Muestra el modal de selección de membresía
        }
    };

    // Maneja la selección de una membresía
    const handleMembershipSelect = (membership) => {
        setSelectedMembership(membership); // Establece la membresía seleccionada
        setShowSelectionModal(false); // Oculta el modal de selección de membresía
    };

    // Maneja los cambios en los campos de entrada de la tarjeta de crédito
    const handleInputChange = (event) => {
        setCreditCardDetails({
            ...creditCardDetails,
            [event.target.name]: event.target.value // Actualiza los detalles de la tarjeta de crédito
        });
    };

    // Maneja la presentación del formulario de pago
    const handleFormSubmit = async (event) => {
        event.preventDefault(); // Previene la acción por defecto del formulario

        // Verifica si se ha seleccionado un método de pago
        if (!paymentMethod) {
            alert('Please select a payment method.');
            return;
        }

        // Verifica si se han completado todos los detalles de la tarjeta de crédito si el método de pago no es en efectivo
        if (paymentMethod !== 'cash' && (!creditCardDetails.cardNumber || !creditCardDetails.expirationDate || !creditCardDetails.cvv || !creditCardDetails.cardType)) {
            alert('Please complete all payment details.');
            return;
        }

        setProcessing(true); // Indica que se está procesando el pago

        // Crea un objeto con los datos del pago
        const paymentData = {
            amount: selectedMembership.price,
            payment_method: paymentMethod,
            ...(paymentMethod !== 'cash' && {
                card_number: creditCardDetails.cardNumber,
                cardholder_name: creditCardDetails.cardHolderName,
                expiration_date: creditCardDetails.expirationDate,
                cvv: creditCardDetails.cvv,
                card_type: creditCardDetails.cardType
            })
        };

        console.log(paymentData); // Muestra los datos del pago en la consola

        // Llama a la acción para realizar la compra de la membresía
        const result = await actions.purchaseMembership({
            membership_id: selectedMembership.id,
            payment_data: paymentData
        });

        setPurchaseResult(result); // Establece el resultado de la compra
        setProcessing(false); // Indica que se ha terminado de procesar el pago
    };

    // Renderiza el formulario de la tarjeta de crédito
    const renderCreditCardForm = () => (
        <>
            <Form.Group>
                <Form.Label>Card Holder Name</Form.Label>
                <Form.Control type="text" placeholder="Card Holder Name" name="cardHolderName" value={creditCardDetails.cardHolderName} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group>
                <Form.Label>Card Number</Form.Label>
                <Form.Control type="text" placeholder="Card Number" name="cardNumber" value={creditCardDetails.cardNumber} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group>
                <Form.Label>Card Type</Form.Label>
                <div key={`inline-radio`} className="mb-3">
                    <Form.Check inline label={<i className="fa-brands fa-cc-visa"></i>} name="cardType" type="radio" id={`visa`} value="visa" checked={creditCardDetails.cardType === 'visa'} onChange={handleInputChange} required />
                    <Form.Check inline label={<i className="fa-brands fa-cc-mastercard"></i>} name="cardType" type="radio" id={`mastercard`} value="mastercard" checked={creditCardDetails.cardType === 'mastercard'} onChange={handleInputChange} required />
                    <Form.Check inline label={<i className="fa-brands fa-cc-amex"></i>} name="cardType" type="radio" id={`amex`} value="amex" checked={creditCardDetails.cardType === 'amex'} onChange={handleInputChange} required />
                </div>
            </Form.Group>
            <Form.Group>
                <Form.Label>Expiration Date</Form.Label>
                <Form.Control type="text" placeholder="MM/YY" name="expirationDate" value={creditCardDetails.expirationDate} onChange={handleInputChange} required />
            </Form.Group>
            <Form.Group>
                <Form.Label>CVV</Form.Label>
                <Form.Control type="text" placeholder="CVV" name="cvv" value={creditCardDetails.cvv} onChange={handleInputChange} required />
            </Form.Group>
        </>
    );

    // Renderiza el componente
    return (
        <>
            <Button className={styles.buttonBuy} onClick={handleBuyClick}>Buy Membership</Button>
            {showSelectionModal && (
                <Modal show={true} onHide={() => setShowSelectionModal(false)} className={styles.modal}>
                    <Modal.Header closeButton className={styles.modalHeader}>
                        <Modal.Title>Select Membership</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className={styles.modalBody}>
                        {store.memberships.map(membership => (
                            <p key={membership.id} className={styles.membershipItem} onClick={() => handleMembershipSelect(membership)}>
                                {membership.name} - ${membership.price}
                            </p>
                        ))}
                    </Modal.Body>
                </Modal>
            )}
            {selectedMembership && (
                <Modal show={true} onHide={() => setSelectedMembership(null)} className={styles.modal}>
                    <Modal.Header closeButton className={styles.modalHeader}>
                        <Modal.Title>Payment Checkout</Modal.Title>
                    </Modal.Header>
                    {processing && <Alert className={styles.alertProcessing}>Processing...</Alert>}
                    {purchaseResult && (
                        <Alert className={purchaseResult.success ? styles.alertResultSuccess : styles.alertResultDanger}>
                            {purchaseResult.success ? `Purchase successful! Payment ID: ${purchaseResult.data.payment}` : `Purchase failed: ${purchaseResult.error}`}
                        </Alert>
                    )}
                    <Modal.Body className={styles.modalBody}>
                        <Form onSubmit={handleFormSubmit}>
                            <Form.Group>
                                <Form.Label>Payment Method</Form.Label>
                                <DropdownButton id="dropdown-payment-method" title={paymentMethod || 'Select Method'} className={styles.paymentMethodDropdown}>
                                    <Dropdown.Item onClick={() => setPaymentMethod('credit_card')}><i className="fa-solid fa-credit-card"></i> Credit Card</Dropdown.Item>
                                    <Dropdown.Item onClick={() => setPaymentMethod('debit_card')}><i className="fa-solid fa-credit-card"></i> Debit Card</Dropdown.Item>
                                    <Dropdown.Item onClick={() => setPaymentMethod('paypal')}><i className="fa-brands fa-paypal"></i> PayPal</Dropdown.Item>
                                    {['admin', 'master'].includes(store.dataRole) && (
                                        <Dropdown.Item onClick={() => setPaymentMethod('cash')}><i className="fa-regular fa-money-bill-1"></i> Cash</Dropdown.Item>
                                    )}
                                </DropdownButton>
                            </Form.Group>
                            {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && renderCreditCardForm()}
                            <Button type="submit">Process Payment</Button>
                        </Form>
                    </Modal.Body>
                </Modal>
            )}
        </>
    );
};

export default MembershipPurchase;

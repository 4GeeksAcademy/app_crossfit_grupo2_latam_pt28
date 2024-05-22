import React, { useState, useContext, useEffect } from 'react';
import { Modal, Button, Form, DropdownButton, Dropdown, Alert } from 'react-bootstrap';
import { Context } from '../store/appContext';
import styles from "./MembershipPurchase.module.css";

const MembershipPurchase = () => {
    const { store, actions } = useContext(Context);
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [selectedMembership, setSelectedMembership] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [creditCardDetails, setCreditCardDetails] = useState({
        cardNumber: '',
        cardHolderName: '',
        expirationDate: '',
        cvv: '',
        cardType: ''
    });
    const [processing, setProcessing] = useState(false);
    const [purchaseResult, setPurchaseResult] = useState(null);

    useEffect(() => {
        actions.loadMemberships();
    }, []);

    const handleBuyClick = () => {
        if (store.uploadedUserData.active_membership_is_active !== "No Activa") {
            alert('You already have an active membership!');
        } else {
            setShowSelectionModal(true);
        }
    };

    const handleMembershipSelect = (membership) => {
        setSelectedMembership(membership);
        setShowSelectionModal(false);
    };

    const handleInputChange = (event) => {
        setCreditCardDetails({
            ...creditCardDetails,
            [event.target.name]: event.target.value
        });
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        // Asegúrate de que se seleccionó un método de pago
        if (!paymentMethod) {
            alert('Please select a payment method.');
            return;
        }
        if(paymentMethod !== 'cash' &&  (!paymentMethod || !creditCardDetails.cardNumber || !creditCardDetails.expirationDate || !creditCardDetails.cvv || !creditCardDetails.cardType)) {
            alert('Please complete all payment details.');
            return;
        }
        setProcessing(true);
        const paymentData = {
            amount: selectedMembership.price,
            payment_method: paymentMethod,
            ...(paymentMethod !== 'cash' && {
            card_number: creditCardDetails.cardNumber,
            cardholder_name: creditCardDetails.cardHolderName,
            expiration_date: creditCardDetails.expirationDate,
            cvv: creditCardDetails.cvv,
            card_type: creditCardDetails.cardType})
        };
        
        console.log(paymentData)
        const result = await actions.purchaseMembership({
            membership_id: selectedMembership.id,
            payment_data: paymentData
        });
        setPurchaseResult(result);
        setProcessing(false);
    };

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
                                    <Dropdown.Item onClick={() => setPaymentMethod('credit_card')}><i class="fa-solid fa-credit-card"></i> Credit Card</Dropdown.Item>
                                    <Dropdown.Item onClick={() => setPaymentMethod('debit_card')}><i class="fa-solid fa-credit-card"></i> Debit Card</Dropdown.Item>
                                    <Dropdown.Item onClick={() => setPaymentMethod('paypal')}><i class="fa-brands fa-paypal"></i> PayPal</Dropdown.Item>
                                    <Dropdown.Item onClick={() => setPaymentMethod('cash')}><i class="fa-regular fa-money-bill-1"></i> Cash</Dropdown.Item>
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
// ReceiveMessages.jsx
import React, { useState, useEffect } from 'react';
import styles from './Messages.module.css';

function ReceiveMessages() {
  const [messages, setMessages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const response = await fetch(`${process.env.BACKEND_URL}/api/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}` // Asegúrate de manejar la autenticación adecuadamente
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data.received);
      }
    };

    fetchMessages();
  }, []);

  const openModal = (message) => {
    setSelectedMessage(message);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Received Messages</h1>
        <span className={styles.badge}>{messages.length}</span>
      </div>
      <ul className={styles.messagelist}>
        {messages.map((msg, idx) => (
          <li key={idx} onClick={() => openModal(msg)} className={styles.message}>
            From: {msg.from}, Content: {msg.content.substring(0, 30)}...
          </li>
        ))}
      </ul>
      {modalOpen && (
        <div>
          <div className={styles.overlay} onClick={closeModal}></div>
          <div className={styles.modal}>
            <h2>Message from {selectedMessage.from}</h2>
            <p>{selectedMessage.content}</p>
            <button onClick={closeModal} className={styles.button}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceiveMessages;

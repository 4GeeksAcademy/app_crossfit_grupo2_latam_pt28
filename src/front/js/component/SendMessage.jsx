// SendMessage.jsx
import React, { useState } from 'react';
import styles from './Messages.module.css';

function SendMessage() {
  const [recipientId, setRecipientId] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    const response = await fetch(`${process.env.BACKEND_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`, // Asegúrate de manejar la autenticación adecuadamente
      },
      body: JSON.stringify({ recipient_id: recipientId, content })
    });
    const data = await response.json();
    console.log(data)
    if (response.ok) {
      setMessage('Message sent successfully!');
    } else {
      setMessage(data.error || 'Failed to send message');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Send Message</h1>
      <input
        type="text"
        placeholder="Recipient ID"
        value={recipientId}
        onChange={(e) => setRecipientId(e.target.value)}
        className={styles.input}
      />
      <textarea
        placeholder="Write your message here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={styles.textarea}
      />
      <button onClick={sendMessage} className={styles.button}>Send</button>
      <p>{message}</p>
    </div>
  );
}

export default SendMessage;

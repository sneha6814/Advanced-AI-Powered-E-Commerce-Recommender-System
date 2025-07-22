import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hi! I’m your shopping assistant. How can I help?', products: [] }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [lastTrackingQuery, setLastTrackingQuery] = useState('');

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);

    // If bot asked for email, next message is email
    let messageToSend = input;
    if (awaitingEmail) {
      messageToSend = `${lastTrackingQuery} user email: ${input.trim()}`;
      setAwaitingEmail(false);
      setLastTrackingQuery('');
    }

    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/chatbot', { message: messageToSend });
      const botMessage = {
        role: 'bot',
        content: res.data.reply,
        products: res.data.products || []
      };
      setMessages(prev => [...prev, botMessage]);

      // Detect if bot asks for email
      if (!awaitingEmail && res.data.reply.toLowerCase().includes('please provide your email')) {
        setAwaitingEmail(true);
        setLastTrackingQuery(input);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, something went wrong.', products: [] }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <div style={styles.container}>
      <div style={styles.chatbox}>
        {messages.map((msg, i) => (
          <div key={i}>
            <div style={msg.role === 'user' ? styles.userMsg : styles.botMsg}>
              {msg.content}
            </div>
            {msg.products?.length > 0 && (
              <div style={styles.products}>
                {msg.products.map((p) => (
                  <Link to={`/products/${p._id}`} key={p._id} style={styles.card}>
                    <img src={p.image} alt={p.name} style={styles.img} />
                    <h4>{p.name}</h4>
                    <p>${p.price}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && <div style={styles.botMsg}>Typing...</div>}
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={awaitingEmail ? "Please enter your email address..." : "Ask about products..."}
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.button} disabled={loading}>
          Send
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: 30,
    right: 30,
    width: 400,
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 0 10px rgba(0,0,0,0.2)',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
    zIndex: 9999,
  },
  chatbox: {
    height: 350,
    overflowY: 'auto',
    padding: 10,
    background: '#f9f9f9',
  },
  userMsg: {
    textAlign: 'right',
    margin: '8px 0',
    background: '#dcf8c6',
    padding: '8px 12px',
    borderRadius: '10px 0 10px 10px',
    display: 'inline-block',
  },
  botMsg: {
    textAlign: 'left',
    margin: '8px 0',
    background: '#eee',
    padding: '8px 12px',
    borderRadius: '0 10px 10px 10px',
    display: 'inline-block',
  },
  inputArea: {
    display: 'flex',
    borderTop: '1px solid #ddd',
  },
  input: {
    flex: 1,
    padding: 10,
    border: 'none',
  },
  button: {
    background: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '0 16px',
    cursor: 'pointer',
  },
  products: {
    display: 'flex',
    gap: 10,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  card: {
    textDecoration: 'none',
    color: '#000',
    width: 100,
    border: '1px solid #ddd',
    borderRadius: 5,
    padding: 5,
    background: '#fff',
    textAlign: 'center',
  },
  img: {
    width: '100%',
    height: 70,
    objectFit: 'cover',
    borderRadius: 4,
  },
};

export default Chatbot;

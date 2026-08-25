import { useEffect, useState } from 'react';
import api from '../api/client.js';

export default function Contact() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactError, setContactError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [question, setQuestion] = useState('');
  const [qna, setQna] = useState([]);
  const [qnaMsg, setQnaMsg] = useState('');
  const [qnaError, setQnaError] = useState('');
  const [asking, setAsking] = useState(false);

  const loadQna = () => {
    api.get('/qna')
      .then((res) => setQna(res.data.data))
      .catch(() => {});
  };

  useEffect(loadQna, []);

  const handleContact = async (e) => {
    e.preventDefault();
    setContactMsg('');
    setContactError('');
    if (phone && !/^\d{10}$/.test(phone)) {
      setContactError('Phone must be 10 digits.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/contact', { fullName: fullName.trim(), email: email.trim(), phone, address, message: message.trim() });
      setContactMsg('Message sent successfully.');
      setFullName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setMessage('');
    } catch (err) {
      setContactError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    setQnaMsg('');
    setQnaError('');
    if (question.trim().length < 3) {
      setQnaError('Question must be at least 3 characters.');
      return;
    }
    setAsking(true);
    try {
      await api.post('/qna', { question: question.trim() });
      setQuestion('');
      setQnaMsg('Question submitted.');
      loadQna();
    } catch (err) {
      setQnaError(err.message);
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="grid-2">
      <div className="card">
        <h2>Contact Us</h2>
        <p className="muted">Have a question about our services? Send us a message.</p>

        {contactMsg && <div className="alert alert-success">{contactMsg}</div>}
        {contactError && <div className="alert alert-danger">{contactError}</div>}

        <form onSubmit={handleContact}>
          <label htmlFor="fullName">Full Name</label>
          <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />

          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label htmlFor="phone">Phone (10 digits)</label>
          <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} maxLength={10} />

          <label htmlFor="address">Address</label>
          <input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} />

          <label htmlFor="message">Message</label>
          <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required />

          <button type="submit" className="btn btn-primary btn-block mt-3" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Frequently Asked Questions</h2>
        <p className="muted">Ask a question — our team will answer shortly.</p>

        {qnaMsg && <div className="alert alert-success">{qnaMsg}</div>}
        {qnaError && <div className="alert alert-danger">{qnaError}</div>}

        <form onSubmit={handleAsk} className="mb-3">
          <label htmlFor="question">Your Question</label>
          <textarea id="question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
          <button type="submit" className="btn btn-primary mt-3" disabled={asking}>
            {asking ? 'Submitting…' : 'Ask Question'}
          </button>
        </form>

        {qna.length === 0 && <p className="muted">No questions yet.</p>}
        {qna.map((q) => (
          <div key={q.id} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
            <p style={{ margin: 0 }}><strong>Q:</strong> {q.question}</p>
            <p className="muted small" style={{ margin: '4px 0 0' }}>
              {q.answer ? <><strong style={{ color: 'var(--green-700)' }}>A:</strong> {q.answer}</> : 'Waiting for an answer…'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
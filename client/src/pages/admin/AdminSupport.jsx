import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminSupport() {
  const { isSuperAdmin } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [qna, setQna] = useState([]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => {
    if (isSuperAdmin) {
      api.get('/admin/contacts').then((r) => setContacts(r.data.data)).catch((e) => setError(e.message));
    }
    api.get('/admin/qna').then((r) => setQna(r.data.data)).catch((e) => setError(e.message));
  };

  useEffect(() => { load(); }, []);

  const removeContact = async (c) => {
    if (!window.confirm(`Delete message from ${c.full_name}?`)) return;
    try {
      await api.delete(`/admin/contacts/${c.id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveAnswer = async (q) => {
    setError('');
    try {
      await api.post(`/admin/qna/${q.id}/answer`, { answer: answers[q.id] || '' });
      setNotice(`Answered Q&A #${q.id}.`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid-2">
      {error && <div className="alert alert-danger" style={{ gridColumn: '1 / -1' }}>{error}</div>}
      {notice && <div className="alert alert-success" style={{ gridColumn: '1 / -1' }}>{notice}</div>}

      {isSuperAdmin && (
        <div className="card">
          <h3>Contact Messages</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Name</th><th>Email / Phone</th><th>Address</th><th>Message</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {!contacts.length && <tr><td colSpan="7" className="muted">No messages.</td></tr>}
              {contacts.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.full_name}</td>
                  <td className="small">{c.email}<br />{c.phone || ''}</td>
                  <td className="small">{c.address || ''}</td>
                  <td className="small" style={{ maxWidth: 220 }}>{c.message}</td>
                  <td className="small">{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</td>
                  <td><button className="btn-danger btn-sm" onClick={() => removeContact(c)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <div className="card">
        <h3>Q&A</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Question</th><th>Answer</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {!qna.length && <tr><td colSpan="5" className="muted">No questions yet.</td></tr>}
              {qna.map((q) => (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td className="small" style={{ maxWidth: 200 }}>{q.question}</td>
                  <td>
                    <textarea
                      placeholder="Write an answer…"
                      value={answers[q.id] ?? q.answer ?? ''}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    />
                  </td>
                  <td className="small">{q.created_at ? new Date(q.created_at).toLocaleDateString() : ''}</td>
                  <td>
                    <button className="btn-primary btn-sm" onClick={() => saveAnswer(q)}>Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
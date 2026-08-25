import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import {
  Tractor, IdCard, Camera, Mic, MicOff, CheckCircle2, Clock, XCircle,
  ChevronRight, ChevronLeft, UploadCloud, FileCheck2, Sprout, ShoppingBasket,
  Trash2, CircleAlert,
} from 'lucide-react';

const SELL_SUGGESTIONS = [
  'Tomato', 'Potato', 'Vegetables', 'Fruits', 'Spices', 'Grains', 'Paddy', 'Maize',
  'Dairy', 'Honey', 'Mushroom', 'Herbs', 'Flowers', 'Eggs',
];

const STEP_LABELS = ['Documents', 'Farm details', 'Review & submit'];

const STATUS_UI = {
  pending: { icon: Clock, label: 'Application under review', cls: 'warning', text: 'Our team is verifying your documents. You will be able to sell once approved — usually within 1–2 working days.' },
  approved: { icon: CheckCircle2, label: 'You are now a farmer', cls: 'success', text: 'Congratulations! Your application was approved. You can list products and start selling.' },
  rejected: { icon: XCircle, label: 'Application rejected', cls: 'danger', text: '' },
};

export default function ApplyFarmer() {
  const navigate = useNavigate();
  const [app, setApp] = useState(undefined); // undefined = loading, null = none
  const [isSeller, setIsSeller] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const [fullName, setFullName] = useState('');
  const [citizenshipNo, setCitizenshipNo] = useState('');
  const [citDoc, setCitDoc] = useState(null);
  const [citPreview, setCitPreview] = useState('');
  const [kisanDoc, setKisanDoc] = useState(null);
  const [kisanPreview, setKisanPreview] = useState('');
  const [sellItems, setSellItems] = useState([]);
  const [customItem, setCustomItem] = useState('');
  const [desc, setDesc] = useState('');
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recRef = useRef(null);

  useEffect(() => {
    api.get('/user/farmer-application')
      .then((r) => { setApp(r.data.data); if (!r.data.data) { setIsSeller(r.data.isSeller); } })
      .catch(() => setApp(null));
  }, []);

  useEffect(() => () => { recRef.current?.stop(); }, []);

  const pickDoc = (setter, setPreview) => (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Only JPG, PNG, GIF or WEBP images are allowed.'); return; }
    setError(''); setter(f); setPreview(URL.createObjectURL(f));
  };

  const pasteDoc = (setter, setPreview) => (e) => {
    const item = Array.from(e.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
    const f = item?.getAsFile();
    if (!f) { setError('Clipboard has no image — copy a photo first (⌘C / Ctrl+C), then paste here.'); return; }
    e.preventDefault();
    setError(''); setter(f); setPreview(URL.createObjectURL(f));
  };

  const toggleItem = (item) =>
    setSellItems((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);

  const addCustomItem = () => {
    const v = customItem.trim();
    if (v && !sellItems.includes(v)) setSellItems((prev) => [...prev, v]);
    setCustomItem('');
  };

  const toggleSTT = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('Voice input is not supported in this browser — try Google Chrome or Microsoft Edge.'); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    setError('');
    try {
      const rec = new SR();
      rec.lang = 'en-US';
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          t += e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            setDesc((d) => `${d ? d + ' ' : ''}${e.results[i][0].transcript}`.trim());
            setInterim('');
          }
        }
        setInterim(t.trim());
      };
      rec.onerror = () => { setListening(false); setError('Voice input stopped — please check your microphone permission.'); };
      rec.onend = () => setListening(false);
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch { setError('Could not start the microphone. Please check browser permissions.'); }
  };

  const canNext1 = fullName.trim().length >= 3 && citizenshipNo.trim().length >= 5 && citDoc && kisanDoc;
  const canNext2 = sellItems.length > 0 && desc.trim().length >= 20;

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const fd = new FormData();
      fd.append('citizenshipDoc', citDoc);
      fd.append('kisanDoc', kisanDoc);
      fd.append('fullName', fullName.trim());
      fd.append('citizenshipNo', citizenshipNo.trim());
      fd.append('sellItems', sellItems.join(', '));
      fd.append('description', desc.trim());
      const res = await api.post('/farmer/apply', fd);
      setDone(res.data.data);
    } catch (err) {
      setError(err.message);
      setStep(1);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="fa-success form-card">
        <div className="fa-success-icon"><CheckCircle2 size={44} /></div>
        <h2>Application submitted!</h2>
        <p className="muted">Your application <strong>#{done.id}</strong> is now with our team. We will verify your documents and approve you as a farmer, usually within 1–2 working days. You will find the live status in your profile.</p>
        <div className="fa-success-actions">
          <Link to="/user-profile" className="btn btn-primary">Go to my profile</Link>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/marketplace')}>Browse marketplace</button>
        </div>
      </div>
    );
  }

  if (app && app.status === 'pending') {
    return (
      <div className="form-card fa-status">
        <div className="fa-status-icon warning"><Clock size={34} /></div>
        <h3>{STATUS_UI.pending.label}</h3>
        <p className="muted">{STATUS_UI.pending.text}</p>
        <div className="fa-doc-row">
          <span>Application ID</span><strong>#{app.id}</strong>
        </div>
        <div className="fa-doc-row">
          <span>Submitted</span><strong>{new Date(app.created_at).toLocaleDateString()}</strong>
        </div>
        <Link to="/user-profile" className="btn btn-ghost btn-block mt-3">Back to my profile</Link>
      </div>
    );
  }

  if (app && app.status === 'approved') {
    return (
      <div className="form-card fa-status">
        <div className="fa-status-icon success"><CheckCircle2 size={34} /></div>
        <h3>{STATUS_UI.approved.label}</h3>
        <p className="muted">{STATUS_UI.approved.text}</p>
        <div className="fa-success-actions">
          <Link to="/farmer" className="btn btn-primary">Open farmer panel</Link>
          <Link to="/add-product" className="btn btn-ghost">List a product</Link>
        </div>
      </div>
    );
  }

  if (app && app.status === 'rejected') {
    return (
      <div className="form-card fa-status">
        <div className="fa-status-icon danger"><XCircle size={34} /></div>
        <h3>{STATUS_UI.rejected.label}</h3>
        <p className="muted">Your application was rejected.</p>
        {app.admin_note && <div className="alert alert-warning">{app.admin_note}</div>}
        <p className="muted small">You cannot resubmit automatically. Please contact the administrator for clarification.</p>
        <Link to="/contact" className="btn btn-ghost btn-block mt-3">Contact support</Link>
      </div>
    );
  }

  if (isSeller) {
    return (
      <div className="form-card fa-status">
        <div className="fa-status-icon success"><Tractor size={34} /></div>
        <h3>You are already a farmer</h3>
        <p className="muted">Your seller account is active — you can manage products and sales from the farmer panel.</p>
        <div className="fa-success-actions">
          <Link to="/farmer" className="btn btn-primary">Open farmer panel</Link>
          <Link to="/add-product" className="btn btn-ghost">List a product</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="form-card fa-form">
      <div className="fa-head">
        <div className="fa-head-icon"><Sprout size={22} /></div>
        <div>
          <h3 style={{ margin: 0 }}>Become a Farmer</h3>
          <p className="muted small" style={{ margin: '3px 0 0' }}>Join AgriSmart as a seller — upload your documents, tell us what you grow, and start selling to buyers across Nepal.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="fa-steps">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className={`fa-step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
            <span className="fa-step-num">{step > i + 1 ? <CheckCircle2 size={15} /> : i + 1}</span>
            <span className="fa-step-label">{label}</span>
          </div>
        ))}
      </div>

      <form onSubmit={submit}>
        {step === 1 && (
          <div className="fa-panel">
            <div className="fa-field">
              <label htmlFor="fa-fullname">Full name (as on citizenship)</label>
              <input id="fa-fullname" type="text" placeholder="e.g. Hari Prasad Sharma" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="fa-field">
              <label htmlFor="fa-citno">Citizenship number</label>
              <input id="fa-citno" type="text" placeholder="e.g. 12345-67890" value={citizenshipNo} onChange={(e) => setCitizenshipNo(e.target.value)} />
            </div>

            <div className="fa-docs">
              <div className={`fa-drop ${citDoc ? 'has' : ''}`} tabIndex={0} onPaste={pasteDoc(setCitDoc, setCitPreview)} onKeyDown={(e) => { if (e.key === 'v' && (e.metaKey || e.ctrlKey)) e.preventDefault(); }}>
                <input type="file" accept="image/*" hidden onChange={pickDoc(setCitDoc, setCitPreview)} id="cit-input" />
                <label htmlFor="cit-input" className="fa-drop-inner">
                  {citPreview
                    ? <><img src={citPreview} alt="Citizenship" /><span className="fa-drop-clear" onClick={(e) => { e.preventDefault(); setCitDoc(null); setCitPreview(''); }}><Trash2 size={14} /></span></>
                    : <><span className="fa-drop-icon"><IdCard size={26} /></span><strong>Citizenship / ID card</strong><span className="muted small">Front-side photo or scan</span><span className="fa-drop-upload"><UploadCloud size={14} /> Choose file</span><span className="muted small">…or copy a photo and paste here (⌘V / Ctrl+V)</span></>}
                </label>
              </div>
              <div className={`fa-drop ${kisanDoc ? 'has' : ''}`} tabIndex={0} onPaste={pasteDoc(setKisanDoc, setKisanPreview)} onKeyDown={(e) => { if (e.key === 'v' && (e.metaKey || e.ctrlKey)) e.preventDefault(); }}>
                <input type="file" accept="image/*" hidden onChange={pickDoc(setKisanDoc, setKisanPreview)} id="kisan-input" />
                <label htmlFor="kisan-input" className="fa-drop-inner">
                  {kisanPreview
                    ? <><img src={kisanPreview} alt="Kisan card" /><span className="fa-drop-clear" onClick={(e) => { e.preventDefault(); setKisanDoc(null); setKisanPreview(''); }}><Trash2 size={14} /></span></>
                    : <><span className="fa-drop-icon"><FileCheck2 size={26} /></span><strong>Kisan card</strong><span className="muted small">Farmer registration card</span><span className="fa-drop-upload"><UploadCloud size={14} /> Choose file</span><span className="muted small">…or copy a photo and paste here (⌘V / Ctrl+V)</span></>}
                </label>
              </div>
            </div>
            <p className="muted small" style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
              <Camera size={14} /> JPG, PNG, GIF or WEBP — up to 8 MB each. Documents stay private and are only seen by the admin team.
            </p>

            <div className="fa-nav">
              <button type="button" className="btn btn-primary" disabled={!canNext1} onClick={() => { setError(''); setStep(2); }}>
                Continue <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fa-panel">
            <div className="fa-field">
              <label>What do you want to sell?</label>
              <div className="fa-chips">
                {SELL_SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className={`fa-chip ${sellItems.includes(s) ? 'on' : ''}`} onClick={() => toggleItem(s)}>
                    {sellItems.includes(s) && <CheckCircle2 size={13} />} {s}
                  </button>
                ))}
              </div>
              <div className="fa-custom-item">
                <input type="text" placeholder="Something else? Type and press Add" value={customItem} onChange={(e) => setCustomItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomItem(); } }} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={addCustomItem}>Add</button>
              </div>
            </div>

            <div className="fa-field">
              <div className="fa-label-row">
                <label>Tell us about your farm</label>
                <button type="button" className={`fa-mic ${listening ? 'on' : ''}`} onClick={toggleSTT} title={listening ? 'Stop voice input' : 'Speak instead of typing'}>
                  {listening ? <><MicOff size={15} /> Stop</> : <><Mic size={15} /> Speak</>}
                </button>
              </div>
              <textarea
                rows={5}
                placeholder="Describe your farm — size, location, what you grow, how you farm (organic, greenhouse…), why you want to sell here…"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              {listening && <div className="fa-listening"><span className="fa-pulse" /> Listening… {interim && <em>“{interim}”</em>}</div>}
              <div className="fa-count muted small">{desc.trim().length}/2000 — minimum 20 characters</div>
            </div>

            <div className="fa-nav">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}><ChevronLeft size={16} /> Back</button>
              <button type="button" className="btn btn-primary" disabled={!canNext2} onClick={() => { setError(''); setStep(3); }}>
                Review <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fa-panel">
            <div className="fa-review">
              <div className="fa-review-item"><span>Full name</span><strong>{fullName}</strong></div>
              <div className="fa-review-item"><span>Citizenship no.</span><strong>{citizenshipNo}</strong></div>
              <div className="fa-review-item"><span>Documents</span>
                <strong className="fa-review-docs">
                  <a href={citPreview} target="_blank" rel="noreferrer">Citizenship</a> ·
                  <a href={kisanPreview} target="_blank" rel="noreferrer">Kisan card</a>
                </strong>
              </div>
              <div className="fa-review-item"><span>Selling</span>
                <strong className="fa-chips-static">{sellItems.map((s) => <em key={s}>{s}</em>)}</strong>
              </div>
              <div className="fa-review-item"><span>About the farm</span><strong className="fa-review-desc">{desc}</strong></div>
            </div>
            <div className="alert alert-info" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <CircleAlert size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>By submitting you confirm the documents belong to you and the details are accurate. False information leads to rejection and account action.</span>
            </div>
            <div className="fa-nav">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}><ChevronLeft size={16} /> Back</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <><Clock size={16} /> Submitting…</> : <><ShoppingBasket size={16} /> Submit application</>}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
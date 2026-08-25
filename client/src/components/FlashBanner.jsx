import { useLocation } from 'react-router-dom';

const LABELS = {
  placed: { type: 'success', text: 'Order placed successfully!' },
  payment_success: { type: 'success', text: 'Payment successful. Thank you!' },
  payment_failed: { type: 'danger', text: 'Payment failed. Please try again.' },
  payment_batch_not_found: { type: 'danger', text: 'Payment batch not found.' },
  payment_error: { type: 'danger', text: 'Payment could not be verified.' },
  payment_already_paid: { type: 'info', text: 'This payment was already completed.' },
  password_updated: { type: 'success', text: 'Password changed successfully.' },
};

export default function FlashBanner() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const flash = params.get('flash');
  const info = flash ? LABELS[flash] : null;
  if (!info) return null;

  return <div className={`flash flash-${info.type}`}>{info.text}</div>;
}
import { Link, useSearchParams } from 'react-router-dom';

const STATES = {
  success: { title: 'Payment Successful', text: 'Your order has been confirmed. Thank you for shopping with AgriSmart!', type: 'success' },
  pending: { title: 'Payment Pending', text: 'Khalti has not confirmed this payment yet. You can retry this payment or check My Orders later.', type: 'warning' },
  failed: { title: 'Payment Failed', text: 'Khalti declined or canceled this payment. You can start a new payment attempt below.', type: 'danger' },
  batch_not_found: { title: 'Payment Batch Not Found', text: 'We could not find the payment batch. Please contact support if this persists.', type: 'danger' },
  error: { title: 'Payment Error', text: 'Something went wrong while verifying your payment.', type: 'danger' },
};

export default function PaymentResult() {
  const [params] = useSearchParams();
  const result = params.get('result') || 'error';
  const batch = params.get('batch');
  const state = STATES[result] || STATES.error;

  return (
    <div className="form-card text-center">
      <h3>{state.title}</h3>
      <div className={`alert alert-${state.type}`}>{state.text}</div>
      <div className="actions-inline" style={{ justifyContent: 'center' }}>
        <Link to="/my-orders" className="btn btn-primary">My Orders</Link>
        {(result === 'pending' || result === 'failed') && batch ? (
          <Link to={`/payment/khalti?batch=${encodeURIComponent(batch)}`} className="btn-ghost">Retry Payment</Link>
        ) : (
          <Link to="/cart" className="btn-ghost">Back to Cart</Link>
        )}
      </div>
    </div>
  );
}
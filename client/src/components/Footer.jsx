import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-col">
          <Link to="/" className="brand">
            <span className="brand-icon"><Sprout size={18} /></span> AgriSmart
          </Link>
          <p className="muted small" style={{ marginTop: 10 }}>
            AI-driven crop advisory, weather insights and a farmer-friendly marketplace —
            built for Nepali agriculture.
          </p>
        </div>
        <div className="footer-col">
          <h4>Platform</h4>
          <Link to="/marketplace">Marketplace</Link>
          <Link to="/weather">Weather</Link>
          <Link to="/about">About Us</Link>
        </div>
        <div className="footer-col">
          <h4>Tools</h4>
          <Link to="/predictions/crop-recommendation">Crop Recommendation</Link>
          <Link to="/predictions/crop-prediction">Crop Prediction</Link>
          <Link to="/predictions/yield-prediction">Yield Prediction</Link>
          <Link to="/predictions/fertilizer-recommendation">Fertilizer Recommendation</Link>
          <Link to="/predictions/rainfall-prediction">Rainfall Prediction</Link>
        </div>
        <div className="footer-col">
          <h4>Support</h4>
          <Link to="/contact">Contact Us</Link>
          <Link to="/contact">Q&amp;A Forum</Link>
          <Link to="/login">Sign In</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} AgriSmart — Smart Agriculture Platform</span>
        <span className="footer-mark">▪ sown with care, harvested with data</span>
      </div>
    </footer>
  );
}
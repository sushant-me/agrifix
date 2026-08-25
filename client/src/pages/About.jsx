const VALUES = [
  { icon: 'Activity', title: 'Data-Driven', desc: 'Every recommendation is backed by ML models trained on real agricultural data.' },
  { icon: 'CloudSun', title: 'Weather Aware', desc: 'Live weather monitoring helps you time your sowing, irrigation and harvest.' },
  { icon: 'Handshake', title: 'Farmer First', desc: 'A marketplace that connects farmers directly with buyers at fair prices.' },
  { icon: 'Recycle', title: 'Sustainable', desc: 'Fertilizer and water guidance that preserves soil health for generations.' },
];

export default function About() {
  return (
    <>
      <div className="page-head text-center" style={{ maxWidth: 640, margin: '0 auto 28px' }}>
        <h1>About AgriSmart</h1>
        <p className="muted">AI-powered advisory, weather intelligence and a fair marketplace — built for Nepali farmers.</p>
      </div>
      <p className="muted text-center" style={{ maxWidth: 680, margin: '0 auto 24px' }}>
        Empowering farmers across Nepal with smarter tools for every season.
      </p>

      <div className="card">
        <h2>Crop Advisory Powered by AI</h2>
        <p>
          AgriSmart was built to give farmers the same insights that large agricultural firms rely on.
          Our machine learning models analyze soil nutrients, climate data and historical yield records
          to recommend the right crops, fertilizers and planting schedules for your specific farm —
          whether you till a small family plot or manage large acreage.
        </p>
      </div>

      <div className="card">
        <h2>Weather Intelligence, Locally Relevant</h2>
        <p>
          Rainfall and temperature swings are the biggest risk factors in agriculture. AgriSmart pulls
          live weather data for your region so you can plan irrigation, protect crops from frost, and
          predict seasonal patterns before they affect your bottom line.
        </p>
      </div>

      <div className="card">
        <h2>A Marketplace That Works for Farmers</h2>
        <p>
          Our direct marketplace removes layers of middlemen. Farmers list fresh produce, seeds and
          equipment, while buyers purchase directly with verified sellers, transparent ratings and
          doorstep delivery support. What you grow reaches the table — and the profit stays with you.
        </p>
      </div>

      <h2 className="text-center mb-3">Our Values</h2>
      <div className="feature-grid">
        {VALUES.map((v) => (
          <div key={v.title} className="feature-card">
            <div className="icon"><IconSet name={v.icon} /></div>
            <h3 style={{ marginTop: 8 }}>{v.title}</h3>
            <p className="muted small" style={{ margin: 0 }}>{v.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
import { Activity, CloudSun, Handshake, Recycle } from 'lucide-react';
function IconSet({ name }) {
  const map = { Activity, CloudSun, Handshake, Recycle };
  const Icon = map[name] || Activity;
  return <Icon size={22} />;
}

// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import api from '../api/client.js';
// import { useAuth } from '../context/AuthContext.jsx';
// import { Carrot } from 'lucide-react';


// const FEATURES = [
//   { n: '01', title: 'Crop recommendation', desc: 'What grows best on your land, based on your soil, season and district.' },
//   { n: '02', title: 'Yield forecasting', desc: 'An honest estimate of what your field will produce — before you sow.' },
//   { n: '03', title: 'Rainfall prediction', desc: 'District-level forecasts to time sowing and irrigation.' },
//   { n: '04', title: 'Fertilizer planning', desc: 'The right nutrients for your soil, not a generic NPK formula.' },
//   { n: '05', title: 'Live weather', desc: 'Current conditions for cities across Nepal, updated throughout the day.' },
//   { n: '06', title: 'Farmers marketplace', desc: 'List your harvest and sell directly — no middlemen, no listing fees.' },
// ];

// const STEPS = [
//   { n: '1', title: 'Create an account', desc: 'Free for farmers, sellers and agronomists.' },
//   { n: '2', title: 'Run a prediction', desc: 'Pick your province, district and season. Get an answer in seconds.' },
//   { n: '3', title: 'Grow and sell', desc: 'Apply the advice, then list your produce on the marketplace.' },
// ];

// const TESTIMONIALS = [
//   { quote: 'The recommendation said rice would struggle in my soil. It was right — I planted millet instead and had my best year.', name: 'Rajesh K.', role: 'Farmer, Jhapa' },
//   { quote: 'I list vegetables here every morning. Buyers from Kathmandu started ordering within the first week.', name: 'Sunita T.', role: 'Seller, Chitwan' },
//   { quote: 'The rainfall forecast told me exactly when to plant. That one call paid for the whole season.', name: 'Bimal G.', role: 'Farmer, Banke' },
// ];

// export default function Home() {
//   const { user } = useAuth();
//   const [products, setProducts] = useState([]);

//   useEffect(() => {
//     api.get('/products?limit=4')
//       .then((res) => setProducts(Array.isArray(res.data.data) ? res.data.data.slice(0, 4) : []))
//       .catch(() => {});
//   }, []);

//   return (
//     <>
//       {/* ============ HERO ============ */}
//       <section className="land-hero">
//         <p className="land-kicker">Crop advisory for Nepali farmers</p>
//         <h1 className="land-title">Grow more. Sell better.</h1>
//         <p className="land-sub">
//           AgriSmart turns soil, weather and season data into predictions you can act on —
//           and puts your harvest in front of real buyers.
//         </p>
//         <div className="land-cta">
//           <Link to={user ? '/dashboard' : '/signup'} className="btn btn-primary btn-lg">
//             {user ? 'Open Dashboard' : 'Get Started'}
//           </Link>
//           <Link to="/marketplace" className="btn btn-outline btn-lg">View Marketplace</Link>
//         </div>
//       </section>
    
//      {/* ============ REAL PRODUCTS ============ */}
//       {products.length > 0 && (
//         <section className="land-live">
//           <div className="land-live-head">
//             <h2>On the marketplace right now</h2>
//             <Link to="/marketplace" className="land-link">See everything →</Link>
//           </div>
//           <div className="product-grid">
//             {products.map((p) => (
//               <Link to={`/product/${p.id}`} key={p.id} className="product-card" style={{ textDecoration: 'none', color: 'inherit' }}>
//                 {p.image_url ? (
//                   <img src={p.image_url} alt={p.product_name} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement.classList.add('thumb-fallback'); }} />
//                 ) : (
//                   <div className="product-thumb"><Carrot size={34} /></div>
//                 )}
//                 <div className="product-body">
//                   <h4>{p.product_name}</h4>
//                   <div className="product-meta">by {p.shop_name}</div>
//                   <div className="product-price">₹{Number(p.price).toLocaleString()}{p.unit ? ` /${p.unit}` : ''}</div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </section>
//       )}

// //       {/* ============ FEATURES ============ */}
//       <section className="land-section">
//         <div className="land-section-head">
//           <h2>The toolkit</h2>
//           <p>Six tools, one account. Each one trained on Nepali agricultural data.</p>
//         </div>
//         <div className="land-features">
//           {FEATURES.map((f) => (
//             <div className="land-feature" key={f.n}>
//               <span className="land-feature-n">{f.n}</span>
//               <h3>{f.title}</h3>
//               <p>{f.desc}</p>
//             </div>
//           ))}
//         </div>
//       </section>

// //       {/* ============ HOW IT WORKS ============ */}
//       <section className="land-section land-alt">
//         <div className="land-section-head">
//           <h2>How it works</h2>
//         </div>
//         <div className="land-steps">
//           {STEPS.map((s) => (
//             <div className="land-step" key={s.n}>
//               <span className="land-step-n">{s.n}</span>
//               <h3>{s.title}</h3>
//               <p>{s.desc}</p>
//             </div>
//           ))}
//         </div>
//       </section>

// //       {/* ============ TESTIMONIALS ============ */}
//       <section className="land-section">
//         <div className="land-section-head">
//           <h2>Used by farmers across Nepal</h2>
//         </div>
//         <div className="land-testimonials">
//           {TESTIMONIALS.map((t) => (
//             <blockquote className="land-testimonial" key={t.name}>
//               <p>“{t.quote}”</p>
//               <footer>
//                 <strong>{t.name}</strong>
//                 <span>{t.role}</span>
//               </footer>
//             </blockquote>
//           ))}
//         </div>
//       </section>

// //       {/* ============ FINAL CTA ============ */}
//       <section className="land-final">
//         <h2>Start with this season.</h2>
//         <p className="muted">Free to sign up. Works on any phone with an internet connection.</p>
//         <div className="land-cta">
//           <Link to={user ? '/dashboard' : '/signup'} className="btn btn-primary btn-lg">
//             {user ? 'Open Dashboard' : 'Get Started'}
//           </Link>
//         </div>
//       </section>
//     </>
//   );
// }
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Carrot } from 'lucide-react';

// ==================== HERO SLIDES ====================

// const slides = [
//    {
//     image: '/images/hero.jpg',
//     kicker: 'Smart farming for Nepal',
//     title: 'Grow more. Grow smarter.',
//     sub: 'Get crop recommendations based on your soil, weather, season and district.',
//     button: 'Explore Crop Tools',
//     link: '/crop-recommendation',
//   },

//   {
//     image: '/images/agri.png',
//     kicker: 'Data-driven agriculture',
//     title: 'Make every season count.',
//     sub: 'Use weather, rainfall, yield and fertilizer predictions to make better farming decisions.',
//     button: 'Get Started',
//     link: '/signup',
//   },
 
//   {
//     image: '/images/farm.png',
//     kicker: 'AgriSmart Marketplace',
//     title: 'Grow more. Sell better.',
//     sub: 'List your harvest and connect directly with buyers across Nepal.',
//     button: 'View Marketplace',
//     link: '/marketplace',
//   },
// ];

const slides = [
  {
    image: '/images/hero.jpg',
    kicker: 'Smart farming for Nepal',
    title: 'Farm smarter. Grow better.',
    sub: 'Get intelligent crop recommendations tailored to your soil, weather, season and location.',
    button: 'Explore Crop Tools',
    link: '/crop-recommendation',
  },

  {
    image: '/images/agri.png',
    kicker: 'Smart decisions, better results',
    title: 'Turn data into better farming.',
    sub: 'Use AI-powered insights for crop, fertilizer, rainfall and yield predictions to plan every season with confidence.',
    button: 'Explore Smart Tools',
    link: '/crop-recommendation',
  },

  {
    image: '/images/farm.png',
    kicker: 'AgriSmart Marketplace',
    title: 'From your farm to the market.',
    sub: 'Sell your agricultural products and connect directly with buyers across Nepal.',
    button: 'Explore Marketplace',
    link: '/marketplace',
  },
];

// ==================== FEATURES ====================

const FEATURES = [
  {
    n: '01',
    title: 'Crop recommendation',
    desc: 'What grows best on your land, based on your soil, season and district.',
  },
  {
    n: '02',
    title: 'Yield forecasting',
    desc: 'An honest estimate of what your field will produce — before you sow.',
  },
  {
    n: '03',
    title: 'Rainfall prediction',
    desc: 'District-level forecasts to time sowing and irrigation.',
  },
  {
    n: '04',
    title: 'Fertilizer planning',
    desc: 'The right nutrients for your soil, not a generic NPK formula.',
  },
  {
    n: '05',
    title: 'Live weather',
    desc: 'Current conditions for cities across Nepal, updated throughout the day.',
  },
  {
    n: '06',
    title: 'Farmers marketplace',
    desc: 'List your harvest and sell directly — no middlemen, no listing fees.',
  },
];

// ==================== HOW IT WORKS ====================

const STEPS = [
  {
    n: '1',
    title: 'Create an account',
    desc: 'Free for farmers, sellers and agronomists.',
  },
  {
    n: '2',
    title: 'Run a prediction',
    desc: 'Pick your province, district and season. Get an answer in seconds.',
  },
  {
    n: '3',
    title: 'Grow and sell',
    desc: 'Apply the advice, then list your produce on the marketplace.',
  },   
];

// ==================== TESTIMONIALS ====================

const TESTIMONIALS = [
  {
    quote:
      'The recommendation said rice would struggle in my soil. It was right — I planted millet instead and had my best year.',
    name: 'Rajesh K.',
    role: 'Farmer, Jhapa',
  },
  {
    quote:
      'I list vegetables here every morning. Buyers from Kathmandu started ordering within the first week.',
    name: 'Sunita T.',
    role: 'Seller, Chitwan',
  },
  {
    quote:
      'The rainfall forecast told me exactly when to plant. That one call paid for the whole season.',
    name: 'Bimal G.',
    role: 'Farmer, Banke',
  },
];

// ==================== HOME COMPONENT ====================

export default function Home() {
  const { user } = useAuth();

  // IMPORTANT:
  // All React hooks must be inside the component.
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);

  // ==================== AUTO SLIDER ====================

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // ==================== LOAD MARKETPLACE PRODUCTS ====================

  useEffect(() => {
    let mounted = true;

    api
      .get('/products?limit=4')
      .then((res) => {
        if (!mounted) return;

        const data = Array.isArray(res.data?.data)
          ? res.data.data.slice(0, 4)
          : [];

        setProducts(data);
      })
      .catch(() => {
        if (mounted) {
          setProducts([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ==================== SLIDER CONTROLS ====================

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + slides.length) % slides.length
    );
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const activeSlide = slides[currentSlide];

  return (
    <>
      {/* =====================================================
          HERO SLIDER
      ====================================================== */}

      <section className="land-hero-slider">
        {slides.map((slide, index) => (
          <div
            key={slide.image}
            className={`hero-slide ${
              index === currentSlide ? 'active' : ''
            }`}
            aria-hidden={index !== currentSlide}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="hero-slide-image"
            />

            <div className="hero-slide-overlay" />

            <div className="hero-slide-content">
              <p className="land-kicker">{slide.kicker}</p>

              <h1 className="land-title">{slide.title}</h1>

              <p className="land-sub">{slide.sub}</p>

              <div className="land-cta">
                <Link
                  to={slide.link}
                  className="btn btn-primary btn-lg"
                >
                  {slide.button}
                </Link>

                <Link
                  to="/marketplace"
                  className="btn btn-outline btn-lg hero-secondary-btn"
                >
                  View Marketplace
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Previous Button */}
        <button
          type="button"
          className="hero-arrow hero-prev"
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          ‹
        </button>

        {/* Next Button */}
        <button
          type="button"
          className="hero-arrow hero-next"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          ›
        </button>

        {/* Slider Dots */}
        <div className="hero-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              className={`hero-dot ${
                index === currentSlide ? 'active' : ''
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={
                index === currentSlide ? 'true' : undefined
              }
            />
          ))}
        </div>
      </section>

      {/* =====================================================
          LIVE MARKETPLACE PRODUCTS
      ====================================================== */}

      {products.length > 0 && (
        <section className="land-live">
          <div className="land-live-head">
            <h2>On the marketplace right now</h2>

            <Link
              to="/marketplace"
              className="land-link"
            >
              See everything →
            </Link>
          </div>

          <div className="product-grid">
            {products.map((product) => (
              <Link
                to={`/product/${product.id}`}
                key={product.id}
                className="product-card"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.product_name || 'Marketplace product'}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                      event.currentTarget.parentElement?.classList.add(
                        'thumb-fallback'
                      );
                    }}
                  />
                ) : (
                  <div className="product-thumb">
                    <Carrot size={34} />
                  </div>
                )}

                <div className="product-body">
                  <h4>{product.product_name}</h4>

                  <div className="product-meta">
                    by {product.shop_name || 'AgriSmart Seller'}
                  </div>

                  <div className="product-price">
                    ₹{Number(product.price || 0).toLocaleString()}
                    {product.unit ? ` /${product.unit}` : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================
          FEATURES
      ====================================================== */}

      <section className="land-section">
        <div className="land-section-head">
          <h2>The toolkit</h2>

          <p>
            Six tools, one account. Each one trained on Nepali
            agricultural data.
          </p>
        </div>

        <div className="land-features">
          {FEATURES.map((feature) => (
            <div
              className="land-feature"
              key={feature.n}
            >
              <span className="land-feature-n">
                {feature.n}
              </span>

              <h3>{feature.title}</h3>

              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section className="land-section land-alt">
        <div className="land-section-head">
          <h2>How it works</h2>
        </div>

        <div className="land-steps">
          {STEPS.map((step) => (
            <div
              className="land-step"
              key={step.n}
            >
              <span className="land-step-n">
                {step.n}
              </span>

              <h3>{step.title}</h3>

              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          TESTIMONIALS
      ====================================================== */}

      <section className="land-section">
        <div className="land-section-head">
          <h2>Used by farmers across Nepal</h2>
        </div>

        <div className="land-testimonials">
          {TESTIMONIALS.map((testimonial) => (
            <blockquote
              className="land-testimonial"
              key={testimonial.name}
            >
              <p>“{testimonial.quote}”</p>

              <footer>
                <strong>{testimonial.name}</strong>
                <span>{testimonial.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="land-final">
        <h2>Start with this season.</h2>

        <p className="muted">
          Free to sign up. Works on any phone with an internet
          connection.
        </p>

        <div className="land-cta">
          <Link
            to={user ? '/dashboard' : '/signup'}
            className="btn btn-primary btn-lg"
          >
            {user ? 'Open Dashboard' : 'Get Started'}
          </Link>
        </div>
      </section>
    </>
  );
}
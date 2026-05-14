import React from 'react';
import { Link } from 'react-router-dom';
import './DigitalKitchen.css';

const DigitalKitchen: React.FC = () => {
  const features = [
    {
      title: "Real-Time Macro Engine",
      description: "Our proprietary algorithm calculates protein, carb, and fat ratios to the gram as you build your plate.",
      icon: "⚡"
    },
    {
      title: "Chef-Led Engineering",
      description: "Every ingredient is prepared using precise sous-vide and grilling techniques to preserve nutrient density.",
      icon: "🍳"
    },
    {
      title: "Smart Sourcing",
      description: "We connect directly with local vertical farms to ensure your greens are harvested less than 12 hours before delivery.",
      icon: "🌱"
    }
  ];

  return (
    <div className="digital-kitchen-page">
      {/* --- HERO SECTION --- */}
      <section className="dk-hero">
        <div className="dk-hero-content">
          <span className="subtitle">THE TECHNOLOGY BEHIND THE TASTE</span>
          <h1 className="sakana-title">DIGITAL <span className="lime-text">KITCHEN</span></h1>
          <p className="hero-p">
            Where culinary intuition meets mathematical precision. We've digitized 
            the cooking process to give you total control over your performance.
          </p>
          <Link to="/build">
            <button className="dk-cta-btn">Open the Builder</button>
          </Link>
        </div>
        <div className="dk-hero-image">
          {/* You can place a high-tech kitchen or UI mockup image here */}
          <div className="ui-glow-circle"></div>
        </div>
      </section>

      {/* --- CORE FEATURES --- */}
      <section className="dk-features">
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="f-card">
              <div className="f-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- THE PROCESS SECTION --- */}
      <section className="dk-process">
        <div className="process-container">
          <div className="process-text">
            <h2>0.01g <span className="white-text">PRECISION</span></h2>
            <p>
              In our kitchen, "roughly" isn't in the vocabulary. Every chicken breast, 
              gram of brown rice, and leaf of kale is weighed and logged into your 
              personal nutrition profile.
            </p>
            <div className="process-stats">
              <div className="ps-item"><strong>100%</strong><span>Traceable</span></div>
              <div className="ps-item"><strong>0%</strong><span>Refined Sugar</span></div>
              <div className="ps-item"><strong>Fresh</strong><span>Daily Delivery</span></div>
            </div>
          </div>
          <div className="process-visual">
            <img src="https://png.pngtree.com/png-vector/20230902/ourmid/pngtree-d-restaurant-kitchen-modern-industrial-kitchen-with-equipment-concept-3d-render-png-image_9827672.png" alt="Precision Cooking" />
          </div>
        </div>
      </section>

      {/* --- FINAL CALL TO ACTION --- */}
      <section className="dk-footer-cta">
        <h2>READY TO ENGINEER YOUR MEAL?</h2>
        <Link to="/build">
            <button className="build-now-footer">Start Building</button>
        </Link>
      </section>
    </div>
  );
};

export default DigitalKitchen;
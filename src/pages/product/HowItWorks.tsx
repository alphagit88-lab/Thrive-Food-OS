import React from 'react';
import { Link } from 'react-router-dom';
import './HowItWorks.css';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: "01",
      title: "Design Your Plate",
      description: "Use our Digital Kitchen to drag and drop ingredients. Watch your protein, carbs, and fats balance in real-time as you customize weights.",
      icon: "🎯"
    },
    {
      number: "02",
      title: "Precision Preparation",
      description: "Our chefs receive your exact specifications. Every meal is prepared to the gram using performance-focused cooking methods like sous-vide and grilling.",
      icon: "🧪"
    },
    {
      number: "03",
      title: "Flash Delivery",
      description: "Once sealed, your meal is dispatched immediately. We target a 45-minute window to ensure your nutrition is fresh and ready for consumption.",
      icon: "🚀"
    }
  ];

  return (
    <div className="how-it-works-page">
      {/* --- HERO --- */}
      <section className="hiw-hero">
        <span className="hiw-subtitle">THE BLUEPRINT</span>
        <h1 className="sakana-title">HOW IT <span className="lime-text">WORKS</span></h1>
        <p className="hiw-lead">
          We’ve engineered a seamless pipeline between your nutritional goals 
          and your daily meals. No guesswork, just results.
        </p>
      </section>

      {/* --- STEPS SECTION --- */}
      <section className="steps-container">
        {steps.map((step, index) => (
          <div key={index} className="step-row">
            <div className="step-number-col">
              <span className="big-num">{step.number}</span>
            </div>
            <div className="step-content-col">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
            <div className="step-icon-col">
              <div className="icon-circle">{step.icon}</div>
            </div>
          </div>
        ))}
      </section>

      {/* --- TECH HIGHLIGHT --- */}
      <section className="hiw-tech-breakdown">
        <div className="tech-card">
          <div className="tech-label">THRIVE ENGINE</div>
          <h2>Data-Driven Satiety</h2>
          <p>
            Our system doesn't just count calories; it calculates the glycemic load 
            and nutrient density of every combination to ensure sustained energy 
            levels throughout your day.
          </p>
        </div>
      </section>

      {/* --- CTA --- */}
      <section className="hiw-cta">
        <h2 className="sakana-title">READY TO <span className="lime-text">START?</span></h2>
        <Link to="/build">
          <button className="hiw-start-btn">Build Your First Meal</button>
        </Link>
      </section>
    </div>
  );
};

export default HowItWorks;
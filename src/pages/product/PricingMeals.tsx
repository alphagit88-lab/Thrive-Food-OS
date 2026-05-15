import React from 'react';
import { Link } from 'react-router-dom';
import './PricingMeals.css';

const PricingMeals: React.FC = () => {
  const subscriptionPlans = [
    {
      name: "Lite Performance",
      price: "24,000",
      meals: "10 Meals / Week",
      features: ["Custom Macro Balancing", "Standard Delivery", "Weekly Goal Review"],
      featured: false
    },
    {
      name: "Pro Athlete",
      price: "42,500",
      meals: "20 Meals / Week",
      // FIXED: Used single quotes for the nested string "Digital Kitchen"
      features: ["Priority 'Digital Kitchen' Access", "Flash 45-Min Delivery", "Daily Macro Optimization", "Nutritionist Chat Support"],
      featured: true
    },
    {
      name: "Ultimate Gains",
      price: "60,000",
      meals: "30 Meals / Week",
      features: ["Unlimited Customization", "Concierge Delivery", "Biometric Data Integration", "Family Sharing"],
      featured: false
    }
  ];

  return (
    // FIXED: Added missing '<' for the opening div
    <div className="pricing-page">
      
      <section className="pricing-hero">
        <h1 className="sakana-title">PRICING & <span className="lime-text">PLANS</span></h1>
        <p className="pricing-lead">
          Invest in your performance. Choose a subscription that fits your training 
          volume or pay as you build.
        </p>
      </section>

      <section className="plans-container">
        <div className="plans-grid">
          {subscriptionPlans.map((plan, index) => (
            <div key={index} className={`plan-card ${plan.featured ? 'featured' : ''}`}>
              {plan.featured && <div className="featured-label">MOST POPULAR</div>}
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="currency">LKR</span>
                <span className="amount">{plan.price}</span>
                <span className="period">/mo</span>
              </div>
              <p className="meal-count">{plan.meals}</p>
              <ul className="plan-features">
                {plan.features.map((feat, i) => (
                  <li key={i}><span>✓</span> {feat}</li>
                ))}
              </ul>
              <button className="plan-btn">Select Plan</button>
            </div>
          ))}
        </div>
      </section>

      {/* FIXED: Removed broken comment fragment */}
      <section className="meal-rates">
        {/* FIXED: Added missing '<' for the span */}
        <h2 className="section-title">BUILD-A-MEAL <span className="lime-text">RATES</span></h2>
        <div className="rates-table">
          <div className="rate-row header">
            <span>Ingredient Category</span>
            <span>Base Price (100g)</span>
          </div>
          <div className="rate-row">
            <span>Premium Meats (Beef/Mutton)</span>
            <span>LKR 850</span>
          </div>
          <div className="rate-row">
            <span>Poultry & Eggs</span>
            <span>LKR 450</span>
          </div>
          <div className="rate-row">
            <span>Complex Carbs (Brown Rice/Quinoa)</span>
            <span>LKR 300</span>
          </div>
          <div className="rate-row">
            <span>Organic Greens & Fibers</span>
            <span>LKR 250</span>
          </div>
        </div>
        <p className="table-note">* Final price is calculated in the Digital Kitchen based on exact weight and cook style.</p>
      </section>

      <section className="pricing-cta">
        <h3>Not ready to commit?</h3>
        <Link to="/build">
          {/* FIXED: Removed leaked CSS code from the button class and text */}
          <button className="secondary-cta">Try a Single Meal</button>
        </Link>
      </section>
    </div>
  );
};

export default PricingMeals;
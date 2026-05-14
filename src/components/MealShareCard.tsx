import React from 'react';
import './MealShareCard.css';

const MealShareCard: React.FC = () => {
    const ingredients = [
        "Chicken Thigh · Grilled · 200g",
        "Brown Rice · Steamed · 150g",
        "Broccoli · Steamed · 100g",
        "Boiled Egg x2"
    ];

    return (
        <div className="meal-share-container">
            {/* LEFT PANEL: IMAGE & ACTIONS */}
            <div className="meal-visual-section">
                <div className="meal-image-wrapper">
                    <img src="https://img.freepik.com/free-psd/roasted-chicken-dinner-platter-delicious-feast_632498-25445.jpg?semt=ais_hybrid&w=740&q=80" alt="Meal" className="main-meal-img" />
                </div>

                <div className="interaction-row">
                    <div className="stat-group">
                        <span className="icon heart">❤️</span>
                        <span className="count">23</span>
                    </div>
                    <div className="stat-group">
                        <span className="icon comment">💬</span>
                        <span className="count">45</span>
                    </div>
                    <div className="price-tag">1,850 LKR</div>
                </div>

                <button className="build-similar-btn">BUILD SIMILAR</button>

                <div className="macro-footer">
                    <div className="macro-item"><strong>40g</strong><span>Protein</span></div>
                    <div className="macro-item"><strong>35g</strong><span>Carbs</span></div>
                    <div className="macro-item"><strong>15g</strong><span>Fats</span></div>
                    <div className="macro-item"><strong>450</strong><span>Kcal</span></div>
                </div>
            </div>

            {/* RIGHT PANEL: SOCIAL & DETAILS */}
            <div className="meal-social-section">
                <div className="user-header">
                    <div className="avatar">A</div>
                    <div className="user-info">
                        <h4>Ashan AK</h4>
                        <p>2 hours ago · One Galle Face · 47 orders</p>
                    </div>
                </div>

                <h2 className="meal-title-quote">"Post-Leg-Day Recovery Bowl"</h2>

                <div className="tags-container">
                    {ingredients.map((tag, i) => (
                        <span key={i} className="ingredient-tag">{tag}</span>
                    ))}
                </div>

                <hr className="divider" />

                <div className="comment-input-wrapper">
                    <div className="mini-avatar">AK</div>
                    <div className="input-box">
                        <input type="text" placeholder="Add a comment" />
                        <button className="send-btn">➔</button>
                    </div>
                </div>

                <div className="comments-list">
                    <div className="comment-item">
                        <div className="comment-avatar blue">NF</div>
                        <div className="comment-body">
                            <h5>Nimesha Fernando</h5>
                            <p>This is exactly what I needed after squats.</p>
                            <span className="timestamp">1 Hour ago</span>
                        </div>
                    </div>

                    <div className="comment-item">
                        <div className="comment-avatar orange">KP</div>
                        <div className="comment-body">
                            <h5>Kasun Perera</h5>
                            <p>Added sweet potato instead of rice and bumped protein to 250g — absolutely dialled in for bulk season</p>
                            <span className="timestamp">45 minutes ago</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MealShareCard;
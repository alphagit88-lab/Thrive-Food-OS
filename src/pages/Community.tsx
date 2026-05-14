import React from 'react';
import MealShareCard from '../components/MealShareCard';
import './Community.css';

const Community: React.FC = () => {
    return (
        <div className="community-page">
            <section className="community-header-section">
                <span className="community-label">COMMUNITY KITCHEN</span>
                <h2 className="community-main-title">
                    Meals built by <br />
                    real people.
                </h2>
                <p className="community-description">
                    Every meal you build gets a name and a place here. Browse what others are
                    eating, get inspired, build your own version.
                </p>
            </section>
            {/* --- COMMUNITY HEADER --- */}
            {/* <header className="community-header">
                <div className="community-meta">
                    <div className="community-avatar">A</div>
                    <div className="community-info">
                        <h1 className="sakana-title">ASHAN <span className="lime-text">AK</span></h1>
                        <p className="bio">Elite Tier · 47 Orders · 12.4k Calories Tracked</p>
                    </div>
                </div>
                <div className="community-actions">
                    <button className="edit-btn">Edit Profile</button>
                    <button className="settings-btn">⚙️</button>
                </div>
            </header> */}

            {/* --- STATS BAR --- */}
            {/* <section className="community-stats-bar">
                <div className="p-stat"><strong>14</strong><span>Day Streak</span></div>
                <div className="p-stat"><strong>185g</strong><span>Avg Protein</span></div>
                <div className="p-stat"><strong>92%</strong><span>Goal Accuracy</span></div>
            </section> */}

            {/* --- MEAL HISTORY GRID --- */}
            <section className="community-content">
                {/* <div className="content-tabs">
                    <button className="tab active">Meal History</button>
                    <button className="tab">Saved Blueprints</button>
                    <button className="tab">Achievements</button>
                </div> */}

                <div className="meal-history-grid">
                    {/* We wrap the MealShareCard here. 
              In a real app, you would map over an array of meal data */}
                    <div className="meal-card-wrapper">
                        <MealShareCard />
                    </div>

                    {/* Example of a second card placeholder */}
                    <div className="meal-card-wrapper">
                        <MealShareCard />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Community;
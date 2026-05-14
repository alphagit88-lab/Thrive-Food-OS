import React from 'react';
import './SetMenus.css';

interface MealData {
    id: number;
    tag: string;
    image: string;
    name: string;
    description: string;
    ingredients: string[];
    macros: { protein: string; carbs: string; fats: string; kcal: string };
    price: string;
}

const MealCard: React.FC<{ meal: MealData }> = ({ meal }) => (
    <div className="meal-card">
        <div className="card-top">
            <span className="meal-tag">{meal.tag}</span>
            <div className="meal-image-container">
                <img src={meal.image} alt={meal.name} className="meal-img" />
            </div>
            <div className="meal-info">
                <h3 className="meal-name">{meal.name}</h3>
                <p className="meal-desc">{meal.description}</p>
            </div>
        </div>

        <div className="meal-info-list">
            <ul className="meal-ingredients">
                {meal.ingredients.map((ing, index) => (
                    <li key={index}><span className="ingredient-bullet">•</span> {ing}</li>
                ))}
            </ul>
        </div>

        <div className="card-macros">
            <div className="macro-box"><strong>{meal.macros.protein}</strong><span>Protein</span></div>
            <div className="macro-box"><strong>{meal.macros.carbs}</strong><span>Carbs</span></div>
            <div className="macro-box"><strong>{meal.macros.fats}</strong><span>Fats</span></div>
            <div className="macro-box"><strong>{meal.macros.kcal}</strong><span>Kcal</span></div>
        </div>

        <div className="card-bottom">
            <span className="price">{meal.price}</span>
            <button className="buy-now-btn">Buy Now</button>
        </div>
    </div>
);

const SetMenus: React.FC = () => {
    const meals: MealData[] = [
        {
            id: 1,
            tag: "MUSCLE GAIN",
            image: "https://img.magnific.com/free-psd/grilled-steak-with-lemon-tomatoes-arugula_632498-26088.jpg?semt=ais_hybrid&w=740&q=80",
            name: "Chicken with Thai Mango-Coconut Dip",
            description: "Fresh Atlantic salmon, seasoned with lemon and herbs, served over a bed of steamed asparagus.",
            ingredients: ["Salmon 200g", "Asparagus 150g", "Quinoa 100g", "Lemon Wedges"],
            macros: { protein: "42g", carbs: "12g", fats: "18g", kcal: "385" },
            price: "2,150 LKR"
        },
        {
            id: 2,
            tag: "WEIGHT LOSS",
            image: "https://png.pngtree.com/png-clipart/20250427/original/pngtree-healthy-food-plate-with-fruits-and-vegetables-png-image_20850628.png",
            name: "Grilled Chicken & Avocado Bowl",
            description: "Lean chicken breast paired with healthy fats from avocado and fresh garden greens.",
            ingredients: ["Chicken 180g", "Avocado 0.5", "Mixed Greens", "Cherry Tomatoes"],
            macros: { protein: "35g", carbs: "8g", fats: "12g", kcal: "310" },
            price: "1,750 LKR"
        },
        {
            id: 3,
            tag: "ENERGY BOOST",
            image: "https://img.magnific.com/free-psd/roasted-chicken-dinner-platter-delicious-feast_632498-25445.jpg",
            name: "Mediterranean Power Bowl",
            description: "A nutrient-dense mix of chickpeas, hummus, and fresh vegetables for sustained energy.",
            ingredients: ["Chickpeas 150g", "Hummus 50g", "Cucumber", "Feta Cheese"],
            macros: { protein: "18g", carbs: "45g", fats: "10g", kcal: "420" },
            price: "1,600 LKR"
        }
    ];

    return (
        <section className="menus-section">
            <div className="menus-header">
                <p className="ready-tag">Ready to Order</p>
                <h2 className="menus-title">Set menus.<br />Built for performance.</h2>
                <p className="menus-subtitle">
                    No decisions needed. Our nutritionists built these meals to hit precise macro targets for different goals.
                    Pick yours and order in one tap.
                </p>
            </div>

            <div className="menus-grid">
                {meals.map((meal, idx) => (
                    <MealCard key={idx} meal={meal} />
                ))}
            </div>
        </section>
    );
};

export default SetMenus;
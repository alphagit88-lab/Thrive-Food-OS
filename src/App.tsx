import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Process from './components/Process';
import Nutrition from './components/Nutrition';
import SetMenus from './components/SetMenus';
import CommunityKitchen from './components/CommunityKitchen';
import Leaderboard from './components/Leaderboard';
import FinalCTA from './components/FinalCTA';
import MealBuilder from './pages/MealBuilder';
import PowerDrinks from './components/PowerDrinks';
import './App.css';
import OrderPage from './pages/OrderPage';
import LoginPage from './pages/LoginPage';
import MainLayout from './Layout/MainLayout';
import SignUpPage from './pages/SignUpPage';
import ChefLoginPage from './pages/ChefLoginPage';
import ChefOrdersPage from './pages/ChefOrdersPage';

const LandingPage = () => (
  <>
    <Hero />
    <Stats />
    <Process />
    <Nutrition />
    <SetMenus />
    <CommunityKitchen />
    <Leaderboard />
    <FinalCTA />
    <PowerDrinks />
  </>
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* --- ROUTES WITH HEADER/FOOTER --- */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/build" element={<MealBuilder />} />
          <Route path="/order" element={<OrderPage />} />
        </Route>
        {/* --- ROUTES WITHOUT HEADER/FOOTER --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signUp" element={<SignUpPage />} />
        <Route path="/chef/login" element={<ChefLoginPage />} />
        <Route path="/chef/orders" element={<ChefOrdersPage />} />
      </Routes>
    </Router>
  );
};

export default App;

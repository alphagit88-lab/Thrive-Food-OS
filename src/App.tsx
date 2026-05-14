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
import PrivacyPolicy from './pages/support/PrivacyPolicy';
import HelpCenter from './pages/support/HelpCenter';
import About from './pages/company/About';
import Careers from './pages/company/Careers';
import Contact from './pages/company/Contact';
import DigitalKitchen from './pages/product/DigitalKitchen';
import HowItWorks from './pages/product/HowItWorks';
import Scheduling from './pages/product/Scheduling';
import PricingMeals from './pages/product/PricingMeals';
import PressMedia from './pages/company/PressMedia';
import FAQs from './pages/support/FAQs';
import TermsConditions from './pages/support/TermsConditions';
import Community from './pages/Community';

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
          <Route path="/community" element={<Community />} />

          {/* Product Routes */}
          <Route path="/digital-kitchen" element={<DigitalKitchen />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/pricingMeals" element={<PricingMeals />} />
          <Route path="/scheduling" element={<Scheduling />} />

          {/* Company Routes */}
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pressMedia" element={<PressMedia />} />

          {/* Support Routes */}
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/privacyPolicy" element={<PrivacyPolicy />} />
          <Route path="/faqs" element={<FAQs />} />
          <Route path="/termsConditions" element={<TermsConditions />} />
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

import React from 'react';
import './Footer.css';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
    return (
        <footer className="footer-section">
            <div className="brand-column">
                <div className="footer-logo">THRIVE</div>
                <p className="brand-tagline">Precision Fuel for Performance</p>
            </div>
            <div className="footer-top">
                <div className="links-grid">
                    <div className="link-group">
                        <h5>PRODUCT LINKS</h5>
                        <ul>
                            <li><Link to="/digital-kitchen">Digital Kitchen</Link></li>
                            <li><Link to="/how-it-works">How It Works</Link></li>
                            <li><Link to="/pricingMeals">Pricing / Meals</Link></li>
                            <li><Link to="/scheduling">Scheduling</Link></li>
                        </ul>
                    </div>

                    <div className="link-group">
                        <h5>COMPANY</h5>
                        <ul>
                            <li><Link to="/about">About THRYV</Link></li>
                            <li><Link to="/careers">Careers</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                            <li><Link to="/pressMedia">Press / Media</Link></li>
                        </ul>
                    </div>

                    <div className="link-group">
                        <h5>SUPPORT</h5>
                        <ul>
                            <li><Link to="/help">Help Center</Link></li>
                            <li><Link to="/faqs">FAQs</Link></li>
                            <li><Link to="/termsConditions">Terms & Conditions</Link></li>
                            <li><Link to="/privacyPolicy">Privacy Policy</Link></li>
                        </ul>
                    </div>

                    <div className="link-group">
                        <h5>SOCIAL</h5>
                        <ul>
                            <li><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a></li>
                            <li><a href="https://tiktok.com" target="_blank" rel="noreferrer">TikTok</a></li>
                            <li><a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a></li>
                            <li><a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a></li>
                        </ul>
                    </div>
                </div>

                <div className="newsletter-column">
                    <h5>Stay in control of your nutrition.</h5>
                    <div className="input-wrapper">
                        <input type="email" placeholder="Email" />
                        <button className="join-thryv-btn">Join THRYV</button>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="footer-bg-text">Build your meals. Track your nutrition. Own your lifestyle.</div>
                <p className="copyright">© 2026 THRYV. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
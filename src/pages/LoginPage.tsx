import React, { useState } from 'react';
import './LoginPage.css';
import { FaGoogle, FaFacebookF } from "react-icons/fa";
import OtpInput from '../components/OtpInput';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp } from '../services/authService';

const LoginPage: React.FC = () => {

	const navigate = useNavigate();

	const [phoneNumber, setPhoneNumber] = useState<string>('');
	const [isSendCodePressed, setIsSendCodePressed] = useState<boolean>(false);
	const [otp, setOtp] = useState<string>('');
	const [loading, setLoading] = useState<boolean>(false);

	const onCreateAccountClick = () => {
		navigate('/signUp');
	};

	const onChefLoginClick = () => {
		navigate('/chef/login');
	};

	const onSendCodeClick = async () => {
		if (!phoneNumber) {
			alert("Please enter your phone number");
			return;
		}

		setLoading(true);
		try {
			// API Call: Using the common service
			await sendOtp(phoneNumber);
			setIsSendCodePressed(true);
		} catch {
			alert("Failed to send code. Please ensure the number is correct.");
		} finally {
			setLoading(false);
		}
	};

	const onCompleteOtp = (code: string) => {
		setOtp(code);
	};

	const onSubmitOtp = async () => {
		if (otp === '' || otp.length < 4) {
			alert('Please enter a valid 4-digit OTP');
			return;
		}

		setLoading(true);
		try {
			// API Call: Verify Login
			const res = await verifyOtp(otp);

			if (res.data.success || res.data.verified) {
				console.log("Login Successful", res.data);
				// Save token if your backend sends one
				if (res.data.token) localStorage.setItem('token', res.data.token);
				navigate('/order');
			}
		} catch {
			alert("Invalid OTP. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="landing-wrapper">
			{/* Background Watermark */}
			<div className="bg-watermark">THRIVE</div>

			<header className="navbar">
				<div className="logo-text">THRIVE</div>
			</header>

			<main className="hero-content">
				<div className="hero-left">
					<h1 className="hero-title">
						Build your meals. Track your nutrition. Own your lifestyle.
					</h1>
					<p className="hero-subtitle">
						Design every ingredient, every gram, every cook style. <br />
						We make it. We deliver it.
					</p>

					{/* Decorative Food Images */}
					<div className="food-decor">
						<img src="https://e7.pngegg.com/pngimages/786/552/png-clipart-platter-of-grilled-lamb-italian-cuisine-pizza-pasta-food-plate-healthy-food-food-beef-thumbnail.png" className="plate plate-lg" alt="Main dish" />
						<img src="https://png.pngtree.com/png-clipart/20250427/original/pngtree-healthy-food-plate-with-fruits-and-vegetables-png-image_20850628.png" className="plate plate-sm top" alt="Side dish" />
						<img src="https://img.freepik.com/free-psd/hearty-dinner-plate-with-roasted-meat-mashed-potatoes-mixed-vegetables_84443-65709.jpg?semt=ais_hybrid&w=740&q=80" className="plate plate-sm bottom" alt="Side dish" />
					</div>
				</div>

				{!isSendCodePressed ?
					<div className="login-card-container">
						<div className="login-card">
							<div className="card-padding">
								<label className="input-label">LOGIN WITH PHONE NUMBER</label>
								<input
									type="text"
									placeholder="Enter your Phone Number"
									className="phone-input"
									value={phoneNumber}
									onChange={(e) => setPhoneNumber(e.target.value)}
								/>
								<p className="otp-hint">You will receive a OTP to the number</p>

								<button
									className="btn-send"
									onClick={onSendCodeClick}
									disabled={loading}
								>
									{loading ? "Sending..." : "Send Code"}
								</button>

								<button className="btn-create" onClick={onCreateAccountClick}>Create Account</button>
								<button className="btn-chef-login" onClick={onChefLoginClick}>Kitchen Chef Login</button>

								<div className="divider">
									<span>Or continue with</span>
								</div>

								<div className="social-grid">
									<button className="btn-social">
										<FaFacebookF size={18} color="var(--black)" /> Continue with Facebook
									</button>
									<button className="btn-social">
										<FaGoogle size={18} color="var(--black)" /> Continue with Google
									</button>
								</div>
							</div>

							{/* Stats Footer on Card */}
							<div className="card-stats">
								<div className="stat-item"><strong>40g</strong><span>Protein</span></div>
								<div className="stat-item"><strong>35g</strong><span>Carbs</span></div>
								<div className="stat-item"><strong>15g</strong><span>Fats</span></div>
								<div className="stat-item"><strong>450</strong><span>Kcal</span></div>
							</div>
						</div>
					</div>
					:
					<div className="otp-wrapper">
						<div className="otp-card">
							<h2 className="otp-title">Enter OTP Code</h2>
							<p className="otp-subtitle">We sent a 4-digit code to</p>
							<p className="phone-number">{phoneNumber}</p>
							<div className="otp-input-container">
								<OtpInput length={4} onComplete={onCompleteOtp} />
							</div>

							<p className="expiry-text">Expires in 02:45</p>

							<p className="resend-text">
								Didn't receive it? <button className="resend-link">Resend code</button>
							</p>

							<button
								className="verify-btn"
								onClick={onSubmitOtp}
								disabled={loading}
							>
								{loading ? "Verifying..." : "Verify and Login"}
							</button>
						</div>
					</div>
				}
			</main>
		</div>
	);
};

export default LoginPage;

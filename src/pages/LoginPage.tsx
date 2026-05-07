import React, { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import './LoginPage.css';
import { FaGoogle, FaFacebookF } from "react-icons/fa";
import OtpInput from '../components/OtpInput';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginCustomer, sendOtp, verifyOtp } from '../services/authService';
import { useAppSelector } from '../store/hooks';
import { readCustomerSession, saveCustomerSession } from '../utils/storage';

const DEFAULT_REDIRECT = '/build';

const getSafeRedirectTarget = (candidate: string | null) => {
	if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
		return DEFAULT_REDIRECT;
	}

	return candidate;
};

const LoginPage: React.FC = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const redirectTo = getSafeRedirectTarget(searchParams.get('redirect'));
	const checkoutDraft = useAppSelector((state) => state.mealBuilder.checkoutDraft);
	const selectedLocationId = useAppSelector((state) => state.mealBuilder.selectedLocationId);
	const activeLocationId = checkoutDraft?.location_id || selectedLocationId || '';

	const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	const [isSendCodePressed, setIsSendCodePressed] = useState(false);
	const [otp, setOtp] = useState('');
	const [loading, setLoading] = useState(false);
	const [formError, setFormError] = useState('');

	useEffect(() => {
		if (readCustomerSession()) {
			navigate(redirectTo, { replace: true });
		}
	}, [navigate, redirectTo]);

	const onCreateAccountClick = () => {
		navigate(`/signUp?redirect=${encodeURIComponent(redirectTo)}`);
	};

	const onChefLoginClick = () => {
		navigate('/chef/login');
	};

	const onSwitchMode = (mode: 'password' | 'otp') => {
		setAuthMode(mode);
		setFormError('');
		setLoading(false);
		setIsSendCodePressed(false);
		setOtp('');
	};

	const onPasswordLogin = async () => {
		if (!identifier.trim() || !password.trim()) {
			setFormError('Enter your email or phone number and password.');
			return;
		}

		setLoading(true);
		setFormError('');

		try {
			const loginPayload = identifier.includes('@')
				? {
						email: identifier.trim(),
						password,
						location_id: activeLocationId || undefined,
				  }
				: {
						phone: identifier.trim(),
						password,
						location_id: activeLocationId || undefined,
				  };

			const res = await loginCustomer(loginPayload);

			if (res.data.success && res.data.token) {
				saveCustomerSession({
					token: res.data.token,
					user: res.data.user,
					authenticated_at: new Date().toISOString(),
				});
				navigate(redirectTo, { replace: true });
				return;
			}

			setFormError('Unable to log in. Please try again.');
		} catch (error) {
			const message = isAxiosError<{ message?: string; error?: string }>(error)
				? error.response?.data?.error || error.response?.data?.message
				: undefined;
			setFormError(message || 'Login failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const onSendCodeClick = async () => {
		if (!phoneNumber.trim()) {
			setFormError("Please enter your phone number");
			return;
		}

		setLoading(true);
		setFormError('');
		try {
			await sendOtp(phoneNumber.trim(), activeLocationId || undefined);
			setIsSendCodePressed(true);
		} catch {
			setFormError("Failed to send code. Please ensure the number is correct.");
		} finally {
			setLoading(false);
		}
	};

	const onCompleteOtp = (code: string) => {
		setOtp(code);
	};

	const onSubmitOtp = async () => {
		if (otp === '' || otp.length < 4) {
			setFormError('Please enter a valid 4-digit OTP');
			return;
		}

		setLoading(true);
		setFormError('');
		try {
			const res = await verifyOtp(phoneNumber.trim(), otp, activeLocationId || undefined);

			if ((res.data.success || res.data.verified) && res.data.token) {
				saveCustomerSession({
					token: res.data.token,
					user: res.data.user || {
						firstName: '',
						lastName: '',
						email: '',
						phone: phoneNumber.trim(),
					},
					authenticated_at: new Date().toISOString(),
				});
				navigate(redirectTo, { replace: true });
				return;
			}

			setFormError("No customer account was found for this phone number. Please create an account first.");
		} catch {
			setFormError("Invalid OTP. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="landing-wrapper">
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

					<div className="food-decor">
						<img src="https://e7.pngegg.com/pngimages/786/552/png-clipart-platter-of-grilled-lamb-italian-cuisine-pizza-pasta-food-plate-healthy-food-food-beef-thumbnail.png" className="plate plate-lg" alt="Main dish" />
						<img src="https://png.pngtree.com/png-clipart/20250427/original/pngtree-healthy-food-plate-with-fruits-and-vegetables-png-image_20850628.png" className="plate plate-sm top" alt="Side dish" />
						<img src="https://img.freepik.com/free-psd/hearty-dinner-plate-with-roasted-meat-mashed-potatoes-mixed-vegetables_84443-65709.jpg?semt=ais_hybrid&w=740&q=80" className="plate plate-sm bottom" alt="Side dish" />
					</div>
				</div>

				<div className="login-card-container">
					{authMode === 'password' ? (
						<div className="login-card">
							<div className="card-padding">
								<div className="login-switch">
									<button
										className="login-switch-btn active"
										type="button"
										onClick={() => onSwitchMode('password')}
									>
										Password Login
									</button>
									<button
										className="login-switch-btn"
										type="button"
										onClick={() => onSwitchMode('otp')}
									>
										OTP Login
									</button>
								</div>

								<label className="input-label">LOGIN TO YOUR ACCOUNT</label>
								<input
									type="text"
									placeholder="Email or Phone Number"
									className="login-field"
									value={identifier}
									onChange={(event) => {
										setIdentifier(event.target.value);
										setFormError('');
									}}
									autoComplete="username"
								/>
								<input
									type="password"
									placeholder="Enter your Password"
									className="login-field"
									value={password}
									onChange={(event) => {
										setPassword(event.target.value);
										setFormError('');
									}}
									autoComplete="current-password"
								/>

								<p className="login-helper-text">
									Use the email or phone number linked to your Thrive account.
								</p>

								{formError ? <div className="login-feedback">{formError}</div> : null}

								<button
									className="btn-send"
									onClick={() => void onPasswordLogin()}
									disabled={loading}
								>
									{loading ? "Logging In..." : "Log In"}
								</button>

								<div className="login-link-row">
									<span>Need a new account?</span>
									<Link to={`/signUp?redirect=${encodeURIComponent(redirectTo)}`} className="login-secondary-link">
										Create Account
									</Link>
								</div>

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

							<div className="card-stats">
								<div className="stat-item"><strong>40g</strong><span>Protein</span></div>
								<div className="stat-item"><strong>35g</strong><span>Carbs</span></div>
								<div className="stat-item"><strong>15g</strong><span>Fats</span></div>
								<div className="stat-item"><strong>450</strong><span>Kcal</span></div>
							</div>
						</div>
					) : !isSendCodePressed ? (
						<div className="login-card">
							<div className="card-padding">
								<div className="login-switch">
									<button
										className="login-switch-btn"
										type="button"
										onClick={() => onSwitchMode('password')}
									>
										Password Login
									</button>
									<button
										className="login-switch-btn active"
										type="button"
										onClick={() => onSwitchMode('otp')}
									>
										OTP Login
									</button>
								</div>

								<label className="input-label">LOGIN WITH PHONE NUMBER</label>
								<input
									type="text"
									placeholder="Enter your Phone Number"
									className="phone-input"
									value={phoneNumber}
									onChange={(event) => {
										setPhoneNumber(event.target.value);
										setFormError('');
									}}
								/>
								<p className="otp-hint">You will receive an OTP to this number.</p>

								{formError ? <div className="login-feedback">{formError}</div> : null}

								<button
									className="btn-send"
									onClick={() => void onSendCodeClick()}
									disabled={loading}
								>
									{loading ? "Sending..." : "Send Code"}
								</button>

								<button className="btn-create" onClick={onCreateAccountClick}>Create Account</button>
								<button className="btn-chef-login" onClick={onChefLoginClick}>Kitchen Chef Login</button>
							</div>

							<div className="card-stats">
								<div className="stat-item"><strong>40g</strong><span>Protein</span></div>
								<div className="stat-item"><strong>35g</strong><span>Carbs</span></div>
								<div className="stat-item"><strong>15g</strong><span>Fats</span></div>
								<div className="stat-item"><strong>450</strong><span>Kcal</span></div>
							</div>
						</div>
					) : (
						<div className="otp-wrapper">
							<div className="otp-card">
								<h2 className="otp-title">Enter OTP Code</h2>
								<p className="otp-subtitle">We sent a 4-digit code to</p>
								<p className="phone-number">{phoneNumber}</p>
								<div className="otp-input-container">
									<OtpInput length={4} onComplete={onCompleteOtp} />
								</div>

								<p className="expiry-text">Use test code 8400 for now.</p>

								{formError ? <div className="login-feedback otp-feedback">{formError}</div> : null}

								<p className="resend-text">
									Need your password instead?{' '}
									<button className="resend-link" onClick={() => onSwitchMode('password')} type="button">
										Switch to password login
									</button>
								</p>

								<button
									className="verify-btn"
									onClick={() => void onSubmitOtp()}
									disabled={loading}
								>
									{loading ? "Verifying..." : "Verify and Login"}
								</button>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
};

export default LoginPage;

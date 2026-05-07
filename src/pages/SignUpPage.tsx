import React, { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './SignUpPage.css';
import OtpInput from '../components/OtpInput';
import { registerUser, sendOtp, verifyOtp } from '../services/authService';
import { useAppSelector } from '../store/hooks';
import { readCustomerSession, saveCustomerSession } from '../utils/storage';

const OTP_BYPASS_ENABLED = true;
const DEFAULT_REDIRECT = '/build';

type SignUpFormState = {
  firstName: string;
  lastName: string;
  email: string;
  dob: string;
  gender: string;
  phone: string;
  password: string;
};

const getSafeRedirectTarget = (candidate: string | null) => {
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return DEFAULT_REDIRECT;
  }

  return candidate;
};

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirectTarget(searchParams.get('redirect'));
  const isCheckoutSignup = redirectTo === '/order';
  const checkoutDraft = useAppSelector((state) => state.mealBuilder.checkoutDraft);
  const selectedLocationId = useAppSelector((state) => state.mealBuilder.selectedLocationId);
  const activeLocationId = checkoutDraft?.location_id || selectedLocationId || '';
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<SignUpFormState>({
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    gender: '',
    phone: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isConfirmTouched, setIsConfirmTouched] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (readCustomerSession()) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  const updateField = (field: keyof SignUpFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormError('');
  };

  const passwordsMatch = formData.password === confirmPassword;
  const showConfirmError = isConfirmTouched && !passwordsMatch && confirmPassword.length > 0;

  const requirements = {
    length: formData.password.length >= 8,
    lowercase: /[a-z]/.test(formData.password),
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*_]/.test(formData.password),
  };

  const strengthCount = Object.values(requirements).filter(Boolean).length;
  const hasStrongEnoughPassword = strengthCount >= 3;

  const getStrengthLabel = () => {
    if (strengthCount <= 0) return '';
    if (strengthCount === 1) return 'Weak';
    if (strengthCount === 2) return 'Fair';
    if (strengthCount === 3) return 'Good';
    return 'Strong Password';
  };

  const getStepOneValidationMessage = () => {
    if (!formData.firstName.trim()) {
      return 'Please enter your first name.';
    }

    if (!formData.email.trim()) {
      return 'Please enter your email address.';
    }

    if (!formData.phone.trim()) {
      return 'Please enter your mobile number.';
    }

    if (!formData.password) {
      return 'Please create a password.';
    }

    if (!hasStrongEnoughPassword) {
      return 'Use a stronger password before continuing.';
    }

    if (!passwordsMatch) {
      return 'Passwords do not match.';
    }

    return '';
  };

  const buildRegistrationPayload = () => ({
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.trim(),
    dob: formData.dob,
    gender: formData.gender.trim(),
    phone: formData.phone.trim(),
    password: formData.password,
  });

  const handleCreateAccount = async () => {
    const validationMessage = getStepOneValidationMessage();
    if (validationMessage) {
      setFormError(validationMessage);
      setStep(1);
      return;
    }

    const registrationPayload = buildRegistrationPayload();

    setLoading(true);
    setFormError('');

    try {
      const response = await registerUser(registrationPayload, activeLocationId || undefined);

      saveCustomerSession({
        token: response.data.token,
        user: response.data.user,
        authenticated_at: new Date().toISOString(),
      });

      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = isAxiosError<{ message?: string; error?: string }>(error)
        ? error.response?.data?.error || error.response?.data?.message
        : undefined;

      setFormError(message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Continue = async () => {
    if (OTP_BYPASS_ENABLED) {
      await handleCreateAccount();
      return;
    }

    const validationMessage = getStepOneValidationMessage();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setStep(2);
  };

  const handleSendOtp = async () => {
    if (!formData.phone.trim()) {
      setFormError('Please enter your phone number.');
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      await sendOtp(formData.phone.trim(), activeLocationId || undefined);
      setStep(3);
    } catch {
      setFormError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      setFormError('Please enter the full OTP code.');
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      await verifyOtp(formData.phone.trim(), otp, activeLocationId || undefined);
      setStep(4);
    } catch {
      setFormError('Invalid OTP code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-wrapper signup-page">
      <div className="bg-watermark">THRIVE</div>

      <header className="navbar">
        <div className="logo-text">THRIVE</div>
      </header>

      <main className="hero-content signup-hero-content">
        <div className="hero-left signup-hero-left">
          <h1 className="hero-title">
            Build your meals. Track your nutrition. Own your lifestyle.
          </h1>
          <p className="hero-subtitle">
            Design every ingredient, every gram, every cook style.
            <br />
            We make it. We deliver it.
          </p>

          <div className="food-decor">
            <img
              src="https://e7.pngegg.com/pngimages/786/552/png-clipart-platter-of-grilled-lamb-italian-cuisine-pizza-pasta-food-plate-healthy-food-food-beef-thumbnail.png"
              className="plate plate-lg"
              alt="Main dish"
            />
            <img
              src="https://png.pngtree.com/png-clipart/20250427/original/pngtree-healthy-food-plate-with-fruits-and-vegetables-png-image_20850628.png"
              className="plate plate-sm top"
              alt="Side dish"
            />
            <img
              src="https://img.freepik.com/free-psd/hearty-dinner-plate-with-roasted-meat-mashed-potatoes-mixed-vegetables_84443-65709.jpg?semt=ais_hybrid&w=740&q=80"
              className="plate plate-sm bottom"
              alt="Side dish"
            />
          </div>
        </div>

        <div className="form-card signup-card">
          {step === 1 && (
            <div className="step-content">
              <h2 className="title">Create your Account</h2>
              <p className="subtitle">
                {isCheckoutSignup
                  ? 'Create your account to continue with checkout.'
                  : 'Lets start with basic details'}
              </p>

              <div className="grid-row">
                <div className="input-group">
                  <label htmlFor="signup-first-name">FIRST NAME</label>
                  <input
                    id="signup-first-name"
                    type="text"
                    value={formData.firstName}
                    onChange={(event) => updateField('firstName', event.target.value)}
                    autoComplete="given-name"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="signup-last-name">LAST NAME</label>
                  <input
                    id="signup-last-name"
                    type="text"
                    value={formData.lastName}
                    onChange={(event) => updateField('lastName', event.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="signup-email">EMAIL</label>
                <input
                  id="signup-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="input-group">
                <label htmlFor="signup-phone">MOBILE NUMBER</label>
                <input
                  id="signup-phone"
                  type="tel"
                  placeholder="+94"
                  value={formData.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  autoComplete="tel"
                />
              </div>

              <div className="grid-row">
                <div className="input-group">
                  <label htmlFor="signup-dob">DATE OF BIRTH</label>
                  <input
                    id="signup-dob"
                    type="date"
                    value={formData.dob}
                    onChange={(event) => updateField('dob', event.target.value)}
                    autoComplete="bday"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="signup-gender">GENDER</label>
                  <input
                    id="signup-gender"
                    type="text"
                    value={formData.gender}
                    onChange={(event) => updateField('gender', event.target.value)}
                    autoComplete="sex"
                  />
                </div>
              </div>

              <div className="grid-row signup-password-grid">
                <div className="input-group">
                  <label htmlFor="signup-password">PASSWORD</label>
                  <div className="password-wrapper">
                    <input
                      id="signup-password"
                      type="password"
                      value={formData.password}
                      onChange={(event) => updateField('password', event.target.value)}
                      autoComplete="new-password"
                    />
                    <div className="strength-meter">
                      {[1, 2, 3, 4].map((index) => (
                        <div key={index} className={`bar ${strengthCount >= index ? 'active' : ''}`}></div>
                      ))}
                    </div>
                    <span className="strength-label">{getStrengthLabel()}</span>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="signup-confirm-password">CONFIRM PASSWORD</label>
                  <div className="input-wrapper-inline">
                    <input
                      id="signup-confirm-password"
                      type="password"
                      value={confirmPassword}
                      className={showConfirmError ? 'input-error' : ''}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setIsConfirmTouched(true);
                        setFormError('');
                      }}
                      autoComplete="new-password"
                    />
                    {showConfirmError ? <span className="error-icon-inline">!</span> : null}
                    {!showConfirmError && passwordsMatch && confirmPassword.length > 0 ? (
                      <span className="success-icon-inline">OK</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="requirements">
                <label>PASSWORD REQUIREMENTS</label>
                <ul className="requirements-box">
                  <li className={requirements.length ? 'valid' : ''}>
                    {requirements.length ? '[OK]' : '[ ]'} At least 8 characters
                  </li>
                  <li className={requirements.uppercase ? 'valid' : ''}>
                    {requirements.uppercase ? '[OK]' : '[ ]'} One uppercase letter
                  </li>
                  <li className={requirements.number ? 'valid' : ''}>
                    {requirements.number ? '[OK]' : '[ ]'} One number
                  </li>
                  <li className={requirements.special ? 'valid' : ''}>
                    {requirements.special ? '[OK]' : '[ ]'} Special character (optional)
                  </li>
                </ul>
              </div>

              {OTP_BYPASS_ENABLED ? (
                <div className="info-box">
                  OTP verification is temporarily skipped. We will create your account and continue your order
                  flow right away.
                </div>
              ) : null}

              {formError ? <div className="signup-feedback">{formError}</div> : null}

              <div className="signup-link-row">
                <span>Already have an account?</span>
                <Link to={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="signup-secondary-link">
                  Log In
                </Link>
              </div>

              <button
                className="primary-btn"
                onClick={() => {
                  void handleStep1Continue();
                }}
                disabled={loading || !hasStrongEnoughPassword || !passwordsMatch}
              >
                {loading
                  ? 'Creating...'
                  : isCheckoutSignup
                    ? 'Create Account and Continue'
                    : 'Create Account'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="step-content">
              <h2 className="title">Your mobile number</h2>
              <p className="subtitle">We'll send a one-time code to verify you</p>
              <div className="input-group">
                <label htmlFor="signup-otp-phone">MOBILE NUMBER</label>
                <input
                  id="signup-otp-phone"
                  type="text"
                  placeholder="+94"
                  value={formData.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </div>
              <div className="info-box">
                An OTP will be sent to this number. Standard SMS rates may apply.
              </div>
              {formError ? <div className="signup-feedback">{formError}</div> : null}
              <button className="primary-btn" onClick={() => void handleSendOtp()} disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <h2 className="title">Enter OTP Code</h2>
              <p className="subtitle-otp">We sent a 4-digit code to</p>
              <p className="phone-number">{formData.phone}</p>
              <OtpInput onComplete={(code) => setOtp(code)} />
              <p className="timer">Expires in 02:45</p>
              <p className="resend-text">
                Didn't receive it? <button className="resend-link">Resend code</button>
              </p>
              {formError ? <div className="signup-feedback">{formError}</div> : null}
              <button className="primary-btn" onClick={() => void handleVerifyOtp()} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="step-content">
              <h2 className="title">Set your password</h2>
              <p className="subtitle">Minimum 8 characters. Mix letters and numbers.</p>

              <div className="input-group">
                <label htmlFor="signup-password-step">PASSWORD</label>
                <div className="password-wrapper">
                  <input
                    id="signup-password-step"
                    type="password"
                    value={formData.password}
                    onChange={(event) => updateField('password', event.target.value)}
                  />
                  <div className="strength-meter">
                    {[1, 2, 3, 4].map((index) => (
                      <div key={index} className={`bar ${strengthCount >= index ? 'active' : ''}`}></div>
                    ))}
                  </div>
                  <span className="strength-label">{getStrengthLabel()}</span>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="signup-confirm-password-step">CONFIRM PASSWORD</label>
                <div className="input-wrapper-inline">
                  <input
                    id="signup-confirm-password-step"
                    type="password"
                    value={confirmPassword}
                    className={showConfirmError ? 'input-error' : ''}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setIsConfirmTouched(true);
                      setFormError('');
                    }}
                  />
                  {showConfirmError ? <span className="error-icon-inline">!</span> : null}
                  {!showConfirmError && passwordsMatch && confirmPassword.length > 0 ? (
                    <span className="success-icon-inline">OK</span>
                  ) : null}
                </div>
              </div>

              <div className="requirements">
                <label>PASSWORD REQUIREMENTS</label>
                <ul className="requirements-box">
                  <li className={requirements.length ? 'valid' : ''}>
                    {requirements.length ? '[OK]' : '[ ]'} At least 8 characters
                  </li>
                  <li className={requirements.uppercase ? 'valid' : ''}>
                    {requirements.uppercase ? '[OK]' : '[ ]'} One uppercase letter
                  </li>
                  <li className={requirements.number ? 'valid' : ''}>
                    {requirements.number ? '[OK]' : '[ ]'} One number
                  </li>
                  <li className={requirements.special ? 'valid' : ''}>
                    {requirements.special ? '[OK]' : '[ ]'} Special character (optional)
                  </li>
                </ul>
              </div>

              {formError ? <div className="signup-feedback">{formError}</div> : null}

              <button
                className="primary-btn"
                disabled={loading || !hasStrongEnoughPassword || !passwordsMatch}
                onClick={() => void handleCreateAccount()}
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SignUpPage;

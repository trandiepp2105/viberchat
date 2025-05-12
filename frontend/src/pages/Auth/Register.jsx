import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI, authAPI } from "../../services";
import OTPInput from "../../components/OTPInput/OTPInput";
import "./Auth.scss";

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState("register"); // register, verify
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
    first_name: "",
    last_name: "",
  });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!formData.username || !formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.password !== formData.password2) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    // Submit registration
    setLoading(true);
    try {
      // Using the authAPI service for registration
      const response = await authAPI.register(formData);

      setMessage(
        response.data.message ||
          "Registration successful! Please check your email for verification code."
      );
      setStep("verify");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        Object.values(err.response?.data || {})
          .map((msgs) => (Array.isArray(msgs) ? msgs.join(" ") : msgs))
          .join(" ") || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    // Validate OTP length
    if (otp.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Use the explicit registration OTP type
      await userAPI.verifyOTP(formData.email, otp, "registration");
      setMessage("Email verification successful! Logging you in...");
      // Auto login after verification and redirect to chat
      try {
        const success = await login(formData.username, formData.password);
        if (success) {
          navigate("/chat");
        }
      } catch (error) {
        console.error("Auto-login failed:", error);
        // If auto-login fails, allow manual login
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.otp_code ||
          "Invalid or expired code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      await userAPI.resendOTP(formData.email, "registration");
      setMessage("A new verification code has been sent to your email.");
    } catch (err) {
      setError("Failed to resend code. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>Verify Your Email</h2>
            <p>Enter the verification code sent to {formData.email}</p>
          </div>
          {message && <div className="auth-message">{message}</div>}
          {error && <div className="auth-error">{error}</div>}{" "}
          <form className="auth-form" onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <OTPInput value={otp} onChange={setOtp} length={6} />
              <p className="otp-hint">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Verifying..." : "Verify Email"}
            </button>

            <div className="resend-link">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-button"
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </form>
          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join ViberChat today</p>
        </div>

        <form className="auth-form" onSubmit={handleRegistrationSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="First name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username">Username*</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password*</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password2">Confirm Password*</label>
              <input
                type="password"
                id="password2"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

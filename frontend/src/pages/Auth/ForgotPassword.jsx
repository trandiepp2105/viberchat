import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userAPI } from "../../services";
import "./Auth.scss";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("request"); // request, verify, reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  // Request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await userAPI.requestPasswordReset(email);

      setMessage(response.data.message);
      setStep("verify");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.email || "An error occurred. Please try again."
      );
    }
  };
  // Verify OTP code
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await userAPI.verifyOTP(email, otp);

      setMessage("OTP verified successfully. Please set your new password.");
      setStep("reset");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.otp_code ||
          "Invalid or expired code. Please try again."
      );
    }
  };
  // Reset password with verified OTP
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await userAPI.completePasswordReset(
        email,
        otp,
        newPassword,
        confirmPassword
      );

      setMessage(response.data.message);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(
        err.response?.data?.new_password ||
          err.response?.data?.otp_code ||
          "Failed to reset password. Please try again."
      );
    }
  };
  // Request OTP again
  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await userAPI.resendOTP(email, "password_reset");

      setMessage("A new verification code has been sent to your email.");
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError("Failed to resend code. Please try again later.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Reset Password</h2>
          {step === "request" && <p>Enter your email to reset your password</p>}
          {step === "verify" && (
            <p>Enter the verification code sent to your email</p>
          )}
          {step === "reset" && <p>Create a new password for your account</p>}
        </div>

        {message && <div className="auth-message">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        {step === "request" && (
          <form className="auth-form" onSubmit={handleRequestReset}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form className="auth-form" onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Verifying..." : "Verify Code"}
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
        )}

        {step === "reset" && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Remember your password? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

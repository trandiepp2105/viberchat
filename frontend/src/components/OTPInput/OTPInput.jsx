import React, { useState, useRef, useEffect } from "react";
import "./OTPInput.scss";

/**
 * OTP Input Component with auto-tab functionality
 * @param {Object} props - Component props
 * @param {string} props.value - Current OTP value
 * @param {Function} props.onChange - Function called when OTP changes
 * @param {number} props.length - Number of digits (default: 6)
 * @returns {React.Component} OTP Input component
 */
const OTPInput = ({ value = "", onChange, length = 6 }) => {
  const [otp, setOtp] = useState(value.split("").slice(0, length));
  const inputRefs = useRef([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Update internal state when external value changes
  useEffect(() => {
    const valueArray = value.split("").slice(0, length);
    setOtp(valueArray.concat(Array(length - valueArray.length).fill("")));
  }, [value, length]);

  // Auto-focus first empty input on mount
  useEffect(() => {
    const firstEmptyIndex = otp.findIndex((digit) => !digit);
    if (firstEmptyIndex !== -1 && inputRefs.current[firstEmptyIndex]) {
      inputRefs.current[firstEmptyIndex].focus();
    }
  }, []);

  const handleChange = (e, index) => {
    const { value: inputValue } = e.target;

    // Only accept digits
    if (inputValue && !/^\d+$/.test(inputValue)) {
      return;
    }

    // Take only the last character if multiple are pasted/entered
    const digit = inputValue.slice(-1);

    // Update OTP state
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Call onChange with the combined OTP
    const otpValue = newOtp.join("");
    onChange(otpValue);

    // Auto-focus next input if a digit was entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // On backspace, clear current digit and focus previous input
    if (e.key === "Backspace") {
      if (otp[index] || index === length - 1) {
        // If current input has a value or it's the last input, just clear it
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
        onChange(newOtp.join(""));
      } else if (index > 0) {
        // Otherwise, move to previous input
        inputRefs.current[index - 1].focus();
      }
    }
    // Arrow navigation
    else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Check if pasted content is a valid OTP (digits only)
    if (!/^\d+$/.test(pastedData)) {
      return;
    }

    // Fill the OTP inputs with the pasted digits
    const digits = pastedData.slice(0, length).split("");
    const newOtp = [...otp];

    digits.forEach((digit, idx) => {
      newOtp[idx] = digit;
    });

    setOtp(newOtp);
    onChange(newOtp.join(""));

    // Focus the next empty input or the last input
    const nextEmptyIndex = digits.length < length ? digits.length : length - 1;
    if (inputRefs.current[nextEmptyIndex]) {
      inputRefs.current[nextEmptyIndex].focus();
    }
  };

  return (
    <div className="otp-input-container">
      {Array(length)
        .fill("")
        .map((_, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            value={otp[index] || ""}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={index === 0 ? handlePaste : undefined}
            ref={(ref) => (inputRefs.current[index] = ref)}
            className="otp-digit"
            autoComplete="one-time-code"
            inputMode="numeric"
          />
        ))}
    </div>
  );
};

export default OTPInput;

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaShieldAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import AuthLayout from "../../components/Auth/AuthLayout";
import {
  verifyOtp,
  resendOtp,
  verifyPhoneOtp,
  resendPhoneOtp,
} from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadUser } = useAuth();

  // "phone" for the new Twilio flow, "email" (default) for the existing flow
  const method = location.state?.method === "phone" ? "phone" : "email";
  const isPhone = method === "phone";

  const email = location.state?.email || "";
  const phone = location.state?.phone || "";
  const identifier = isPhone ? phone : email;

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!identifier) {
      // Nobody should land here without an email/phone in state — send them back
      navigate("/register");
    }
  }, [identifier, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (index, value) => {
    const clean = value.replace(/[^0-9]/g, "").slice(0, 1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (clean && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    if (!text) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill("");
    text.split("").slice(0, OTP_LENGTH).forEach((c, i) => (next[i] = c));
    setDigits(next);
    const lastIndex = Math.min(text.length, OTP_LENGTH) - 1;
    if (lastIndex >= 0) inputsRef.current[lastIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join("");

    if (code.length !== OTP_LENGTH) {
      toast.error("Enter the full 6-digit code");
      return;
    }

    try {
      setLoading(true);
      const res = isPhone
        ? await verifyPhoneOtp(phone, code)
        : await verifyOtp(email, code);

      localStorage.setItem("token", res.data.token);

      await loadUser();

      toast.success("Account verified!");
      navigate("/chat");
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      if (isPhone) {
        await resendPhoneOtp(phone);
      } else {
        await resendOtp(email);
      }
      toast.success("A new code has been sent");
      setCooldown(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center mb-5">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
            <FaShieldAlt className="text-white text-3xl" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            {isPhone ? "Verify Your Phone" : "Verify Your Email"}
          </h1>

          <p className="text-slate-400 mt-2 break-words px-2">
            We sent a 6-digit code to{" "}
            <span className="text-slate-200 font-medium">{identifier}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div
            className="flex justify-center gap-2 sm:gap-3"
            onPaste={handlePaste}
          >
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl bg-slate-800 border border-slate-700 text-center text-xl font-semibold text-white outline-none focus:border-blue-500 transition"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 font-semibold text-white transition disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify Account"}
          </button>
        </form>

        <div className="text-center mt-6 text-slate-400">
          Didn't get the code?{" "}
          {cooldown > 0 ? (
            <span className="text-slate-500">Resend in {cooldown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-blue-500 hover:text-blue-400 font-medium disabled:opacity-60"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          )}
        </div>

        <p className="text-center text-slate-400 mt-6">
          {isPhone ? "Wrong number?" : "Wrong email?"}{" "}
          <Link to="/register" className="text-blue-500 hover:text-blue-400">
            Go back
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}

export default VerifyOtp;

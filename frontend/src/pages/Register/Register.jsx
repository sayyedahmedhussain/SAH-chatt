import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaComments,
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaLock,
  FaCamera,
  FaPhone,
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import AuthLayout from "../../components/Auth/AuthLayout";
import { registerUser, sendPhoneOtp } from "../../services/authService";

function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  // "email" (default, existing flow) or "phone" (new Twilio flow)
  const [verifyMethod, setVerifyMethod] = useState("email");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Phone flow — Twilio Verify OTP
    if (verifyMethod === "phone") {
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      try {
        setLoading(true);

        const data = new FormData();
        data.append("username", formData.username);
        data.append("phone", formData.phone);
        data.append("password", formData.password);

        if (selectedImage) {
          data.append("profilePicture", selectedImage);
        }

        const res = await sendPhoneOtp(data);

        toast.success(res.data.message);

        navigate("/verify-otp", {
          state: { phone: res.data.phone || formData.phone, method: "phone" },
        });
      } catch (error) {
        toast.error(error.response?.data?.message || "Registration Failed");
      } finally {
        setLoading(false);
      }

      return;
    }

    // Email flow — unchanged existing behaviour
    try {
      setLoading(true);

      const data = new FormData();

      data.append("username", formData.username);
      data.append("email", formData.email);
      data.append("password", formData.password);

      if (selectedImage) {
        data.append("profilePicture", selectedImage);
      }

      const res = await registerUser(data);

      if (res.data.emailSent === false) {
        toast(res.data.message, { icon: "⚠️", duration: 6000 });
      } else {
        toast.success(res.data.message);
      }

      // Registration now requires OTP email verification before login
      navigate("/verify-otp", {
        state: { email: res.data.email || formData.email, method: "email" },
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-center mb-5">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center">
            <FaComments className="text-white text-3xl" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white text-center">
          Create Account
        </h1>

        <p className="text-center text-slate-400 mt-2">
          Join the conversation
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 mt-8">

          {/* Profile Picture */}

          <div className="flex justify-center">
            <label className="relative cursor-pointer group">

              <div className="w-28 h-28 rounded-full border-2 border-dashed border-slate-600 overflow-hidden bg-slate-800 flex items-center justify-center">

                {preview ? (
                  <img
                    src={preview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaCamera className="text-4xl text-slate-500" />
                )}

              </div>

              <div className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full">
                <FaCamera className="text-white text-sm" />
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />

            </label>
          </div>

          {/* Username */}

          <div className="relative">
            <FaUser className="absolute left-4 top-4 text-slate-500" />

            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
              className="w-full pl-11 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white"
            />
          </div>

          {/* Verification Method */}

          <div className="flex items-center justify-center gap-6 text-slate-300 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="verifyMethod"
                value="email"
                checked={verifyMethod === "email"}
                onChange={() => setVerifyMethod("email")}
                className="accent-blue-600"
              />
              Verify with Email
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="verifyMethod"
                value="phone"
                checked={verifyMethod === "phone"}
                onChange={() => setVerifyMethod("phone")}
                className="accent-blue-600"
              />
              Verify with Phone Number
            </label>
          </div>

          {/* Email or Phone, depending on selected method */}

          {verifyMethod === "email" ? (
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-4 text-slate-500" />

              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full pl-11 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white"
              />
            </div>
          ) : (
            <div className="relative">
              <FaPhone className="absolute left-4 top-4 text-slate-500" />

              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number (e.g. +14155552671)"
                className="w-full pl-11 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white"
              />
            </div>
          )}

          {/* Password */}

          <div className="relative">
            <FaLock className="absolute left-4 top-4 text-slate-500" />

            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full pl-11 pr-12 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-slate-400"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Confirm Password — phone flow only */}

          {verifyMethod === "phone" && (
            <div className="relative">
              <FaLock className="absolute left-4 top-4 text-slate-500" />

              <input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                className="w-full pl-11 pr-12 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-white font-semibold"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        <p className="text-center text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/" className="text-blue-500">
            Login
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}

export default Register;
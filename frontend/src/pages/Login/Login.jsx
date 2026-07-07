import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaComments,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
} from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import AuthLayout from "../../components/Auth/AuthLayout";
import { loginUser } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { loadUser } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await loginUser(formData);

      // Save token
      localStorage.setItem("token", res.data.token);

      // Save user (optional but useful)
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: res.data._id,
          username: res.data.username,
          email: res.data.email,
        })
      );

      // Fetch the fresh user into AuthContext (and thus SocketContext)
      // BEFORE navigating, so profile pic / online status / socket
      // connection are ready as soon as the Chat page mounts.
      await loadUser();

      toast.success("Login Successful");

      navigate("/chat");

    } catch (error) {
      const data = error.response?.data;

      if (data?.needsVerification) {
        toast.error(data.message || "Please verify your email first");
        navigate("/verify-otp", { state: { email: data.email || formData.email } });
        return;
      }

      toast.error(data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
            <FaComments className="text-white text-3xl" />
          </div>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">
            Welcome Back
          </h1>

          <p className="text-slate-400 mt-2">
            Login to continue chatting
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

          <div className="relative">
            <FaEnvelope className="absolute left-4 top-4 text-slate-500" />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full pl-11 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500 transition"
              required
            />
          </div>

          <div className="relative">
            <FaLock className="absolute left-4 top-4 text-slate-500" />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full pl-11 pr-12 rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500 transition"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-slate-400"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 font-semibold text-white transition"
          >
            {loading ? "Logging In..." : "Login"}
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-slate-400 mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-blue-500 hover:text-blue-400"
          >
            Register
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}

export default Login;
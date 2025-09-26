import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Github, Twitter, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  
  const { login, error, loading, clearError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const from = location.state?.from?.pathname || "/";
  const successMessage = location.state?.message;

  const [localError, setLocalError] = useState(null);
  
  useEffect(() => {
    if(clearError) clearError();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    if (localError) {
      setLocalError(null);
    }
    if (error) {
        clearError();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLocalError(null);
    
    if (!formData.email?.trim() || !formData.password?.trim()) {
      setLocalError('Invalid Credentials');
      return;
    }
    
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setLocalError(result.error || 'Invalid Credentials');
      }
    } catch (error) {
      setLocalError('Invalid Credentials');
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-background via-background/95 to-accent/5 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-blog-primary to-blog-secondary opacity-20 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-blog-accent to-blog-primary opacity-30 rounded-full blur-2xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.2,
              type: "spring",
              stiffness: 200,
            }}
            className="flex justify-center mb-6"
          >
            <Logo size="xl" showText={false} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="font-poppins font-bold text-3xl gradient-text mb-2"
          >
            Welcome back
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center"
          >
            <span className="font-poppins font-bold text-xl gradient-text">
              BlogSpace
            </span>
            <p className="text-sm text-muted-foreground mt-1 tracking-wider">
              CREATE • SHARE • INSPIRE
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-4 text-muted-foreground"
          >
            Sign in to your account to continue writing
          </motion.p>
        </div>

        {(localError || error) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm flex items-start space-x-2"
          >
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Login Error</p>
              <p className="mt-1">{localError || error}</p>
            </div>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm flex items-start space-x-2"
          >
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Success!</p>
              <p className="mt-1">{successMessage}</p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="glass-effect rounded-2xl p-8 space-y-6"
        >
          <form onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blog-primary focus:border-transparent transition-all duration-300"
                  placeholder="Enter your email"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blog-primary focus:border-transparent transition-all duration-300"
                  placeholder="Enter your password"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blog-primary focus:ring-blog-primary border-border rounded"
                  disabled={loading}
                />
                <label
                  htmlFor="rememberMe"
                  className="ml-2 block text-sm text-foreground"
                >
                  Remember me
                </label>
              </div>
              
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gradient py-3 px-4 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>

            {(localError || error) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm flex items-start space-x-2"
              >
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Login Error</p>
                  <p className="mt-1">{localError || error}</p>
                </div>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm flex items-start space-x-2"
              >
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Success!</p>
                  <p className="mt-1">{successMessage}</p>
                </div>
              </motion.div>
            )}
          </form>

          
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="text-center"
        >
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blog-primary hover:text-blog-secondary font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

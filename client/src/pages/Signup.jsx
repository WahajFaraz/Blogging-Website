import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Eye, EyeOff, User, Mail, Lock, CheckCircle, AlertCircle, Camera, Globe, Twitter, Github, Linkedin, Instagram } from "lucide-react";
import Logo from "../components/Logo";
import {Textarea} from "../components/ui/textarea"

const Signup = () => {
  const navigate = useNavigate();
  const { signup, error, loading, clearError } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    bio: "",
    avatar: null,
    socialLinks: {
      website: "",
      twitter: "",
      github: "",
      linkedin: "",
      instagram: ""
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if(clearError) clearError();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 30) {
      errors.username = "Username cannot exceed 30 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (formData.fullName.length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    } else if (formData.fullName.length > 100) {
      errors.fullName = "Full name cannot exceed 100 characters";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const formDataToSend = new FormData();
    formDataToSend.append('username', formData.username.trim());
    formDataToSend.append('email', formData.email.trim().toLowerCase());
    formDataToSend.append('password', formData.password);
    formDataToSend.append('fullName', formData.fullName.trim());
    formDataToSend.append('bio', formData.bio.trim());
    
    if (formData.avatar && formData.avatar.file) {
      formDataToSend.append('avatar', formData.avatar.file);
    }
    
    formDataToSend.append('socialLinks', JSON.stringify(formData.socialLinks));

    const result = await signup(formDataToSend);

    if (result.success) {
      navigate('/login');
    }
  };

  const getFieldError = (fieldName) => {
    return validationErrors[fieldName] || null;
  };

  const isFieldValid = (fieldName) => {
    return formData[fieldName] && !getFieldError(fieldName);
  };

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-background via-background/95 to-accent/5 flex items-center justify-center py-8">
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

      <div className="w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
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

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="font-poppins font-bold text-3xl gradient-text mb-2"
            >
              Create Account
            </motion.h1>

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
              Join BlogSpace and start sharing your stories
            </motion.p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Enter your details to create your account</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm flex items-start space-x-2"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Signup Error</p>
                    <p className="mt-1">{error}</p>
                  </div>
                </motion.div>
              )}

              {Object.keys(validationErrors).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm"
                >
                  <div className="flex items-start space-x-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="font-medium">Please fix the following errors:</p>
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-7">
                    {Object.entries(validationErrors).map(([field, error]) => (
                      <li key={field} className="text-red-700">
                        <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span> {error}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className={`pl-10 ${getFieldError('fullName') ? 'border-red-500' : ''} ${isFieldValid('fullName') ? 'border-green-500' : ''}`}
                      disabled={loading}
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {isFieldValid('fullName') && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {getFieldError('fullName') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('fullName')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="username">Username *</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Choose a unique username"
                      className={`pl-10 ${getFieldError('username') ? 'border-red-500' : ''} ${isFieldValid('username') ? 'border-green-500' : ''}`}
                      disabled={loading}
                      autoComplete="username"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {isFieldValid('username') && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {getFieldError('username') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('username')}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Only letters, numbers, and underscores allowed
                  </p>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      className={`pl-10 ${getFieldError('email') ? 'border-red-500' : ''} ${isFieldValid('email') ? 'border-green-500' : ''}`}
                      disabled={loading}
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {isFieldValid('email') && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {getFieldError('email') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('email')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Create a strong password"
                      className={`pl-10 pr-10 ${getFieldError('password') ? 'border-red-500' : ''} ${isFieldValid('password') ? 'border-green-500' : ''}`}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {isFieldValid('password') && (
                      <CheckCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {getFieldError('password') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('password')}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum 6 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm your password"
                      className={`pl-10 pr-10 ${getFieldError('confirmPassword') ? 'border-red-500' : ''} ${isFieldValid('confirmPassword') ? 'border-green-500' : ''}`}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {isFieldValid('confirmPassword') && (
                      <CheckCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {getFieldError('confirmPassword') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('confirmPassword')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="bio">Bio (Optional)</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="avatar">Profile Image (Optional)</Label>
                  <div className="mt-2 flex items-center space-x-4">
                    <label htmlFor="avatar" className="cursor-pointer relative">
                      <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                        {formData.avatar ? (
                          <img
                            src={formData.avatar.preview}
                            alt="Profile preview"
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <Camera className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      {formData.avatar && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFormData(prev => ({ ...prev, avatar: null }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </label>
                    <div className="flex-1">
                      <input
                        id="avatar"
                        name="avatar"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Image must be less than 2MB');
                              return;
                            }
                            
                            const preview = URL.createObjectURL(file);
                            setFormData(prev => ({
                              ...prev,
                              avatar: {
                                file,
                                preview,
                                name: file.name
                              }
                            }));
                          }
                        }}
                        className="hidden"
                        disabled={loading}
                      />
                      <label
                        htmlFor="avatar"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blog-primary transition-colors"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {formData.avatar ? 'Change Image' : 'Choose Image'}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, GIF up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium">Social Media Links (Optional)</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website" className="flex items-center gap-2 text-xs">
                      <Globe className="h-3 w-3" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      name="socialLinks.website"
                      value={formData.socialLinks.website}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          socialLinks: {
                            ...prev.socialLinks,
                            website: value
                          }
                        }));
                      }}
                      placeholder="https://yourwebsite.com"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="flex items-center gap-2 text-xs">
                      <Twitter className="h-3 w-3" />
                      Twitter
                    </Label>
                    <Input
                      id="twitter"
                      name="socialLinks.twitter"
                      value={formData.socialLinks.twitter}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          socialLinks: {
                            ...prev.socialLinks,
                            twitter: value
                          }
                        }));
                      }}
                      placeholder="@username or https://twitter.com/username"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github" className="flex items-center gap-2 text-xs">
                      <Github className="h-3 w-3" />
                      GitHub
                    </Label>
                    <Input
                      id="github"
                      name="socialLinks.github"
                      value={formData.socialLinks.github}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          socialLinks: {
                            ...prev.socialLinks,
                            github: value
                          }
                        }));
                      }}
                      placeholder="username or https://github.com/username"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="flex items-center gap-2 text-xs">
                      <Linkedin className="h-3 w-3" />
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin"
                      name="socialLinks.linkedin"
                      value={formData.socialLinks.linkedin}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          socialLinks: {
                            ...prev.socialLinks,
                            linkedin: value
                          }
                        }));
                      }}
                      placeholder="username or https://linkedin.com/in/username"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instagram" className="flex items-center gap-2 text-xs">
                      <Instagram className="h-3 w-3" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      name="socialLinks.instagram"
                      value={formData.socialLinks.instagram}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          socialLinks: {
                            ...prev.socialLinks,
                            instagram: value
                          }
                        }));
                      }}
                      placeholder="username or https://instagram.com/username"
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blog-primary hover:bg-blog-secondary"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm flex items-start space-x-2"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Signup Error</p>
                      <p className="mt-1">{error}</p>
                    </div>
                  </motion.div>
                )}

                {Object.keys(validationErrors).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm"
                  >
                    <div className="flex items-start space-x-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="font-medium">Please fix the following errors:</p>
                    </div>
                    <ul className="list-disc list-inside space-y-1 ml-7">
                      {Object.entries(validationErrors).map(([field, error]) => (
                        <li key={field} className="text-red-700">
                          <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span> {error}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-blog-primary hover:text-blog-secondary font-medium underline"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By creating an account, you agree to our{" "}
              <a href="#" className="text-blog-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blog-primary hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
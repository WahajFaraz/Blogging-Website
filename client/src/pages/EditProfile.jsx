import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { MediaUpload } from "../components/MediaUpload";
import { ArrowLeft, Save, X, User, Globe, Twitter, Github, Linkedin, Instagram, Camera, CheckCircle, Upload, Shield, AlertCircle } from "lucide-react";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, token, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    socialLinks: {
      website: "",
      twitter: "",
      github: "",
      linkedin: "",
      instagram: ""
    }
  });

  const [avatar, setAvatar] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        bio: user.bio || "",
        socialLinks: {
          website: user.socialLinks?.website || "",
          twitter: user.socialLinks?.twitter || "",
          github: user.socialLinks?.github || "",
          linkedin: user.socialLinks?.linkedin || "",
          instagram: user.socialLinks?.instagram || ""
        }
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image must be less than 2MB');
        return;
      }
      
      const preview = URL.createObjectURL(file);
      setAvatar({
        file,
        preview,
        name: file.name
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (formData.fullName.length < 2) {
      errors.fullName = "Full name must be at least 2 characters";
    } else if (formData.fullName.length > 100) {
      errors.fullName = "Full name cannot exceed 100 characters";
    }

    if (formData.bio && formData.bio.length > 500) {
      errors.bio = "Bio cannot exceed 500 characters";
    }

    if (formData.socialLinks.website && !isValidUrl(formData.socialLinks.website)) {
      errors.website = "Please enter a valid website URL";
    }

    if (formData.socialLinks.twitter && !/^@?[a-zA-Z0-9_]{1,15}$/.test(formData.socialLinks.twitter)) {
      errors.twitter = "Please enter a valid Twitter handle";
    }

    if (formData.socialLinks.github && !/^[a-zA-Z0-9-]{1,39}$/.test(formData.socialLinks.github)) {
      errors.github = "Please enter a valid GitHub username";
    }

      if (formData.socialLinks.linkedin && !/^[a-zA-Z0-9-]{3,100}$/.test(formData.socialLinks.linkedin)) {
    errors.linkedin = "Please enter a valid LinkedIn username";
  }

  if (formData.socialLinks.instagram && !/^[a-zA-Z0-9_.]{1,30}$/.test(formData.socialLinks.instagram)) {
    errors.instagram = "Please enter a valid Instagram username";
  }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      let updates = { ...formData };
      
      if (avatar) {
        const formDataToSend = new FormData();
        formDataToSend.append('avatar', avatar.file);
        formDataToSend.append('fullName', formData.fullName);
        formDataToSend.append('bio', formData.bio);
        formDataToSend.append('socialLinks', JSON.stringify(formData.socialLinks));
                formDataToSend.append('notificationPreferences', JSON.stringify(formData.notificationPreferences || {}));
        
        const result = await updateProfile(formDataToSend);
        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/profile');
          }, 1500);
        } else {
          setError(result.error);
        }
      } else {
        const result = await updateProfile(updates);
        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/profile');
          }, 1500);
        } else {
          setError(result.error);
        }
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName) => {
    return validationErrors[fieldName] || null;
  };

  const isFieldValid = (fieldName) => {
    return formData[fieldName] && !getFieldError(fieldName);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blog-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blog-primary/10 via-blog-secondary/10 to-accent/10 p-6 backdrop-blur-sm border border-border/50">
            <div className="absolute inset-0 bg-gradient-to-r from-blog-primary/5 to-blog-secondary/5" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Profile
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16">
                  <Avatar className="w-full h-full rounded-full ring-4 ring-blog-primary/20 shadow-lg">
                    <AvatarImage 
                      src={avatar?.url || user?.avatar?.url || ''} 
                      alt={user?.fullName || user?.username || 'Profile'}
                      className="object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <AvatarFallback className="text-xl bg-gradient-to-br from-blog-primary to-blog-secondary text-white font-bold">
                      {getInitials(user?.fullName || user?.username)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Edit Profile</h1>
                  <p className="text-muted-foreground">Update your personal information and preferences</p>
                </div>
              </div>
            </div>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg"
            >
              <p className="font-medium">Profile updated successfully! Redirecting to profile page...</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
            >
              <p className="font-medium">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blog-primary/10 via-blog-secondary/5 to-blog-primary/10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                
                <CardContent className="relative p-8">
                  <div className="text-center">
                    <label htmlFor="avatar-upload" className="relative inline-block mb-6 cursor-pointer">
                      <div className="w-40 h-40 mx-auto">
                        <Avatar className="w-full h-full rounded-full ring-4 ring-white dark:ring-gray-800 shadow-2xl">
                          <AvatarImage 
                            src={avatar?.preview || user?.avatar?.url || ''} 
                            alt={user?.fullName || user?.username || 'Profile'}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                            }}
                          />
                          <AvatarFallback className="text-4xl bg-gradient-to-br from-blog-primary to-blog-secondary text-white font-bold">
                            {getInitials(user?.fullName || user?.username)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-all duration-300 flex items-center justify-center group">
                        <div className="text-center text-white">
                          <Camera className="h-8 w-8 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-sm font-medium">Change Photo</p>
                        </div>
                      </div>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>

                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-foreground mb-2">
                        {user?.fullName || user?.username}
                      </h2>
                      <p className="text-muted-foreground">
                        Click on your photo to update
                      </p>
                    </div>

                    {avatar && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium"
                      >
                        <CheckCircle className="h-4 w-4" />
                        New photo selected - Save to update
                      </motion.div>
                    )}

                    <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-border/50">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Max Size</p>
                        <p className="text-sm font-semibold text-foreground">2MB</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Formats</p>
                        <p className="text-sm font-semibold text-foreground">JPG, PNG, GIF</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Quality</p>
                        <p className="text-sm font-semibold text-foreground">High-Res</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-card to-muted/10 border-border/50 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blog-primary/5 to-blog-secondary/5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blog-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Tell us about yourself and what makes you unique</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      maxLength={100}
                      className={`pl-10 ${getFieldError('fullName') ? 'border-red-500' : ''} ${isFieldValid('fullName') ? 'border-green-500' : ''}`}
                      disabled={loading}
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {getFieldError('fullName') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('fullName')}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.fullName.length}/100 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                    className={getFieldError('bio') ? 'border-red-500' : ''}
                    disabled={loading}
                  />
                  {getFieldError('bio') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('bio')}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-muted/10 border-border/50 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blog-primary/5 to-blog-secondary/5 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blog-primary" />
                  Social Connections
                </CardTitle>
                <CardDescription>Connect your social media profiles to build your online presence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Input
                      id="website"
                      name="socialLinks.website"
                      value={formData.socialLinks.website}
                      onChange={handleInputChange}
                      placeholder="https://yourwebsite.com"
                      type="url"
                      className={`pl-10 ${getFieldError('website') ? 'border-red-500' : ''} ${isFieldValid('website') ? 'border-green-500' : ''}`}
                      disabled={loading}
                    />
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {getFieldError('website') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('website')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <div className="relative">
                    <Input
                      id="twitter"
                      name="socialLinks.twitter"
                      value={formData.socialLinks.twitter}
                      onChange={handleInputChange}
                      placeholder="@username"
                      className={`pl-10 ${getFieldError('twitter') ? 'border-red-500' : ''} ${isFieldValid('twitter') ? 'border-green-500' : ''}`}
                      disabled={loading}
                    />
                    <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {getFieldError('twitter') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('twitter')}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter with or without @ symbol
                  </p>
                </div>

                <div>
                  <Label htmlFor="github">GitHub</Label>
                  <div className="relative">
                    <Input
                      id="github"
                      name="socialLinks.github"
                      value={formData.socialLinks.github}
                      onChange={handleInputChange}
                      placeholder="username"
                      className={`pl-10 ${getFieldError('github') ? 'border-red-500' : ''} ${isFieldValid('github') ? 'border-green-500' : ''}`}
                      disabled={loading}
                    />
                    <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {getFieldError('github') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('github')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <div className="relative">
                    <Input
                      id="linkedin"
                      name="socialLinks.linkedin"
                      value={formData.socialLinks.linkedin}
                      onChange={handleInputChange}
                      placeholder="username"
                      className={`pl-10 ${getFieldError('linkedin') ? 'border-red-500' : ''} ${isFieldValid('linkedin') ? 'border-green-500' : ''}`}
                      disabled={loading}
                    />
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {getFieldError('linkedin') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('linkedin')}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="relative">
                    <Input
                      id="instagram"
                      name="socialLinks.instagram"
                      value={formData.socialLinks.instagram}
                      onChange={handleInputChange}
                      placeholder="username"
                      className={`pl-10 ${getFieldError('instagram') ? 'border-red-500' : ''} ${isFieldValid('instagram') ? 'border-green-500' : ''}`}
                      disabled={loading}
                    />
                    <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {getFieldError('instagram') && (
                    <p className="text-sm text-red-500 mt-1">{getFieldError('instagram')}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Only letters, numbers, underscores, and dots allowed
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/profile')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[140px] bg-gradient-to-r from-blog-primary to-blog-secondary hover:from-blog-primary/90 hover:to-blog-secondary/90 text-white shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </div>
                )}
              </Button>
            </div>

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg"
              >
                <p className="font-medium">Profile updated successfully! Redirecting to profile page...</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
              >
                <p className="font-medium">{error}</p>
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default EditProfile;

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
import { Badge } from "../components/ui/badge";
import Avatar from "../components/Avatar";
import { MediaUpload } from "../components/MediaUpload";
import { Edit, Save, X, User, Mail, Calendar, MapPin, Globe, Twitter, Github, Linkedin, Camera, Instagram, Bell, Users, UserPlus, UserMinus, CheckCircle, Settings, Palette, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const { user, token, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    socialLinks: {
      website: "",
      twitter: "",
      github: "",
      linkedin: "",
      instagram: ""
    },
    notificationPreferences: {
      emailOnNewPost: true,
      emailOnNewFollower: true,
      emailOnNewComment: true
    }
  });

  const [avatar, setAvatar] = useState(null);


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
        },
        notificationPreferences: {
          emailOnNewPost: user.notificationPreferences?.emailOnNewPost ?? true,
          emailOnNewFollower: user.notificationPreferences?.emailOnNewFollower ?? true,
          emailOnNewComment: user.notificationPreferences?.emailOnNewComment ?? true
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
  };

  const handleAvatarSelect = (media) => {
    setAvatar(media);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        
        const result = await updateProfile(formDataToSend);
        if (result.success) {
          setSuccess(true);
          setIsEditing(false);
          setAvatar(null);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          setError(result.error);
        }
      } else {
        const result = await updateProfile(updates);
        if (result.success) {
          setSuccess(true);
          setIsEditing(false);
          setTimeout(() => setSuccess(false), 3000);
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

  const cancelEdit = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        bio: user.bio || "",
        socialLinks: {
          website: user.socialLinks?.website || "",
          twitter: user.socialLinks?.twitter || "",
          github: user.socialLinks?.github || "",
          linkedin: user.socialLinks?.linkedin || ""
        }
      });
    }
    setAvatar(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blog-primary/10 via-blog-secondary/10 to-accent/10 p-8 backdrop-blur-sm border border-border/50">
            <div className="absolute inset-0 bg-gradient-to-r from-blog-primary/5 to-blog-secondary/5" />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 md:w-24 md:h-24">
                      <div className="relative">
                        <Avatar 
                          src={user?.avatar?.url}
                          alt={user?.fullName || user?.username || 'Profile'}
                          size={80}
                          fallbackText={user?.fullName || user?.username}
                          className="ring-4 ring-blog-primary/20 shadow-xl"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                      {user?.fullName || user?.username}
                    </h1>
                    <p className="text-muted-foreground text-lg mb-2">@{user?.username}</p>
                    {user?.bio && (
                      <p className="text-muted-foreground max-w-md">{user.bio}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Joined {formatDate(user.createdAt)}</span>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {user.role}
                      </Badge>
                      {user.isVerified && (
                        <Badge className="bg-blue-500 hover:bg-blue-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => navigate('/profile/edit')}
                    variant="outline"
                    className="flex items-center gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80"
                  >
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                  <Button
                    onClick={() => navigate('/create')}
                    className="bg-gradient-to-r from-blog-primary to-blog-secondary hover:from-blog-primary/90 hover:to-blog-secondary/90 text-white shadow-lg"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
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
              <p className="font-medium">Profile updated successfully!</p>
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

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
                >
                  <Link to={`/author/${user._id}/followers`}>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {user.followers?.length || 0}
                      </div>
                      <div className="text-sm text-blue-600/80 dark:text-blue-400/80">Followers</div>
                    </div>
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl border border-green-200/50 dark:border-green-700/50"
                >
                  <Link to={`/author/${user._id}/following`}>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {user.following?.length || 0}
                      </div>
                      <div className="text-sm text-green-600/80 dark:text-green-400/80">Following</div>
                    </div>
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl border border-purple-200/50 dark:border-purple-700/50"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      0
                    </div>
                    <div className="text-sm text-purple-600/80 dark:text-purple-400/80">Posts</div>
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200/50 dark:border-orange-700/50"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      0
                    </div>
                    <div className="text-sm text-orange-600/80 dark:text-orange-400/80">Likes</div>
                  </div>
                </motion.div>
              </div>

              <Card className="bg-gradient-to-br from-card to-muted/20 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => navigate('/my-posts')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Posts
                  </Button>
                  <Button
                    onClick={() => navigate('/create')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Write Article
                  </Button>
                  <Button
                    onClick={() => navigate('/profile/edit')}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-6">
              <Card className="bg-gradient-to-br from-card to-muted/10 border-border/50 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blog-primary/5 to-blog-secondary/5 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blog-primary" />
                        Personal Information
                      </CardTitle>
                      <CardDescription>Your profile details and bio</CardDescription>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 bg-background/50 hover:bg-background/80"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          maxLength={100}
                        />
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
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formData.bio.length}/500 characters
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1"
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
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{user.fullName || 'Not set'}</p>
                          <p className="text-sm text-muted-foreground">Full Name</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{user.email}</p>
                          <p className="text-sm text-muted-foreground">Email Address</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{formatDate(user.createdAt)}</p>
                          <p className="text-sm text-muted-foreground">Member Since</p>
                        </div>
                      </div>

                      {user.bio && (
                        <div>
                          <p className="font-medium mb-2">Bio</p>
                          <p className="text-muted-foreground">{user.bio}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-muted/10 border-border/50 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blog-primary/5 to-blog-secondary/5 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blog-primary" />
                    Social Connections
                  </CardTitle>
                  <CardDescription>Your social media profiles and links</CardDescription>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          name="socialLinks.website"
                          value={formData.socialLinks.website}
                          onChange={handleInputChange}
                          placeholder="https://yourwebsite.com"
                          type="url"
                        />
                      </div>

                      <div>
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          name="socialLinks.twitter"
                          value={formData.socialLinks.twitter}
                          onChange={handleInputChange}
                          placeholder="@username"
                        />
                      </div>

                      <div>
                        <Label htmlFor="github">GitHub</Label>
                        <Input
                          id="github"
                          name="socialLinks.github"
                          value={formData.socialLinks.github}
                          onChange={handleInputChange}
                          placeholder="username"
                        />
                      </div>

                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          name="socialLinks.linkedin"
                          value={formData.socialLinks.linkedin}
                          onChange={handleInputChange}
                          placeholder="username"
                        />
                      </div>

                      <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          name="socialLinks.instagram"
                          value={formData.socialLinks.instagram}
                          onChange={handleInputChange}
                          placeholder="username"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {user.socialLinks?.website && (
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                          <a
                            href={user.socialLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blog-primary hover:underline"
                          >
                            {user.socialLinks.website}
                          </a>
                        </div>
                      )}

                      {user.socialLinks?.twitter && (
                        <div className="flex items-center gap-3">
                          <Twitter className="h-5 w-5 text-muted-foreground" />
                          <a
                            href={`https://twitter.com/${user.socialLinks.twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blog-primary hover:underline"
                          >
                            {user.socialLinks.twitter}
                          </a>
                        </div>
                      )}

                      {user.socialLinks?.github && (
                        <div className="flex items-center gap-3">
                          <Github className="h-5 w-5 text-muted-foreground" />
                          <a
                            href={`https://github.com/${user.socialLinks.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blog-primary hover:underline"
                          >
                            {user.socialLinks.github}
                          </a>
                        </div>
                      )}

                      {user.socialLinks?.linkedin && (
                        <div className="flex items-center gap-3">
                          <Linkedin className="h-5 w-5 text-muted-foreground" />
                          <a
                            href={`https://linkedin.com/in/${user.socialLinks.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blog-primary hover:underline"
                          >
                            {user.socialLinks.linkedin}
                          </a>
                        </div>
                      )}

                      {user.socialLinks?.instagram && (
                        <div className="flex items-center gap-3">
                          <Instagram className="h-5 w-5 text-muted-foreground" />
                          <a
                            href={`https://instagram.com/${user.socialLinks.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blog-primary hover:underline"
                          >
                            {user.socialLinks.instagram}
                          </a>
                        </div>
                      )}

                      {!user.socialLinks?.website && !user.socialLinks?.twitter && 
                       !user.socialLinks?.github && !user.socialLinks?.linkedin && 
                       !user.socialLinks?.instagram && (
                        <p className="text-muted-foreground text-center py-4">
                          No social links added yet. Click Edit to add some!
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-muted/10 border-border/50 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blog-primary/5 to-blog-secondary/5 rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blog-primary" />
                        Notification Settings
                      </CardTitle>
                      <CardDescription>Control your email and push notifications</CardDescription>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        size="sm"
                        className="bg-background/50 hover:bg-background/80"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Email when you post a blog</Label>
                          <p className="text-xs text-muted-foreground">Followers will receive an email notification</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.notificationPreferences.emailOnNewPost}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              notificationPreferences: {
                                ...prev.notificationPreferences,
                                emailOnNewPost: e.target.checked
                              }
                            }));
                          }}
                          className="w-4 h-4 text-blog-primary bg-background border-border rounded focus:ring-blog-primary focus:ring-2"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Email when someone follows you</Label>
                          <p className="text-xs text-muted-foreground">Get notified of new followers</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.notificationPreferences.emailOnNewFollower}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              notificationPreferences: {
                                ...prev.notificationPreferences,
                                emailOnNewFollower: e.target.checked
                              }
                            }));
                          }}
                          className="w-4 h-4 text-blog-primary bg-background border-border rounded focus:ring-blog-primary focus:ring-2"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Email when someone comments</Label>
                          <p className="text-xs text-muted-foreground">Get notified of new comments on your posts</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.notificationPreferences.emailOnNewComment}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              notificationPreferences: {
                                ...prev.notificationPreferences,
                                emailOnNewComment: e.target.checked
                              }
                            }));
                          }}
                          className="w-4 h-4 text-blog-primary bg-background border-border rounded focus:ring-blog-primary focus:ring-2"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Blog post notifications</span>
                        <Badge variant={user.notificationPreferences?.emailOnNewPost ? "default" : "secondary"}>
                          {user.notificationPreferences?.emailOnNewPost ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Follower notifications</span>
                        <Badge variant={user.notificationPreferences?.emailOnNewFollower ? "default" : "secondary"}>
                          {user.notificationPreferences?.emailOnNewFollower ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Comment notifications</span>
                        <Badge variant={user.notificationPreferences?.emailOnNewComment ? "default" : "secondary"}>
                          {user.notificationPreferences?.emailOnNewComment ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;

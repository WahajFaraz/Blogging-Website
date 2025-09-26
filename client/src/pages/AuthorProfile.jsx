import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createApiUrl } from "../lib/urlUtils";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import BlogGrid from "../components/BlogGrid";
import BlogCard from "../components/BlogCard";
import { Globe, Twitter, Github, Linkedin, Instagram, Mail, Rss, UserPlus, UserCheck } from "lucide-react";

const AuthorProfile = () => {
  const { authorId } = useParams();
  const { user: currentUser, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [author, setAuthor] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        setLoading(true);
        
        const authorRes = await fetch(createApiUrl(`users/id/${authorId}`));
        if (!authorRes.ok) throw new Error('Author not found');
        const authorData = await authorRes.json();
        setAuthor(authorData);

        if (currentUser) {
          setIsFollowing(authorData.followers.some(f => f._id === currentUser._id));
        }
        
        const blogsRes = await fetch(createApiUrl(`blogs/user/${authorId}`));
        if (!blogsRes.ok) throw new Error('Could not fetch blogs');
        const blogsData = await blogsRes.json();
        setBlogs(blogsData.blogs || []);
        
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorData();
  }, [authorId, currentUser]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    const endpoint = isFollowing ? 'unfollow' : 'follow';

    try {
            const response = await fetch(createApiUrl(`users/${endpoint}/${authorId}`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setAuthor(prev => ({
          ...prev,
          followers: isFollowing
            ? prev.followers.filter(f => f._id !== currentUser._id)
            : [...prev.followers, { _id: currentUser._id, fullName: currentUser.fullName, username: currentUser.username, avatar: currentUser.avatar }]
        }));
      } else {
        const data = await response.json();
        console.error('Follow/unfollow error:', data.error);
      }
    } catch (error) {
      console.error('Failed to toggle follow status', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blog-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading author profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser._id === authorId;

  return (
    <div className="min-h-screen bg-background pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <Card className="overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-blog-primary to-blog-secondary relative" />
            <CardContent className="mt-0 pt-16 p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6">
                <Avatar className="h-32 w-32 rounded-full ring-4 ring-background shadow-lg flex-shrink-0 -mt-10 md:-mt-14">
                  <AvatarImage 
                    src={author.avatar?.url || ''} 
                    alt={author.fullName} 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <AvatarFallback className="text-4xl bg-gradient-to-br from-blog-primary to-blog-secondary text-white font-bold">
                    {getInitials(author.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <h1 className="text-3xl font-bold text-foreground mt-4">{author.fullName}</h1>
                  <p className="text-muted-foreground">@{author.username}</p>
                  <p className="text-center md:text-left max-w-2xl mt-4 text-foreground/80">{author.bio}</p>
                  <div className="flex items-center justify-center md:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                    <Link to={`/author/${authorId}/followers`} className="hover:underline">
                      <span className="font-bold text-foreground">{author.followers.length}</span> Followers
                    </Link>
                    <Link to={`/author/${authorId}/following`} className="hover:underline">
                      <span className="font-bold text-foreground">{author.following.length}</span> Following
                    </Link>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {!isOwnProfile && isAuthenticated && (
                    <Button onClick={handleFollowToggle} disabled={followLoading}>
                      {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-6 border-t border-border">
                {author.socialLinks?.website && <a href={author.socialLinks.website} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Globe /></Button></a>}
                {author.socialLinks?.twitter && <a href={`https://twitter.com/${author.socialLinks.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Twitter /></Button></a>}
                {author.socialLinks?.github && <a href={`https://github.com/${author.socialLinks.github}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Github /></Button></a>}
                {author.socialLinks?.linkedin && <a href={`https://linkedin.com/in/${author.socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Linkedin /></Button></a>}
                {author.socialLinks?.instagram && <a href={`https://instagram.com/${author.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon"><Instagram /></Button></a>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">Posts by {author.fullName}</h2>
          {blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog, index) => (
                <BlogCard key={blog._id} blog={blog} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/50 rounded-lg">
              <Rss className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground">No posts yet</h3>
              <p className="text-muted-foreground mt-2">This author hasn't published any posts.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthorProfile;

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import Avatar from "./Avatar";
import { Heart, MessageCircle, Eye, Clock, Calendar } from "lucide-react";
import { useState } from "react";
import { config } from "../lib/config";
const { api } = config;

const BlogCard = ({ blog, index }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [likedState, setLikedState] = useState({
    isLiked: blog?.isLiked || false,
    likesCount: (blog?.likes && Array.isArray(blog.likes) ? blog.likes.length : 0) || 0,
  });
  
  // Ensure we have valid blog data
  if (!blog) {
    return null; // Or return a placeholder/skeleton
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    const newLikedState = !likedState.isLiked;
    const newLikesCount = newLikedState 
      ? likedState.likesCount + 1 
      : Math.max(0, likedState.likesCount - 1);

    setLikedState({
      isLiked: newLikedState,
      likesCount: newLikesCount,
    });

    const originalState = { ...likedState };
    
    try {
      const response = await fetch(`${api.baseUrl}/api/${api.version}/blogs/${blog._id}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      setLikedState(originalState);
    }
  };

  const isAuthor = user && blog.author?._id && user._id && blog.author._id === user._id;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]"
    >
      <div className="relative">
        <Link to={`/blog/${blog._id}`} className="block">
          {blog.media && blog.media.type !== "none" ? (
            <div className="relative h-64 overflow-hidden">
              {blog.media.type === "image" ? (
                <img
                  src={blog.media.url}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  style={{ filter: "none" }}
                />
              ) : blog.media.type === "video" ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blog-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg
                        className="w-8 h-8 text-blog-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Video Content
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="capitalize">
                  {blog.category}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="relative h-64 bg-gradient-to-br from-blog-primary/10 to-blog-secondary/10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blog-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-8 h-8 text-blog-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">No Media</p>
              </div>
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="capitalize">
                  {blog.category}
                </Badge>
              </div>
            </div>
          )}
        </Link>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={`/author/${blog.author._id}`}
              className="flex items-center gap-3 z-10 relative"
            >
              <div className="flex items-center gap-2">
                <Avatar 
                  src={blog.author?.avatar?.url} 
                  alt={blog.author?.username || 'User'}
                  size={32}
                  fallbackText={blog.author?.username || blog.author?.fullName || 'U'}
                  className="border border-gray-200"
                />
                <span className="text-sm font-medium">
                  {blog.author?.username || blog.author?.fullName || 'Unknown Author'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground hover:text-blog-primary transition-colors">
                  {blog.author.fullName}
                </p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Heart className="h-4 w-4 mr-1" />
                      <span>{(blog.likes && blog.likes.length) || 0}</span>
                    </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {blog.readTime || 0} min
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {blog.views || 0}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-2 ${
                likedState.isLiked
                  ? "text-red-500 hover:text-red-600"
                  : "hover:text-red-500"
              }`}
            >
              <Heart
                className={`h-4 w-4 ${
                  likedState.isLiked ? "fill-current" : ""
                }`}
              />
              {likedState.likesCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {blog.comments?.length || 0}
            </Button>
          </div>

          {isAuthor && (
            <Badge variant="secondary" className="text-xs">
              Your Post
            </Badge>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
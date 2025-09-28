import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import Avatar from "./Avatar";
import { Heart, MessageCircle, Eye, Calendar, FileText } from "lucide-react";
import { useState } from "react";
import { config } from "../lib/config";
const { api } = config;

const BlogCard = ({ blog, index }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [likedState, setLikedState] = useState({
    isLiked: blog.isLiked || false,
    likesCount: blog.likes.length,
  });

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

  const isAuthor = user && blog.author._id === user._id;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative flex-1 flex flex-col">
        <Link to={`/blog/${blog._id}`} className="block flex-1 flex flex-col">
          {blog.media && blog.media.type !== "none" ? (
            <div className="relative h-48 overflow-hidden">
              {blog.media.type === "image" ? (
                <img
                  src={blog.media.url}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
              
              {blog.category && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="text-xs">
                    {blog.category}
                  </Badge>
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-lg font-semibold text-white line-clamp-2 mb-1">
                  {blog.title}
                </h3>
                {blog.excerpt && (
                  <p className="text-sm text-white/90 line-clamp-2">
                    {blog.excerpt}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-48 bg-muted flex items-center justify-center relative">
              <FileText className="h-12 w-12 text-muted-foreground" />
              {blog.category && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="text-xs">
                    {blog.category}
                  </Badge>
                </div>
              )}
            </div>
          )}
        </Link>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Avatar 
                src={blog.author?.avatar} 
                alt={blog.author?.username} 
                className="h-8 w-8"
              />
              <div>
                <p className="text-sm font-medium">
                  {blog.author?.username || 'Unknown'}
                </p>
                <p className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(blog.createdAt)}
                </p>
              </div>
            </div>
            
            {isAuthor && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                Your Post
              </Badge>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold line-clamp-2 group-hover:text-blog-primary transition-colors">
              {blog.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {blog.excerpt || (blog.content ? blog.content.substring(0, 150) + '...' : 'No content available')}
            </p>
          </div>
          
          {blog.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {blog.tags.slice(0, 3).map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {blog.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{blog.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-muted-foreground" title={`${likedState.likesCount} likes`}>
                <Heart 
                  className={`h-4 w-4 mr-1 ${likedState.isLiked ? 'text-red-500 fill-current' : ''} group-hover:text-red-500 transition-colors`} 
                />
                <span>{likedState.likesCount}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground" title={`${blog.comments?.length || 0} comments`}>
                <MessageCircle className="h-4 w-4 mr-1 group-hover:text-blue-500 transition-colors" />
                <span>{blog.comments?.length || 0}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground" title={`${blog.views || 0} views`}>
                <Eye className="h-4 w-4 mr-1 group-hover:text-green-500 transition-colors" />
                <span>{blog.views || 0}</span>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={handleLike}
            >
              {likedState.isLiked ? 'Liked' : 'Like'}
            </Button>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;
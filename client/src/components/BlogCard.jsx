import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Badge } from "./ui/badge";
import Avatar from "./Avatar";
import { Heart, MessageCircle } from "lucide-react";
import { useState } from "react";
import { config } from "../lib/config";

const { api } = config;

const BlogCard = ({ blog, index }) => {
  // Animation variants for staggered loading
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1],
      }
    }
  };
  
  // Truncate text to a certain length
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const { user, token, isAuthenticated } = useAuth();
  const [likedState, setLikedState] = useState({
    isLiked: blog.isLiked || false,
    likesCount: blog.likes?.length || 0,
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
      setLikedState(originalState);
    }
  };

  const isAuthor = user && blog.author && blog.author._id === user._id;

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative flex-1 flex flex-col">
        <Link to={`/blog/${blog._id}`} className="block flex-1 flex flex-col">
          <div className="relative pt-[56.25%] overflow-hidden bg-muted/20">
            {blog.media && blog.media.type === "image" ? (
              <img
                src={blog.media.url}
                alt={blog.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading={index > 2 ? 'lazy' : 'eager'}
                width={600}
                height={337.5}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
            
            {/* Category Badge */}
            {blog.category && (
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="text-xs font-medium">
                  {blog.category}
                </Badge>
              </div>
            )}
            
            {/* Read time */}
            <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-muted-foreground">
              {Math.ceil(blog.readingTime || 5)} min read
            </div>
          </div>
        </Link>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Title and Excerpt */}
        <div className="mb-3">
          <h3 className="text-lg font-bold leading-snug mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {blog.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {truncateText(blog.summary || 'No summary available', 120)}
          </p>
        </div>

        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="mt-2 mb-4">
            <div className="flex flex-wrap gap-2">
              {blog.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Author and Stats */}
        <div className="mt-auto pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar
                src={blog.author?.avatar}
                alt={blog.author?.name}
                className="h-8 w-8 text-xs"
              />
              <div>
                <p className="text-sm font-medium leading-none">
                  {blog.author?.name || 'Unknown Author'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(blog.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-muted-foreground">
              <button 
                onClick={handleLike}
                className="flex items-center hover:text-red-500 transition-colors"
                aria-label={likedState.isLiked ? 'Unlike this post' : 'Like this post'}
              >
                <Heart className={`h-4 w-4 ${likedState.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="sr-only">Likes:</span>
                <span className="ml-1 text-xs">{likedState.likesCount}</span>
              </button>
              <span className="flex items-center">
                <MessageCircle className="h-4 w-4" />
                <span className="sr-only">Comments:</span>
                <span className="ml-1 text-xs">{blog.comments?.length || 0}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default BlogCard;

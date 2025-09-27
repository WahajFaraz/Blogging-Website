import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createApiUrl } from "../lib/urlUtils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { toast } from "sonner";
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  Clock, 
  Calendar, 
  User, 
  Edit, 
  Trash2, 
  Send,
  ThumbsUp,
  ThumbsDown,
  X,
  ArrowLeft
} from "lucide-react";
import api from "../lib/api";

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, isAuthenticated } = useAuth();
  
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCommentsSidebar, setShowCommentsSidebar] = useState(false);

  useEffect(() => {
    fetchBlog();
  }, [id, token]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const data = await api.getBlog(id, token);
      setBlog(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching blog post:', err);
      setError(err.message || 'Failed to load blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    try {
      setLiking(true);
      const data = await api.likeBlog(id, token);
      setBlog(prev => ({
        ...prev,
        likes: data.likes,
        isLiked: data.isLiked
      }));
    } catch (err) {
      console.error('Error liking post:', err);
      setError(err.message || 'Failed to like post');
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const data = await api.addComment(id, commentText, token);
      
      setBlog(prev => ({
        ...prev,
        comments: [data.comment, ...prev.comments]
      }));
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
      setDeleting(true);
      await api.deleteBlog(id, token);
      navigate('/');
      toast.success('Post deleted successfully');
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          <p className="text-muted-foreground">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Blog Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'The blog post you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const isAuthor = user && blog?.author?._id === user?._id;
  const isLiked = blog?.isLiked || false;

  return (
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="mb-6" style={{ marginTop: '10px' }}>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="capitalize">
                {blog.category}
              </Badge>
              {blog.featured && (
                <Badge variant="default" className="bg-blog-primary">
                  Featured
                </Badge>
              )}
            </div>

            <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
              {blog.title}
            </h1>

            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {blog.excerpt}
            </p>

            <Link to={`/author/${blog.author._id}`} className="inline-flex items-center gap-4 mb-6 group">
              <Avatar className="h-12 w-12 rounded-full ring-2 ring-blog-primary/20 shadow-md group-hover:ring-blog-primary transition-all">
                <AvatarImage 
                  src={blog.author?.avatar?.url || ''} 
                  alt={blog.author?.fullName || blog.author?.username || 'Author'} 
                  className="object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <AvatarFallback className="bg-gradient-to-br from-blog-primary to-blog-secondary text-white font-bold">
                  {blog.author?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || blog.author?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground group-hover:text-blog-primary transition-colors">
                  {blog.author.fullName}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(blog.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {blog.readTime} min read
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {blog.views}
                  </span>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleLike}
                disabled={liking}
                variant={isLiked ? "default" : "outline"}
                className={`flex items-center gap-2 ${isLiked ? 'bg-red-500 hover:bg-red-600' : ''}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                {blog.likes.length} {blog.likes.length === 1 ? 'Like' : 'Likes'}
              </Button>

              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowCommentsSidebar(true)}
              >
                <MessageCircle className="h-4 w-4" />
                {blog.comments.length} {blog.comments.length === 1 ? 'Comment' : 'Comments'}
              </Button>

              {isAuthor && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/edit/${id}`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mb-8 space-y-4">
            {Array.isArray(blog.mediaGallery) && blog.mediaGallery.filter(m=>m.placement==='header').sort((a,b)=>a.order-b.order).map((m, idx)=> (
              <div key={`header-${idx}`}>
                {m.type === 'image' ? (
                  <img
                    src={m.url}
                    alt={`${blog.title} media ${idx+1}`}
                    className="w-full h-[500px] object-cover rounded-lg cursor-pointer"
                    style={{ filter: 'none' }}
                    onClick={() => window.open(m.url, '_blank')}
                  />
                ) : (
                  <video src={m.url} controls className="w-full h-[500px] object-cover rounded-lg" />
                )}
              </div>
            ))}
            {(!blog.mediaGallery || blog.mediaGallery.length === 0) && blog.media && blog.media.type !== 'none' && (
              <div>
                {blog.media.type === 'image' ? (
                  <img
                    src={blog.media.url}
                    alt={blog.title}
                    className="w-full h-[500px] object-cover rounded-lg cursor-pointer"
                    style={{ filter: 'none' }}
                    onClick={() => window.open(blog.media.url, '_blank')}
                  />
                ) : blog.media.type === 'video' ? (
                  <video src={blog.media.url} controls className="w-full h-[500px] object-cover rounded-lg" />
                ) : null}
              </div>
            )}
          </div>

          {blog.tags && blog.tags.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {blog.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="prose prose-lg max-w-none">
              <div 
                className="leading-relaxed [&_*]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_h4]:text-foreground [&_h5]:text-foreground [&_h6]:text-foreground [&_p]:text-foreground [&_li]:text-foreground [&_span]:text-foreground [&_div]:text-foreground [&_blockquote]:text-foreground [&_code]:text-foreground [&_pre]:text-foreground [&_table]:text-foreground [&_td]:text-foreground [&_th]:text-foreground [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:hover:text-blue-800 dark:[&_a]:hover:text-blue-300 [&_strong]:text-foreground [&_em]:text-foreground [&_u]:text-foreground [&_ol]:text-foreground [&_ul]:text-foreground"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>
            
            {Array.isArray(blog.mediaGallery) && blog.mediaGallery.some(m=>m.placement==='inline') && (
              <div className="mt-8 space-y-6">
                {blog.mediaGallery.filter(m=>m.placement==='inline').sort((a,b)=>a.order-b.order).map((m, idx)=> (
                  <div key={`inline-${idx}`} className="text-center">
                    {m.type === 'image' ? (
                      <img
                        src={m.url}
                        alt={`${blog.title} inline media ${idx+1}`}
                        className="w-full max-w-4xl mx-auto h-auto rounded-lg shadow-lg cursor-pointer"
                        style={{ filter: 'none' }}
                        onClick={() => window.open(m.url, '_blank')}
                      />
                    ) : (
                      <video 
                        src={m.url} 
                        controls 
                        className="w-full max-w-4xl mx-auto h-auto rounded-lg shadow-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {Array.isArray(blog.mediaGallery) && blog.mediaGallery.some(m=>m.placement==='footer') && (
            <div className="mb-8 space-y-4">
              {blog.mediaGallery.filter(m=>m.placement==='footer').sort((a,b)=>a.order-b.order).map((m, idx)=> (
                <div key={`footer-${idx}`}>
                  {m.type === 'image' ? (
                    <img
                      src={m.url}
                      alt={`${blog.title} media footer ${idx+1}`}
                      className="w-full h-[500px] object-cover rounded-lg cursor-pointer"
                      style={{ filter: 'none' }}
                      onClick={() => window.open(m.url, '_blank')}
                    />
                  ) : (
                    <video src={m.url} controls className="w-full h-[500px] object-cover rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {showCommentsSidebar && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-50"
                  onClick={() => setShowCommentsSidebar(false)}
                />
                
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'tween', duration: 0.3 }}
                  className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 overflow-y-auto"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Comments</h2>
                        <p className="text-sm text-muted-foreground">{blog.comments.length} {blog.comments.length === 1 ? 'comment' : 'comments'}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCommentsSidebar(false)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {isAuthenticated ? (
                      <form onSubmit={handleComment} className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 rounded-full ring-2 ring-blog-primary/20 shadow-sm">
                            <AvatarImage 
                              src={user.avatar?.url || ''} 
                              alt={user.fullName || user.username || 'Commenter'} 
                              className="object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blog-primary to-blog-secondary text-white font-bold">
                              {user.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || user.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <Textarea
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Write a comment..."
                              rows={3}
                              className="resize-none text-sm"
                              disabled={submittingComment}
                            />
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-xs text-muted-foreground">
                                {commentText.length}/1000
                              </p>
                              <Button
                                type="submit"
                                size="sm"
                                disabled={!commentText.trim() || submittingComment}
                                className="bg-blog-primary hover:bg-blog-secondary h-8"
                              >
                                {submittingComment ? (
                                  <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                    <span className="text-xs">Posting...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Send className="h-3 w-3" />
                                    <span className="text-xs">Post</span>
                                  </div>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center py-6 mb-6 border-b border-border">
                        <p className="text-muted-foreground mb-4 text-sm">
                          Please sign in to leave a comment
                        </p>
                        <Button size="sm" onClick={() => navigate('/login')}>
                          Sign In
                        </Button>
                      </div>
                    )}

                    <div className="space-y-4">
                      {blog.comments.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground text-sm">
                            No comments yet. Be the first to share your thoughts!
                          </p>
                        </div>
                      ) : (
                        blog.comments.map((comment, index) => (
                          <motion.div
                            key={comment._id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Link to={`/author/${comment.user._id}`} className="flex gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                              <Avatar className="h-8 w-8 rounded-full ring-2 ring-blog-primary/20 shadow-sm">
                                <AvatarImage 
                                  src={comment.user?.avatar?.url || ''} 
                                  alt={comment.user?.fullName || comment.user?.username || 'Commenter'} 
                                  className="object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                <AvatarFallback className="text-xs bg-gradient-to-br from-blog-primary to-blog-secondary text-white font-bold">
                                  {comment.user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || comment.user?.username?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-foreground text-sm">
                                    {comment.user.fullName}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-foreground text-sm leading-relaxed">{comment.content}</p>
                              </div>
                            </Link>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogDetail;
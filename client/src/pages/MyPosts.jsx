import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Eye, 
  Heart, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Plus,
  TrendingUp,
  BarChart3,
  Users,
  FileText
} from "lucide-react";

const MyPosts = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchMyPosts();
  }, []);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      console.log('Fetching user posts with token:', token);
      // Pass myPosts as a string 'true' and include the token in the options
      const data = await api.getBlogs({ myPosts: 'true' }, token);
      console.log('Fetched posts:', data);
      
      // The response should be an array of posts
      if (Array.isArray(data)) {
        setPosts(data);
      } else if (data && Array.isArray(data.blogs)) {
        // Handle case where response is an object with a blogs array
        setPosts(data.blogs);
      } else if (data && typeof data === 'object') {
        // If it's a single post object, wrap it in an array
        setPosts([data]);
      } else {
        // If we can't determine the format, set empty array
        console.warn('Unexpected response format:', data);
        setPosts([]);
      }
      
      setError(null);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError(error.message || 'Failed to fetch posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      setDeleting(postId);
      await api.deleteBlog(postId, token);
      setPosts(prev => prev.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      setError(error.message || 'Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const stats = {
    totalPosts: posts.length,
    publishedPosts: posts.filter(post => post.status === 'published').length,
    draftPosts: posts.filter(post => post.status === 'draft').length,
    totalViews: posts.reduce((sum, post) => sum + (post.views || 0), 0),
    totalLikes: posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0),
    totalComments: posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0),
    averageViews: posts.length > 0 ? Math.round(posts.reduce((sum, post) => sum + (post.views || 0), 0) / posts.length) : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blog-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your posts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={fetchMyPosts}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  // Separate posts into drafts and published
  const publishedPosts = posts.filter(post => post.status === 'published');
  const draftPosts = posts.filter(post => post.status === 'draft');

  const renderPostGrid = (posts, emptyMessage) => {
    if (posts.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative flex flex-col rounded-xl overflow-hidden bg-card border shadow-sm hover:shadow-md transition-all duration-300 h-full"
          >
            {/* Post Image */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={post.coverImage?.url || 'https://images.unsplash.com/photo-1542435503-956c469947f6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80'}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div className="flex space-x-2">
                  <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm text-white border-0">
                    {post.category || 'Uncategorized'}
                  </Badge>
                  {post.status === 'draft' && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                      Draft
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Post Content */}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4 mr-1" />
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
                <span className="mx-2">•</span>
                <Clock className="h-4 w-4 mr-1" />
                {Math.ceil((post.content?.length || 0) / 1000 * 2)} min read
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                <Link 
                  to={`/blog/${post._id}`} 
                  className="hover:text-blog-primary transition-colors after:absolute after:inset-0"
                >
                  {post.title}
                </Link>
              </h3>
              
              <p className="text-muted-foreground line-clamp-3 my-4 flex-1">
                {post.excerpt || (post.content ? post.content.substring(0, 150) + '...' : '')}
              </p>
              
              {/* Post Stats */}
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors">
                    <Heart className="h-4 w-4 mr-1" />
                    <span>{post.likes?.length || 0}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span>{post.comments?.length || 0}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors">
                    <Eye className="h-4 w-4 mr-1" />
                    <span>{post.views || 0}</span>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/edit/${post._id}`);
                    }}
                    title="Edit post"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(post._id);
                    }}
                    disabled={deleting === post._id}
                    title="Delete post"
                  >
                    {deleting === post._id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">My Posts</h1>
            <p className="text-muted-foreground">Manage and track your blog posts</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalPosts}</p>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.publishedPosts}</p>
                    <p className="text-sm text-muted-foreground">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalViews}</p>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalLikes}</p>
                    <p className="text-sm text-muted-foreground">Total Likes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engagement</CardTitle>
                <CardDescription>Post performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comments</span>
                  <span className="font-medium">{stats.totalComments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Views</span>
                  <span className="font-medium">{stats.averageViews}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Drafts</span>
                  <span className="font-medium">{stats.draftPosts}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Manage your content</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => navigate('/create')} 
                  className="w-full mb-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Post
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/profile')} 
                  className="w-full"
                >
                  View Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
                <CardDescription>Improve your posts</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Use engaging titles and excerpts</p>
                <p>• Add relevant tags for discoverability</p>
                <p>• Include high-quality media</p>
                <p>• Post consistently</p>
              </CardContent>
            </Card>
          </div>

          {/* Published Posts Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Published Posts ({publishedPosts.length})</CardTitle>
              <CardDescription>Your published blog posts visible to everyone</CardDescription>
            </CardHeader>
            <CardContent>
              {renderPostGrid(publishedPosts, 'No published posts yet')}
            </CardContent>
          </Card>

          {/* Draft Posts Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Drafts ({draftPosts.length})</CardTitle>
              <CardDescription>Your unpublished draft posts</CardDescription>
            </CardHeader>
            <CardContent>
              {renderPostGrid(draftPosts, 'No draft posts yet')}
            </CardContent>
          </Card>

          {/* Empty State */}
          {posts.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Posts (0)</CardTitle>
                <CardDescription>You haven't created any posts yet</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-4">Start writing your first blog post</p>
                <Button onClick={() => navigate('/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyPosts;
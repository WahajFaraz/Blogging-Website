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
      if (!token || !user) {
        throw new Error('No authentication token or user data found. Please log in again.');
      }
      

      const response = await api.getBlogs({ 
        myPosts: 'true',
        limit: 100
      }, token);
      
      
      let postsData = [];
      
      if (response && response.data && Array.isArray(response.data.blogs)) {
        postsData = response.data.blogs;
      } else if (response && Array.isArray(response.blogs)) {
        postsData = response.blogs;
      } else if (Array.isArray(response)) {
        postsData = response;
      } else if (response && typeof response === 'object') {
        postsData = [response];
      }
      
      setPosts(postsData || []);
      
      setError(null);
    } catch (error) {
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

  const publishedPosts = posts.filter(post => post.status === 'published');
  const draftPosts = posts.filter(post => post.status === 'draft');

  const stats = {
    totalPosts: posts.length,
    publishedPosts: publishedPosts.length,
    draftPosts: draftPosts.length,
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

          {/* Stats Cards */}
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

          {/* All Posts Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">All Posts</h2>
              <div className="flex space-x-4">
                <span className="text-sm text-muted-foreground">
                  {publishedPosts.length} {publishedPosts.length === 1 ? 'published' : 'published'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {draftPosts.length} {draftPosts.length === 1 ? 'draft' : 'drafts'}
                </span>
              </div>
            </div>
            
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => {
                  return (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-card border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row ${
                      post.status === 'draft' ? 'opacity-90' : ''
                    }`}
                  >
                    {post.media?.url && (
                      <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
                        <img 
                          src={post.media.url} 
                          alt={post.title} 
                          className={`w-full h-full object-cover hover:scale-105 transition-transform duration-300 ${
                            post.status === 'draft' ? 'opacity-70' : ''
                          }`}
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(post.updatedAt || post.createdAt)}
                          </span>
                          {post.status === 'draft' ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Draft
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Published
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-2 text-foreground">
                        <Link 
                          to={post.status === 'draft' ? `/edit/${post._id}` : `/blog/${post._id}`}
                          className="hover:text-blog-primary transition-colors"
                        >
                          {post.title || 'Untitled Draft'}
                        </Link>
                      </h3>
                      
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {post.excerpt || (post.content ? post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '') : 'No content yet')}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          {post.status === 'published' && (
                            <>
                              <div className="flex items-center text-muted-foreground">
                                <Eye className="h-4 w-4 mr-1" />
                                <span>{post.views || 0}</span>
                              </div>
                              <div className="flex items-center text-muted-foreground">
                                <Heart className="h-4 w-4 mr-1" />
                                <span>{post.likes?.length || 0}</span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/edit/${post._id}`)}
                          >
                            {post.status === 'draft' ? 'Continue Editing' : 'Edit'}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(post._id)}
                            disabled={deleting === post._id}
                          >
                            {deleting === post._id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-1">No posts yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Create your first post to get started</p>
                <Button onClick={() => navigate('/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default MyPosts;
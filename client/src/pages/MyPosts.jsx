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
      // Pass myPosts as a string 'true' and include the token in the options
      const data = await api.getBlogs({ myPosts: 'true' }, token);
      console.log('Fetched posts:', data);
      // The response is an array of posts, not an object with a blogs property
      setPosts(Array.isArray(data) ? data : []);
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

          <Card>
            <CardHeader>
              <CardTitle>Your Posts ({posts.length})</CardTitle>
              <CardDescription>
                {posts.length === 0 ? 'No posts yet' : 'Manage your published and draft posts'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
                  <p className="text-muted-foreground mb-4">Start writing your first blog post</p>
                  <Button onClick={() => navigate('/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post, index) => (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              <Link 
                                to={`/blog/${post._id}`} 
                                className="hover:text-blog-primary transition-colors"
                              >
                                {post.title}
                              </Link>
                            </h3>
                            <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                              {post.status}
                            </Badge>
                            {post.featured && (
                              <Badge variant="default" className="bg-blog-primary">
                                Featured
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {post.excerpt}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.publishedAt || post.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.readTime} min read
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.views || 0} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {post.likes?.length || 0} likes
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {post.comments?.length || 0} comments
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {post.tags?.slice(0, 3).map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {post.tags?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/edit/${post._id}`)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(post._id)}
                            disabled={deleting === post._id}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                            {deleting === post._id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default MyPosts;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from './ui/button';
import { Loader2, Search, AlertCircle, RefreshCw, X, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from './ui/skeleton';


const BlogGrid = ({
  searchQuery = '',
  category,
  sort = 'newest',
  page = 1,
  limit = 12,
  onPageChange
}) => {
  const { token, isAuthenticated } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const location = useLocation();
  const observer = useRef();
  const loadingRef = useRef(false);
  const [searchParams] = useSearchParams();
  
  // Reset state when search params change
  useEffect(() => {
    setBlogs([]);
    setPage(1);
    setHasMore(true);
    setTotalCount(0);
  }, [searchQuery, category, sort]);

  const fetchBlogs = useCallback(async () => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page,
        limit,
        sort,
        ...(searchQuery && { search: searchQuery }),
        ...(category && { category })
      });
      
      const queryString = params.toString();
      console.log('Fetching blogs with query:', queryString);
      
      // Include token if user is authenticated
      const response = isAuthenticated 
        ? await api.getBlogs(queryString ? `?${queryString}` : '', token)
        : await api.getBlogs(queryString ? `?${queryString}` : '');

      // Handle different response formats
      let blogsData = [];
      let total = 0;

      // Handle different API response structures
      if (response && response.data) {
        // Response with pagination data
        blogsData = response.data.blogs || response.data || [];
        total = response.data.total || response.data.length || 0;
      } else if (Array.isArray(response)) {
        // Direct array response
        blogsData = response;
        total = response.length;
      } else if (response && typeof response === 'object') {
        // Single blog object
        blogsData = [response];
        total = 1;
      }

      console.log('Processed blogs data:', { 
        blogs: blogsData, 
        total,
        originalResponse: response 
      });

      // Update state
      setBlogs(prevBlogs => 
        page === 1 ? blogsData : [...prevBlogs, ...blogsData]
      );
      setTotalCount(total);
      setHasMore(blogsData.length === limit);
      
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blogs. Please try again later.');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, category, sort, isAuthenticated, token]);

  // Fetch blogs when dependencies change
  useEffect(() => {
    const isMounted = { current: true };
    
    const loadData = async () => {
      await fetchBlogs();
    };
    
    if (isMounted.current) {
      loadData();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [fetchBlogs]);
  
  // Reset blogs when search params change
  useEffect(() => {
    setBlogs([]);
    setPage(1);
    setHasMore(true);
  }, [searchQuery, category, sort]);

  // Loading skeleton
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-8">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg overflow-hidden">
          <Skeleton className="h-48 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
  
  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Something went wrong
        </h3>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button 
          onClick={fetchBlogs}
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Search/Filters Summary */}
      {(searchQuery || category) && (
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Showing results for:</span>
            
            {searchQuery && (
              <span className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                Search: "{searchQuery}"
                <button 
                  onClick={() => {
                    const newSearchParams = new URLSearchParams(searchParams);
                    newSearchParams.delete('q');
                    setSearchParams(newSearchParams);
                  }}
                  className="ml-2 text-primary/70 hover:text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {category && category !== 'all' && (
              <span className="inline-flex items-center bg-secondary/10 text-secondary-foreground px-3 py-1 rounded-full text-sm">
                Category: {category}
                <button 
                  onClick={() => {
                    const newSearchParams = new URLSearchParams(searchParams);
                    newSearchParams.delete('category');
                    setSearchParams(newSearchParams);
                  }}
                  className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {(searchQuery || (category && category !== 'all')) && (
              <button 
                onClick={() => {
                  setSearchParams({});
                }}
                className="ml-auto text-sm text-muted-foreground hover:text-foreground flex items-center"
              >
                <X className="h-3 w-3 mr-1" />
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && blogs.length === 0 ? (
        renderSkeletons()
      ) : (
        <>
          {/* Blog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {blogs.map((blog, index) => (
                <motion.div
                  key={blog._id || `blog-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                >
                  <BlogCard blog={blog} index={index} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Empty State */}
          {!isLoading && blogs.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchQuery || category ? 'No matching posts found' : 'No posts available'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery || category
                  ? 'Try adjusting your search or filter to find what you\'re looking for.'
                  : 'There are no blog posts to display at the moment. Check back later or create a new post.'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {searchQuery || category ? (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchParams({});
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear all filters
                  </Button>
                ) : null}
                
                {isAuthenticated && (
                  <Button asChild>
                    <Link to="/create-post">
                      <Pencil className="h-4 w-4 mr-2" />
                      Write your first post
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Load More Button */}
          {hasMore && blogs.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button 
                onClick={() => onPageChange(page + 1)}
                disabled={isLoading}
                variant="outline"
                className="min-w-[150px]"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Load More
              </Button>
            </div>
          )}
          
          {/* End of results */}
          {!hasMore && blogs.length > 0 && (
            <div className="text-center text-muted-foreground py-8">
              You've reached the end of the list
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlogGrid;
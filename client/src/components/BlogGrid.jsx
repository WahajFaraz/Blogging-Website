import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import BlogCard from "./BlogCard";
import api from "../lib/api";

// Simple wrapper to track if component is mounted
const useIsMounted = () => {
  const isMounted = useRef(false);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  return isMounted;
};

const BlogGrid = ({ blogs: initialBlogs, searchFilters = { query: '', category: 'all', sort: 'newest' } }) => {
  const [blogs, setBlogs] = useState(initialBlogs || []);
  const [loading, setLoading] = useState(!initialBlogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);
  const location = useLocation();
  const isMounted = useIsMounted();

  const fetchBlogs = async () => {
    // Skip initial fetch if we have initialBlogs
    if (initialLoad && initialBlogs) {
      setInitialLoad(false);
      return;
    }

    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchFilters.query) params.append('search', searchFilters.query);
      if (searchFilters.category && searchFilters.category !== 'all') params.append('category', searchFilters.category);
      if (searchFilters.sort) params.append('sort', searchFilters.sort);
      
      const queryString = params.toString();
      console.log('Fetching blogs with params:', queryString);
      
      const response = await api.getBlogs(queryString ? `?${queryString}` : '');
      
      if (!isMounted.current) return;
      
      // The response is already parsed by our API utility
      if (response.success && response.data) {
        setBlogs(response.data.blogs || []);
      } else {
        throw new Error(response.message || 'Failed to fetch blogs');
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Skip if we have initialBlogs and it's the first render
    if (initialBlogs && initialLoad) {
      setBlogs(initialBlogs);
      setInitialLoad(false);
      setLoading(false);
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const search = urlParams.get('search') || '';
    setSearchQuery(search);
    
    // Only fetch if we don't have initialBlogs or it's not the first render
    if (!initialBlogs || !initialLoad) {
      fetchBlogs();
    }
  }, [location.search, searchFilters, initialBlogs, initialLoad]);
  
  // Cleanup function to prevent state updates after unmount
  useEffect(() => {
    return () => {
      setBlogs([]);
      setLoading(true);
    };
  }, []);

  if (loading) {
                  return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              );
  }

  return (
    <div>
      {searchQuery && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Search results for: "{searchQuery}"
          </h2>
          <p className="text-muted-foreground">
            {blogs.length} {blogs.length === 1 ? 'result' : 'results'} found
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.isArray(blogs) && blogs.length > 0 ? (
          blogs.map((blog, index) => (
            <BlogCard key={blog._id || blog.id || Math.random()} blog={blog} index={index} />
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8 col-span-full">
            {searchQuery ? (
              <div>
                <p className="text-lg mb-2">No blogs found for "{searchQuery}"</p>
                <p className="text-sm">Try different keywords or browse all posts</p>
              </div>
            ) : (
              "No blogs available"
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogGrid;
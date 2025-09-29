import React, { useEffect, useState } from "react";
import BlogCard from "./BlogCard";
import { motion } from "framer-motion";
import { createApiUrl } from "../lib/urlUtils";

export const FeaturedSlider = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedBlogs = async () => {
      setLoading(true);
      try {
        const response = await fetch(createApiUrl('blogs/featured'), {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        
        if (!response.ok) {
          throw new Error('Failed to fetch featured blogs');
        }

        const data = await response.json();
        setBlogs(data.blogs || []);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBlogs();
  }, []);

  const featuredBlogs = Array.isArray(blogs) ? blogs.slice(0, 3) : [];

  if (loading) {
    return (
                      <div className="flex space-x-4 overflow-x-auto py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-80 h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                  ))}
                </div>
    );
  }

  return (
    <div className="flex space-x-4 overflow-x-auto py-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {featuredBlogs.length > 0 ? (
        featuredBlogs.map((blog) => (
          <motion.div key={blog._id || blog.id || Math.random()} whileHover={{ scale: 1.05 }} className="flex-shrink-0">
            <BlogCard blog={blog} />
          </motion.div>
        ))
      ) : (
        <div className="text-center text-gray-500 py-8">
          No featured blogs available
        </div>
      )}
    </div>
  );
};

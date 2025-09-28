import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { HeroSection } from "../components/HeroSection";
import BlogGrid from "../components/BlogGrid";
import ErrorBoundary from "../components/ErrorBoundary";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Search, RefreshCw, AlertCircle, Filter, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Skeleton } from "../components/ui/skeleton";

const Index = () => {
  const { token, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Get initial values from URL or use defaults
  const [searchFilters, setSearchFilters] = useState({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 12
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchFilters.query) params.set('q', searchFilters.query);
    if (searchFilters.category !== 'all') params.set('category', searchFilters.category);
    if (searchFilters.sort !== 'newest') params.set('sort', searchFilters.sort);
    if (searchFilters.page > 1) params.set('page', searchFilters.page);
    
    // Update URL without causing a navigation
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${params.toString() ? `?${params}` : ''}`
    );
  }, [searchFilters]);

  const handleFilterChange = (name, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name !== 'page' && { page: 1 }) // Reset to first page when filters change
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // The form submission will trigger the URL update via the effect above
  };

  const resetFilters = () => {
    setSearchFilters({
      query: '',
      category: 'all',
      sort: 'newest',
      page: 1,
      limit: 12
    });
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'technology', label: 'Technology' },
    { value: 'design', label: 'Design' },
    { value: 'development', label: 'Development' },
    { value: 'business', label: 'Business' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'travel', label: 'Travel' },
    { value: 'food', label: 'Food' },
    { value: 'health', label: 'Health' },
    { value: 'education', label: 'Education' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'trending', label: 'Trending Now' },
    { value: 'most-viewed', label: 'Most Viewed' }
  ];

  // Build query string for API
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (searchFilters.query) params.append('search', searchFilters.query);
    if (searchFilters.category && searchFilters.category !== 'all') {
      params.append('category', searchFilters.category);
    }
    params.append('sort', searchFilters.sort);
    params.append('page', searchFilters.page);
    params.append('limit', searchFilters.limit);
    return params.toString();
  }, [searchFilters]);

  // Fetch blogs when filters change
  const fetchBlogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryString = buildQueryString();
      const response = await fetch(`/api/blogs?${queryString}`, {
        headers: isAuthenticated ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch blogs');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blogs. Please try again later.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString, isAuthenticated, token]);
  
  // Initial data fetch
  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return (
    <ErrorBoundary>
      <div className="pt-16">
        <HeroSection />

        <main className="container mx-auto px-4 py-8">
          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="sticky top-16 z-10 bg-background/80 backdrop-blur-sm py-4 -mx-4 px-4 border-b"
          >
            <div className="max-w-7xl mx-auto">
              <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search articles, authors, or topics..."
                    className="w-full pl-10 pr-4 py-2 h-10 rounded-lg bg-card"
                    value={searchFilters.query}
                    onChange={(e) => handleFilterChange('query', e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                  
                  <Button type="submit" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </form>
              
              {/* Expanded Filters */}
              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="pt-4 border-t flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-1 block">Category</label>
                        <Select
                          value={searchFilters.category}
                          onValueChange={(value) => handleFilterChange('category', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-sm font-medium mb-1 block">Sort By</label>
                        <Select
                          value={searchFilters.sort}
                          onValueChange={(value) => handleFilterChange('sort', value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            {sortOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={resetFilters}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reset filters
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-8 mb-8"
          >
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">Discover Amazing Content</h1>
              <p className="text-muted-foreground">Search through thousands of articles and find what interests you</p>
            </div>
            
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto p-4 bg-card border rounded-lg shadow-sm space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by keyword, tag, or author..."
                  value={searchFilters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-base"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Category</label>
                  <Select
                    value={searchFilters.category}
                    onValueChange={(value) => handleFilterChange('category', value === 'All' ? 'all' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sort by</label>
                  <Select
                    value={searchFilters.sort}
                    onValueChange={(value) => handleFilterChange('sort', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort posts by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {error ? (
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
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
              </div>
            ) : (
              <BlogGrid 
                searchQuery={searchFilters.query} 
                category={searchFilters.category !== 'all' ? searchFilters.category : undefined}
                sort={searchFilters.sort}
                page={searchFilters.page}
                limit={searchFilters.limit}
                onPageChange={(page) => handleFilterChange('page', page)}
              />
            )}
          </motion.div>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default Index;

import React, { useState } from "react";
import { motion } from "framer-motion";
import { HeroSection } from "../components/HeroSection";
import BlogGrid from "../components/BlogGrid";
import ErrorBoundary from "../components/ErrorBoundary";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Search } from "lucide-react";

export default function Index() {
  const [searchFilters, setSearchFilters] = useState({
    query: '',
    category: 'all',
    sort: 'newest'
  });

  const handleFilterChange = (name, value) => {
    setSearchFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const categories = [
    "All", "Technology", "Design", "Development", "Business", 
    "Lifestyle", "Travel", "Food", "Health", 
    "Education", "Entertainment", "Other"
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'popular', label: 'Most Popular' }
  ];

  return (
    <ErrorBoundary>
      <div className="pt-16 md:pt-20">
        <HeroSection />

        <main className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search and Filter Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mb-8 md:mb-12"
          >
            <div className="bg-card p-4 md:p-6 rounded-xl shadow-sm border">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search articles..."
                        className="pl-10 w-full"
                        value={searchFilters.query}
                        onChange={(e) => handleFilterChange('query', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-nowrap">
                    <Select 
                      value={searchFilters.category} 
                      onValueChange={(value) => handleFilterChange('category', value)}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category.toLowerCase()}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={searchFilters.sort} 
                      onValueChange={(value) => handleFilterChange('sort', value)}
                    >
                      <SelectTrigger className="w-full sm:w-[180px]">
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
                    
                    <Button type="submit" className="hidden sm:flex">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
                
                <Button type="submit" className="w-full sm:hidden">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
            </div>
          </motion.section>

          {/* Blog Posts Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full"
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
            <BlogGrid searchFilters={searchFilters} />
          </motion.div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

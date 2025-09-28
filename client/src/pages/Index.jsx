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
    // The BlogGrid component will refetch data when searchFilters changes.
    // This function is just to handle the form submission event.
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
      <div className="pt-16">
        <HeroSection />

        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8"
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

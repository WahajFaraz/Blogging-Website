import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Loader2, Search, ArrowLeft, ArrowRight, Filter } from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 9;

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get current page from URL or default to 1
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchTerm = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  useEffect(() => {
    console.log('Component mounted or dependencies changed:', { currentPage, searchTerm, category });
    fetchBlogs();
    fetchCategories();
    
    // Cleanup function
    return () => {
      console.log('Cleaning up Explore component');
    };
  }, [currentPage, searchTerm, category]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        category: category,
        sort: 'newest'
      };
      
      console.log('Fetching blogs with params:', params);
      const response = await api.getBlogs(params);
      console.log('API Response:', response);
      
      // Handle both response formats:
      // 1. Direct response with blogs array and total count
      // 2. Response with data object containing blogs and total
      const blogsData = response.blogs || response.data?.blogs || [];
      const totalCount = response.total || response.data?.total || 0;
      
      setBlogs(Array.isArray(blogsData) ? blogsData : []);
      setTotalBlogs(Number(totalCount) || 0);
      setTotalPages(Math.ceil((Number(totalCount) || 0) / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.getBlogs({ fields: 'category' });
      const uniqueCategories = [...new Set(response.data.blogs.map(blog => blog.category))].filter(Boolean);
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    params.set('search', searchQuery);
    params.set('page', '1'); // Reset to first page on new search
    setSearchParams(params);
  };

  const handleCategorySelect = (category) => {
    const params = new URLSearchParams(searchParams);
    if (selectedCategory === category) {
      params.delete('category');
      setSelectedCategory('');
    } else {
      params.set('category', category);
      setSelectedCategory(category);
    }
    params.set('page', '1'); // Reset to first page when changing category
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    window.scrollTo(0, 0);
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSearchParams({});
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Stories</h1>
        <p className="text-muted-foreground">Discover amazing stories from our community</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stories..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
            {(searchTerm || category) && (
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </form>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategorySelect(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Blog Grid */}
      {blogs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {blogs.map((blog) => (
              <Card key={blog._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {blog.media?.url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={blog.media.url}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-xl line-clamp-2">
                      {blog.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {blog.excerpt || blog.content.substring(0, 150) + '...'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">{blog.category}</Badge>
                    {blog.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{blog.author?.name || 'Anonymous'}</span>
                    <span>{format(new Date(blog.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/blog/${blog._id}`)}
                  >
                    Read More
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No stories found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || category 
              ? 'Try adjusting your search or filter criteria.' 
              : 'There are no stories available at the moment.'}
          </p>
          <Button variant="outline" onClick={resetFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default Explore;

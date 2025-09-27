import express from 'express';
import { body, validationResult } from 'express-validator';
import Blog from '../models/Blog.js';
import { auth, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all published blogs with pagination and filtering
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, sort = 'newest', myPosts } = req.query;
    
    // Basic pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    
    // Base query
    let query = {};
    
    // If myPosts is true and user is authenticated, get only their posts
    if (myPosts === 'true' && req.user) {
      query.author = req.user._id;
    } else {
      // Otherwise, only get published posts
      query.status = 'published';
    }
    
    // Filter by category if provided
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Text search across multiple fields
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Sorting options
    const sortOptions = {
      newest: { publishedAt: -1 },
      oldest: { publishedAt: 1 },
      popular: { views: -1 },
      trending: { views: -1 }
    }[sort] || { publishedAt: -1 };
    
    // Execute query with pagination
    let [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate({
          path: 'author',
          select: 'username fullName avatar',
          // Ensure we always have a valid avatar URL
          transform: (doc) => {
            if (doc) {
              if (!doc.avatar || !doc.avatar.url) {
                doc.avatar = {
                  url: 'https://ui-avatars.com/api/?name=' + 
                       encodeURIComponent(doc.fullName || doc.username || 'U') + 
                       '&background=random&color=fff',
                  public_id: 'default-avatar',
                  format: 'jpg'
                };
              }
              return doc;
            }
            return null;
          }
        })
        .sort(sortOptions)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .lean()
        .exec(),
      Blog.countDocuments(query).exec()
    ]);
    
    // Ensure all blogs have valid author avatars
    blogs = blogs.map(blog => {
      if (blog.author && (!blog.author.avatar || !blog.author.avatar.url)) {
        blog.author.avatar = {
          url: 'https://ui-avatars.com/api/?name=' + 
               encodeURIComponent(blog.author.fullName || blog.author.username || 'U') + 
               '&background=random&color=fff',
          public_id: 'default-avatar',
          format: 'jpg'
        };
      }
      return blog;
    });
    
    // Add isLiked flag if user is authenticated
    const blogsWithLiked = blogs.map(blog => {
      const blogObj = { ...blog };
      
      // Handle missing featured image
      if (!blogObj.featuredImage || !blogObj.featuredImage.url) {
        blogObj.featuredImage = {
          url: 'https://via.placeholder.com/800x450?text=No+Image+Available',
          publicId: 'placeholder'
        };
      }
      
      // Handle missing author avatar
      if (blogObj.author && (!blogObj.author.avatar || !blogObj.author.avatar.url)) {
        blogObj.author.avatar = {
          url: 'https://via.placeholder.com/150?text=U',
          publicId: 'default-avatar'
        };
      }
      
      // Add isLiked flag if user is authenticated
      blogObj.isLiked = req.user ? (blog.likes || []).includes(req.user.id) : false;
      
      return blogObj;
    });
    
    // Send response
    res.status(200).json({
      success: true,
      data: {
        blogs: blogsWithLiked,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs. Please try again later.'
    });
  }
});

// Get user's own posts - must come before /:id route
router.get('/my-posts', auth, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user._id })
      .populate('author', 'username fullName avatar')
      .sort({ createdAt: -1 });
    
    res.json({ blogs });
  } catch (error) {
    console.error('Get my posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const blogDoc = await Blog.findById(req.params.id)
      .populate('author', 'username fullName avatar bio followers following')
      .populate('comments.user', 'username fullName avatar');
    
    if (!blogDoc) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (blogDoc.status !== 'published') {
      if (!req.user || blogDoc.author._id.toString() !== req.user._id.toString()) {
        return res.status(404).json({ error: 'Blog not found' });
      }
    }
    
    if (blogDoc.status === 'published' && (!req.user || blogDoc.author._id.toString() !== req.user._id.toString())) {
      await blogDoc.incrementViews();
    }
    
    const blog = blogDoc.toObject();

    if (req.user) {
      blog.isLiked = blogDoc.likes.some(likeId => likeId.equals(req.user._id));
      blog.isBookmarked = false;
    }
    
    res.json(blog);
    
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('excerpt')
    .isLength({ min: 10, max: 300 })
    .withMessage('Excerpt must be between 10 and 300 characters'),
  body('category')
    .isIn(['Technology', 'Design', 'Development', 'Business', 'Lifestyle', 'Travel', 'Food', 'Health', 'Education', 'Entertainment', 'Other'])
    .withMessage('Invalid category'),
  body('tags')
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  body('tags.*')
    .isLength({ min: 1, max: 20 })
    .withMessage('Each tag must be between 1 and 20 characters'),
  body('media')
    .optional()
    .isObject()
    .withMessage('Media must be an object'),
  body('mediaGallery.*.type')
    .optional()
    .isIn(['image', 'video'])
    .withMessage('Each media item type must be image or video'),
  body('mediaGallery.*.url')
    .optional()
    .isString()
    .withMessage('Each media item must have a url'),
  body('mediaGallery.*.placement')
    .optional()
    .isIn(['header', 'inline', 'footer'])
    .withMessage('Placement must be header, inline, or footer'),
  body('mediaGallery')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Media gallery must be an array (max 20 items)'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, content, excerpt, category, tags, media, mediaGallery, status = 'draft' } = req.body;
    
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);
    
    const blog = new Blog({
      title,
      content,
      excerpt,
      category,
      tags: tags || [],
      media: media || { type: 'none', url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop' },
      mediaGallery: Array.isArray(mediaGallery) ? mediaGallery.map((m, idx) => ({
        type: m.type,
        url: m.url,
        public_id: m.public_id,
        format: m.format,
        size: m.size,
        duration: m.duration,
        order: typeof m.order === 'number' ? m.order : idx,
        placement: ['header', 'inline', 'footer'].includes(m.placement) ? m.placement : 'header'
      })) : [],
      status,
      author: req.user._id,
      readTime,
      publishedAt: status === 'published' ? new Date() : null
    });
    
    const savedBlog = await blog.save();
    
    // Populate the author field
    const populatedBlog = await Blog.findById(savedBlog._id)
      .populate('author', 'username fullName avatar')
      .lean();
    
    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: {
        blog: populatedBlog
      }
    });
    
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: 'Server error during blog creation' });
  }
});

router.put('/:id', auth, [
  body('title')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters'),
  body('excerpt')
    .optional()
    .isLength({ min: 10, max: 300 })
    .withMessage('Excerpt must be between 10 and 300 characters'),
  body('category')
    .optional()
    .isIn(['Technology', 'Design', 'Development', 'Business', 'Lifestyle', 'Travel', 'Food', 'Health', 'Education', 'Entertainment', 'Other'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  body('media')
    .optional()
    .isObject()
    .withMessage('Media must be an object'),
  body('mediaGallery')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Media gallery must be an array (max 20 items)'),
  body('mediaGallery.*.type')
    .optional()
    .isIn(['image', 'video'])
    .withMessage('Each media item type must be image or video'),
  body('mediaGallery.*.url')
    .optional()
    .isString()
    .withMessage('Each media item must have a url'),
  body('mediaGallery.*.placement')
    .optional()
    .isIn(['header', 'inline', 'footer'])
    .withMessage('Placement must be header, inline, or footer'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this blog' });
    }
    
    const updates = req.body;
    const allowedUpdates = ['title', 'content', 'excerpt', 'category', 'tags', 'media', 'mediaGallery', 'status'];
    
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});
    
    if (filteredUpdates.mediaGallery && Array.isArray(filteredUpdates.mediaGallery)) {
      filteredUpdates.mediaGallery = filteredUpdates.mediaGallery.map((m, idx) => ({
        type: m.type,
        url: m.url,
        public_id: m.public_id,
        format: m.format,
        size: m.size,
        duration: m.duration,
        order: typeof m.order === 'number' ? m.order : idx,
        placement: ['header', 'inline', 'footer'].includes(m.placement) ? m.placement : 'header'
      }));
    }

    if (filteredUpdates.status === 'published' && blog.status !== 'published') {
      filteredUpdates.publishedAt = new Date();
    } else if (filteredUpdates.status === 'draft') {
      filteredUpdates.publishedAt = null;
    }
    
    if (filteredUpdates.content) {
      const wordCount = filteredUpdates.content.split(/\s+/).length;
      filteredUpdates.readTime = Math.ceil(wordCount / 200);
    }
    
    if (filteredUpdates.media && blog.media && blog.media.public_id) {
      try {
        await deleteFile(blog.media.public_id);
      } catch (error) {
        console.error('Error deleting old media:', error);
      }
    }
    
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      filteredUpdates,
      { new: true, runValidators: true }
    ).populate('author', 'username fullName avatar');
    
    res.json({
      message: 'Blog updated successfully',
      blog: updatedBlog
    });
    
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: 'Server error during blog update' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this blog' });
    }
    
    if (blog.media && blog.media.public_id) {
      try {
        await deleteFile(blog.media.public_id);
      } catch (error) {
        console.error('Error deleting media:', error);
      }
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Blog deleted successfully' });
    
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Server error during blog deletion' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (blog.status !== 'published') {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    await blog.toggleLike(req.user._id);
    
    res.json({ 
      message: 'Like toggled successfully',
      isLiked: blog.likes.includes(req.user._id),
      likeCount: blog.likes.length
    });
    
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/comments', auth, [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    if (blog.status !== 'published') {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    const comment = {
      user: req.user._id,
      content: req.body.content
    };
    
    blog.comments.push(comment);
    await blog.save();
    
    await blog.populate('comments.user', 'username fullName avatar');
    const newComment = blog.comments[blog.comments.length - 1];
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment
    });
    
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Server error during comment creation' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const blogs = await Blog.find({ 
      author: req.params.userId,
      status: 'published' 
    })
    .populate('author', 'username fullName avatar')
    .sort({ publishedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
    
    const total = await Blog.countDocuments({ 
      author: req.params.userId,
      status: 'published' 
    });
    
    res.json({
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Get user blogs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

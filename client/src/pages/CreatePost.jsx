import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { MediaUpload } from "../components/MediaUpload";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  X, Plus, Save, Eye, EyeOff, Bold, Italic, Underline, Heading1, Heading2,
  List, ListOrdered, Quote, Code, Link, AlignLeft, AlignCenter, AlignRight, Image
} from "lucide-react";

const CreatePost = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const contentRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    tags: [],
    status: "draft",
    media: null,
    mediaGallery: []
  });

  const [tagInput, setTagInput] = useState("");

  const categories = [
    "Technology", "Design", "Development", "Business", 
    "Lifestyle", "Travel", "Food", "Health", 
    "Education", "Entertainment", "Other"
  ];

  useEffect(() => {
    if (contentRef.current && !contentRef.current.innerHTML && formData.content) {
      contentRef.current.innerHTML = formData.content;
    }
  }, []);





  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
  };

  const handleStatusChange = (value) => {
    setFormData(prev => ({
      ...prev,
      status: value
    }));
  };

  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleMediaSelect = (media) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media || media,
      mediaGallery: [...(prev.mediaGallery || []), {
        type: media.type,
        url: media.url,
        public_id: media.public_id,
        format: media.format,
        size: media.size,
        duration: media.duration,
        order: (prev.mediaGallery?.length || 0),
        placement: media.placement || 'header'
      }]
    }));
  };

  const execCommand = (command, value = null) => {
    const editor = contentRef.current;
    if (!editor) return;
    
    editor.focus();
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    const editor = contentRef.current;
    if (editor) {
      const content = editor.innerHTML;
      setFormData(prev => {
        if (prev.content !== content) {
          return {
            ...prev,
            content: content
          };
        }
        return prev;
      });
    }
  };

  const handleContentChange = (e) => {
    clearTimeout(contentRef.current?.updateTimeout);
    contentRef.current.updateTimeout = setTimeout(() => {
      updateContent();
    }, 10);
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
      }
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (!formData.content.trim()) {
      setError("Content is required");
      return false;
    }
    if (!formData.excerpt.trim()) {
      setError("Excerpt is required");
      return false;
    }
    if (!formData.category) {
      setError("Category is required");
      return false;
    }
    if (formData.title.length > 200) {
      setError("Title cannot exceed 200 characters");
      return false;
    }
    if (formData.excerpt.length > 300) {
      setError("Excerpt cannot exceed 300 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Prepare the blog data according to server expectations
      const blogData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 200) + '...',
        category: formData.category,
        tags: formData.tags || [],
        status: formData.status || 'draft',
        media: formData.media || {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop'
        },
        mediaGallery: formData.mediaGallery || []
      };

      const response = await api.createBlog(blogData, token);
      
      // If we get here, the blog was created successfully
      setSuccess(true);
      // Show success message
      toast.success('Blog created successfully!');
      // Redirect to the home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Create post error:', error);
      setError(error.message || 'Failed to create blog post. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateReadTime = () => {
    const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  };

  const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;

  return (
    <div className="min-h-screen bg-background pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Create New Post</h1>
            <p className="text-muted-foreground">Share your thoughts with the world</p>
          </div>

        

          

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential details about your blog post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter your blog post title..."
                    maxLength={200}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.title.length}/200 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="excerpt">Excerpt *</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    placeholder="Brief summary of your post..."
                    maxLength={300}
                    rows={3}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.excerpt.length}/300 characters
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={handleCategoryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>Add relevant tags to help readers find your post</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a tag..."
                    maxLength={20}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim() || formData.tags.length >= 10}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground">
                  Maximum 10 tags allowed • Press Enter to add
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>Add images/videos to your post. You can add multiple and set their order and placement.</CardDescription>
              </CardHeader>
              <CardContent>
                <MediaUpload
                  onMediaSelect={handleMediaSelect}
                  mediaType="both"
                  maxSize={20}
                />
                {formData.mediaGallery.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Media order and placement</h4>
                    {formData.mediaGallery.map((m, idx) => (
                      <div key={idx} className="flex items-center gap-3 border rounded p-2">
                        <span className="w-6 text-sm text-muted-foreground">{idx+1}.</span>
                        <div className="flex-1 flex items-center gap-3">
                          <span className="text-sm truncate">{m.type.toUpperCase()} • {m.format?.toUpperCase()} • {(m.size/1024/1024).toFixed(2)}MB</span>
                        </div>
                        <select
                          className="border rounded px-2 py-1 text-sm bg-background"
                          value={m.placement}
                          onChange={(e)=>{
                            const v = e.target.value;
                            setFormData(prev=>{
                              const g=[...prev.mediaGallery];
                              g[idx] = { ...g[idx], placement: v };
                              return { ...prev, mediaGallery: g };
                            })
                          }}
                        >
                          <option value="header">Header</option>
                          <option value="inline">Inline (in content)</option>
                          <option value="footer">Footer</option>
                        </select>
                        <input
                          type="number"
                          className="w-20 border rounded px-2 py-1 text-sm bg-background"
                          value={m.order}
                          onChange={(e)=>{
                            const v = Number(e.target.value);
                            setFormData(prev=>{
                              const g=[...prev.mediaGallery];
                              g[idx] = { ...g[idx], order: v };
                              return { ...prev, mediaGallery: g };
                            })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content *</CardTitle>
                <CardDescription>Write your blog post content with rich formatting options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {wordCount} words • ~{calculateReadTime()} min read
                  </div>
                </div>

                <div className="w-full">
                  <div className="w-full">
                    <Label>Write Your Content Below :</Label>
                    
                    <div className="border border-border rounded-t-lg bg-muted/50 p-2 flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('bold')}
                        className="h-8 w-8 p-0"
                        title="Bold (Ctrl+B)"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('italic')}
                        className="h-8 w-8 p-0"
                        title="Italic (Ctrl+I)"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('underline')}
                        className="h-8 w-8 p-0"
                        title="Underline (Ctrl+U)"
                      >
                        <Underline className="h-4 w-4" />
                      </Button>

                      <div className="w-px h-6 bg-border mx-1"></div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('formatBlock', '<h1>')}
                        className="h-8 px-2 text-sm"
                        title="Heading 1"
                      >
                        H1
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('formatBlock', '<h2>')}
                        className="h-8 px-2 text-sm"
                        title="Heading 2"
                      >
                        H2
                      </Button>

                      <div className="w-px h-6 bg-border mx-1"></div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('justifyLeft')}
                        className="h-8 w-8 p-0"
                        title="Align Left"
                      >
                        <AlignLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('justifyCenter')}
                        className="h-8 w-8 p-0"
                        title="Align Center"
                      >
                        <AlignCenter className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('justifyRight')}
                        className="h-8 w-8 p-0"
                        title="Align Right"
                      >
                        <AlignRight className="h-4 w-4" />
                      </Button>

                      <div className="w-px h-6 bg-border mx-1"></div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('insertUnorderedList')}
                        className="h-8 w-8 p-0"
                        title="Bullet List"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => execCommand('insertOrderedList')}
                        className="h-8 w-8 p-0"
                        title="Numbered List"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>

                      <div className="w-px h-6 bg-border mx-1"></div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={insertLink}
                        className="h-8 w-8 p-0"
                        title="Insert Link"
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={insertImage}
                        className="h-8 w-8 p-0"
                        title="Insert Image"
                      >
                        <Image className="h-4 w-4" />
                      </Button>

                      <div className="w-px h-6 bg-border mx-1"></div>

                      <Select onValueChange={(value) => execCommand('fontSize', value)}>
                        <SelectTrigger className="h-8 w-20">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Small</SelectItem>
                          <SelectItem value="3">Normal</SelectItem>
                          <SelectItem value="5">Large</SelectItem>
                          <SelectItem value="7">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select onValueChange={(value) => execCommand('fontName', value)}>
                        <SelectTrigger className="h-8 w-32">
                          <SelectValue placeholder="Font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Courier New">Courier New</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div
                      ref={contentRef}
                      contentEditable
                      onInput={handleContentChange}
                      onKeyDown={handleKeyDown}
                      onBlur={updateContent}
                      className="w-full border border-border rounded-b-lg p-4 min-h-[400px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent prose prose-sm max-w-none text-foreground bg-background [&>*]:text-foreground [&_p]:text-foreground [&_h1]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_li]:text-foreground [&_span]:text-foreground [&_div]:text-foreground"
                      style={{ 
                        fontFamily: 'inherit',
                        color: 'inherit',
                        width: '100%'
                      }}
                      suppressContentEditableWarning={true}
                      data-placeholder="Start writing your content here..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

  <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {formData.status === 'published' ? 'Publish' : 'Save Draft'}
                  </div>
                )}
              </Button>
            </div>

  {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg"
            >
              <p className="font-medium">Post created successfully! Redirecting to home page...</p>
            </motion.div>
          )}


          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
            >
              <p className="font-medium">{error}</p>
            </motion.div>
          )}
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default CreatePost;
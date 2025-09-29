import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MediaUpload } from "../components/MediaUpload";
import { createApiUrl } from "../lib/urlUtils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  X, Plus, Save, Eye, EyeOff, ArrowLeft, Bold, Italic, Underline, 
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Link, Code, Image
} from "lucide-react";

const EditPost = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
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
  const contentRef = useRef(null);

  const categories = [
    "Technology", "Design", "Development", "Business", 
    "Lifestyle", "Travel", "Food", "Health", 
    "Education", "Entertainment", "Other"
  ];

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(createApiUrl(`blogs/${id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.author._id !== user._id) {
          navigate('/my-posts');
          return;
        }

        setFormData({
          title: data.title || "",
          content: data.content || "",
          excerpt: data.excerpt || "",
          category: data.category || "",
          tags: data.tags || [],
          status: data.status || "draft",
          media: data.media || null,
          mediaGallery: data.mediaGallery || []
        });
        
        setTimeout(() => {
          if (contentRef.current && data.content) {
            contentRef.current.innerHTML = data.content;
          }
        }, 100);
      } else {
        setError(data.message || 'Failed to fetch post');
      }
    } catch (error) {
      setError('Failed to load post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      mediaGallery: prev.mediaGallery.filter((_, i) => i !== index)
    }));
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

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(createApiUrl(`blogs/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Invalid response from server');
      }

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/blog/${id}`);
        }, 2000);
      } else {
        setError(data.message || data.error || 'Failed to update blog post');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
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

  const calculateReadTime = () => {
    const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  };

  const wordCount = formData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blog-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/my-posts')}>Back to My Posts</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                onClick={() => navigate('/my-posts')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to My Posts
              </Button>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Edit Post</h1>
            <p className="text-muted-foreground">Update your blog post</p>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg"
            >
              <p className="font-medium">Post updated successfully! Redirecting to post...</p>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
            >
              <p className="font-medium">{error}</p>
            </motion.div>
          )}

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
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeMedia(idx)}
                          className="text-red-600 hover:text-red-700 hover:border-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content *</CardTitle>
                <CardDescription>Write your blog post content</CardDescription>
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
                onClick={() => navigate('/my-posts')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="min-w-[120px]"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {formData.status === 'published' ? 'Update & Publish' : 'Save Changes'}
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
                <p className="font-medium">Post updated successfully! Redirecting to post...</p>
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

export default EditPost;
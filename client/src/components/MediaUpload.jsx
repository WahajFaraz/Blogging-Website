import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image, Video, File, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { config } from "../lib/config";
import { createApiUrl } from "../lib/urlUtils";
const { api } = config;

export const MediaUpload = ({ 
  onMediaSelect, 
  mediaType = 'both',
  maxSize = 20,
  className = "",
  accept = "image/*,video/*",
  multiple = true,
  folder = 'blogss',
  placement = 'header'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [error, setError] = useState(null);
  const [dragCounter, setDragCounter] = useState(0);
  
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragCounter(prev => prev + 1);
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragCounter(prev => prev - 1);
    if (dragCounter === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setDragCounter(0);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    setError(null);
    
    const validFiles = files.filter(file => {
      if (mediaType === 'image' && !file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      if (mediaType === 'video' && !file.type.startsWith('video/')) {
        setError('Only video files are allowed');
        return false;
      }
      
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File size must be less than ${maxSize}MB`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    for (const file of validFiles) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      let endpoint = createApiUrl('media/upload-blog-media');
      if (file.type.startsWith('image/')) {
        endpoint = `${api.baseUrl}/api/${api.version}/media/upload-image`;
      } else if (file.type.startsWith('video/')) {
        endpoint = `${api.baseUrl}/api/${api.version}/media/upload-video`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      
      const newMedia = {
        ...result.media,
        id: Date.now() + Math.random(),
        originalName: file.name,
        placement
      };
      
      setUploadedMedia(prev => [...prev, newMedia]);
      
      if (onMediaSelect) {
        onMediaSelect(newMedia);
      }

      setUploadProgress(100);
      
      setTimeout(() => setUploadProgress(0), 1000);

    } catch (error) {
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (mediaId) => {
    setUploadedMedia(prev => prev.filter(media => media.id !== mediaId));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (fileType.startsWith('video/')) return <Video className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center space-x-2"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </motion.div>
      )}

      {uploading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">Uploading...</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      <div
        ref={dropZoneRef}
        className={`relative border-2 border-dashed rounded-lg p-3 transition-all duration-300 cursor-pointer group min-h-[80px] ${isDragging
            ? 'border-blog-primary bg-blog-primary/5 scale-[1.01]'
            : 'border-border hover:border-blog-primary/60 hover:bg-blog-primary/5'
          }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex items-center gap-2">
          <Upload className={`h-4 w-4 flex-shrink-0 ${isDragging ? 'text-blog-primary' : 'text-muted-foreground'
            }`} />
          <div className="flex-1">
            <span className="text-sm font-medium text-foreground">
              {isDragging ? 'Drop to upload!' : (<>Drop or <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
                className="text-blog-primary hover:text-blog-secondary font-semibold underline"
              >browse</button></>)}
            </span>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">Max {maxSize}MB</span>
        </div>

      </div>

      {uploadedMedia.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-foreground mb-3">Uploaded Media</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedMedia.map((media) => (
              <motion.div
                key={media.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group bg-card border border-border rounded-lg overflow-hidden"
              >
                {media.type === 'image' ? (
                  <img
                    src={media.url}
                    alt={media.originalName}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted flex items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <div className="p-3">
                  <p className="text-sm font-medium text-foreground truncate">
                    {media.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(media.size)} • {media.format?.toUpperCase()}
                  </p>
                  {media.duration && (
                    <p className="text-xs text-muted-foreground">
                      Duration: {Math.round(media.duration)}s
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeMedia(media.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>

                <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;
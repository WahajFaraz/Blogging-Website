import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Avatar = ({ 
  src, 
  alt = 'User', 
  size = 40, 
  className = '',
  fallbackText = null
}) => {
  const [imgError, setImgError] = useState(false);
  
  // If there's no source or there was an error loading the image
  if (!src || imgError) {
    const initial = fallbackText 
      ? fallbackText.charAt(0).toUpperCase()
      : alt.charAt(0).toUpperCase();
    
    return (
      <div 
        className={`inline-flex items-center justify-center rounded-full bg-gray-300 text-gray-600 font-medium ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${size * 0.4}px`
        }}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      onError={() => setImgError(true)}
    />
  );
};

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.number,
  className: PropTypes.string,
  fallbackText: PropTypes.string
};

export default Avatar;

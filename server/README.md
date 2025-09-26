# BlogSpace API Server

This is the backend API server for the BlogSpace application, built with Node.js, Express, and MongoDB.

## 🚀 Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- MongoDB Atlas account (recommended) or local MongoDB instance
- Vercel account for deployment
- Cloudinary account for image storage (optional)

## 🔧 Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5001
   NODE_ENV=production
   CLIENT_URL=https://your-frontend-domain.com

   # MongoDB Connection (MongoDB Atlas recommended)
   MONGODB_URI=your_mongodb_atlas_connection_string

   # JWT Configuration
   JWT_SECRET=generate_a_strong_secret_key
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
   RATE_LIMIT_MAX=100           # 100 requests per window

   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## 🛠 Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. For production:
   ```bash
   npm run build
   npm start
   ```

## 🌐 Deployment to Vercel

### Prerequisites
- Vercel account
- MongoDB Atlas database
- Cloudinary account (for image uploads)

### Steps

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repository-url
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Configure Project**:
   - Framework Preset: "Other"
   - Root Directory: (leave as is)
   - Build Command: `npm run build`
   - Output Directory: (leave empty)
   - Install Command: `npm install`
   - Development Command: `npm run dev`

4. **Environment Variables**:
   Add all variables from your `.env` file in the Vercel project settings:
   - Go to "Settings" → "Environment Variables"
   - Add each variable from your `.env` file

5. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

### Vercel Configuration

The `vercel.json` file is pre-configured with:
- Proper CORS headers
- Security headers
- Route handling
- Increased Lambda size and duration limits

## 🔒 Security

- Rate limiting enabled (100 requests/15 minutes)
- Helmet.js for security headers
- CORS properly configured
- Request sanitization
- XSS protection
- MongoDB injection protection

## 📝 API Documentation

API documentation is available at `/api-docs` when running in development mode.

## 🔄 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| PORT | Server port | No | 5001 |
| NODE_ENV | Environment (development/production) | No | development |
| MONGODB_URI | MongoDB connection string | Yes | - |
| JWT_SECRET | Secret for JWT signing | Yes | - |
| JWT_EXPIRE | JWT expiration time | No | 30d |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | No | - |
| CLOUDINARY_API_KEY | Cloudinary API key | No | - |
| CLOUDINARY_API_SECRET | Cloudinary API secret | No | - |

## 🛠 Troubleshooting

- **H10 App Crashed**: Check your environment variables and MongoDB connection
- **Timeout Errors**: Increase the `maxDuration` in `vercel.json`
- **CORS Issues**: Verify `CLIENT_URL` and CORS settings
- **File Upload Issues**: Check Cloudinary configuration and file size limits

## 📜 License

This project is licensed under the MIT License.

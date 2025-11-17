# 🌐 Frontend Deployment Configuration

## Environment Variables

The frontend needs the following environment variables set in Render:

### Required Variables:

```bash
# Backend API URL (IMPORTANT!)
VITE_API_URL=https://talentbinder-backend.onrender.com

# Optional: App Name
VITE_APP_NAME=Talent Binder
```

## Render Configuration Steps

### 1. **Set Environment Variables in Render Dashboard**

Go to your frontend service → Environment → Add Environment Variables:

```
Name: VITE_API_URL
Value: https://talentbinder-backend.onrender.com
```

**IMPORTANT**: After adding the environment variable, you MUST trigger a new deploy because Vite bundles environment variables at build time!

### 2. **Build Settings**

- **Build Command**: `npm install; npm run build`
- **Publish Directory**: `dist`

### 3. **Backend URL**

Make sure you know your backend URL from Render:
- Go to your backend service in Render
- Copy the URL (e.g., `https://talentbinder-backend.onrender.com`)
- Use this as the value for `VITE_API_URL` (without `/api` at the end)

## Local Development

Create a `.env` file (not committed to git):

```bash
# Development
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=Talent Binder
```

## How It Works

The frontend uses `VITE_API_URL` to determine where the backend API is:

- **Local Development**: `http://localhost:4000/api/...`
- **Production (Render)**: `https://your-backend.onrender.com/api/...`

If `VITE_API_URL` is not set, it falls back to `/api` (same origin), which will fail in production if frontend and backend are separate services.

## Troubleshooting

**Problem**: `ERR_NAME_NOT_RESOLVED` or `Failed to fetch`
- **Solution**: Check that `VITE_API_URL` is set in Render environment variables
- **Solution**: Verify the backend URL is correct and the backend is running

**Problem**: CORS errors
- **Solution**: Backend must have frontend URL in allowed origins (`index.js`)
- **Solution**: Check that `credentials: true` is set in CORS config

## Backend Configuration

The backend also needs to know about the frontend:

In backend `.env.render`:
```bash
FRONTEND_URL=https://talentbinder-frontend.onrender.com
```

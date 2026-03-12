# LostFinder - Lost and Found Management System

A full-stack application to report and find lost items, featuring an AI-based matching system, real-time chat, and an admin control panel.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas or local MongoDB instance

### Installation
1. Clone the repository
2. Run `npm run install:all` in the root directory to install dependencies for both client and backend.

### Configuration
1. **Backend**: Copy `backend/.env.example` to `backend/.env` and fill in your MongoDB URI, JWT secret, and SMTP settings.
2. **Client**: Copy `client/.env.example` to `client/.env` and configure the API base URL.

### Development
Run `npm run dev` in the root directory to start both the backend and client concurrently.

## 📦 Deployment Ready

### Build for Production
1. Build the client:
   ```bash
   cd client && npm run build
   ```
2. The backend is configured to serve the static files from `client/dist` when `NODE_ENV=production`.

### Environment Variables for Production
Ensure the following are set on your deployment platform (e.g., Render, Heroku, Vercel):
- `NODE_ENV=production`
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL` (your production frontend URL)

## ✨ Features
- **User Module**: Report lost/found items, browse items, claim items with proofs, real-time chat with finders/owners.
- **AI Matching**: Automatically detects possible matches based on item names, categories, and locations.
- **Admin Module**: Manage users (block/unblock), delete items, review claims, and view analytics.
- **Real-time Notifications**: In-app notifications for matches and claim updates.

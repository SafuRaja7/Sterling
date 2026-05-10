# Sterling Shopify Market | Global Hub

A premium, trustworthy, AI-powered e-commerce order matching platform.

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, React Three Fiber (Three.js), Zustand.
- **Backend**: Node.js, Express, MongoDB, Socket.io, JWT.

## Prerequisites
- **Node.js**: v18 or higher (You must install Node.js as it was not found in your environment).
- **MongoDB**: The cluster URL has been configured with the provided credentials in `backend/.env`.

## Setup Instructions

### 1. Backend Setup
1. Open terminal and `cd backend`
2. Run `npm install`
3. Check `backend/.env` to ensure `MONGODB_URI` has your exact cluster URL replacing `YOUR_CLUSTER_URL`.
4. Run `npm run seed` to create the default Admin account.
   - Admin Username: `admin`
   - Admin Password: `admin123`
5. Run `npm run dev` to start the backend server on port 5000.

### 2. Frontend Setup
1. Open a second terminal and `cd frontend`
2. Run `npm install`
3. Run `npm run dev` to start the Next.js app on port 3000.
4. Open `http://localhost:3000` in your browser.

## Features
- **God-Mode Admin**: Schedule combos, adjust balances, approve deposits, and wipe user progress.
- **Real-time Engine**: Socket.io integration for instant admin notifications.
- **Progressive Tasks**: Dynamic 20-order system with progressive commission logic.
- **Premium 3D UI**: Framer motion transitions and React Three Fiber rotating globe.

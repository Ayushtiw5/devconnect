# DevConnect

A full-stack MERN application for developers to connect, share, and collaborate.

## Tech Stack

- **Frontend**: React (Vite), Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT

## Features (MVP)

- [x] User authentication (email/password)
- [ ] User profiles with skills and experience
- [ ] Posts feed with likes and comments
- [ ] Follow/unfollow users
- [ ] User search by name/skills
- [ ] Basic notifications

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```
3. Copy environment file:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` with your values
5. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

## Scripts

### Server
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server

## License

MIT

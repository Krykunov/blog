# Spotify "Now Playing" Widget

This project contains the complete code for building a production-ready Spotify "Now Playing" widget with Next.js, as described in the blog post.

## Features

- Real-time Spotify widget showing currently playing track
- Elegant fallback to recently played when nothing is active
- Server-side caching to optimize API calls
- Comprehensive error handling for production reliability
- Beautiful, responsive UI with smooth animations
- Complete TypeScript implementation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```bash
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

3. Run the development server:
```bash
npm run dev
```

## Getting Your Refresh Token

Follow the authorization flow described in the blog post to get your refresh token.

## Project Structure

```
src/
├── app/
│   └── api/
│       └── spotify/
│           ├── route.ts          # Next.js API route
│           └── spotify.ts        # Core Spotify logic
└── components/
    └── SpotifyWidget.tsx         # React component
```

## Deployment

This project is ready for deployment on Vercel, Netlify, or any other Next.js hosting platform. Make sure to set your environment variables in your hosting platform's settings.
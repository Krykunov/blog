# Spotify "Now Playing" Widget

A Next.js widget that displays your currently playing or recently played Spotify track with a clean, modern design and spinning album artwork animation.

## Features

- 🎵 Shows currently playing track or last played track
- 🎨 Spinning album artwork when music is playing
- ⚡ Server-side rendering for optimal performance
- 🔄 Smart caching (15-second cache duration)
- 🎯 Graceful error handling with fallbacks
- 📱 Responsive design
- 🔗 Clickable links to open tracks in Spotify

## Architecture

This widget uses a clean service layer architecture:

- **Service Layer** (`src/lib/services/spotify.ts`): Core Spotify API logic
- **Server Component** (`SpotifyWidgetServer.tsx`): Server-side rendering approach
- **Client Component** (`SpotifyWidget.tsx`): Client-side rendering approach
- **API Route** (`src/app/api/spotify/route.ts`): HTTP endpoint for client components

## Quick Start

1. **Clone and install dependencies:**
```bash
git clone https://github.com/Krykunov/blog.git
cd blog/spotify-widget
npm install
```

2. **Set up Spotify credentials:**
```bash
cp .env.local.example .env.local
```

3. **Configure your Spotify app:**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Add your credentials to `.env.local`

4. **Run the development server:**
```bash
npm run dev
```

## Usage

### Server-Side Approach (Recommended)

For optimal performance, use the server component that fetches data during SSR:

```tsx
import SpotifyWidgetServer from "@/components/SpotifyWidgetServer";

export default function Page() {
  return (
    <div>
      <SpotifyWidgetServer />
    </div>
  );
}
```

### Client-Side Approach

For dynamic updates or when you need client-side interactivity:

```tsx
import SpotifyWidget from "@/components/SpotifyWidget";

export default function Page() {
  return (
    <div>
      <SpotifyWidget />
    </div>
  );
}
```

### Direct Service Usage

You can also use the service directly in your server components:

```tsx
import { getSpotifyData } from "@/lib/services/spotify";

export default async function CustomComponent() {
  const spotifyData = await getSpotifyData();
  
  return (
    <div>
      <h2>{spotifyData.isPlaying ? "Now Playing" : "Last Played"}</h2>
      <p>{spotifyData.title} by {spotifyData.artist}</p>
    </div>
  );
}
```

## Environment Variables

Create a `.env.local` file with your Spotify app credentials:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

## Getting Spotify Credentials

1. **Create a Spotify App:**
   - Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Click "Create an App"
   - Note your Client ID and Client Secret

2. **Get Authorization Code:**
   - Visit this URL (replace YOUR_CLIENT_ID):
   ```
   https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000&scope=user-read-currently-playing%20user-read-recently-played
   ```

3. **Exchange for Refresh Token:**
   - Use the authorization code to get a refresh token
   - You can use tools like Postman or curl for this exchange

## Benefits of Service Layer Architecture

- **Server-Side Rendering**: Faster initial page loads
- **Clean Separation**: Business logic separated from UI components
- **Reusability**: Service can be used in multiple components
- **Maintainability**: Easier to test and modify
- **Backward Compatibility**: API routes still work for existing implementations

## Customization

The widget is built with Tailwind CSS and can be easily customized:

- Modify colors in the component files
- Adjust the spinning animation duration
- Change the cache duration in the service
- Add additional Spotify data fields

## Tech Stack

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Spotify Web API** for music data

## License

MIT License - feel free to use this in your own projects!
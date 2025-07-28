// Import environment variables - these are only available server-side
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
import queryString from "query-string"; // Helper for URL encoding form data

// Base URL for Spotify's player endpoints
const BASE_URL = "https://api.spotify.com/v1/me/player";

// Define the shape of data our widget will use
// This is a simplified version of Spotify's complex API response
export type SpotifyData = {
  isPlaying: boolean;        // Whether music is currently playing
  songUrl: string | null;    // Link to open track in Spotify (null if unavailable)
  title: string;             // Track name
  albumImageUrl: string | null; // Album artwork URL (null if unavailable)
  artist: string;            // Artist name(s), comma-separated if multiple
};

// Simple in-memory cache to reduce API calls
// In production, you might use Redis or another cache store
interface CacheEntry {
  data: SpotifyData;         // The cached Spotify data
  timestamp: number;         // When this data was cached (milliseconds)
}

let cache: CacheEntry | null = null;  // Our cache storage
const CACHE_DURATION = 15000;         // Cache for 15 seconds (15,000 ms)

// Spotify returns multiple image sizes for album artwork
type SpotifyImage = {
  url: string;      // Direct URL to the image
  height: number;   // Image height in pixels
  width: number;    // Image width in pixels
};

// Artist information from Spotify
type SpotifyArtist = {
  external_urls: { spotify: string }; // Link to artist's Spotify page
  href: string;                       // API endpoint for this artist
  id: string;                         // Spotify's unique artist ID
  name: string;                       // Artist's display name
  type: "artist";                     // Always "artist" for artist objects
  uri: string;                        // Spotify URI (spotify:artist:...)
};

// Album information with nested artist data
type SpotifyAlbum = {
  album_type: string;           // "album", "single", "compilation"
  artists: SpotifyArtist[];     // Array of artists (albums can have multiple)
  external_urls: { spotify: string }; // Link to album's Spotify page
  href: string;                 // API endpoint for this album
  id: string;                   // Spotify's unique album ID
  images: SpotifyImage[];       // Array of album artwork in different sizes
  name: string;                 // Album title
  release_date: string;         // Release date (YYYY-MM-DD format)
  type: "album";               // Always "album" for album objects
  uri: string;                 // Spotify URI (spotify:album:...)
};

// Complete track information - this is what we get from the API
type Track = {
  album: SpotifyAlbum;          // Full album information
  artists: SpotifyArtist[];     // Array of track artists
  available_markets: string[];   // Countries where track is available
  disc_number: number;          // Disc number (for multi-disc albums)
  duration_ms: number;          // Track length in milliseconds
  explicit: boolean;            // Whether track has explicit content
  external_ids: {               // External identifiers (ISRC, UPC, etc.)
    isrc?: string;              // International Standard Recording Code
    ean?: string;               // European Article Number
    upc?: string;               // Universal Product Code
  };
  external_urls: { spotify: string }; // Link to track's Spotify page
  href: string;                 // API endpoint for this track
  id: string;                   // Spotify's unique track ID
  is_playable: boolean;         // Whether track can be played
  name: string;                 // Track title
  popularity: number;           // Popularity score (0-100)
  preview_url: string | null;   // 30-second preview URL (may be null)
  track_number: number;         // Track number on the album
  type: "track";               // Always "track" for track objects
  uri: string;                 // Spotify URI (spotify:track:...)
  is_local: boolean;           // Whether this is a local file
};

// Spotify's token response structure
type AccessToken = { access_token: string };

const getAccessToken = async (): Promise<AccessToken> => {
  // Get credentials from environment variables
  const clientId = SPOTIFY_CLIENT_ID;
  const clientSecret = SPOTIFY_CLIENT_SECRET;
  const refreshToken = SPOTIFY_REFRESH_TOKEN;

  // Validate that all required credentials are present
  // This prevents runtime errors and provides clear error messages
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Spotify credentials in environment variables");
  }

  // Create Basic Auth header by base64 encoding "clientId:clientSecret"
  // This is required by OAuth 2.0 specification for client authentication
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  // Make token refresh request to Spotify
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      // Basic authentication with client credentials
      Authorization: `Basic ${basic}`,
      // Form data content type (required by OAuth 2.0)
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: queryString.stringify({
      grant_type: "refresh_token",    // OAuth flow type for token refresh
      refresh_token: refreshToken,    // Our long-lived refresh token
    }),
  });

  // Check if the request was successful
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();
  
  // Spotify returns error details in the response body even for successful HTTP requests
  if (data.error) {
    throw new Error(`Spotify auth error: ${data.error_description || data.error}`);
  }

  // Return the new access token
  // Note: Spotify may also return a new refresh token, but usually doesn't
  return data;
};

// Helper function to create authorization headers for Spotify API calls
const getAccessTokenHeader = (accessToken: string) => {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
};

// Fetch currently playing track from Spotify
const getNowPlayingResponse = async (accessToken: string) => {
  return fetch(`${BASE_URL}/currently-playing`, getAccessTokenHeader(accessToken));
};

// Transform Spotify's complex track data into our simplified format
const mapSpotifyData = (track: Track) => {
  return {
    // Get Spotify URL, fallback to null if not available
    songUrl: track.external_urls?.spotify || null,
    
    // Get track name, fallback to "Unknown Track"
    title: track.name || "Unknown Track",
    
    // Get largest album image (first in array), fallback to null
    albumImageUrl: track.album?.images[0]?.url || null,
    
    // Join multiple artists with commas, fallback to "Unknown Artist"
    artist: track.artists?.map((artist: { name: string }) => artist.name).join(", ") || "Unknown Artist",
  };
};

// Fallback function: get the most recently played track
const getRecentlyPlayed = async (accessToken: string) => {
  try {
    // Request only the most recent track (limit=1)
    const response = await fetch(`${BASE_URL}/recently-played?limit=1`, getAccessTokenHeader(accessToken));
    
    if (!response.ok) {
      throw new Error(`Recently played API error: ${response.status}`);
    }

    const json = await response.json();

    // Check if we actually got any tracks back
    if (!json.items || json.items.length === 0) {
      return { 
        isPlaying: false, 
        songUrl: null, 
        title: "No Recent Tracks", 
        albumImageUrl: null, 
        artist: "No listening history" 
      };
    }

    // Use the same mapping function, but mark as not currently playing
    return { isPlaying: false, ...mapSpotifyData(json.items[0].track) };
  } catch (error) {
    console.error("Recently played error:", error);
    // Final fallback if even recently played fails
    return { 
      isPlaying: false, 
      songUrl: null, 
      title: "Unable to fetch", 
      albumImageUrl: null, 
      artist: "Recent tracks unavailable" 
    };
  }
};

const getCachedData = (): SpotifyData | null => {
  if (!cache) return null;
  
  const now = Date.now();
  if (now - cache.timestamp > CACHE_DURATION) {
    cache = null; // Expire cache
    return null;
  }
  
  return cache.data;
};

const setCachedData = (data: SpotifyData): void => {
  cache = {
    data,
    timestamp: Date.now()
  };
};

const getSpotifyData = async (): Promise<SpotifyData> => {
  try {
    // Check cache first
    const cachedData = getCachedData();
    if (cachedData) {
      return cachedData;
    }
    
    const tokenData = await getAccessToken();
    
    if (!tokenData.access_token) {
      throw new Error("Failed to get access token");
    }
    
    const { access_token } = tokenData;
    const nowPlayingResponse = await getNowPlayingResponse(access_token);

    // Handle different response statuses
    if (nowPlayingResponse.status === 204) {
      // No content - nothing is playing
      const recentData = await getRecentlyPlayed(access_token);
      setCachedData(recentData);
      return recentData;
    }
    
    if (nowPlayingResponse.status === 401) {
      throw new Error("Unauthorized - token may be expired");
    }
    
    if (nowPlayingResponse.status === 403) {
      throw new Error("Forbidden - insufficient scopes");
    }
    
    if (nowPlayingResponse.status === 429) {
      throw new Error("Rate limited - too many requests");
    }
    
    if (!nowPlayingResponse.ok) {
      throw new Error(`Spotify API error: ${nowPlayingResponse.status}`);
    }

    const data = await nowPlayingResponse.json();

    // Handle ads or missing track data
    if (!data.item || !data.item.name || !data.item.artists || data.currently_playing_type !== "track") {
      const recentData = await getRecentlyPlayed(access_token);
      setCachedData(recentData);
      return recentData;
    }

    const result = { isPlaying: data.is_playing, ...mapSpotifyData(data.item) };
    setCachedData(result);
    return result;
    
  } catch (error) {
    console.error("Spotify API error:", error);
    
    // Return cached data if available, even if expired
    if (cache) {
      return cache.data;
    }
    
    // Return fallback data as last resort
    return {
      isPlaying: false,
      songUrl: null,
      title: "Unable to fetch",
      albumImageUrl: null,
      artist: "Spotify data unavailable"
    };
  }
};

export default getSpotifyData;
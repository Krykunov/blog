import queryString from "query-string";

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
const BASE_URL = "https://api.spotify.com/v1/me/player";

export type SpotifyData = {
  isPlaying: boolean;
  songUrl: string | null;
  title: string;
  albumImageUrl: string | null;
  artist: string;
};

// Simple in-memory cache
interface CacheEntry {
  data: SpotifyData;
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_DURATION = 15000; // 15 seconds cache

type SpotifyImage = {
  url: string;
  height: number;
  width: number;
};

type SpotifyArtist = {
  external_urls: { spotify: string };
  href: string;
  id: string;
  name: string;
  type: "artist";
  uri: string;
};

type SpotifyAlbum = {
  album_type: string;
  artists: SpotifyArtist[];
  external_urls: { spotify: string };
  href: string;
  id: string;
  images: SpotifyImage[];
  name: string;
  release_date: string;
  type: "album";
  uri: string;
};

type Track = {
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
  available_markets: string[];
  disc_number: number;
  duration_ms: number;
  explicit: boolean;
  external_ids: {
    isrc?: string;
    ean?: string;
    upc?: string;
  };
  external_urls: { spotify: string };
  href: string;
  id: string;
  is_playable: boolean;
  name: string;
  popularity: number;
  preview_url: string | null;
  track_number: number;
  type: "track";
  uri: string;
  is_local: boolean;
};

type AccessToken = { access_token: string };

const getAccessToken = async (): Promise<AccessToken> => {
  const clientId = SPOTIFY_CLIENT_ID;
  const clientSecret = SPOTIFY_CLIENT_SECRET;
  const refreshToken = SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Spotify credentials in environment variables");
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: queryString.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Spotify auth error: ${data.error_description || data.error}`);
  }

  return data;
};

const getAccessTokenHeader = (accessToken: string) => {
  return { headers: { Authorization: `Bearer ${accessToken}` } };
};

const getNowPlayingResponse = async (accessToken: string) => {
  return fetch(`${BASE_URL}/currently-playing`, getAccessTokenHeader(accessToken));
};

const mapSpotifyData = (track: Track) => {
  return {
    songUrl: track.external_urls?.spotify || null,
    title: track.name || "Unknown Track",
    albumImageUrl: track.album?.images[0]?.url || null,
    artist: track.artists?.map((artist: { name: string }) => artist.name).join(", ") || "Unknown Artist",
  };
};

const getRecentlyPlayed = async (accessToken: string) => {
  try {
    const response = await fetch(`${BASE_URL}/recently-played?limit=1`, getAccessTokenHeader(accessToken));
    
    if (!response.ok) {
      throw new Error(`Recently played API error: ${response.status}`);
    }

    const json = await response.json();

    if (!json.items || json.items.length === 0) {
      return { 
        isPlaying: false, 
        songUrl: null, 
        title: "No Recent Tracks", 
        albumImageUrl: null, 
        artist: "No listening history" 
      };
    }

    return { isPlaying: false, ...mapSpotifyData(json.items[0].track) };
  } catch (error) {
    console.error("Recently played error:", error);
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

export const getSpotifyData = async (): Promise<SpotifyData> => {
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
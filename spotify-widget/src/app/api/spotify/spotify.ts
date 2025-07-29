// Re-export types for backward compatibility
export type { SpotifyData } from "@/lib/services/spotify";

// Re-export from the service layer for backward compatibility
export { getSpotifyData as default } from "@/lib/services/spotify";
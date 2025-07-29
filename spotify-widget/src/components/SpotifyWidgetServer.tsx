/* eslint-disable @next/next/no-img-element */
import { getSpotifyData } from "@/lib/services/spotify";

// Utility function for conditional classes (simplified version of clsx/cn)
const cn = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

// Client component for the spinning animation
const SpinningAlbumCover = ({ 
  src, 
  alt, 
  isPlaying 
}: { 
  src: string; 
  alt: string; 
  isPlaying: boolean; 
}) => {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("absolute aspect-square rounded-full", {
        "animate-[spin_5s_linear_infinite]": isPlaying,
      })}
    />
  );
};

const SpotifyWidgetServer = async () => {
  // Fetch data server-side with error handling
  let data;
  try {
    data = await getSpotifyData();
  } catch (error) {
    console.error("Failed to fetch Spotify data:", error);
    // Fallback data on server error
    data = {
      isPlaying: false,
      songUrl: null,
      title: "Unable to connect",
      albumImageUrl: null,
      artist: "Spotify unavailable"
    };
  }

  return (
    <a
      href={data?.songUrl || "https://open.spotify.com/"}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex h-full items-center gap-x-6 rounded-3xl p-5",
        "max-lg:p-6 md:max-lg:flex-col md:max-lg:items-start md:max-lg:justify-between",
        "hover:bg-slate-50 transition-colors duration-200"
      )}
    >
      {/* Spotify Icon Badge */}
      <div className="absolute right-3 top-3">
        <svg
          className="w-6 h-6 text-green-500 transition-all duration-300 group-hover:text-green-400"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      </div>

      {/* Album Art */}
      <div className="aspect-square h-full rounded-xl bg-black p-3 max-lg:h-3/5 max-md:min-w-24">
        <div className="relative">
          <SpinningAlbumCover
            src={data?.albumImageUrl || "/images/spotify-placeholder.png"}
            alt={data?.albumImageUrl ? `Album cover for ${data.title}` : "Spotify logo"}
            isPlaying={data?.isPlaying || false}
          />
        </div>
      </div>

      {/* Track Info */}
      <div className="w-full space-y-1 overflow-hidden tracking-wide">
        <p className="text-sm text-slate-400">
          {data?.isPlaying ? "Now playing" : "Last played"}
        </p>
        <div className="items-center gap-x-4 space-y-1 md:max-lg:flex">
          <p className="max-w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap font-medium">
            {data?.title}
          </p>
          <p className="overflow-hidden text-ellipsis whitespace-nowrap text-sm uppercase text-slate-400">
            {data?.artist}
          </p>
        </div>
      </div>
    </a>
  );
};

export default SpotifyWidgetServer;
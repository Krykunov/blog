import SpotifyWidget from "@/components/SpotifyWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-8 text-gray-900">
          Spotify Widget Demo
        </h1>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <SpotifyWidget />
        </div>
        <p className="text-center text-gray-600 mt-4 text-sm">
          This widget shows your currently playing or recently played Spotify track.
        </p>
      </div>
    </main>
  );
}
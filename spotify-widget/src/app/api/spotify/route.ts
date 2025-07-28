import { NextRequest, NextResponse } from "next/server";
import getSpotifyData from "./spotify";

export async function GET(req: NextRequest) {
  try {
    const data = await getSpotifyData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Spotify data" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const files = {
  communities: "community-areas.geojson",
  neighborhoods: "neighborhoods.geojson",
} as const;

export async function GET(request: NextRequest) {
  const layer = request.nextUrl.searchParams.get("layer");

  if (layer !== "communities" && layer !== "neighborhoods") {
    return NextResponse.json(
      { error: "Invalid geographic layer" },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "geography",
      files[layer]
    );

    const contents = await readFile(filePath, "utf8");

    return new NextResponse(contents, {
      headers: {
        "Content-Type": "application/geo+json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Geography API error:", error);

    return NextResponse.json(
      { error: "Could not load geographic boundaries" },
      { status: 500 }
    );
  }
}

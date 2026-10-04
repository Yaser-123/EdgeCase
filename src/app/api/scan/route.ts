import { NextRequest, NextResponse } from "next/server";
import { runFullScan } from "@/server/scanner";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body || typeof body.url !== "string" || !body.url.trim()) {
      return NextResponse.json(
        { status: "error", error: "Missing or invalid URL parameter" },
        { status: 400 }
      );
    }

    // Run the scan
    const result = await runFullScan(body.url.trim());

    if (result.status === "error") {
      // Return a 422 Unprocessable Entity or 400 Bad Request depending on error, 
      // but 400 is fine for most validation/scanning errors.
      // If it's a "Scan already in progress", maybe 429 Too Many Requests.
      const statusCode = result.error?.includes("already in progress") ? 429 : 400;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { status: "error", error: "Internal server error" },
      { status: 500 }
    );
  }
}

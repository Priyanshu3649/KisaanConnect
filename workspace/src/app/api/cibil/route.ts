// app/api/cibil/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { full_name, dob, pan, address, pincode, mobile } = await req.json();

  if (!full_name || !dob || !pan || !mobile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const payload = {
    merchantId: process.env.CYRUS_MERCHANT_ID,
    merchantKey: process.env.CYRUS_MERCHANT_KEY,
    full_name,
    dob,
    pan,
    address: address || "Not Available",
    pincode: pincode || "000000",
    mobile,
    type: "CIBIL_REPORT_SCORE",
    txnid: `KC-${Date.now().toString()}`, // unique ID
  };

  try {
    const res = await fetch("https://cyrusrecharge.in/api/total-kyc.aspx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
        // Log the error response from Cyrus API for debugging
        const errorBody = await res.text();
        console.error(`Cyrus API Error (${res.status}):`, errorBody);
        return NextResponse.json({ error: "Failed to fetch from CIBIL API", details: errorBody }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Internal server error calling Cyrus API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

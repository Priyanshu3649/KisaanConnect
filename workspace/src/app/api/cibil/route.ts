
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // 1️⃣ Get data from the request body
  const body = await req.json();

  // 2️⃣ Add your merchant credentials (DON’T send from frontend)
  const payload = {
    merchantId: process.env.CYRUS_MERCHANT_ID,  // from env
    merchantKey: process.env.CYRUS_MERCHANT_KEY, // from env
    ...body,
    type: "CIBIL_REPORT_SCORE",
    txnid: `KC-${Date.now().toString()}`, // unique transaction id
  };

  try {
    // 3️⃣ Call Cyrus API
    const res = await fetch("https://cyrusrecharge.in/api/total-kyc.aspx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 4️⃣ Handle response
    let data;
    if (!res.ok) {
        const errorText = await res.text();
        console.error("Cyrus API Error:", errorText);
        return NextResponse.json({ error: "Failed to fetch from CIBIL API", details: errorText }, { status: res.status });
    }

    try {
      data = await res.json();
    } catch (e) {
      // Handle cases where response is not valid JSON
      data = { raw: await res.text() };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Internal server error calling Cyrus API proxy:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

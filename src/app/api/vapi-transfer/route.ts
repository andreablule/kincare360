import { NextRequest, NextResponse } from "next/server";

// VAPI server-destination handler for dynamic call transfers
// When Lily's transferCall tool fires, VAPI POSTs here with the tool call args
// We extract providerPhone and return the actual number to dial

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // VAPI sends transfer destination request with tool call info
    // Extract providerPhone from the tool call arguments
    let providerPhone = "";

    // Format 1: VAPI transferCall destination server request
    const toolCall = body.message?.toolCallList?.[0];
    if (toolCall?.function?.arguments) {
      const args =
        typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      providerPhone = args.providerPhone || "";
    }

    // Format 2: Direct in body (transfer destination payload)
    if (!providerPhone) {
      providerPhone =
        body.message?.toolCalls?.[0]?.function?.arguments?.providerPhone ||
        body.toolCall?.function?.arguments?.providerPhone ||
        body.providerPhone ||
        "";
    }

    // Clean to digits only and format as +1XXXXXXXXXX
    const digits = providerPhone.replace(/\D/g, "").slice(-10);

    if (digits.length !== 10) {
      console.error("[vapi-transfer] Invalid phone:", providerPhone);
      return NextResponse.json(
        { error: "Invalid provider phone number" },
        { status: 400 }
      );
    }

    const formattedNumber = `+1${digits}`;
    console.log(`[vapi-transfer] Transferring to: ${formattedNumber}`);

    return NextResponse.json({
      destination: {
        type: "number",
        number: formattedNumber,
        message: "I'm connecting you now. Please hold.",
      },
    });
  } catch (err) {
    console.error("[vapi-transfer] Error:", err);
    return NextResponse.json(
      { error: "Transfer failed" },
      { status: 500 }
    );
  }
}

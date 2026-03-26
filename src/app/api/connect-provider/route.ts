import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const toolCall = body.message?.toolCallList?.[0];
    const toolCallId = toolCall?.id || '';

    let args: any = {};
    if (toolCall?.function?.arguments) {
      args = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else if (body.message?.functionCall?.parameters) {
      args = body.message.functionCall.parameters;
    } else {
      args = body;
    }

    const providerPhone: string = args.providerPhone || args.phone || '';
    const providerName: string = args.providerName || args.name || 'the provider';

    if (!providerPhone) {
      return NextResponse.json({
        results: [{ toolCallId, result: `I don't have a phone number for ${providerName}. Would you like me to find a different option?` }]
      });
    }

    // Normalize to E.164
    const digits = providerPhone.replace(/\D/g, '');
    const e164 = digits.length === 10 ? `+1${digits}` : digits.length === 11 ? `+${digits}` : `+1${digits}`;

    // VAPI dynamic transfer — this is the correct way to transfer to a dynamic number
    // Return a transfer action in the tool result
    return NextResponse.json({
      results: [{
        toolCallId,
        result: `Connecting you to ${providerName} now. Please hold while I transfer your call.`
      }],
      // VAPI reads this to execute the transfer
      action: {
        type: "transfer",
        destination: {
          type: "number",
          number: e164,
          callerId: "+18125155252",
          message: `Transferring to ${providerName}.`
        }
      }
    });

  } catch (err) {
    console.error('Connect provider error:', err);
    return NextResponse.json({
      results: [{ toolCallId: '', result: 'I had a brief issue. Could you try again?' }]
    });
  }
}

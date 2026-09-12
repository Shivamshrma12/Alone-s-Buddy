import { NextResponse } from "next/server";
import { callGrokAgent, GrokDecisionRequest } from "@/lib/agent/grok";

export async function POST(req: Request) {
  try {
    const body: GrokDecisionRequest = await req.json();

    if (!body.userGoal || !body.currentLocation || !body.destination || !body.currentRoute) {
      return NextResponse.json(
        { error: "Missing required journey observations" },
        { status: 400 }
      );
    }

    const decision = await callGrokAgent(body);
    return NextResponse.json(decision);
  } catch (error) {
    console.error("[API Agent] Error processing decision:", error);
    return NextResponse.json(
      { error: "Internal agent processing error" },
      { status: 500 }
    );
  }
}

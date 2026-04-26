import { NextResponse } from "next/server";
import { Resend } from "resend";
import { calculateScore, type Form990Input } from "@/lib/scoring";
import { EmailTemplate } from "@/lib/email-template";

export async function POST(req: Request) {
  let body: {
    email?: unknown;
    firstName?: unknown;
    orgName?: unknown;
    encodedData?: unknown;
    optIn?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const encodedData =
    typeof body.encodedData === "string" ? body.encodedData : "";
  const firstName = typeof body.firstName === "string" ? body.firstName : undefined;
  const orgName = typeof body.orgName === "string" ? body.orgName : undefined;
  const optIn = body.optIn === true;

  if (!email) {
    return NextResponse.json(
      { success: false, error: "Email required" },
      { status: 400 },
    );
  }
  if (!encodedData) {
    return NextResponse.json(
      { success: false, error: "Score data missing" },
      { status: 400 },
    );
  }

  let input: Form990Input;
  try {
    const json = Buffer.from(encodedData, "base64").toString("utf-8");
    input = JSON.parse(json);
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid score data" },
      { status: 400 },
    );
  }

  const scoreResult = calculateScore(input);
  if (!scoreResult) {
    return NextResponse.json(
      { success: false, error: "Could not calculate score" },
      { status: 400 },
    );
  }

  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) {
    return NextResponse.json(
      { success: false, error: "Email service is not configured" },
      { status: 500 },
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://connectnpo.com";

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: `Your 990 Health Score — ${orgName || "Your Nonprofit"}`,
      react: EmailTemplate({
        firstName,
        orgName,
        scoreResult,
        encodedData,
        baseUrl,
      }),
    });
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message ?? "Send failed" },
        { status: 500 },
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Send failed",
      },
      { status: 500 },
    );
  }

  void optIn; // captured for future newsletter integration

  return NextResponse.json({ success: true });
}

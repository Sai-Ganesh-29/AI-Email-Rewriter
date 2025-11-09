import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/openai";

const bodySchema = z.object({
  email: z.string().min(1, "Email text is required").max(16000),
  tone: z.enum(["formal", "friendly", "concise", "apologetic", "persuasive"]).default("formal"),
  keepLength: z.boolean().optional().default(false)
});

const SYSTEM_PROMPT = `You are a helpful email rewriting assistant.
Rewrite the user's email with the requested tone while preserving meaning.
- Keep names, dates, numbers, and links intact.
- Fix grammar and clarity.
- Be respectful and natural.
Return ONLY the rewritten email text with no preface or commentary.`;

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { email, tone, keepLength } = bodySchema.parse(json);
    const modelFromHeader = (req.headers.get("x-model") || "").trim();

    const input = email.trim().slice(0, 16000);
    const userPrompt = [
      `Tone: ${tone}`,
      keepLength ? "Keep approximately the same length." : "You may shorten slightly for clarity.",
      "",
      "Original email:",
      input
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: (modelFromHeader || "openai/gpt-4o-mini") as any,
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ]
    });

    const text = completion.choices?.[0]?.message?.content?.trim()
      || "Sorry, I couldn’t generate a rewrite. Please try again.";

    return new Response(JSON.stringify({ ok: true, rewritten: text }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    const message =
      err?.name === "ZodError"
        ? err.issues?.map((i: any) => i.message).join(", ")
        : err?.message || "Unknown error";
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
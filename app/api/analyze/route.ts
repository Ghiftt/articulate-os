import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text, context } = await req.json();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an English writing analyst. Analyze the given text and return ONLY a JSON object with no markdown, no backticks, no explanation — just raw JSON.

Return this exact structure:
{
  "clarity_score": number (0-100),
  "structure_score": number (0-100),
  "word_choice_score": number (0-100),
  "tone_score": number (0-100),
  "overall_score": number (0-100),
  "weak_areas": ["area1", "area2"],
  "strong_areas": ["area1"],
  "filler_words": ["word1", "word2"],
  "suggested_replacements": {"weak_word": "stronger_word"}
}`
        },
        {
          role: "user",
          content: `Context: ${context || "general"}\n\nText to analyze:\n${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const analysis = JSON.parse(clean);

    return NextResponse.json({ analysis });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
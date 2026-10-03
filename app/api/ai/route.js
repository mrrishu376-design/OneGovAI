import { GoogleGenAI } from "@google/genai";

export async function POST(request) {
  try {
    const { mode, query, services, complaints, serviceName } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json({ ok: false, error: "GEMINI_API_KEY is not configured." }, { status: 200 });
    }

    const ai = new GoogleGenAI({ apiKey });

    if (mode === "route") {
      const catalogue = Object.entries(services || {})
        .map(([key, value]) => `- ${key}: ${value.name} (${value.dept}, ${value.kind})`)
        .join("\n");

      const prompt = [
        "You are the routing assistant for OneGovAI, a prototype government service interoperability platform.",
        "The citizen may write in English, Hindi, or Hinglish.",
        `Citizen request: "${query}"`,
        "",
        "Choose exactly one service from this catalogue:",
        catalogue,
        "",
        'Return JSON only: {"serviceKey":"<key>","summary":"<one short English sentence>"}'
      ].join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const raw = response.text || "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return Response.json({ ok: false, error: "AI returned an invalid response." });

      const data = JSON.parse(match[0]);
      if (!services?.[data.serviceKey]) {
        return Response.json({ ok: false, error: "AI returned an unknown service." });
      }

      return Response.json({
        ok: true,
        serviceKey: data.serviceKey,
        summary: data.summary || ""
      });
    }

    if (mode === "summarize") {
      const prompt = [
        `These ${complaints?.length || 0} citizen complaints are about "${serviceName}".`,
        "Write two short sentences in simple English.",
        "State the common problem and one action an officer should take.",
        ...(complaints || []).map((item) => `- ${item}`)
      ].join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      return Response.json({ ok: true, summary: (response.text || "").trim() });
    }

    return Response.json({ ok: false, error: "Unknown AI operation." }, { status: 400 });
  } catch (error) {
    return Response.json({
      ok: false,
      error: String(error?.message || error).slice(0, 220)
    }, { status: 200 });
  }
}

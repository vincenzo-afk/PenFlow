/**
 * PenFlow — AI Study-Note Builder
 *
 * Structures raw text into blocks (headings, paragraphs, bullets, revision boxes,
 * formulas) suitable for handwritten rendering. Provider-agnostic: plug in any
 * OpenAI-compatible API endpoint (or use the offline heuristic fallback).
 */

/**
 * Heuristic (offline, no API key) structuring fallback.
 * Works by detecting common patterns: ALL-CAPS lines → headings,
 * leading dashes/numbers → lists, lines in [brackets] → revision boxes.
 */
export function structureNotesHeuristic(text) {
  const blocks = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    if (/^\[.*\]$/.test(line)) {
      blocks.push({ type: "revisionBox", text: line.slice(1, -1) });
    } else if (/^[•\-\*]\s+/.test(line)) {
      blocks.push({ type: "bullet", text: line.replace(/^[•\-\*]\s+/, "") });
    } else if (/^\d+[\.:\)]\s+/.test(line)) {
      blocks.push({ type: "numbered", text: line.replace(/^\d+[\.:\)]\s+/, "") });
    } else if (line === line.toUpperCase() && line.length > 2 && line.length < 80 && !/\d/.test(line)) {
      blocks.push({ type: "heading", text: line });
    } else if (/[\d+\-×÷=²³√πθ∑∫]/.test(line) && line.length < 100) {
      blocks.push({ type: "formula", text: line });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }
  return blocks;
}

/**
 * LLM-based structuring. Send raw text to any OpenAI-compatible endpoint and
 * request a JSON block list. Throws if the provider is unreachable; the caller
 * can fall back to `structureNotesHeuristic`.
 *
 * @param {string} text            Raw user text
 * @param {object} api             {baseUrl, apiKey, model?}
 * @param {string} mode            "notes" | "flashcards" | "summary" | "cheatsheet"
 * @returns {Promise<object[]>}    Structured blocks
 */
export async function structureNotesAI(text, api, mode = "notes") {
  const baseUrl = (api.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = api.model || "gpt-4o-mini";

  const prompts = {
    notes: "Convert this raw text into structured study notes. Output ONLY a JSON array of blocks, each with 'type' (heading|paragraph|bullet|numbered|revisionBox|formula|highlight) and 'text'. Group related ideas, create clear headings, mark key terms as highlight, and put definitions/formulas in revisionBox.",
    flashcards: "Convert this material into study flashcards. Output ONLY a JSON array of blocks with 'type' (flashcard) and 'text' formatted as 'Q: ... || A: ...'.",
    summary: "Summarize this text into concise revision notes. Output ONLY a JSON array of blocks (heading|bullet|revisionBox|highlight).",
    cheatsheet: "Condense this material into a one-page cheat sheet. Output ONLY a JSON array of blocks (heading|bullet|formula|revisionBox).",
  };

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: prompts[mode] || prompts.notes },
        { role: "user", content: text.slice(0, 20000) },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) throw new Error(`AI provider error: ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "[]";
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
}

/**
 * AI proofreading pass: returns corrected text.
 */
export async function proofread(text, api) {
  const baseUrl = (api.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = api.model || "gpt-4o-mini";
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${api.apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Fix grammar and spelling in the user's text. Preserve meaning and formatting. Output ONLY the corrected text." },
        { role: "user", content: text.slice(0, 20000) },
      ],
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`AI provider error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || text;
}

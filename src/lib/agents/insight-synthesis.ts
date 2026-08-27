import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";
import { callGemini } from "../services/gemini";
import { groqJson } from "../services/groq";
import type { InsightDTO, InsightOpportunity, AggregatedTable } from "../types";

/**
 * Node 8 — Insight Synthesis Agent.
 * Per user spec: ONE Gemini call (stronger model, highest-value, lowest-frequency).
 * Takes ONLY the clean aggregated table (not raw reviews) and produces
 * the final verdict / opportunity summary.
 *
 * Falls back to Groq if Gemini is unavailable.
 */
export async function insightSynthesisNode(state: GraphState): Promise<Partial<GraphState>> {
  return trackNode(state, "insightSynthesis", async (s) => {
    if (!s.aggregatedTable) return { result: {}, cost: 0 };

    const table = s.aggregatedTable;
    const systemPrompt = `You are a competitive intelligence analyst. Given a structured comparison table of product aspects, write:
1. verdictText: a 2-3 paragraph verdict that explains which product is best positioned and why. Be specific, cite aspect frequencies and sentiment. Avoid filler.
2. opportunities: 2-4 actionable opportunities for the "your_product" (first product) — concrete things they could improve or lean into based on competitor weaknesses. Each opportunity needs a title (≤80 chars), rationale (≤200 chars), and impact (high|medium|low).
3. confidence: your overall confidence in the verdict (0.0-1.0), reflecting data quality and agreement across sources.

Return ONLY valid JSON: {"verdictText": string, "opportunities": [{"title": string, "rationale": string, "impact": "high"|"medium"|"low"}], "confidence": number}`;

    const userPrompt = `Aggregated comparison table:

${serializeTable(table)}

Cross-source disagreement flags:
${table.crossSourceFlags.length > 0 ? table.crossSourceFlags.map((f) => `- ${f.aspect}: ${f.marketplaceSentiment} (marketplace) vs ${f.organicSentiment} (organic) — ${f.disagreementNote}`).join("\n") : "(none)"}

Write the verdict and opportunities. Return JSON only.`;

    let result: { data: InsightDTO | null; cost: number };

    // Primary: Gemini
    if (process.env.GEMINI_API_KEY) {
      const gem = await callGemini<InsightDTO>(systemPrompt, userPrompt, {
        temperature: 0.4,
        maxTokens: 2000,
        timeoutMs: 60_000,
      });
      result = { data: gem.data, cost: gem.cost };
    } else if (process.env.GROQ_API_KEY) {
      // Fallback: Groq
      const groq = await groqJson<InsightDTO>(systemPrompt, userPrompt, {
        temperature: 0.4,
        maxTokens: 2000,
        timeoutMs: 30_000,
      });
      result = { data: groq.data, cost: groq.cost };
    } else {
      // Last-resort mock
      result = { data: mockInsight(table), cost: 0 };
    }

    if (!result.data) {
      result = { data: mockInsight(table), cost: result.cost };
    }

    // Sanity-fill missing fields
    const insight: InsightDTO = {
      verdictText: result.data.verdictText ?? "",
      confidence: result.data.confidence ?? 0.6,
      opportunities: (result.data.opportunities ?? []).slice(0, 4),
      verifiedClaims: [],
    };

    return {
      result: { insight },
      cost: result.cost,
      metadata: {
        opportunities: insight.opportunities.length,
        confidence: insight.confidence,
        fallbackUsed: !process.env.GEMINI_API_KEY ? "groq-or-mock" : "gemini",
      },
    };
  });
}

function serializeTable(table: AggregatedTable): string {
  const lines: string[] = [];
  for (const p of table.products) {
    lines.push(`### ${p.productName} [${p.role}]`);
    lines.push(`  rating: ${p.rating ?? "n/a"}, price: ${p.price ?? "n/a"} ${p.currency ?? ""}, reviews: ${p.reviewCount}, dataQuality: ${p.dataQuality}`);
    for (const a of p.aspects) {
      lines.push(`  - ${a.aspect}: ${a.sentiment} (freq=${a.frequency}, conf=${a.confidence.toFixed(2)}, src={mkt:${a.sourceBreakdown.marketplace}, reddit:${a.sourceBreakdown.reddit}, blog:${a.sourceBreakdown.blog}})`);
      if (a.exampleQuotes[0]) lines.push(`      ex: "${a.exampleQuotes[0].slice(0, 100)}"`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function mockInsight(table: AggregatedTable): InsightDTO {
  const your = table.products[0];
  const comps = table.products.slice(1);
  const topComplaints = comps.flatMap((p) => p.topComplaints).slice(0, 3);

  const verdict = `Based on aggregated review data, ${your?.productName ?? "your product"} is positioned against ${comps.length} competitor(s). ` +
    `Its strongest aspects appear to be ${(your?.topPraises[0]?.aspect ?? "value")} while competitors struggle most with ${(topComplaints[0]?.aspect ?? "build quality")}. ` +
    `Cross-source verification shows ${table.crossSourceFlags.length} potential disagreement flags worth investigating before final strategy.`;

  return {
    verdictText: verdict,
    confidence: 0.55,
    opportunities: topComplaints.slice(0, 3).map((c) => ({
      title: `Capitalize on competitor weakness: ${c.aspect}`,
      rationale: `Top competitor complaint is "${c.aspect}" with ${c.frequency} mentions. Highlight your product's strength here in marketing copy.`,
      impact: c.frequency > 30 ? "high" as const : "medium" as const,
    })),
    verifiedClaims: [],
  };
}

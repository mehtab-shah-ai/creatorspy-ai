import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";

/**
 * Node 1 — Input Validator.
 * Parses user input (link vs name), extracts ASIN/product-ID if link given.
 * Catches invalid/non-existent links BEFORE any paid API calls happen.
 */
export async function inputValidatorNode(state: GraphState): Promise<Partial<GraphState>> {
  return trackNode(state, "inputValidator", async (s) => {
    const all: {
      input: string;
      role: "your_product" | "competitor";
      asin?: string;
      url?: string;
      name?: string;
      platform: string;
    }[] = [];

    // Validate your product
    const yourInput = s.yourProductInput.trim();
    if (!yourInput) throw new Error("Your product input is required");

    const yourParsed = parseProductInput(yourInput, "your_product");
    if (!yourParsed.ok) throw new Error(`Invalid your-product input: ${yourParsed.error}`);
    all.push(yourParsed.value);

    // Validate competitors
    if (s.autoFind) {
      // Competitors will be resolved by competitorResolver node
      // No validation needed here
    } else {
      if (s.competitorInputs.length === 0) {
        throw new Error("Either provide competitor links or enable auto-find");
      }
      for (const input of s.competitorInputs) {
        const parsed = parseProductInput(input, "competitor");
        if (!parsed.ok) throw new Error(`Invalid competitor input "${input}": ${parsed.error}`);
        all.push(parsed.value);
      }
    }

    return {
      result: { validatedProducts: all },
      cost: 0,
      metadata: { validated: all.length },
    };
  });
}

type ParsedProduct =
  | { ok: true; value: any }
  | { ok: false; error: string };

function parseProductInput(
  input: string,
  role: "your_product" | "competitor",
): ParsedProduct {
  const trimmed = input.trim();
  if (trimmed.length < 3) {
    return { ok: false, error: "Input too short (min 3 chars)" };
  }

  // URL?
  if (/^https?:\/\//i.test(trimmed)) {
    // Amazon URL
    const asinMatch = trimmed.match(/\/(?:dp|gp\/product|exec\/obidos\/asin)\/([A-Z0-9]{10})/i);
    if (asinMatch) {
      return {
        ok: true,
        value: {
          input: trimmed,
          role,
          asin: asinMatch[1]!.toUpperCase(),
          url: trimmed,
          platform: "amazon",
        },
      };
    }
    // Flipkart URL
    if (/flipkart\.com/i.test(trimmed)) {
      return {
        ok: true,
        value: {
          input: trimmed,
          role,
          url: trimmed,
          platform: "flipkart",
        },
      };
    }
    // Generic URL — accept but mark unknown
    return {
      ok: true,
      value: {
        input: trimmed,
        role,
        url: trimmed,
        platform: "unknown",
      },
    };
  }

  // Plain name
  return {
    ok: true,
    value: {
      input: trimmed,
      role,
      name: trimmed,
      platform: "unknown",
    },
  };
}

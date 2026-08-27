import type { GraphState } from "../graph/state";
import { trackNode } from "./tracker";

/**
 * Node 1 — Input Validator.
 *
 * FIX 1: Validates the structured form fields:
 *   - productLink (optional): if given, extract ASIN/product-ID, skip search
 *   - productName (required if no link)
 *   - category (required)
 *   - priceMin/priceMax (required)
 *   - platform (required, default both)
 *
 * For competitor inputs (user-provided links), validates each is a valid URL.
 * Catches invalid/non-existent links BEFORE any paid API calls happen.
 */
export async function inputValidatorNode(state: GraphState): Promise<Partial<GraphState>> {
  return trackNode(state, "inputValidator", async (s) => {
    // Validate structured form fields
    if (!s.category) throw new Error("Category is required");
    if (s.priceMin == null || s.priceMax == null) throw new Error("Price range is required");
    if (s.priceMax <= s.priceMin) throw new Error("Max price must be greater than min price");
    if (!s.platformPref) throw new Error("Platform preference is required");

    // Determine your_product: prefer link, fall back to name
    const yourInput = s.productLink ?? s.productName;
    if (!yourInput) throw new Error("Either product link or product name is required");

    const yourParsed = parseProductInput(yourInput, "your_product");
    if (!yourParsed.ok) throw new Error(`Invalid your-product input: ${yourParsed.error}`);

    const all: {
      input: string;
      role: "your_product" | "competitor";
      asin?: string;
      url?: string;
      name?: string;
      platform: string;
    }[] = [yourParsed.value];

    // Validate competitor inputs (only if not auto-find)
    if (!s.autoFind) {
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
      metadata: {
        validated: all.length,
        hasLink: !!s.productLink,
        category: s.category,
        priceRange: [s.priceMin, s.priceMax],
        platform: s.platformPref,
      },
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
    // Amazon URL (any TLD — amazon.in, amazon.com, etc.)
    const asinMatch = trimmed.match(/\/(?:dp|gp\/product|exec\/obidos\/asin)\/([A-Z0-9]{10})/i);
    if (asinMatch && /amazon\./i.test(trimmed)) {
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

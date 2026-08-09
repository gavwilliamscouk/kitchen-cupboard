import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

function toTitleCase(str: string): string {
  if (!str) return str;
  const minorWords = new Set(["and", "but", "for", "or", "nor", "the", "a", "an", "to", "in", "with", "of", "on", "at", "by", "from", "as", "is"]);
  return str.toLowerCase().split(/\s+/).map((word, index) => {
    if (index === 0 || !minorWords.has(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recipe: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let title = "";
    let ingredients: string[] = [];
    let method: string = "";
    let serves = "";

    // 1. Try to find JSON-LD Recipe schema (Most reliable)
    const jsonLdScripts = $('script[type="application/ld+json"]');
    
    jsonLdScripts.each((_, script) => {
      try {
        const data = JSON.parse($(script).html() || "{}");
        const recipeData = Array.isArray(data) 
          ? data.find(item => item["@type"] === "Recipe") 
          : (data["@type"] === "Recipe" ? data : (data["@graph"]?.find((item: any) => item["@type"] === "Recipe")));

        if (recipeData) {
          title = recipeData.name || "";
          
          // Extract yield/serves
          if (recipeData.recipeYield) {
            const yieldVal = Array.isArray(recipeData.recipeYield) 
              ? recipeData.recipeYield[0] 
              : recipeData.recipeYield;
            serves = String(yieldVal).trim();
          }
          
          if (Array.isArray(recipeData.recipeIngredient)) {
            ingredients = recipeData.recipeIngredient;
          }
          
          if (recipeData.recipeInstructions) {
            const instructions = recipeData.recipeInstructions;
            if (Array.isArray(instructions)) {
              method = instructions.map((step: any) => step.text || step).join("\n\n");
            } else if (typeof instructions === 'string') {
              method = instructions;
            }
          }
        }
      } catch (e) {
        // Skip invalid JSON
      }
    });

    // 2. Fallback to common DOM selectors if JSON-LD fails
    if (!title) {
      title = $('h1').first().text().trim() || $('title').text().replace(/recipe/i, '').trim();
    }

    if (ingredients.length === 0) {
      $('[class*="ingredient"] li, [id*="ingredient"] li').each((_, el) => {
        ingredients.push($(el).text().trim());
      });
    }

    if (!method) {
      const methodSteps: string[] = [];
      $('[class*="instruction"] li, [class*="method"] li, [id*="instruction"] li').each((_, el) => {
        methodSteps.push($(el).text().trim());
      });
      method = methodSteps.join("\n\n");
    }

    // Basic cleaning
    ingredients = ingredients.map(i => i.replace(/\s+/g, ' ').trim()).filter(Boolean);
    
    return NextResponse.json({
      title: title ? toTitleCase(title) : "Imported Recipe",
      serves,
      ingredients,
      method: method || "Could not parse method instructions from this page.",
      sourceUrl: url,
    });
  } catch (error) {
    console.error("Error scraping recipe:", error);
    return NextResponse.json({ error: "Failed to parse recipe from URL" }, { status: 500 });
  }
}

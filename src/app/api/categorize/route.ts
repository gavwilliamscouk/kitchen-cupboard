import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { itemName, validCategories } = await req.json();

    if (!itemName) {
      return NextResponse.json({ error: "Item name is required" }, { status: 400 });
    }

    const apiKey = process.env.AI_API_KEY;
    
    if (!apiKey) {
      // Fallback if no API key is provided
      return NextResponse.json({ category: "Uncategorised" });
    }

    const categoriesListStr = Array.isArray(validCategories) && validCategories.length > 0 
      ? validCategories.join(", ") 
      : "Fruit & Veg, Herbs & Spices, Bakery, Nuts, Dairy, Fish & Seafood, Meat, Pasta & Rice, Tinned Food, Sauces & Condiments, Snacks, Cereal & Breakfast, Baking, Hot Drinks, Oils, Alcohol, Health & Beauty, Household, Pets, Frozen, Drinks, Deli, Baby, Non-food, Clothes, DIY, Car Care";

    const prompt = `You are a grocery categorization assistant. Based on the item name "${itemName}", reply with exactly one most logical supermarket category from the following list: 
${categoriesListStr}.
Only output the exact category name from this list and nothing else.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      console.error("Gemini API Error", await response.text());
      return NextResponse.json({ category: "Uncategorised" });
    }

    const data = await response.json();
    const category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Uncategorised";

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error in categorize API:", error);
    return NextResponse.json({ category: "Uncategorised" });
  }
}

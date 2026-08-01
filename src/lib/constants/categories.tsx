import React from "react";
import { useCategories } from "@/lib/contexts/CategoriesContext";

export const DEPARTMENTS = [
  "Fruit & Veg",
  "Herbs & Spices",
  "Bakery",
  "Nuts",
  "Dairy",
  "Fish & Seafood",
  "Meat",
  "Pasta & Rice",
  "Tinned Food",
  "Sauces & Condiments",
  "Snacks",
  "Cereal & Breakfast",
  "Baking",
  "Hot Drinks",
  "Oils",
  "Alcohol",
  "Health & Beauty",
  "Household",
  "Pets",
  "Frozen",
  "Drinks",
  "Deli",
  "Baby",
  "Non-food",
  "Clothes",
  "DIY",
  "Car Care",
] as const;

export type CategoryName = typeof DEPARTMENTS[number] | string;

export const CATEGORY_EMOJIS: Record<string, string> = {
  "Fruit & Veg": "🍎",
  "Herbs & Spices": "🌿",
  "Bakery": "🍞",
  "Nuts": "🥜",
  "Dairy": "🥛",
  "Fish & Seafood": "🐟",
  "Meat": "🥩",
  "Pasta & Rice": "🍝",
  "Tinned Food": "🥫",
  "Sauces & Condiments": "🌶️",
  "Snacks": "🍫",
  "Cereal & Breakfast": "🥣",
  "Baking": "🎂",
  "Hot Drinks": "☕",
  "Oils": "🫒",
  "Alcohol": "🍷",
  "Health & Beauty": "🧴",
  "Household": "🧹",
  "Pets": "🐶",
  "Frozen": "❄️",
  "Drinks": "🧃",
  "Deli": "🥪",
  "Baby": "👶",
  "Non-food": "📦",
  "Clothes": "👕",
  "DIY": "🛠️",
  "Car Care": "🚗",
};



export function CategoryIcon({
  category,
  size = 20,
  className = "",
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  const { getCategoryEmoji } = useCategories();
  const emoji = getCategoryEmoji(category);
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none leading-none ${className}`}
      style={{ fontSize: `${size}px` }}
      role="img"
      aria-label={category}
    >
      {emoji}
    </span>
  );
}

// Export CategoryBadge alias for compatibility
export const CategoryBadge = CategoryIcon;

export const DUMMY_PRODUCTS_BY_CATEGORY: Record<
  string,
  { name: string; subInfo?: string; volumeQuantity: string; preferredSupermarket: string }
> = {
  "Fruit & Veg": { name: "Bananas", subInfo: "Organic", volumeQuantity: "1 bunch", preferredSupermarket: "Tesco" },
  "Herbs & Spices": { name: "Salt", subInfo: "Sea Salt Flakes", volumeQuantity: "250g", preferredSupermarket: "Tesco" },
  "Bakery": { name: "Eggs", subInfo: "Free Range", volumeQuantity: "12 pack", preferredSupermarket: "Lidl" },
  "Nuts": { name: "Almonds", subInfo: "Roasted", volumeQuantity: "200g", preferredSupermarket: "Lidl" },
  "Dairy": { name: "Yogurt", subInfo: "Greek", volumeQuantity: "500g", preferredSupermarket: "Lidl" },
  "Fish & Seafood": { name: "Salmon Fillets", subInfo: "Fresh", volumeQuantity: "2 pack", preferredSupermarket: "Sainsburys" },
  "Meat": { name: "Chicken Breasts", subInfo: "Free Range", volumeQuantity: "500g", preferredSupermarket: "Tesco" },
  "Pasta & Rice": { name: "Rice", subInfo: "Basmati", volumeQuantity: "1kg", preferredSupermarket: "Asda" },
  "Tinned Food": { name: "Tomatoes", subInfo: "Chopped", volumeQuantity: "400g", preferredSupermarket: "Tesco" },
  "Sauces & Condiments": { name: "Mayonnaise", subInfo: "Olive Oil", volumeQuantity: "435ml", preferredSupermarket: "Sainsburys" },
  "Snacks": { name: "Chocolate", subInfo: "Dark 70%", volumeQuantity: "100g", preferredSupermarket: "Lidl" },
  "Cereal & Breakfast": { name: "Oats", subInfo: "Rolled", volumeQuantity: "1kg", preferredSupermarket: "Aldi" },
  "Baking": { name: "Flour", subInfo: "Plain", volumeQuantity: "1.5kg", preferredSupermarket: "Tesco" },
  "Hot Drinks": { name: "Tea", subInfo: "English Breakfast", volumeQuantity: "80 bags", preferredSupermarket: "Sainsburys" },
  "Oils": { name: "Olive Oil", subInfo: "Extra Virgin", volumeQuantity: "500ml", preferredSupermarket: "Tesco" },
  "Alcohol": { name: "Beer", subInfo: "Craft IPA", volumeQuantity: "4 pack", preferredSupermarket: "Sainsburys" },
  "Health & Beauty": { name: "Toothpaste", subInfo: "Total Care", volumeQuantity: "75ml", preferredSupermarket: "Boots" },
  "Household": { name: "Kitchen Roll", subInfo: "Super Soft", volumeQuantity: "2 rolls", preferredSupermarket: "Tesco" },
  "Pets": { name: "Cat Food", subInfo: "Pouches in Jelly", volumeQuantity: "12 pack", preferredSupermarket: "Sainsburys" },
  "Frozen": { name: "Garden Peas", subInfo: "Frozen", volumeQuantity: "1kg", preferredSupermarket: "Asda" },
  "Drinks": { name: "Sparkling Water", subInfo: "Natural", volumeQuantity: "1.5L", preferredSupermarket: "Lidl" },
  "Deli": { name: "Hummus", subInfo: "Fresh Original", volumeQuantity: "200g", preferredSupermarket: "Sainsburys" },
  "Baby": { name: "Baby Wipes", subInfo: "Sensitive", volumeQuantity: "64 pack", preferredSupermarket: "Boots" },
  "Non-food": { name: "Foil", subInfo: "Kitchen Extra Strong", volumeQuantity: "10m", preferredSupermarket: "Tesco" },
  "Clothes": { name: "Socks", subInfo: "Cotton Ankle", volumeQuantity: "3 pack", preferredSupermarket: "Next" },
  "DIY": { name: "Tape", subInfo: "Masking Multi-Surface", volumeQuantity: "1 roll", preferredSupermarket: "B&Q" },
  "Car Care": { name: "Screenwash", subInfo: "All Season Concentrated", volumeQuantity: "5L", preferredSupermarket: "Halfords" },
};

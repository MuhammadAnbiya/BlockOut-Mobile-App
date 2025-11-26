// lib/shopCatalog.js

export const SHOP_CATALOG = {
  // --- TOP (Glasses, Hats, Hair) ---
  "glasses_pixel": { id: "glasses_pixel", name: "Pixel Glasses", type: "TOP", price: 1000 },
  "hair_spiky": { id: "hair_spiky", name: "Spiky Hair", type: "TOP", price: 1000 },
  "hat_cap": { id: "hat_cap", name: "Cap Hat", type: "TOP", price: 1000 },
  "hat_crown": { id: "hat_crown", name: "Gold Crown", type: "TOP", price: 5000 },
  "hat_helmet": { id: "hat_helmet", name: "Yellow Helmet", type: "TOP", price: 1000 },
  "acc_headphones": { id: "acc_headphones", name: "Headphones", type: "TOP", price: 1000 },

  // --- SHIRT (Baju) ---
  "shirt_black": { id: "shirt_black", name: "Black Hoodie", type: "SHIRT", price: 800 },
  "shirt_blue": { id: "shirt_blue", name: "Blue T-Shirt", type: "SHIRT", price: 500 },

  // --- PANTS (Celana) ---
  "pants_blue": { id: "pants_blue", name: "Blue Jeans", type: "PANTS", price: 600 },
  "pants_black": { id: "pants_black", name: "Black Jogger", type: "PANTS", price: 700 },

  // --- SHOES (Sepatu/Bottom) ---
  "shoes_black": { id: "shoes_black", name: "Black Boots", type: "SHOES", price: 500 },
};

export const getItemPrice = (itemId) => SHOP_CATALOG[itemId]?.price || 0;
export const getItemType = (itemId) => SHOP_CATALOG[itemId]?.type || null;
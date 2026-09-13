import { Restaurant, MenuItemSummary } from "../types/swiggy";

export const SANDBOX_RESTAURANTS: Restaurant[] = [
  {
    id: "rest_meghana_01",
    name: "Meghana Foods",
    cuisines: ["Biryani", "Andhra", "North Indian"],
    avgRating: 4.4,
    totalRatings: "10K+",
    costForTwo: "₹500 for two",
    areaName: "Indiranagar",
    distanceKm: 2.1,
    deliveryTimeMinutes: 28,
    veg: false,
    availabilityStatus: "OPEN",
    offer: "20% OFF UPTO ⊮120"
  },
  {
    id: "rest_truffles_02",
    name: "Truffles",
    cuisines: ["Burgers", "American", "Pasta", "Desserts"],
    avgRating: 4.5,
    totalRatings: "20K+",
    costForTwo: "₮450 for two",
    areaName: "KOramangala",
    distanceKm: 3.5,
    deliveryTimeMinutes: 32,
    veg: false,
    availabilityStatus: "OPEN",
    offer: "FLAT ⊮100 OFF"
  },
  {
    id: "rest_anand_sweets_03",
    name: "Anand Sweets & Purani Dilli Chaat",
    cuisines: ["North Indian", "Street Food", "Mithai", "Pure Veg"],
    avgRating: 4.3,
    totalRatings: "5K+",
    costForTwo: "⊮400 for two",
    areaName: "Indiranagar",
    distanceKm: 1.8,
    deliveryTimeMinutes: 24,
    veg: true,
    availabilityStatus: "OPEN",
    offer: "15% OFF"
  }
];

export const SANDBOX_MENUS: Record<string, MenuItemSummary[]> = {
  rest_meghana_01: [
    {
      id: "item_m01",
      menu_item_id: "m_biryani_chk",
      name: "Meghana Special Chicken Biryani",
      price: 330,
      isVeg: false,
      inStock: 1,
      isBestseller: true,
      rating: 4.6,
      categories: ["Biryanis", "Bestsellers"]
    },
    {
      id: "item_m02",
      menu_item_id: "m_biryani_paneer",
      name: "Paneer Biryani",
      price: 290,
      isVeg: true,
      inStock: 1,
      isBestseller: true,
      rating: 4.3,
      categories: ["Biryanis", "Veg Delights"]
    },
    {
      id: "item_m03",
      menu_item_id: "m_biryani_veg",
      name: "Special Veg Biryani (Jain Friendly on Request)",
      price: 260,
      isVeg: true,
      inStock: 1,
      rating: 4.1,
      categories: ["Biryanis", "Veg Delights"]
    },
    {
      id: "item_m04",
      menu_item_id: "m_chk_555",
      name: "Chicken 555 (Crispy Andhra Starter)",
      price: 310,
      isVeg: false,
      inStock: 1,
      isBestseller: true,
      rating: 4.5,
      categories: ["Starters"]
    },
    {
      id: "item_m05",
      menu_item_id: "m_mushroom_curry",
      name: "Mushroom Babycorn Masala (Vegan)",
      price: 280,
      isVeg: true,
      inStock: 1,
      rating: 4.2,
      categories: ["Gravies", "Vegan"]
    },
    {
      id: "item_m06",
      menu_item_id: "m_curd_rice",
      name: "South Indian Tadka Curd Rice",
      price: 180,
      isVeg: true,
      inStock: 1,
      rating: 4.4,
      categories: ["Rice Specials"]
    }
  ],
  rest_truffles_02: [
    {
      id: "item_t01",
      menu_item_id: "t_all_american_burger",
      name: "All American Chicken Burger",
      price: 260,
      isVeg: false,
      inStock: 1,
      isBestseller: true,
      rating: 4.7,
      categories: ["Burgers", "Bestsellers"]
    },
    {
      id: "item_t02",
      menu_item_id: "t_veg_cheese_burger",
      name: "Veg Cheese & Crisp Burger",
      price: 220,
      isVeg: true,
      inStock: 1,
      isBestseller: true,
      rating: 4.3,
      categories: ["Burgers", "Veggie"]
    },
    {
      id: "item_t03",
      menu_item_id: "t_peri_peri_fries",
      name: "Peri Peri French Fries (Vegan)",
      price: 150,
      isVeg: true,
      inStock: 1,
      rating: 4.5,
      categories: ["Sides", "Vegan"]
    }
  ]
};
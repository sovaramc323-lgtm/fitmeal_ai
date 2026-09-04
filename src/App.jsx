import { useEffect, useId, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL = "https://fitmealai-production.up.railway.app";

// Free USDA FoodData Central key: https://api.data.gov/signup/
// DEMO_KEY works but is rate-limited (30 req/hour, 50/day per IP).
// Swap in your own key here once you have one.
const USDA_API_KEY = "DEMO_KEY";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WORKOUTS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Abs",
  "Cardio",
  "Rest",
];

const FOOD_SUGGESTIONS = [
  "Roti",
  "Basmati Rice",
  "Dal Tadka",
  "Paneer",
  "Chicken Curry",
  "Chicken Biryani",
  "Masala Dosa",
  "Idli",
  "Samosa",
  "Vada Pav",
  "Pav Bhaji",
  "Curd / Dahi",
  "Masala Chai",
  "Cold Coffee",
  "Lassi (Sweet)",
  "Thums Up / Cola",
];

// Daily targets used for the dashboard's progress bars / AI insight.
// These are now editable via the Profile page (see `targets` state);
// these constants are only the defaults used the very first time the
// app runs, before anything has been saved to localStorage.
const DEFAULT_CALORIE_TARGET = 2400;
const DEFAULT_PROTEIN_TARGET = 140;
const DEFAULT_WATER_TARGET_ML = 3000;
const WATER_STEP_ML = 250;

// Curated nutrition database for Indian foods, drinks, sweets, street
// food and fast food. Values are per 100g (or 100ml for drinks) so they
// scale the same way as the USDA results using the quantity field.
// `serving` is just an informational hint (typical single-serving size)
// shown in the dropdown — it does not affect the math.
const INDIAN_FOODS = [
  // Staples & grains
  { name: "Basmati Rice (cooked)", category: "Staples", calories: 121, protein: 2.7, carbs: 25.7, fat: 0.4, serving: 150 },
  { name: "Jeera Rice", category: "Staples", calories: 170, protein: 3, carbs: 30, fat: 4, serving: 150 },
  { name: "Curd Rice", category: "Staples", calories: 120, protein: 3, carbs: 20, fat: 3, serving: 150 },
  { name: "Roti / Chapati (whole wheat)", category: "Staples", calories: 297, protein: 11, carbs: 59, fat: 3.7, serving: 30 },
  { name: "Naan (plain)", category: "Staples", calories: 310, protein: 9, carbs: 50, fat: 9, serving: 90 },
  { name: "Paratha (plain)", category: "Staples", calories: 330, protein: 6.5, carbs: 45, fat: 14, serving: 60 },
  { name: "Aloo Paratha", category: "Staples", calories: 260, protein: 5.5, carbs: 34, fat: 11, serving: 100 },
  { name: "Puri", category: "Staples", calories: 390, protein: 6, carbs: 43, fat: 21, serving: 30 },
  { name: "Idli", category: "Staples", calories: 130, protein: 4, carbs: 27, fat: 0.3, serving: 35 },
  { name: "Dosa (plain)", category: "Staples", calories: 168, protein: 3.9, carbs: 28, fat: 4.5, serving: 80 },
  { name: "Masala Dosa", category: "Staples", calories: 220, protein: 4.5, carbs: 30, fat: 9, serving: 150 },
  { name: "Uttapam", category: "Staples", calories: 150, protein: 4, carbs: 27, fat: 3, serving: 100 },
  { name: "Medu Vada", category: "Staples", calories: 280, protein: 8, carbs: 28, fat: 15, serving: 40 },
  { name: "Upma", category: "Staples", calories: 130, protein: 3, carbs: 20, fat: 4, serving: 150 },
  { name: "Poha", category: "Staples", calories: 130, protein: 2.6, carbs: 27, fat: 1.5, serving: 150 },
  { name: "Dhokla", category: "Staples", calories: 160, protein: 6, carbs: 28, fat: 3, serving: 60 },
  { name: "Thepla", category: "Staples", calories: 280, protein: 6, carbs: 38, fat: 11, serving: 40 },
  { name: "Handvo", category: "Staples", calories: 220, protein: 6, carbs: 28, fat: 9, serving: 80 },

  // Dals & curries
  { name: "Dal Tadka (Toor Dal, cooked)", category: "Dals & Curries", calories: 116, protein: 7, carbs: 20, fat: 0.4, serving: 150 },
  { name: "Dal Makhani", category: "Dals & Curries", calories: 220, protein: 8, carbs: 17, fat: 13, serving: 150 },
  { name: "Rajma (Kidney Bean Curry)", category: "Dals & Curries", calories: 140, protein: 8, carbs: 20, fat: 3, serving: 150 },
  { name: "Chole (Chickpea Curry)", category: "Dals & Curries", calories: 164, protein: 8, carbs: 22, fat: 5, serving: 150 },
  { name: "Sambar", category: "Dals & Curries", calories: 90, protein: 4, carbs: 13, fat: 2.5, serving: 150 },
  { name: "Rasam", category: "Dals & Curries", calories: 45, protein: 2, carbs: 7, fat: 1, serving: 150 },
  { name: "Kadhi", category: "Dals & Curries", calories: 95, protein: 3, carbs: 8, fat: 5.5, serving: 150 },
  { name: "Palak Paneer", category: "Dals & Curries", calories: 180, protein: 8, carbs: 7, fat: 14, serving: 150 },
  { name: "Paneer Butter Masala", category: "Dals & Curries", calories: 240, protein: 9, carbs: 9, fat: 18, serving: 150 },
  { name: "Butter Chicken", category: "Dals & Curries", calories: 220, protein: 16, carbs: 6, fat: 14, serving: 150 },
  { name: "Chicken Curry", category: "Dals & Curries", calories: 170, protein: 15, carbs: 5, fat: 10, serving: 150 },
  { name: "Egg Curry", category: "Dals & Curries", calories: 150, protein: 9, carbs: 4, fat: 10, serving: 150 },
  { name: "Fish Curry", category: "Dals & Curries", calories: 140, protein: 14, carbs: 4, fat: 7, serving: 150 },
  { name: "Mutton Curry", category: "Dals & Curries", calories: 220, protein: 17, carbs: 4, fat: 15, serving: 150 },
  { name: "Bhindi Masala", category: "Dals & Curries", calories: 95, protein: 2, carbs: 8, fat: 6, serving: 100 },
  { name: "Aloo Gobi", category: "Dals & Curries", calories: 110, protein: 2.5, carbs: 14, fat: 5, serving: 150 },
  { name: "Baingan Bharta", category: "Dals & Curries", calories: 95, protein: 2, carbs: 9, fat: 6, serving: 150 },
  { name: "Mixed Vegetable Curry", category: "Dals & Curries", calories: 100, protein: 3, carbs: 11, fat: 5, serving: 150 },

  // Tandoor & grills
  { name: "Chicken Tikka", category: "Tandoor & Grills", calories: 180, protein: 25, carbs: 3, fat: 8, serving: 100 },
  { name: "Tandoori Chicken", category: "Tandoor & Grills", calories: 165, protein: 27, carbs: 2, fat: 5.5, serving: 100 },
  { name: "Chicken 65", category: "Tandoor & Grills", calories: 220, protein: 20, carbs: 8, fat: 13, serving: 150 },
  { name: "Seekh Kebab", category: "Tandoor & Grills", calories: 240, protein: 18, carbs: 4, fat: 17, serving: 100 },
  { name: "Paneer Tikka", category: "Tandoor & Grills", calories: 210, protein: 14, carbs: 6, fat: 15, serving: 100 },

  // Rice dishes
  { name: "Chicken Biryani", category: "Rice Dishes", calories: 200, protein: 9, carbs: 22, fat: 8, serving: 250 },
  { name: "Veg Biryani", category: "Rice Dishes", calories: 160, protein: 3.5, carbs: 24, fat: 5.5, serving: 250 },
  { name: "Egg Biryani", category: "Rice Dishes", calories: 185, protein: 7, carbs: 23, fat: 7, serving: 250 },
  { name: "Fried Rice (Veg)", category: "Rice Dishes", calories: 163, protein: 3.5, carbs: 27, fat: 4.5, serving: 200 },

  // Street food & snacks
  { name: "Samosa", category: "Street Food", calories: 262, protein: 4, carbs: 28, fat: 15, serving: 60 },
  { name: "Kachori", category: "Street Food", calories: 280, protein: 5, carbs: 30, fat: 16, serving: 50 },
  { name: "Pakora (Onion)", category: "Street Food", calories: 280, protein: 5, carbs: 25, fat: 18, serving: 50 },
  { name: "Bhel Puri", category: "Street Food", calories: 175, protein: 4, carbs: 30, fat: 5, serving: 150 },
  { name: "Sev Puri", category: "Street Food", calories: 200, protein: 4, carbs: 28, fat: 8, serving: 150 },
  { name: "Dahi Puri", category: "Street Food", calories: 180, protein: 4, carbs: 25, fat: 7, serving: 150 },
  { name: "Pani Puri (Golgappa)", category: "Street Food", calories: 230, protein: 5, carbs: 38, fat: 6, serving: 100 },
  { name: "Vada Pav", category: "Street Food", calories: 290, protein: 6, carbs: 38, fat: 13, serving: 120 },
  { name: "Misal Pav", category: "Street Food", calories: 210, protein: 7, carbs: 28, fat: 8, serving: 200 },
  { name: "Pav Bhaji", category: "Street Food", calories: 200, protein: 5, carbs: 25, fat: 9, serving: 200 },
  { name: "Chole Bhature", category: "Street Food", calories: 330, protein: 9, carbs: 40, fat: 15, serving: 250 },
  { name: "Litti Chokha", category: "Street Food", calories: 230, protein: 6, carbs: 30, fat: 9, serving: 150 },
  { name: "Momos (Veg)", category: "Street Food", calories: 160, protein: 5, carbs: 28, fat: 3, serving: 150 },
  { name: "Momos (Chicken)", category: "Street Food", calories: 175, protein: 9, carbs: 22, fat: 5, serving: 150 },
  { name: "Spring Roll", category: "Street Food", calories: 220, protein: 4, carbs: 26, fat: 11, serving: 100 },
  { name: "Manchurian (Veg)", category: "Street Food", calories: 160, protein: 4, carbs: 18, fat: 8, serving: 150 },
  { name: "Noodles (Veg Hakka)", category: "Street Food", calories: 150, protein: 4, carbs: 25, fat: 4, serving: 200 },

  // Fast food (Indian-style)
  { name: "French Fries", category: "Fast Food", calories: 312, protein: 3.4, carbs: 41, fat: 15, serving: 100 },
  { name: "Burger (Veg)", category: "Fast Food", calories: 250, protein: 6, carbs: 33, fat: 10, serving: 150 },
  { name: "Burger (Chicken)", category: "Fast Food", calories: 280, protein: 14, carbs: 28, fat: 13, serving: 150 },
  { name: "Sandwich (Veg)", category: "Fast Food", calories: 200, protein: 5, carbs: 28, fat: 7, serving: 150 },
  { name: "Sandwich (Chicken)", category: "Fast Food", calories: 220, protein: 12, carbs: 24, fat: 8, serving: 150 },
  { name: "Cutlet (Veg)", category: "Fast Food", calories: 220, protein: 4, carbs: 24, fat: 12, serving: 60 },
  { name: "Pizza (Cheese, regular crust)", category: "Fast Food", calories: 266, protein: 11, carbs: 33, fat: 10, serving: 100 },

  // Sweets & desserts
  { name: "Gulab Jamun", category: "Sweets", calories: 330, protein: 4, carbs: 50, fat: 13, serving: 40 },
  { name: "Jalebi", category: "Sweets", calories: 350, protein: 2, carbs: 60, fat: 12, serving: 30 },
  { name: "Rasgulla", category: "Sweets", calories: 186, protein: 4, carbs: 32, fat: 4, serving: 40 },
  { name: "Besan Ladoo", category: "Sweets", calories: 400, protein: 7, carbs: 50, fat: 18, serving: 30 },
  { name: "Gajar Halwa", category: "Sweets", calories: 280, protein: 3, carbs: 32, fat: 15, serving: 100 },
  { name: "Kheer", category: "Sweets", calories: 130, protein: 3, carbs: 20, fat: 4, serving: 150 },
  { name: "Barfi", category: "Sweets", calories: 380, protein: 6, carbs: 45, fat: 18, serving: 30 },

  // Dairy & basics
  { name: "Paneer", category: "Dairy & Basics", calories: 265, protein: 18, carbs: 1.2, fat: 21, serving: 50 },
  { name: "Curd / Dahi (plain)", category: "Dairy & Basics", calories: 60, protein: 3.5, carbs: 4.7, fat: 3.3, serving: 150 },
  { name: "Buttermilk (Chaas)", category: "Dairy & Basics", calories: 40, protein: 2, carbs: 4, fat: 1.5, serving: 200 },
  { name: "Ghee", category: "Dairy & Basics", calories: 900, protein: 0, carbs: 0, fat: 100, serving: 5 },
  { name: "Butter", category: "Dairy & Basics", calories: 717, protein: 0.9, carbs: 0.1, fat: 81, serving: 5 },
  { name: "Full Fat Milk", category: "Dairy & Basics", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, serving: 200 },
  { name: "Boiled Egg", category: "Dairy & Basics", calories: 155, protein: 13, carbs: 1.1, fat: 11, serving: 50 },
  { name: "Omelette (2 eggs)", category: "Dairy & Basics", calories: 190, protein: 13, carbs: 1.5, fat: 15, serving: 100 },
  { name: "Egg Bhurji", category: "Dairy & Basics", calories: 180, protein: 12, carbs: 3, fat: 13, serving: 100 },
  { name: "Papad (roasted)", category: "Dairy & Basics", calories: 280, protein: 20, carbs: 52, fat: 2, serving: 10 },
  { name: "Pickle / Achaar", category: "Dairy & Basics", calories: 220, protein: 1, carbs: 15, fat: 18, serving: 15 },
  { name: "Coconut Chutney", category: "Dairy & Basics", calories: 150, protein: 2, carbs: 6, fat: 14, serving: 20 },

  // Drinks & beverages
  { name: "Masala Chai", category: "Drinks", calories: 55, protein: 1.5, carbs: 7, fat: 2.2, serving: 150, unit: "ml" },
  { name: "Filter Coffee (South Indian)", category: "Drinks", calories: 60, protein: 2, carbs: 8, fat: 2.5, serving: 150, unit: "ml" },
  { name: "Cold Coffee", category: "Drinks", calories: 130, protein: 4, carbs: 18, fat: 5, serving: 250, unit: "ml" },
  { name: "Lassi (Sweet)", category: "Drinks", calories: 140, protein: 3.5, carbs: 22, fat: 4.5, serving: 250, unit: "ml" },
  { name: "Nimbu Pani (Sweet)", category: "Drinks", calories: 45, protein: 0.1, carbs: 11, fat: 0, serving: 250, unit: "ml" },
  { name: "Jaljeera", category: "Drinks", calories: 25, protein: 0.3, carbs: 6, fat: 0, serving: 200, unit: "ml" },
  { name: "Coconut Water", category: "Drinks", calories: 19, protein: 0.7, carbs: 3.7, fat: 0.2, serving: 250, unit: "ml" },
  { name: "Sugarcane Juice", category: "Drinks", calories: 39, protein: 0.3, carbs: 10, fat: 0, serving: 250, unit: "ml" },
  { name: "Rooh Afza (prepared)", category: "Drinks", calories: 55, protein: 0, carbs: 14, fat: 0, serving: 250, unit: "ml" },
  { name: "Badam Milk", category: "Drinks", calories: 110, protein: 4, carbs: 12, fat: 5, serving: 200, unit: "ml" },
  { name: "Bournvita (prepared)", category: "Drinks", calories: 95, protein: 3, carbs: 17, fat: 1.5, serving: 200, unit: "ml" },
  { name: "Horlicks (prepared)", category: "Drinks", calories: 100, protein: 3, carbs: 18, fat: 1.5, serving: 200, unit: "ml" },
  { name: "Thums Up / Cola", category: "Drinks", calories: 43, protein: 0, carbs: 11, fat: 0, serving: 300, unit: "ml" },
  { name: "Limca", category: "Drinks", calories: 40, protein: 0, carbs: 10.5, fat: 0, serving: 300, unit: "ml" },
  { name: "Frooti (Mango Drink)", category: "Drinks", calories: 54, protein: 0.1, carbs: 13, fat: 0, serving: 200, unit: "ml" },
  { name: "Maaza", category: "Drinks", calories: 55, protein: 0.1, carbs: 13.5, fat: 0, serving: 250, unit: "ml" },
  { name: "Green Tea", category: "Drinks", calories: 1, protein: 0, carbs: 0.3, fat: 0, serving: 200, unit: "ml" },
  { name: "Black Coffee", category: "Drinks", calories: 2, protein: 0.3, carbs: 0, fat: 0, serving: 150, unit: "ml" },
  { name: "Beer (regular)", category: "Drinks", calories: 43, protein: 0.5, carbs: 3.6, fat: 0, serving: 330, unit: "ml" },
  { name: "Whisky", category: "Drinks", calories: 250, protein: 0, carbs: 0, fat: 0, serving: 30, unit: "ml" },
  { name: "Rum", category: "Drinks", calories: 231, protein: 0, carbs: 0, fat: 0, serving: 30, unit: "ml" },
  { name: "Red Wine", category: "Drinks", calories: 85, protein: 0.1, carbs: 2.6, fat: 0, serving: 150, unit: "ml" },
];

// Instant, offline fuzzy search over the Indian foods database. Matches
// every word in the query against the food name so "chicken curry" or
// "cold coffee" both resolve correctly, and ranks exact/prefix matches
// first.
const searchIndianFoods = (query) => {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const words = q.split(/\s+/).filter(Boolean);

  return INDIAN_FOODS.map((food, idx) => ({
    id: `in-${idx}`,
    name: food.name,
    brand: `${food.category} · Indian Foods DB · ~${food.serving}${
      food.unit || "g"
    } serving`,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    _searchName: food.name.toLowerCase(),
  }))
    .filter((food) => words.every((w) => food._searchName.includes(w)))
    .sort((a, b) => {
      const aStarts = a._searchName.startsWith(q) ? 0 : 1;
      const bStarts = b._searchName.startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a._searchName.length - b._searchName.length;
    })
    .slice(0, 8)
    .map(({ _searchName, ...food }) => food);
};

// =========================================================
// EXERCISE ANATOMY DATA
// -----------------------------------------------------------
// Every exercise carries the muscles it trains (highlighted red on
// the dummy figure) plus a "start" and "end" pose, expressed as pure
// joint-rotation angles so a single reusable <ExerciseFigure> can
// draw every exercise in the library — the same idea as a printed
// muscle-chart poster, just generated instead of hand-drawn per pose.
// =========================================================

const EXERCISES = [
  {
    muscle: "Chest",
    title: "Bench Press",
    description:
      "Press the weight upward while keeping your shoulder blades stable.",
    highlight: ["chest", "triceps"],
    pose: {
      start: { arm: 46, arm2: 118 },
      end: { arm: 96, arm2: 16 },
    },
  },
  {
    muscle: "Chest",
    title: "Cable Fly",
    description: "Bring the handles together slowly and squeeze the chest.",
    highlight: ["chest"],
    pose: {
      start: { arm: 96, arm2: -8 },
      end: { arm: 24, arm2: -8 },
    },
  },
  {
    muscle: "Back",
    title: "Lat Pulldown",
    description: "Pull the bar toward your upper chest and control the return.",
    highlight: ["back", "biceps"],
    pose: {
      start: { arm: 172, arm2: 0 },
      end: { arm: 92, arm2: -42 },
    },
  },
  {
    muscle: "Back",
    title: "Seated Row",
    description: "Pull toward your torso while keeping your spine neutral.",
    highlight: ["back", "biceps"],
    pose: {
      start: { arm: 108, arm2: 0 },
      end: { arm: 22, arm2: -32 },
    },
  },
  {
    muscle: "Shoulders",
    title: "Lateral Raise",
    description: "Raise your arms to shoulder height with controlled movement.",
    highlight: ["shoulders"],
    pose: {
      start: { arm: 6, arm2: 0 },
      end: { arm: 90, arm2: 0 },
    },
  },
  {
    muscle: "Shoulders",
    title: "Shoulder Press",
    description: "Press overhead without arching your lower back.",
    highlight: ["shoulders", "triceps"],
    pose: {
      start: { arm: 88, arm2: 98 },
      end: { arm: 172, arm2: 12 },
    },
  },
  {
    muscle: "Legs",
    title: "Leg Press",
    description: "Lower the platform under control and drive through your feet.",
    highlight: ["quads"],
    pose: {
      start: { leg: 46, leg2: -72 },
      end: { leg: 8, leg2: -6 },
    },
  },
  {
    muscle: "Legs",
    title: "Leg Extension",
    description: "Extend your knees smoothly and squeeze your quads.",
    highlight: ["quads"],
    pose: {
      start: { leg: 6, leg2: -86 },
      end: { leg: 6, leg2: -4 },
    },
  },
  {
    muscle: "Arms & Abs",
    title: "Bicep Curl",
    description: "Curl without swinging your elbows forward.",
    highlight: ["biceps"],
    pose: {
      start: { arm: 14, arm2: 0 },
      end: { arm: 14, arm2: -150 },
    },
  },
  {
    muscle: "Arms & Abs",
    title: "Tricep Pushdown",
    description: "Keep elbows tucked and push the cable downward.",
    highlight: ["triceps"],
    pose: {
      start: { arm: 14, arm2: -102 },
      end: { arm: 14, arm2: -8 },
    },
  },
  {
    muscle: "Arms & Abs",
    title: "Cable Crunch",
    description: "Curl your torso down while keeping the movement controlled.",
    highlight: ["abs"],
    pose: {
      start: { arm: 168, arm2: 0 },
      end: { arm: 68, arm2: -44 },
    },
  },
  {
    muscle: "Cardio",
    title: "Treadmill",
    description: "Start easy, build pace gradually and finish with a cooldown.",
    highlight: ["quads", "calves"],
    pose: {
      start: { arm: 30, arm2: -20, leg: 34, leg2: -18 },
      end: { arm: -30, arm2: 10, leg: -26, leg2: 14 },
    },
  },

  // ---- Library expansion — same schema as above, additive only ----

  {
    muscle: "Chest",
    title: "Incline Dumbbell Press",
    description: "Press dumbbells up and slightly in, targeting the upper chest.",
    highlight: ["chest", "shoulders", "triceps"],
    pose: {
      start: { arm: 52, arm2: 122 },
      end: { arm: 100, arm2: 18 },
    },
  },
  {
    muscle: "Chest",
    title: "Push-Up",
    description: "Lower your chest to the floor while keeping your core braced.",
    highlight: ["chest", "triceps", "abs"],
    pose: {
      start: { arm: 38, arm2: 112 },
      end: { arm: 14, arm2: 14 },
    },
  },
  {
    muscle: "Back",
    title: "Deadlift",
    description: "Hinge at the hips and drive through your heels, keeping your back flat.",
    highlight: ["back", "quads"],
    pose: {
      start: { arm: 24, arm2: 0, leg: 26, leg2: -8 },
      end: { arm: 4, arm2: 0, leg: 4, leg2: -2 },
    },
  },
  {
    muscle: "Back",
    title: "Pull-Up",
    description: "Pull your chin over the bar, leading with your elbows down and back.",
    highlight: ["back", "biceps"],
    pose: {
      start: { arm: 176, arm2: -4 },
      end: { arm: 86, arm2: -60 },
    },
  },
  {
    muscle: "Shoulders",
    title: "Front Raise",
    description: "Raise the weight straight in front to shoulder height.",
    highlight: ["shoulders"],
    pose: {
      start: { arm: 4, arm2: 0 },
      end: { arm: 88, arm2: 0 },
    },
  },
  {
    muscle: "Shoulders",
    title: "Face Pull",
    description: "Pull the rope toward your face, flaring elbows out wide.",
    highlight: ["shoulders", "back"],
    pose: {
      start: { arm: 110, arm2: -6 },
      end: { arm: 70, arm2: -70 },
    },
  },
  {
    muscle: "Legs",
    title: "Squat",
    description: "Sit your hips back and down, keeping your chest up and knees tracking your toes.",
    highlight: ["quads"],
    pose: {
      start: { leg: 6, leg2: -8 },
      end: { leg: 52, leg2: -74 },
    },
  },
  {
    muscle: "Legs",
    title: "Lunges",
    description: "Step forward and lower until both knees reach about 90 degrees.",
    highlight: ["quads", "calves"],
    pose: {
      start: { leg: 4, leg2: -4 },
      end: { leg: 44, leg2: -66 },
    },
  },
  {
    muscle: "Legs",
    title: "Calf Raise",
    description: "Rise onto your toes and pause at the top, then lower slowly.",
    highlight: ["calves"],
    pose: {
      start: { leg: 4, leg2: 6 },
      end: { leg: 4, leg2: -18 },
    },
  },
  {
    muscle: "Arms & Abs",
    title: "Hammer Curl",
    description: "Curl with a neutral grip, keeping wrists locked and elbows still.",
    highlight: ["biceps"],
    pose: {
      start: { arm: 12, arm2: 0 },
      end: { arm: 12, arm2: -140 },
    },
  },
  {
    muscle: "Arms & Abs",
    title: "Skull Crusher",
    description: "Lower the bar toward your forehead, then extend back up.",
    highlight: ["triceps"],
    pose: {
      start: { arm: 178, arm2: -110 },
      end: { arm: 178, arm2: -6 },
    },
  },
  {
    muscle: "Arms & Abs",
    title: "Plank",
    description: "Hold a straight line from shoulders to heels, bracing your core.",
    highlight: ["abs"],
    pose: {
      start: { arm: 100, arm2: -4, leg: 2, leg2: 0 },
      end: { arm: 100, arm2: -4, leg: 2, leg2: 0 },
    },
  },
  {
    muscle: "Arms & Abs",
    title: "Russian Twist",
    description: "Rotate your torso side to side, keeping feet lifted and controlled.",
    highlight: ["abs"],
    pose: {
      start: { arm: 96, arm2: -30 },
      end: { arm: 96, arm2: 30 },
    },
  },
  {
    muscle: "Cardio",
    title: "Cycling",
    description: "Keep a steady cadence, then push pace for short intervals.",
    highlight: ["quads", "calves"],
    pose: {
      start: { leg: 44, leg2: -70 },
      end: { leg: -18, leg2: -10 },
    },
  },
  {
    muscle: "Cardio",
    title: "Rowing Machine",
    description: "Drive with your legs first, then finish the pull with your arms.",
    highlight: ["back", "quads"],
    pose: {
      start: { arm: 30, arm2: 0, leg: 46, leg2: -70 },
      end: { arm: 140, arm2: -60, leg: 6, leg2: -4 },
    },
  },
  {
    muscle: "Cardio",
    title: "Jump Rope",
    description: "Stay light on your feet with small, quick hops.",
    highlight: ["calves"],
    pose: {
      start: { arm: 20, arm2: -10, leg: 2, leg2: 4 },
      end: { arm: -10, arm2: -10, leg: 2, leg2: -14 },
    },
  },
];

const MUSCLE_LABELS = {
  chest: "Chest",
  back: "Back / Lats",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  abs: "Abs",
  quads: "Quads",
  calves: "Calves",
};

// Reusable anatomical dummy — a simplified front-facing silhouette
// whose limbs rotate around shoulder/elbow/hip/knee pivots, with the
// trained muscle group(s) filled red the same way a wall-chart poster
// highlights the "effective area" for each move.
// Rounded, gradient-shaded "dummy" figure — front-facing anatomical
// mannequin (capsule limbs, domed head, tapered torso) instead of a
// flat stick figure, so it reads as a 3D-ish plastic training dummy
// with the trained muscle group lit up red, the way a gym wall-chart
// mannequin does. Rotation is driven entirely by the numeric
// arm/arm2/leg/leg2 props (set by the parent, either statically or
// frame-by-frame from a JS animation loop) — never by a CSS
// transition on the SVG transform, since animating that attribute
// with CSS fights the explicit rotate(angle, cx, cy) pivot and makes
// limbs visibly detach from the body.
function ExerciseFigure({ highlight = [], arm = 8, arm2 = 0, leg = 4, leg2 = 0, size = 78, animated = false }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const isHi = (m) => highlight.includes(m);
  const bodyFill = isHi("chest") || isHi("abs") || isHi("back") ? "figureMuscle" : "figureSkin";
  const skinUrl = `url(#skin-${uid})`;
  const muscleUrl = `url(#muscle-${uid})`;
  const cls = (hi) => (hi ? "figureMuscle" : "figureSkin");
  const fill = (hi) => (hi ? muscleUrl : skinUrl);

  return (
    <svg
      viewBox="0 0 100 168"
      width={size}
      height={size * 1.68}
      aria-hidden="true"
      className={
        animated
          ? "exerciseFigureSvg exerciseFigureAnimated"
          : "exerciseFigureSvg"
      }
    >
      <defs>
        <linearGradient id={`skin-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--figureSkinLight)" />
          <stop offset="55%" stopColor="var(--figureSkinMid)" />
          <stop offset="100%" stopColor="var(--figureSkinDark)" />
        </linearGradient>
        <linearGradient id={`muscle-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--figureMuscleLight)" />
          <stop offset="55%" stopColor="var(--redBright)" />
          <stop offset="100%" stopColor="var(--redDeep)" />
        </linearGradient>
        <radialGradient id={`head-${uid}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="var(--figureSkinLight)" />
          <stop offset="100%" stopColor="var(--figureSkinDark)" />
        </radialGradient>
      </defs>

      {/* torso — tapered, slightly domed chest for a molded-plastic look */}
      <path
        d="M34,29 Q50,23 66,29 L69,58 Q69,75 58,80 L50,83 L42,80 Q31,75 31,58 Z"
        fill={bodyFill === "figureMuscle" ? muscleUrl : skinUrl}
        className={`figureTorso ${bodyFill}`}
      />

      {/* chest overlay */}
      {isHi("chest") && (
        <g>
          <ellipse cx="42" cy="40" rx="9.5" ry="7.5" fill={muscleUrl} className="figureMuscle" />
          <ellipse cx="58" cy="40" rx="9.5" ry="7.5" fill={muscleUrl} className="figureMuscle" />
        </g>
      )}

      {/* back / lat overlay */}
      {isHi("back") && (
        <path d="M34,31 L50,45 L66,31 L69,58 L50,74 L31,58 Z" fill={muscleUrl} className="figureMuscle" />
      )}

      {/* abs overlay */}
      {isHi("abs") && (
        <g fill={muscleUrl} className="figureMuscle">
          <rect x="42" y="38" width="16" height="6" rx="2" />
          <rect x="42" y="46" width="16" height="6" rx="2" />
          <rect x="42" y="54" width="16" height="6" rx="2" />
          <rect x="42" y="62" width="16" height="6" rx="2" />
        </g>
      )}

      {/* head + neck */}
      <circle cx="50" cy="14" r="10" fill={`url(#head-${uid})`} className="figureHead" />
      <rect x="45.5" y="22" width="9" height="8" rx="3" fill={skinUrl} className="figureSkin" />

      {/* shoulders */}
      <circle cx="32" cy="31" r={isHi("shoulders") ? 8 : 6.5} fill={fill(isHi("shoulders"))} className={cls(isHi("shoulders"))} />
      <circle cx="68" cy="31" r={isHi("shoulders") ? 8 : 6.5} fill={fill(isHi("shoulders"))} className={cls(isHi("shoulders"))} />

      {/* left arm */}
      <g transform={`rotate(${arm} 32 31)`}>
        <rect x="27" y="31" width="11" height="30" rx="5.5" fill={fill(isHi("biceps") || isHi("triceps"))} className={cls(isHi("biceps") || isHi("triceps"))} />
        <g transform={`rotate(${arm2} 32.5 61)`}>
          <rect x="28" y="61" width="9.5" height="26" rx="4.5" fill={skinUrl} className="figureSkin" />
          <circle cx="32.5" cy="89" r="5.2" fill="var(--figureJointColor)" className="figureJoint" />
        </g>
      </g>

      {/* right arm (mirrored) */}
      <g transform={`rotate(${-arm} 68 31)`}>
        <rect x="62" y="31" width="11" height="30" rx="5.5" fill={fill(isHi("biceps") || isHi("triceps"))} className={cls(isHi("biceps") || isHi("triceps"))} />
        <g transform={`rotate(${-arm2} 67.5 61)`}>
          <rect x="62.5" y="61" width="9.5" height="26" rx="4.5" fill={skinUrl} className="figureSkin" />
          <circle cx="67.5" cy="89" r="5.2" fill="var(--figureJointColor)" className="figureJoint" />
        </g>
      </g>

      {/* hips */}
      <path d="M31,58 Q50,74 69,58 L67,90 Q50,97 33,90 Z" fill={skinUrl} className="figureSkin" />

      {/* left leg */}
      <g transform={`rotate(${leg} 40 90)`}>
        <rect x="34.5" y="90" width="12" height="34" rx="5.8" fill={fill(isHi("quads"))} className={cls(isHi("quads"))} />
        <g transform={`rotate(${leg2} 40 124)`}>
          <rect x="35.5" y="124" width="10" height="30" rx="4.6" fill={fill(isHi("calves"))} className={cls(isHi("calves"))} />
        </g>
      </g>

      {/* right leg (mirrored) */}
      <g transform={`rotate(${-leg} 60 90)`}>
        <rect x="53.5" y="90" width="12" height="34" rx="5.8" fill={fill(isHi("quads"))} className={cls(isHi("quads"))} />
        <g transform={`rotate(${-leg2} 60 124)`}>
          <rect x="54.5" y="124" width="10" height="30" rx="4.6" fill={fill(isHi("calves"))} className={cls(isHi("calves"))} />
        </g>
      </g>
    </svg>
  );
}

const easeInOutSmooth = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, p) => a + (b - a) * p;

// Side-by-side START → END dummy pair, mirroring how the reference
// wall-chart shows two frames of the same movement per exercise.
//
// Every card in the grid now animates continuously and simultaneously
// (like a looping reference-video demo), not just the one the person
// has opened — `active` is kept as a prop for API compatibility but is
// no longer required to be true for the loop to run. Each card still
// has its own independent play/pause toggle and, to protect scroll
// performance with a full library on screen, only actually runs its
// requestAnimationFrame loop while the card is in (or near) the
// viewport — see the IntersectionObserver effect below.
//
// The animation itself is a JS requestAnimationFrame tween that
// interpolates the numeric arm/arm2/leg/leg2 angles between the two
// poses and feeds the live numbers to <ExerciseFigure> every frame —
// deliberately NOT a CSS transition on the SVG transform attribute,
// which fights the rotate(angle, cx, cy) pivot and makes limbs
// visibly fly apart from the body mid-rotation.
function ExercisePosePair({ exercise, size = 78 }) {
  const { highlight, pose } = exercise;
  const prefersReducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [inView, setInView] = useState(true);
  const [t, setT] = useState(0);
  const [reps, setReps] = useState(0);
  const dirRef = useRef(1);
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const wrapRef = useRef(null);

  // Pause the rAF loop for cards scrolled off-screen so a full 24-item
  // library doesn't run two dozen simultaneous animation loops at once.
  useEffect(() => {
    const node = wrapRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "200px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const isRunning = playing && inView;

  useEffect(() => {
    if (!isRunning) {
      lastRef.current = null;
      return undefined;
    }

    const durationMs = 850;

    const step = (now) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = now - lastRef.current;
      lastRef.current = now;

      setT((old) => {
        let next = old + (dirRef.current * dt) / durationMs;
        if (next >= 1) {
          next = 1;
          dirRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          dirRef.current = 1;
          setReps((r) => r + 1); // completed one full rep (end -> back to start)
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [isRunning]);

  const p = easeInOutSmooth(t);
  const live = {
    arm: lerp(pose.start.arm ?? 8, pose.end.arm ?? 8, p),
    arm2: lerp(pose.start.arm2 ?? 0, pose.end.arm2 ?? 0, p),
    leg: lerp(pose.start.leg ?? 4, pose.end.leg ?? 4, p),
    leg2: lerp(pose.start.leg2 ?? 0, pose.end.leg2 ?? 0, p),
  };

  return (
    <div className="exerciseFigurePair" ref={wrapRef}>
      <button
        type="button"
        className={playing ? "poseAnimToggle poseAnimToggleOn" : "poseAnimToggle"}
        onClick={(e) => {
          e.stopPropagation();
          setPlaying((old) => !old);
        }}
        aria-label={playing ? "Pause pose animation" : "Play pose animation"}
        title={playing ? "Pause animation" : "Play animation"}
      >
        {playing ? "❚❚" : "▶"}
      </button>

      {reps > 0 && <div className="exerciseRepCounter">REP {reps}</div>}

      <div className="exerciseFigureFrame exerciseFigureFrameLive">
        <ExerciseFigure
          highlight={highlight}
          arm={live.arm}
          arm2={live.arm2}
          leg={live.leg}
          leg2={live.leg2}
          size={size}
          animated={isRunning}
        />
        <span>{t < 0.5 ? "START" : "END"}</span>
      </div>
    </div>
  );
}

// Simple inline SVG line chart for body weight over time — no charting
// dependency needed since it's just one series of dated points.
function WeightChart({ entries }) {
  if (!entries || entries.length < 2) {
    return (
      <div className="emptyState">
        <strong>Not enough data yet</strong>
        <span>Log your weight at least twice (Leaderboard → Weekly Check-In) to see a trend line.</span>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const weights = sorted.map((e) => e.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  const width = 600;
  const height = 160;
  const padX = 10;
  const padY = 14;

  const points = sorted.map((entry, i) => {
    const x =
      sorted.length === 1
        ? width / 2
        : padX + (i / (sorted.length - 1)) * (width - padX * 2);
    const y =
      height -
      padY -
      ((entry.weight - min) / range) * (height - padY * 2);
    return { x, y, entry };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const delta = last.weight - first.weight;

  return (
    <div className="weightChartWrap">
      <div className="weightChartSummary">
        <div>
          <span>LATEST</span>
          <strong>{last.weight} kg</strong>
        </div>
        <div>
          <span>SINCE FIRST LOG</span>
          <strong className={delta <= 0 ? "posChange" : "negChange"}>
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} kg
          </strong>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="weightChartSvg">
        <path d={path} className="weightChartLine" fill="none" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4.5 : 3} className="weightChartDot" />
        ))}
      </svg>

      <div className="weightChartAxis">
        <span>{first.date}</span>
        <span>{last.date}</span>
      </div>
    </div>
  );
}

const createSplit = () =>
  DAYS.map((_, i) => ({
    day: i + 1,
    workouts: [],
  }));

const toDateKey = (date) => date.toISOString().slice(0, 10);

const getWeekDates = () => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return toDateKey(d);
  });
};

// Reusable live food/drink search box: type anything, hit the USDA
// FoodData Central database, pick a match, scale it by grams/ml.
function FoodSearchBox({
  query,
  onQueryChange,
  results,
  loading,
  selected,
  onSelect,
  quantity,
  onQuantityChange,
  onAdd,
  placeholder,
  addLabel,
}) {
  return (
    <div className="foodSearchWrap">
      <div className="quickMeal foodSearchRow">
        <div className="foodSearchInputWrap">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
          />

          {loading && <span className="foodSearchSpinner">⟳</span>}

          {results.length > 0 && (
            <div className="foodSearchDropdown">
              {results.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="foodSearchOption"
                  onClick={() => onSelect(item)}
                >
                  <div>
                    <strong>{item.name}</strong>
                    {item.brand && <span>{item.brand}</span>}
                  </div>

                  <small>
                    {Math.round(item.calories)} kcal · P{" "}
                    {item.protein.toFixed(1)}g · C{" "}
                    {item.carbs.toFixed(1)}g
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          type="number"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          placeholder="grams / ml"
        />

        <button onClick={onAdd}>{addLabel}</button>
      </div>

      {selected && (
        <div className="foodSelectedPreview">
          Selected: <strong>{selected.name}</strong> — per 100g/ml:{" "}
          {Math.round(selected.calories)} kcal, P{" "}
          {selected.protein.toFixed(1)}g, C{" "}
          {selected.carbs.toFixed(1)}g, F{" "}
          {selected.fat.toFixed(1)}g
        </div>
      )}
    </div>
  );
}

// Small toast stack — replaces raw alert()/confirm() calls with
// something that matches the rest of the shell and doesn't block
// the UI thread. Each toast auto-dismisses after ~3.5s.
function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="toastStack">
      {toasts.map((t) => (
        <div className={`toast ${t.type || ""}`} key={t.id}>
          <div className="toastIcon">
            {t.type === "success"
              ? "✓"
              : t.type === "warning"
              ? "!"
              : "✦"}
          </div>

          <div className="toastBody">
            <strong>{t.title}</strong>
            {t.message && <p>{t.message}</p>}
          </div>

          <button
            className="toastClose"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// Confirmation modal — used for destructive/irreversible actions
// (resetting all data, removing a friend) instead of the browser's
// native confirm() dialog.
function ConfirmModal({ config, onCancel, onConfirm }) {
  if (!config) return null;

  return (
    <div className="modalBackdrop" onClick={onCancel}>
      <div
        className={`modal ${config.destructive ? "destructive" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalIcon">{config.destructive ? "⚠" : "✦"}</div>
        <h3>{config.title}</h3>
        <p>{config.message}</p>

        <div className="modalActions">
          <button className="modalCancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="modalConfirm" onClick={onConfirm}>
            {config.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("dashboard");

  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [split, setSplit] = useState(createSplit());
  const [setup, setSetup] = useState(false);

  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState([]);
  const [foodSearching, setFoodSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [meals, setMeals] = useState([]);
  const [waterLogs, setWaterLogs] = useState([]);

  const [darkMode, setDarkMode] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [themeTransitioning, setThemeTransitioning] = useState(false);

  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [expandedExercise, setExpandedExercise] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessage, setAiMessage] = useState("");

  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [friendCode, setFriendCode] = useState("");
  const [addFriendCode, setAddFriendCode] = useState("");
  const [leaderboard, setLeaderboard] = useState(null);
  const [leaderboardTab, setLeaderboardTab] = useState("protein");
  const [statWeight, setStatWeight] = useState("");
  const [statBodyFat, setStatBodyFat] = useState("");

  const [navOpen, setNavOpen] = useState(false);

  // Editable daily targets (Profile page) — replace the old hardcoded
  // CALORIE_TARGET / PROTEIN_TARGET / WATER_TARGET_ML constants so the
  // progress bars and AI score actually reflect the person's own goals.
  const [calorieTarget, setCalorieTarget] = useState(DEFAULT_CALORIE_TARGET);
  const [proteinTarget, setProteinTarget] = useState(DEFAULT_PROTEIN_TARGET);
  const [waterTarget, setWaterTarget] = useState(DEFAULT_WATER_TARGET_ML);
  const [targetDraft, setTargetDraft] = useState({
    calorieTarget: DEFAULT_CALORIE_TARGET,
    proteinTarget: DEFAULT_PROTEIN_TARGET,
    waterTarget: DEFAULT_WATER_TARGET_ML,
  });

  // Strength/weight progression — the biggest functional gap in the
  // original app. exerciseLogs holds every logged set so the Exercise
  // Library can show history + detect PRs; weightHistory is a local,
  // dated record of body weight so Progress can chart it even before
  // (or without) the backend leaderboard weight-log endpoint.
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [setDraft, setSetDraft] = useState({});
  const [weightHistory, setWeightHistory] = useState([]);

  // Custom water amount (dashboard water row) — lets someone log an
  // exact amount instead of only the fixed +250ml quick-action button.
  const [customWaterAmount, setCustomWaterAmount] = useState("");

  // Inline meal editing — previously the food log only supported
  // delete-and-re-add; this lets you adjust a logged meal's quantity
  // (grams/ml) in place and have macros recalculated automatically.
  const [editingMealId, setEditingMealId] = useState(null);
  const [editQuantityDraft, setEditQuantityDraft] = useState("");

  // Exercise Library enhancements — muscle-group filter + text search so
  // a growing library stays browsable, per-exercise notes (form cues,
  // reminders) that persist locally, and a simple rest timer that starts
  // automatically after a set is logged.
  const [exerciseFilter, setExerciseFilter] = useState("All");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseNotes, setExerciseNotes] = useState({});
  const [restTimer, setRestTimer] = useState(null); // { exercise, secondsLeft, duration, running }

  // Real (if lightweight) AI chat log, replacing the old single
  // question/answer pair that didn't actually accumulate a
  // conversation and whose Enter-key handler didn't send anything.
  const [aiChatLog, setAiChatLog] = useState([]);

  // Toasts + confirmation modal — shared feedback surfaces used across
  // every page instead of window.alert()/window.confirm().
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);

  const pushToast = (title, message = "", type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((old) => [...old, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((old) => old.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id) =>
    setToasts((old) => old.filter((t) => t.id !== id));

  const askConfirm = ({ title, message, confirmLabel, destructive, onConfirm }) => {
    setConfirmConfig({ title, message, confirmLabel, destructive, onConfirm });
  };

  const closeConfirm = () => setConfirmConfig(null);

  const runConfirm = () => {
    confirmConfig?.onConfirm?.();
    setConfirmConfig(null);
  };

  // Toggle dark/light with a brief "transitioning" flag so the shell can
  // play a soft cross-fade/ripple instead of the theme just snapping —
  // purely cosmetic, the underlying darkMode boolean still drives every
  // --token in App.css exactly as before.
  const toggleTheme = () => {
    setThemeTransitioning(true);
    setDarkMode((old) => !old);
    setTimeout(() => setThemeTransitioning(false), 500);
  };

  const todayIndex = new Date().getDay();
  const todayName = DAYS[todayIndex];

  const today = split.find(
    (item) => item.day === todayIndex + 1
  );

  const tomorrowIndex = (todayIndex + 1) % 7;

  const tomorrow = split.find(
    (item) => item.day === tomorrowIndex + 1
  );

  const todayDate = useMemo(() => toDateKey(new Date()), []);
  const weekDates = useMemo(() => getWeekDates(), []);

  const todayMeals = useMemo(
    () => meals.filter((item) => item.date === todayDate),
    [meals, todayDate]
  );

  const totals = useMemo(
    () =>
      todayMeals.reduce(
        (total, item) => ({
          calories: total.calories + item.calories,
          protein: total.protein + item.protein,
          carbs: total.carbs + item.carbs,
          fat: total.fat + (item.fat || 0),
        }),
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        }
      ),
    [todayMeals]
  );

  const todayWater = useMemo(
    () =>
      waterLogs
        .filter((item) => item.date === todayDate)
        .reduce((sum, item) => sum + item.amount, 0),
    [waterLogs, todayDate]
  );

  const weeklyTotals = useMemo(
    () =>
      weekDates.map((date) =>
        meals
          .filter((item) => item.date === date)
          .reduce(
            (total, item) => ({
              calories: total.calories + item.calories,
              protein: total.protein + item.protein,
              carbs: total.carbs + item.carbs,
              fat: total.fat + (item.fat || 0),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          )
      ),
    [meals, weekDates]
  );

  // Consecutive-day logging streak, counting back from today (or from
  // yesterday if nothing has been logged yet today so a streak isn't
  // lost the moment the clock rolls over).
  const loggedDates = useMemo(
    () => new Set(meals.map((item) => item.date)),
    [meals]
  );

  const streak = useMemo(() => {
    let count = 0;
    const cursor = new Date();

    if (!loggedDates.has(toDateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (loggedDates.has(toDateKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return count;
  }, [loggedDates]);

  // Macro ring angles — protein/carb/fat share of today's grams,
  // expressed as cumulative conic-gradient stops.
  const macroRingStyle = useMemo(() => {
    const p = Math.max(totals.protein, 0);
    const c = Math.max(totals.carbs, 0);
    const f = Math.max(totals.fat, 0);
    const sum = p + c + f;

    if (!sum) {
      return { "--proteinDeg": "0deg", "--carbDeg": "0deg", "--fatDeg": "0deg" };
    }

    const proteinDeg = (p / sum) * 360;
    const carbDeg = proteinDeg + (c / sum) * 360;
    const fatDeg = carbDeg + (f / sum) * 360;

    return {
      "--proteinDeg": `${proteinDeg}deg`,
      "--carbDeg": `${carbDeg}deg`,
      "--fatDeg": `${fatDeg}deg`,
    };
  }, [totals]);

  const aiScore = Math.min(
    100,
    Math.round(
      Math.min(totals.protein * 1.3, 45) +
      Math.min(totals.calories / 25, 35) +
      Math.min(todayMeals.length * 7, 20)
    )
  );

  const proteinRemaining = Math.max(proteinTarget - totals.protein, 0);

  const aiInsight =
    totals.protein < proteinTarget
      ? "Protein is your biggest opportunity today."
      : totals.calories < 1200
      ? "Your energy intake looks light. Consider a balanced meal."
      : todayMeals.length < 3
      ? "Your nutrition log needs another meal or snack."
      : "Your nutrition pattern is looking strong today.";

  const aiInsightDetail =
    totals.protein < proteinTarget
      ? `${totals.protein.toFixed(0)}g / ${proteinTarget}g protein — you're ${proteinRemaining.toFixed(
          0
        )}g short of today's target.`
      : "Keep your meals consistent and match your nutrition with today's activity.";

  // Recent/favorite meals — dedupe the meal log by name (most recent
  // logging wins) so "log again" one-tap entries surface the things
  // actually eaten often, without requiring a fresh search + typed
  // quantity every single time.
  const recentMeals = useMemo(() => {
    const seen = new Map();
    for (let i = meals.length - 1; i >= 0; i -= 1) {
      const item = meals[i];
      if (!seen.has(item.name)) {
        seen.set(item.name, item);
      }
      if (seen.size >= 8) break;
    }
    return Array.from(seen.values());
  }, [meals]);

  // Best set ever logged per exercise (by weight, then reps) — used to
  // show "current best" on each card and to detect PRs when a new set
  // is logged.
  const bestSetByExercise = useMemo(() => {
    const best = {};
    exerciseLogs.forEach((log) => {
      const current = best[log.exercise];
      if (
        !current ||
        log.weight > current.weight ||
        (log.weight === current.weight && log.reps > current.reps)
      ) {
        best[log.exercise] = log;
      }
    });
    return best;
  }, [exerciseLogs]);

  // Training volume (Σ weight × reps) — a simple, standard way to see
  // whether total work done is trending up, independent of any single
  // exercise's PR. Tracked for today and for the current calendar week.
  const todayVolume = useMemo(
    () =>
      exerciseLogs
        .filter((log) => log.date === todayDate)
        .reduce((sum, log) => sum + log.weight * log.reps, 0),
    [exerciseLogs, todayDate]
  );

  const todaySetCount = useMemo(
    () => exerciseLogs.filter((log) => log.date === todayDate).length,
    [exerciseLogs, todayDate]
  );

  const weeklyVolume = useMemo(
    () =>
      exerciseLogs
        .filter((log) => log.date >= weekDates[0])
        .reduce((sum, log) => sum + log.weight * log.reps, 0),
    [exerciseLogs, weekDates]
  );

  const weeklySetCount = useMemo(
    () => exerciseLogs.filter((log) => log.date >= weekDates[0]).length,
    [exerciseLogs, weekDates]
  );

  // Distinct muscle-group tabs for the Exercise Library filter bar,
  // in the same order the exercises were authored ("All" always first).
  const muscleGroups = useMemo(() => {
    const seen = [];
    EXERCISES.forEach((ex) => {
      if (!seen.includes(ex.muscle)) seen.push(ex.muscle);
    });
    return ["All", ...seen];
  }, []);

  // Exercises visible in the Library after applying the muscle-group tab
  // and the free-text search (matches title, muscle group or description).
  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase();

    return EXERCISES.filter((ex) => {
      const matchesFilter =
        exerciseFilter === "All" || ex.muscle === exerciseFilter;

      const matchesSearch =
        !q ||
        ex.title.toLowerCase().includes(q) ||
        ex.muscle.toLowerCase().includes(q) ||
        ex.description.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [exerciseFilter, exerciseSearch]);

  // Most recent logged sets for a given exercise, newest first — powers
  // the small history list shown inside each exercise's open detail.
  const historyForExercise = (title) =>
    exerciseLogs
      .filter((log) => log.exercise === title)
      .slice()
      .reverse();

  useEffect(() => {
    const saved = localStorage.getItem("fitmealApp");

    if (saved) {
      try {
        const data = JSON.parse(saved);

        setName(data.name || "");
        setWeight(data.weight || "");
        setSplit(data.split || createSplit());
        setMeals(
          (data.meals || []).map((item) => ({
            ...item,
            date: item.date || toDateKey(new Date()),
          }))
        );
        setWaterLogs(
          (data.waterLogs || []).map((item) => ({
            ...item,
            date: item.date || toDateKey(new Date()),
          }))
        );
        setSetup(data.setup || false);
        setReminders(data.reminders ?? true);
        setDarkMode(data.darkMode ?? true);
        setCalorieTarget(data.calorieTarget || DEFAULT_CALORIE_TARGET);
        setProteinTarget(data.proteinTarget || DEFAULT_PROTEIN_TARGET);
        setWaterTarget(data.waterTarget || DEFAULT_WATER_TARGET_ML);
        setTargetDraft({
          calorieTarget: data.calorieTarget || DEFAULT_CALORIE_TARGET,
          proteinTarget: data.proteinTarget || DEFAULT_PROTEIN_TARGET,
          waterTarget: data.waterTarget || DEFAULT_WATER_TARGET_ML,
        });
        setExerciseLogs(data.exerciseLogs || []);
        setWeightHistory(data.weightHistory || []);
        setExerciseNotes(data.exerciseNotes || {});
      } catch {
        localStorage.removeItem("fitmealApp");
      }
    }
  }, []);

  useEffect(() => {
    const currentWeekStart = weekDates[0];

    localStorage.setItem(
      "fitmealApp",
      JSON.stringify({
        name,
        weight,
        split,
        meals: meals.filter(
          (item) => item.date >= currentWeekStart
        ),
        waterLogs: waterLogs.filter(
          (item) => item.date >= currentWeekStart
        ),
        setup,
        reminders,
        darkMode,
        calorieTarget,
        proteinTarget,
        waterTarget,
        exerciseLogs,
        weightHistory,
        exerciseNotes,
      })
    );
  }, [
    name,
    weight,
    split,
    meals,
    waterLogs,
    setup,
    reminders,
    darkMode,
    weekDates,
    calorieTarget,
    proteinTarget,
    waterTarget,
    exerciseLogs,
    weightHistory,
    exerciseNotes,
  ]);

  useEffect(() => {
    if (page === "leaderboard" && token) {
      fetchFriendCode();
      fetchFriends();
      fetchLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, token]);

  // Close the mobile nav whenever the page changes, and lock body
  // scroll while the nav drawer is open so the page behind it doesn't move.
  useEffect(() => {
    setNavOpen(false);
  }, [page]);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  // Close the mobile nav automatically if the viewport is resized
  // back up to desktop width.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 700) setNavOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Rest-timer countdown — ticks once a second while a timer is
  // running, and stops itself (without clearing the display) at 0 so
  // the "rest's over" state is visible until dismissed or restarted.
  useEffect(() => {
    if (!restTimer || !restTimer.running) return undefined;

    const id = setInterval(() => {
      setRestTimer((old) => {
        if (!old || !old.running) return old;
        if (old.secondsLeft <= 1) {
          return { ...old, secondsLeft: 0, running: false };
        }
        return { ...old, secondsLeft: old.secondsLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(id);
  }, [restTimer?.running, restTimer?.exercise]);

  // Live search: Indian foods, drinks, sweets, street food and fast
  // food (from the curated INDIAN_FOODS database) show up instantly on
  // every keystroke — no network round-trip needed. A short debounce
  // then also queries USDA FoodData Central in the background to fill
  // in anything the local database doesn't cover (packaged/branded
  // items, less common ingredients, etc), and those results are
  // appended below the Indian matches.
  useEffect(() => {
    const q = foodQuery.trim();

    if (!q || (selectedFood && selectedFood.name === foodQuery)) {
      setFoodResults([]);
      return;
    }

    const localMatches = searchIndianFoods(q);
    setFoodResults(localMatches);

    const timer = setTimeout(() => {
      searchFoods(q, localMatches);
    }, 450);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foodQuery]);

  const searchFoods = async (query, localMatches = []) => {
    setFoodSearching(true);

    try {
      const res = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(
          query
        )}&pageSize=10&dataType=Foundation,SR%20Legacy,Branded`
      );

      if (!res.ok) {
        throw new Error("Search failed");
      }

      const data = await res.json();

      const nutrientValue = (food, nutrientName) => {
        const match = (food.foodNutrients || []).find(
          (n) => n.nutrientName === nutrientName
        );
        return match ? match.value : 0;
      };

      const localNames = new Set(
        localMatches.map((f) => f.name.toLowerCase())
      );

      const mapped = (data.foods || [])
        .map((food) => ({
          id: food.fdcId,
          name: food.description,
          brand: food.brandOwner || food.brandName || "USDA Database",
          calories: nutrientValue(food, "Energy"),
          protein: nutrientValue(food, "Protein"),
          carbs: nutrientValue(food, "Carbohydrate, by difference"),
          fat: nutrientValue(food, "Total lipid (fat)"),
        }))
        // Skip anything that's essentially a duplicate of a local match
        .filter((food) => !localNames.has(food.name.toLowerCase()));

      // Indian Foods DB matches always come first, USDA results fill
      // in the rest — cap the combined list so the dropdown stays tidy.
      setFoodResults([...localMatches, ...mapped].slice(0, 14));
    } catch (err) {
      console.error(err);
      // Keep whatever local matches we already had, even if USDA fails.
      setFoodResults(localMatches);
    } finally {
      setFoodSearching(false);
    }
  };

  const selectFood = (food) => {
    setSelectedFood(food);
    setFoodQuery(food.name);
    setFoodResults([]);
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchFriendCode = async () => {
    try {
      const res = await fetch(`${API_URL}/api/friends/code`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setFriendCode(data.friendCode || "");
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${API_URL}/api/friends`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setFriends(data.friends || []);
      setIncomingRequests(data.incoming || []);
      setOutgoingRequests(data.outgoing || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leaderboard`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendFriendRequest = async () => {
    if (!addFriendCode.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/friends/request`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ code: addFriendCode.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        pushToast(
          "Couldn't send request",
          data.message || "Check the code and try again.",
          "warning"
        );
        return;
      }

      setAddFriendCode("");
      pushToast("Friend request sent", "", "success");
      fetchFriends();
    } catch (err) {
      console.error(err);
      pushToast("Couldn't send request", "Check your connection.", "warning");
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      await fetch(`${API_URL}/api/friends/respond`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ requestId, action }),
      });
      fetchFriends();
      fetchLeaderboard();
    } catch (err) {
      console.error(err);
    }
  };

  const removeFriend = (friendId) => {
    askConfirm({
      title: "Remove this friend?",
      message: "They'll be removed from your leaderboard and friends list. You can always reconnect later with their code.",
      confirmLabel: "Remove Friend",
      destructive: true,
      onConfirm: async () => {
        try {
          await fetch(`${API_URL}/api/friends/${friendId}`, {
            method: "DELETE",
            headers: authHeaders(),
          });
          fetchFriends();
          fetchLeaderboard();
          pushToast("Friend removed", "", "info");
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const logStats = async () => {
    if (!statWeight) {
      pushToast("Enter your current weight", "", "warning");
      return;
    }

    try {
      await fetch(`${API_URL}/api/weight-log`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          weight: Number(statWeight),
          bodyFat: statBodyFat ? Number(statBodyFat) : null,
        }),
      });

      setWeight(String(statWeight));
      setWeightHistory((old) => [
        ...old,
        {
          id: Date.now(),
          date: todayDate,
          weight: Number(statWeight),
          bodyFat: statBodyFat ? Number(statBodyFat) : null,
        },
      ]);
      setStatWeight("");
      setStatBodyFat("");
      fetchLeaderboard();
      pushToast("Stats logged", "Your leaderboard standing has been updated.", "success");
    } catch (err) {
      console.error(err);
      pushToast("Couldn't log stats", "Check your connection and try again.", "warning");
    }
  };

  // Log one set (reps + weight) for an exercise, detect whether it's a
  // new personal record against everything logged for that exercise so
  // far, and surface it with a toast.
  const logSet = (exerciseTitle) => {
    const draft = setDraft[exerciseTitle] || {};
    const reps = Number(draft.reps);
    const weight = Number(draft.weight);

    if (!reps || weight < 0 || draft.weight === undefined || draft.weight === "") {
      pushToast("Enter reps and weight", "", "warning");
      return;
    }

    const previousBest = bestSetByExercise[exerciseTitle];
    const isPR =
      !previousBest ||
      weight > previousBest.weight ||
      (weight === previousBest.weight && reps > previousBest.reps);

    const entry = {
      id: Date.now(),
      date: todayDate,
      exercise: exerciseTitle,
      reps,
      weight,
    };

    setExerciseLogs((old) => [...old, entry]);
    setSetDraft((old) => ({ ...old, [exerciseTitle]: { reps: "", weight: "" } }));

    if (isPR && previousBest) {
      pushToast(
        `🏆 New PR — ${exerciseTitle}`,
        `${weight}kg × ${reps} beats your previous best of ${previousBest.weight}kg × ${previousBest.reps}.`,
        "success"
      );
    } else {
      pushToast("Set logged", `${exerciseTitle}: ${weight}kg × ${reps}`, "success");
    }

    startRestTimer(exerciseTitle, 60);
  };

  // ---- Rest timer controls ----

  const startRestTimer = (exerciseTitle, seconds) => {
    setRestTimer({
      exercise: exerciseTitle,
      duration: seconds,
      secondsLeft: seconds,
      running: true,
    });
  };

  const toggleRestTimer = (exerciseTitle) => {
    setRestTimer((old) => {
      if (!old || old.exercise !== exerciseTitle) {
        return {
          exercise: exerciseTitle,
          duration: 60,
          secondsLeft: 60,
          running: true,
        };
      }
      return { ...old, running: !old.running };
    });
  };

  const resetRestTimer = (exerciseTitle, seconds) => {
    setRestTimer({
      exercise: exerciseTitle,
      duration: seconds,
      secondsLeft: seconds,
      running: true,
    });
  };

  // ---- Per-exercise notes (form cues / reminders), saved locally ----

  const setExerciseNote = (exerciseTitle, text) => {
    setExerciseNotes((old) => ({ ...old, [exerciseTitle]: text }));
  };

  const saveTargets = () => {
    const nextCalorie = Number(targetDraft.calorieTarget) || DEFAULT_CALORIE_TARGET;
    const nextProtein = Number(targetDraft.proteinTarget) || DEFAULT_PROTEIN_TARGET;
    const nextWater = Number(targetDraft.waterTarget) || DEFAULT_WATER_TARGET_ML;

    setCalorieTarget(nextCalorie);
    setProteinTarget(nextProtein);
    setWaterTarget(nextWater);
    pushToast("Targets updated", "Your dashboard and AI score now use your new goals.", "success");
  };

  // Send the current AI chat draft into the (still simulated, but now
  // real conversation-log) chat, instead of the old handler that just
  // set aiMessage back to itself on Enter and never appended anything.
  const sendAiMessage = () => {
    const text = aiMessage.trim();
    if (!text) return;

    const reply = askAI(text);

    setAiChatLog((old) => [
      ...old,
      { id: Date.now(), role: "user", text },
      { id: Date.now() + 1, role: "bot", text: reply },
    ]);
    setAiMessage("");
  };

  const handleLogin = async () => {
    setAuthError("");

    if (!loginEmail || !loginPassword) {
      setAuthError("Enter your email and password.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("token", data.token);

      setToken(data.token);
      setName(data.name || "");
      setWeight(data.weight || "");
      setSetup(true);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleRegister = async () => {
    setAuthError("");

    if (
      !name ||
      !weight ||
      !registerEmail ||
      !registerPassword
    ) {
      setAuthError("All fields are required.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: registerEmail,
          password: registerPassword,
          weight: Number(weight),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed"
        );
      }

      localStorage.setItem("token", data.token);

      setToken(data.token);
      setSetup(true);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setSetup(false);
  };

  const toggleWorkout = (day, workout) => {
    setSplit((old) =>
      old.map((item) => {
        if (item.day !== day) return item;

        const exists = item.workouts.includes(workout);

        return {
          ...item,
          workouts: exists
            ? item.workouts.filter((w) => w !== workout)
            : [...item.workouts, workout],
        };
      })
    );
  };

  const addMeal = () => {
    if (!selectedFood) {
      pushToast(
        "Select a food first",
        "Search above and pick a result from the list before adding.",
        "warning"
      );
      return;
    }

    const multiplier = Number(quantity) / 100;

    const newMeal = {
      id: Date.now(),
      date: todayDate,
      name: selectedFood.name,
      quantity: Number(quantity),
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Number(
        (selectedFood.protein * multiplier).toFixed(1)
      ),
      carbs: Number(
        (selectedFood.carbs * multiplier).toFixed(1)
      ),
      fat: Number(
        (selectedFood.fat * multiplier).toFixed(1)
      ),
    };

    setMeals((old) => [...old, newMeal]);
    setFoodQuery("");
    setSelectedFood(null);
    setFoodResults([]);
    setQuantity(100);
    pushToast("Meal logged", `${newMeal.name} · ${newMeal.calories} kcal`, "success");
  };

  const addWater = (amount) => {
    setWaterLogs((old) => [
      ...old,
      { id: Date.now() + Math.random(), date: todayDate, amount },
    ]);
    pushToast("Water logged", `+${amount} ml`, "success");
  };

  const removeMeal = (id) => {
    setMeals((old) =>
      old.filter((item) => item.id !== id)
    );
  };

  // Save an edited quantity for an already-logged meal, recalculating
  // calories/protein/carbs/fat from the same per-100g/ml rates used
  // when it was first added (rates are derived from the stored values
  // and original quantity, so no need to re-look-up the food).
  const saveMealEdit = (meal) => {
    const newQuantity = Number(editQuantityDraft);

    if (!newQuantity || newQuantity <= 0) {
      pushToast("Enter a valid quantity", "", "warning");
      return;
    }

    const ratio = newQuantity / meal.quantity;

    setMeals((old) =>
      old.map((item) =>
        item.id === meal.id
          ? {
              ...item,
              quantity: newQuantity,
              calories: Math.round(item.calories * ratio),
              protein: Number((item.protein * ratio).toFixed(1)),
              carbs: Number((item.carbs * ratio).toFixed(1)),
              fat: Number((item.fat * ratio).toFixed(1)),
            }
          : item
      )
    );

    setEditingMealId(null);
    setEditQuantityDraft("");
    pushToast("Meal updated", `${meal.name} · ${newQuantity}${meal.name.toLowerCase().includes("chai") || meal.name.toLowerCase().includes("juice") ? "ml" : "g"}`, "success");
  };

  const saveSetup = () => {
    if (!name || !weight) {
      pushToast("Missing details", "Please enter your name and weight.", "warning");
      return;
    }

    setSetup(true);
    setPage("dashboard");
  };

  const enableNotification = async () => {
    if (!("Notification" in window)) {
      pushToast("Not supported", "Notifications aren't supported in this browser.", "warning");
      return;
    }

    const permission =
      await Notification.requestPermission();

    if (permission === "granted") {
      new Notification("FitMeal AI", {
        body:
          "Your AI coach is ready. Check today's workout and nutrition.",
      });
      pushToast("Notifications enabled", "", "success");
    }
  };

  const resetApp = () => {
    askConfirm({
      title: "Reset all FitMeal AI data?",
      message: "This clears your profile, workout split and meal history from this device. This can't be undone.",
      confirmLabel: "Reset Everything",
      destructive: true,
      onConfirm: () => {
        localStorage.removeItem("fitmealApp");

        setName("");
        setWeight("");
        setSplit(createSplit());
        setMeals([]);
        setSetup(false);
        setPage("dashboard");
        setDarkMode(true);
      },
    });
  };

  // ---- Backup & restore — everything FitMeal AI keeps in localStorage
  // as a single portable JSON file, so someone can move to a new
  // device/browser or just keep a manual backup without a server. ----

  const exportData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      data: {
        name,
        weight,
        split,
        meals,
        waterLogs,
        setup,
        reminders,
        darkMode,
        calorieTarget,
        proteinTarget,
        waterTarget,
        exerciseLogs,
        weightHistory,
        exerciseNotes,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fitmeal-backup-${todayDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    pushToast("Backup exported", "Your data has been downloaded as a JSON file.", "success");
  };

  const importData = (file) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const data = parsed.data || parsed; // tolerate a raw dump too

        askConfirm({
          title: "Import this backup?",
          message: "This will overwrite your current profile, meals, water logs, exercise history and targets on this device.",
          confirmLabel: "Import & Overwrite",
          destructive: true,
          onConfirm: () => {
            setName(data.name || "");
            setWeight(data.weight || "");
            setSplit(data.split || createSplit());
            setMeals(data.meals || []);
            setWaterLogs(data.waterLogs || []);
            setSetup(data.setup ?? true);
            setReminders(data.reminders ?? true);
            setDarkMode(data.darkMode ?? true);
            setCalorieTarget(data.calorieTarget || DEFAULT_CALORIE_TARGET);
            setProteinTarget(data.proteinTarget || DEFAULT_PROTEIN_TARGET);
            setWaterTarget(data.waterTarget || DEFAULT_WATER_TARGET_ML);
            setTargetDraft({
              calorieTarget: data.calorieTarget || DEFAULT_CALORIE_TARGET,
              proteinTarget: data.proteinTarget || DEFAULT_PROTEIN_TARGET,
              waterTarget: data.waterTarget || DEFAULT_WATER_TARGET_ML,
            });
            setExerciseLogs(data.exerciseLogs || []);
            setWeightHistory(data.weightHistory || []);
            setExerciseNotes(data.exerciseNotes || {});

            pushToast("Backup restored", "Your data has been imported successfully.", "success");
          },
        });
      } catch (err) {
        console.error(err);
        pushToast("Import failed", "That file doesn't look like a valid FitMeal AI backup.", "warning");
      }
    };

    reader.readAsText(file);
  };

  const askAI = (message) => {
    const text = (message ?? aiMessage).toLowerCase();

    if (text.includes("protein")) {
      return `You've logged ${totals.protein.toFixed(
        1
      )}g protein today. Consider chicken, eggs, paneer, dal or curd.`;
    }

    if (text.includes("calorie")) {
      return `You've logged ${Math.round(
        totals.calories
      )} kcal today. Keep your meals balanced around your activity.`;
    }

    if (text.includes("workout")) {
      return today?.workouts?.length
        ? `Today's focus is ${today.workouts.join(
            " + "
          )}. Stay controlled and prioritize good form.`
        : "Today is currently a recovery day. Recovery is part of progress.";
    }

    if (text.includes("meal")) {
      return "Try oats + milk + banana for breakfast, rice + dal + chicken for lunch, and paneer + roti for dinner.";
    }

    return `AI analysis: ${aiInsight} Your current FitMeal score is ${aiScore}/100.`;
  };

  /* ================= AUTH ================= */

  if (!token) {
    return (
      <div
        className={
          darkMode
            ? "setupScreen dark"
            : "setupScreen light"
        }
      >
        <div className="authGlow glowOne" />
        <div className="authGlow glowTwo" />

        <div className="setupCard authCard">
          <div className="aiLogoLarge">
            <span>F</span>
            <i>✦</i>
          </div>

          <div className="authEyebrow">
            AI FITNESS SYSTEM
          </div>

          <h1>FitMeal AI</h1>

          <p className="authSubtitle">
            Your intelligent nutrition and workout
            command center.
          </p>

          <div className="authTabs">
            <button
              className={
                authMode === "login"
                  ? "authTab active"
                  : "authTab"
              }
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
            >
              Log In
            </button>

            <button
              className={
                authMode === "register"
                  ? "authTab active"
                  : "authTab"
              }
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
              }}
            >
              Create Account
            </button>
          </div>

          {authMode === "register" && (
            <>
              <label>Your name</label>
              <input
                placeholder="Enter your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

              <label>Body weight</label>
              <input
                type="number"
                placeholder="Weight in kg"
                value={weight}
                onChange={(e) =>
                  setWeight(e.target.value)
                }
              />

              <label>Email</label>
              <input
                placeholder="you@example.com"
                value={registerEmail}
                onChange={(e) =>
                  setRegisterEmail(e.target.value)
                }
              />

              <label>Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={registerPassword}
                onChange={(e) =>
                  setRegisterPassword(e.target.value)
                }
              />

              {authError && (
                <div className="authError">
                  ⚠ {authError}
                </div>
              )}

              <button
                className="mainButton"
                onClick={handleRegister}
              >
                Create My AI Profile →
              </button>
            </>
          )}

          {authMode === "login" && (
            <>
              <label>Email</label>
              <input
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) =>
                  setLoginEmail(e.target.value)
                }
              />

              <label>Password</label>
              <input
                type="password"
                placeholder="Your password"
                value={loginPassword}
                onChange={(e) =>
                  setLoginPassword(e.target.value)
                }
              />

              {authError && (
                <div className="authError">
                  ⚠ {authError}
                </div>
              )}

              <button
                className="mainButton"
                onClick={handleLogin}
              >
                Enter FitMeal AI →
              </button>
            </>
          )}

          <div className="authFeatures">
            <span>✦ AI INSIGHTS</span>
            <span>◈ NUTRITION</span>
            <span>▲ WORKOUTS</span>
          </div>
        </div>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* ================= SETUP ================= */

  if (!setup) {
    return (
      <div
        className={
          darkMode
            ? "setupScreen dark"
            : "setupScreen light"
        }
      >
        <div className="setupCard setupWizard">
          <div className="setupWizardHeader">
            <div className="aiLogoLarge small">
              <span>F</span>
              <i>✦</i>
            </div>

            <div>
              <div className="authEyebrow">
                INITIALIZE YOUR SYSTEM
              </div>

              <h1>Build Your Plan</h1>

              <p>
                Tell FitMeal AI what your week looks
                like.
              </p>
            </div>
          </div>

          <div className="setupInputs">
            <div>
              <label>Name</label>
              <input
                placeholder="Your name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />
            </div>

            <div>
              <label>Weight</label>
              <input
                type="number"
                placeholder="kg"
                value={weight}
                onChange={(e) =>
                  setWeight(e.target.value)
                }
              />
            </div>
          </div>

          <div className="setupSectionTitle">
            <span>01</span>
            WEEKLY WORKOUT INTENT
          </div>

          {split.map((day) => (
            <div
              className="setupDay"
              key={day.day}
            >
              <div className="setupDayTitle">
                <strong>
                  {DAYS[day.day - 1]}
                </strong>

                <span>
                  {day.workouts.length
                    ? `${day.workouts.length} selected`
                    : "No focus selected"}
                </span>
              </div>

              <div className="checkGrid">
                {WORKOUTS.map((workout) => (
                  <label
                    key={workout}
                    className={
                      day.workouts.includes(workout)
                        ? "checked"
                        : ""
                    }
                  >
                    <input
                      type="checkbox"
                      checked={day.workouts.includes(
                        workout
                      )}
                      onChange={() =>
                        toggleWorkout(
                          day.day,
                          workout
                        )
                      }
                    />

                    <span>{workout}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            className="mainButton"
            onClick={saveSetup}
          >
            Launch My Dashboard ✦
          </button>
        </div>

        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* ================= MAIN APP ================= */

  const navItems = [
    ["dashboard", "⌂", "Dashboard"],
    ["workout", "●", "Workout"],
    ["nutrition", "◈", "Nutrition"],
    ["planner", "□", "Meal Planner"],
    ["progress", "↗", "Progress"],
    ["exercises", "▲", "Exercises"],
    ["profile", "○", "Profile"],
    ["leaderboard", "★", "Leaderboard"],
  ];

  const currentNavLabel =
    navItems.find(([key]) => key === page)?.[2] || "Dashboard";

  return (
    <div
      className={
        (darkMode
          ? "appShell dark"
          : "appShell light") + (themeTransitioning ? " themeSwitching" : "")
      }
    >
      <a href="#mainContent" className="skipLink">
        Skip to content
      </a>

      <div className="ambient ambientOne" />
      <div className="ambient ambientTwo" />

      {/* Mobile top bar with hamburger — only visible on small screens */}
      <div className="mobileTopbar">
        <button
          className={
            navOpen
              ? "hamburgerButton hamburgerOpen"
              : "hamburgerButton"
          }
          onClick={() => setNavOpen((open) => !open)}
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <div className="mobileBrand">
          <div className="logo">F</div>
          <div>
            <strong>{currentNavLabel}</strong>
            <span>FitMeal AI</span>
          </div>
        </div>

        <div className="mobileScore">
          <span>{aiScore}</span>
        </div>
      </div>

      {/* Backdrop behind the drawer on mobile */}
      {navOpen && (
        <div
          className="navBackdrop"
          onClick={() => setNavOpen(false)}
        />
      )}

      <aside className={navOpen ? "sidebar sidebarOpen" : "sidebar"}>
        <div className="brand">
          <div className="logo">
            F
          </div>

          <div>
            <h2>FitMeal</h2>
            <span>AI Intelligence</span>
          </div>

          <button
            className="sidebarCloseButton"
            onClick={() => setNavOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="aiSideStatus">
          <span />
          AI SYSTEM ONLINE
        </div>

        <nav>
          {navItems.map(([key, icon, label]) => (
            <button
              key={key}
              className={
                page === key ? "selected" : ""
              }
              onClick={() => setPage(key)}
            >
              <span>{icon}</span>
              {label}

              {key === "dashboard" && (
                <small>AI</small>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebarBottom">
          {streak > 0 && (
            <div
              className="streakBadge"
              style={{ margin: "0 5px 10px", justifyContent: "center", width: "calc(100% - 10px)" }}
            >
              <span className="streakFlame">🔥</span>
              {streak} day{streak === 1 ? "" : "s"} streak
            </div>
          )}

          <div className="sidebarScore">
            <div>
              <span>AI SCORE</span>
              <strong>{aiScore}</strong>
            </div>

            <div className="miniRing">
              <i
                style={{
                  "--score": `${aiScore * 3.6}deg`,
                }}
              />
            </div>
          </div>

          <button onClick={enableNotification}>
            🔔 Notifications
          </button>

          <button
            className="themeSwitchRow"
            onClick={toggleTheme}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="themeSwitchLabel">
              {darkMode ? "☾ Dark Mode" : "☀ Light Mode"}
            </span>
            <span className={darkMode ? "miniThemeSwitch" : "miniThemeSwitch miniThemeSwitchLight"}>
              <i>{darkMode ? "☾" : "☀"}</i>
            </span>
          </button>

          <button
            className="logoutButton"
            onClick={logout}
          >
            ⇥ Log Out
          </button>
        </div>
      </aside>

      <main className="main" id="mainContent">
        <header className="topbar">
          <div>
            <div className="smallTitle">
              FITMEAL AI / COMMAND CENTER
            </div>

            <h1>
              {page === "dashboard"
                ? `Welcome back, ${name}`
                : page === "workout"
                ? "Workout Intelligence"
                : page === "nutrition"
                ? "Nutrition Intelligence"
                : page === "planner"
                ? "AI Meal Planner"
                : page === "progress"
                ? "Progress Analytics"
                : page === "exercises"
                ? "Exercise Intelligence"
                : page === "profile"
                ? "Profile & Settings"
                : "Friends Leaderboard"}
            </h1>
          </div>

          <div className="topbarRight">
            <div className="systemBadge">
              <span />
              AI ONLINE
            </div>

            <div className="profileMini">
              <div className="avatar">
                {name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>{name}</strong>
                <span>{weight} kg</span>
              </div>
            </div>
          </div>
        </header>

        {/* ================= DASHBOARD ================= */}

        {page === "dashboard" && (
          <>
            {(() => {
              const hour = new Date().getHours();
              const greeting =
                hour < 12
                  ? "Good morning"
                  : hour < 18
                  ? "Good afternoon"
                  : "Good evening";

              return (
                <section className="greetingBar">
                  <div>
                    <span className="greetingEyebrow">
                      {todayName.toUpperCase()}
                    </span>
                    <h1>
                      {greeting}, {name} 👋
                    </h1>
                  </div>

                  {streak > 0 && (
                    <div className="streakBadge">
                      <span className="streakFlame">🔥</span>
                      {streak} day{streak === 1 ? "" : "s"} streak
                    </div>
                  )}
                </section>
              );
            })()}

            <section className="panel progressPanel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    TODAY'S PROGRESS
                  </span>
                  <h2>Calories, Protein & Water</h2>
                </div>
              </div>

              <div className="progressRows">
                <div className="progressRow">
                  <div className="progressRowHead">
                    <b>🔥 Calories</b>
                    <span>
                      {Math.round(totals.calories)} / {calorieTarget} kcal
                    </span>
                  </div>
                  <div className="progressRowBar">
                    <i
                      style={{
                        width: `${Math.min(
                          (totals.calories / calorieTarget) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="progressRow">
                  <div className="progressRowHead">
                    <b>🥩 Protein</b>
                    <span>
                      {totals.protein.toFixed(0)} / {proteinTarget} g
                    </span>
                  </div>
                  <div className="progressRowBar">
                    <i
                      style={{
                        width: `${Math.min(
                          (totals.protein / proteinTarget) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="progressRow">
                  <div className="progressRowHead">
                    <b>💧 Water</b>
                    <span>
                      {(todayWater / 1000).toFixed(1)} /{" "}
                      {(waterTarget / 1000).toFixed(1)} L
                    </span>
                  </div>
                  <div className="progressRowBar water">
                    <i
                      style={{
                        width: `${Math.min(
                          (todayWater / waterTarget) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="waterCustomRow">
                    <input
                      type="number"
                      min="0"
                      value={customWaterAmount}
                      onChange={(e) => setCustomWaterAmount(e.target.value)}
                      placeholder="Custom ml"
                    />
                    <button
                      className="waterCustomBtn"
                      onClick={() => {
                        const amt = Number(customWaterAmount);
                        if (!amt || amt <= 0) {
                          pushToast("Enter an amount", "", "warning");
                          return;
                        }
                        addWater(amt);
                        setCustomWaterAmount("");
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="todayWorkoutMini">
              <div>
                <span className="panelEyebrow">
                  TODAY · DAY {todayIndex + 1}
                </span>
                <h3 style={{ margin: "6px 0 0" }}>
                  {today?.workouts?.length
                    ? today.workouts.join(" + ")
                    : "Recovery Day"}
                </h3>
              </div>
              <button onClick={() => setPage("workout")}>
                Start Workout →
              </button>
            </section>

            <section className="quickActionsRow">
              <button
                className="quickActionBtn"
                onClick={() => setPage("nutrition")}
              >
                <span>＋</span>
                Log Meal
              </button>

              <button
                className="quickActionBtn"
                onClick={() => addWater(WATER_STEP_ML)}
              >
                <span>💧</span>
                Add Water
              </button>

              <button
                className="quickActionBtn"
                onClick={() => setPage("workout")}
              >
                <span>🏋️</span>
                Log Workout
              </button>

              <button
                className="quickActionBtn"
                onClick={() => setPage("leaderboard")}
              >
                <span>⚖️</span>
                Update Weight
              </button>
            </section>

            <section className="hero">
              <div className="heroContent">
                <div className="heroEyebrow">
                  <span />
                  TODAY / {todayName.toUpperCase()}
                </div>

                <h2>
                  {today?.workouts?.length
                    ? today.workouts.join(" + ")
                    : "Recovery Day"}
                </h2>

                <p>
                  Your AI coach has analyzed your
                  current nutrition and workout
                  activity.
                </p>

                <div className="heroActions">
                  <button
                    onClick={() =>
                      setPage("workout")
                    }
                  >
                    View Workout
                  </button>

                  <button
                    className="secondary"
                    onClick={() =>
                      setPage("nutrition")
                    }
                  >
                    Log Nutrition
                  </button>
                </div>
              </div>

              <div className="heroCore">
                <div
                  className="heroRing"
                  style={{
                    "--progress": `${aiScore * 3.6}deg`,
                  }}
                >
                  <div>
                    <strong>
                      {aiScore}
                    </strong>
                    <span>AI SCORE</span>
                  </div>
                </div>

                <small>
                  DAILY READINESS
                </small>
              </div>
            </section>

            <section className="aiCoach">
              <div className="aiCoachGlow" />

              <div className="aiCoachHeader">
                <div className="aiOrb">
                  <span>✦</span>
                </div>

                <div>
                  <div className="aiStatus">
                    <span />
                    AI COACH ONLINE
                  </div>

                  <h2>
                    FitMeal Intelligence
                  </h2>

                  <p>
                    Live analysis of today's
                    fitness behavior.
                  </p>
                </div>

                <button
                  className="aiExpand"
                  onClick={() =>
                    setAiOpen(!aiOpen)
                  }
                >
                  {aiOpen
                    ? "Close AI"
                    : "Ask AI →"}
                </button>
              </div>

              <div className="aiBrief">
                <div className="aiBriefIcon">
                  ✦
                </div>

                <div>
                  <span>
                    TODAY'S AI INSIGHT
                  </span>

                  <h3>{aiInsight}</h3>

                  <p>{aiInsightDetail}</p>
                </div>
              </div>

              <div className="aiRecommendations">
                <div className="aiRecommendation">
                  <b>🍗</b>
                  <div>
                    <small>
                      NUTRITION
                    </small>
                    <strong>
                      {totals.protein.toFixed(
                        1
                      )}
                      g protein
                    </strong>
                    <span>
                      {totals.protein < proteinTarget
                        ? "Needs attention"
                        : "On track"}
                    </span>
                  </div>
                </div>

                <div className="aiRecommendation">
                  <b>🔥</b>
                  <div>
                    <small>
                      ENERGY
                    </small>
                    <strong>
                      {Math.round(
                        totals.calories
                      )}{" "}
                      kcal
                    </strong>
                    <span>
                      Today's intake
                    </span>
                  </div>
                </div>

                <div className="aiRecommendation">
                  <b>🏋️</b>
                  <div>
                    <small>
                      WORKOUT
                    </small>
                    <strong>
                      {today?.workouts?.length
                        ? `${today.workouts.length} focus`
                        : "Recovery"}
                    </strong>
                    <span>
                      {today?.workouts?.length
                        ? today.workouts.join(
                            " • "
                          )
                        : "Rest day"}
                    </span>
                  </div>
                </div>
              </div>

              {aiOpen && (
                <div className="aiChat">
                  <div className="aiChatMessages">
                    <div className="aiChatBubble bot">
                      <span>✦</span>
                      Hi {name}. Ask me about
                      protein, calories, meals or
                      today's workout.
                    </div>

                    {aiChatLog.map((entry) =>
                      entry.role === "user" ? (
                        <div className="aiChatBubble user" key={entry.id}>
                          {entry.text}
                        </div>
                      ) : (
                        <div className="aiChatBubble bot" key={entry.id}>
                          <span>✦</span>
                          {entry.text}
                        </div>
                      )
                    )}
                  </div>

                  <div className="aiChatInput">
                    <input
                      value={aiMessage}
                      onChange={(e) =>
                        setAiMessage(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          sendAiMessage();
                        }
                      }}
                      placeholder="Ask FitMeal AI..."
                    />

                    <button onClick={sendAiMessage}>
                      ↑
                    </button>
                  </div>
                </div>
              )}

              <div className="aiFooter">
                <span>
                  ✦ FITMEAL AI ENGINE
                </span>

                <span>
                  Analysis generated from
                  today's activity
                </span>
              </div>
            </section>

            <div className="dashboardGrid">
              <section className="panel">
                <div className="panelHeader">
                  <div>
                    <span className="panelEyebrow">
                      TODAY
                    </span>
                    <h2>
                      Workout Focus
                    </h2>
                  </div>

                  <button
                    className="textButton"
                    onClick={() =>
                      setPage("workout")
                    }
                  >
                    Open Plan →
                  </button>
                </div>

                <div className="todayWorkout">
                  {today?.workouts?.length ? (
                    today.workouts.map(
                      (workout) => (
                        <div
                          className="workoutChip"
                          key={workout}
                        >
                          <span>●</span>
                          {workout}
                        </div>
                      )
                    )
                  ) : (
                    <div className="emptyState">
                      <strong>
                        Recovery mode
                      </strong>
                      <span>
                        No workout selected
                        for today.
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <section className="panel">
                <div className="panelHeader">
                  <div>
                    <span className="panelEyebrow">
                      NEXT UP
                    </span>
                    <h2>
                      Tomorrow
                    </h2>
                  </div>

                  <span className="badge">
                    DAY {tomorrowIndex + 1} ·{" "}
                    {tomorrow?.workouts?.length
                      ? tomorrow.workouts.join(" + ")
                      : "REST"}
                  </span>
                </div>

                <div className="tomorrowCard">
                  <div className="tomorrowIcon">
                    {tomorrow?.workouts?.length
                      ? "🏋️"
                      : "☾"}
                  </div>

                  <div>
                    <strong>
                      {tomorrow?.workouts
                        ?.length
                        ? tomorrow.workouts.join(
                            " + "
                          )
                        : "Rest Day"}
                    </strong>

                    <span>
                      {DAYS[
                        tomorrowIndex
                      ]}
                    </span>
                  </div>
                </div>

                <select
                  value={
                    tomorrow?.workouts?.[0] ||
                    "Rest"
                  }
                  onChange={(e) => {
                    const selected =
                      e.target.value;

                    setSplit((old) =>
                      old.map((item) =>
                        item.day ===
                        tomorrowIndex + 1
                          ? {
                              ...item,
                              workouts:
                                selected ===
                                "Rest"
                                  ? []
                                  : [selected],
                            }
                          : item
                      )
                    );
                  }}
                >
                  {WORKOUTS.map(
                    (workout) => (
                      <option
                        key={workout}
                        value={workout}
                      >
                        {workout}
                      </option>
                    )
                  )}
                </select>
              </section>
            </div>

            <section className="panel quickMealPanel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    AI FOOD TRACKER
                  </span>
                  <h2>
                    Quick Meal Entry
                  </h2>
                </div>

                <button
                  className="textButton"
                  onClick={() =>
                    setPage("nutrition")
                  }
                >
                  Full Nutrition →
                </button>
              </div>

              <FoodSearchBox
                query={foodQuery}
                onQueryChange={(value) => {
                  setFoodQuery(value);
                  setSelectedFood(null);
                }}
                results={foodResults}
                loading={foodSearching}
                selected={selectedFood}
                onSelect={selectFood}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onAdd={addMeal}
                placeholder="What did you eat or drink? e.g. dal, biryani, vada pav, chai"
                addLabel="+ Add Meal"
              />
            </section>
          </>
        )}

        {/* ================= WORKOUT ================= */}

        {page === "workout" && (
          <>
            <section className="pageIntro">
              <p>AI TRAINING SYSTEM</p>
              <h2>Workout Schedule</h2>
              <span>
                Build your weekly training split.
              </span>
            </section>

            <div className="workoutSchedule">
              {split.map((day) => (
                <div
                  className={`workoutDay ${
                    day.day ===
                    todayIndex + 1
                      ? "current"
                      : ""
                  }`}
                  key={day.day}
                >
                  <div className="dayTitle">
                    <div>
                      <span>
                        DAY {day.day}
                      </span>
                      <h3>
                        {DAYS[day.day - 1]}
                      </h3>
                    </div>

                    {day.day ===
                      todayIndex + 1 && (
                      <b>TODAY</b>
                    )}
                  </div>

                  <div className="workoutOptions">
                    {WORKOUTS.map(
                      (workout) => (
                        <label
                          key={workout}
                          className={
                            day.workouts.includes(
                              workout
                            )
                              ? "workoutSelected"
                              : ""
                          }
                        >
                          <input
                            type="checkbox"
                            checked={day.workouts.includes(
                              workout
                            )}
                            onChange={() =>
                              toggleWorkout(
                                day.day,
                                workout
                              )
                            }
                          />

                          <span>
                            {workout}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ================= NUTRITION ================= */}

        {page === "nutrition" && (
          <>
            <section className="pageIntro">
              <p>AI NUTRITION ENGINE</p>
              <h2>Nutrition Dashboard</h2>
              <span>
                Track food and drinks and monitor your daily
                nutrition profile.
              </span>
            </section>

            <div className="nutritionLarge">
              <div className="nutritionCard calories">
                <span>CALORIES</span>
                <strong>
                  {Math.round(
                    totals.calories
                  )}
                </strong>
                <small>kcal</small>
              </div>

              <div className="nutritionCard protein">
                <span>PROTEIN</span>
                <strong>
                  {totals.protein.toFixed(1)}
                </strong>
                <small>grams</small>
              </div>

              <div className="nutritionCard carbs">
                <span>CARBS</span>
                <strong>
                  {totals.carbs.toFixed(1)}
                </strong>
                <small>grams</small>
              </div>

              <div className="nutritionCard fat">
                <span>FAT</span>
                <strong>
                  {totals.fat.toFixed(1)}
                </strong>
                <small>grams</small>
              </div>
            </div>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    TODAY'S SPLIT
                  </span>
                  <h2>Macro Breakdown</h2>
                </div>
              </div>

              {totals.protein + totals.carbs + totals.fat > 0 ? (
                <div className="macroRingRow">
                  <div className="macroRing" style={macroRingStyle}>
                    <div>
                      <strong>
                        {Math.round(totals.protein + totals.carbs + totals.fat)}g
                      </strong>
                      <span>TOTAL</span>
                    </div>
                  </div>

                  <div className="macroLegend">
                    <div className="macroLegendRow">
                      <i className="protein" />
                      Protein
                      <b>{totals.protein.toFixed(1)}g</b>
                    </div>
                    <div className="macroLegendRow">
                      <i className="carbs" />
                      Carbs
                      <b>{totals.carbs.toFixed(1)}g</b>
                    </div>
                    <div className="macroLegendRow">
                      <i className="fat" />
                      Fat
                      <b>{totals.fat.toFixed(1)}g</b>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="emptyState">
                  <strong>No macros yet</strong>
                  <span>Log a meal below to see today's protein / carb / fat split.</span>
                </div>
              )}
            </section>

            <section className="panel weekPanel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    THIS WEEK
                  </span>
                  <h2>Weekly Breakdown</h2>
                </div>

                <span className="badge">
                  RESETS SUNDAY
                </span>
              </div>

              <div className="weekGrid">
                {weekDates.map((date, i) => (
                  <div
                    className={
                      date === todayDate
                        ? "weekDayCard currentDay"
                        : "weekDayCard"
                    }
                    key={date}
                  >
                    <span>
                      {DAYS[i]
                        .slice(0, 3)
                        .toUpperCase()}
                    </span>

                    <strong>
                      {Math.round(
                        weeklyTotals[i].calories
                      )}
                    </strong>

                    <small>kcal</small>
                    <small>
                      P{" "}
                      {weeklyTotals[
                        i
                      ].protein.toFixed(1)}
                      g
                    </small>
                    <small>
                      C{" "}
                      {weeklyTotals[
                        i
                      ].carbs.toFixed(1)}
                      g
                    </small>
                  </div>
                ))}
              </div>
            </section>

            {recentMeals.length > 0 && (
              <section className="panel">
                <div className="panelHeader">
                  <div>
                    <span className="panelEyebrow">
                      ONE-TAP LOGGING
                    </span>
                    <h2>Log Again</h2>
                  </div>
                </div>

                <div className="recentMealsRow">
                  {recentMeals.map((item) => (
                    <button
                      className="recentMealChip"
                      key={item.id}
                      onClick={() => {
                        const newMeal = {
                          ...item,
                          id: Date.now(),
                          date: todayDate,
                        };
                        setMeals((old) => [...old, newMeal]);
                        pushToast(
                          "Meal logged",
                          `${newMeal.name} · ${newMeal.calories} kcal`,
                          "success"
                        );
                      }}
                    >
                      <strong>{item.name}</strong>
                      <span>
                        {item.quantity}g · {item.calories} kcal
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    LIVE FOOD & DRINK SEARCH
                  </span>
                  <h2>Add Food or Drink</h2>
                  <p className="foodSearchNote">
                    Indian foods search instantly offline. Anything else falls back to USDA's free
                    DEMO_KEY, which is limited to 30 searches/hour — add your own key in the code for
                    heavier use.
                  </p>
                </div>
              </div>

              <FoodSearchBox
                query={foodQuery}
                onQueryChange={(value) => {
                  setFoodQuery(value);
                  setSelectedFood(null);
                }}
                results={foodResults}
                loading={foodSearching}
                selected={selectedFood}
                onSelect={selectFood}
                quantity={quantity}
                onQuantityChange={setQuantity}
                onAdd={addMeal}
                placeholder="Search Indian food or drinks: samosa, biryani, lassi, chai..."
                addLabel="Add Food"
              />

              <div className="foodHints">
                {FOOD_SUGGESTIONS.map((food) => (
                  <button
                    key={food}
                    onClick={() => {
                      setSelectedFood(null);
                      setFoodQuery(food);
                    }}
                  >
                    {food}
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    TODAY
                  </span>
                  <h2>Food Log</h2>
                </div>

                <span className="badge">
                  {todayMeals.length} MEALS
                </span>
              </div>

              {todayMeals.length === 0 ? (
                <div className="emptyState large">
                  <span>◈</span>
                  <strong>
                    No meals logged
                  </strong>
                  <p>
                    Add your first meal above
                    and let FitMeal AI analyze
                    your day.
                  </p>
                </div>
              ) : (
                <div className="foodList">
                  {todayMeals.map((item) => {
                    const isEditing = editingMealId === item.id;

                    if (isEditing) {
                      return (
                        <div className="foodRow foodRowEditing" key={item.id}>
                          <div className="foodAvatar">
                            {item.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <strong>{item.name}</strong>
                            <span>editing quantity</span>
                          </div>

                          <input
                            type="number"
                            className="foodEditInput"
                            value={editQuantityDraft}
                            onChange={(e) => setEditQuantityDraft(e.target.value)}
                            autoFocus
                          />

                          <button
                            className="foodEditSave"
                            onClick={() => saveMealEdit(item)}
                          >
                            Save
                          </button>

                          <button
                            className="deleteBtn"
                            onClick={() => setEditingMealId(null)}
                            aria-label="Cancel edit"
                          >
                            ×
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        className="foodRow"
                        key={item.id}
                      >
                        <div className="foodAvatar">
                          {item.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {item.name}
                          </strong>
                          <span>
                            {item.quantity}g
                          </span>
                        </div>

                        <b>
                          {item.calories} kcal
                        </b>

                        <span>
                          P{" "}
                          {item.protein}g
                        </span>

                        <span>
                          C{" "}
                          {item.carbs}g
                        </span>

                        <div className="foodRowActions">
                          <button
                            className="foodEditBtn"
                            onClick={() => {
                              setEditingMealId(item.id);
                              setEditQuantityDraft(String(item.quantity));
                            }}
                            aria-label={`Edit ${item.name}`}
                            title="Edit quantity"
                          >
                            ✎
                          </button>

                          <button
                            className="deleteBtn"
                            onClick={() =>
                              removeMeal(
                                item.id
                              )
                            }
                            aria-label={`Remove ${item.name}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* ================= PLANNER ================= */}

        {page === "planner" && (
          <>
            <section className="pageIntro">
              <p>AI MEAL INTELLIGENCE</p>
              <h2>Meal Planner</h2>
              <span>
                Simple meal ideas matched to your
                training day.
              </span>
            </section>

            <div className="plannerHero">
              <div className="plannerOrb">
                ✦
              </div>

              <div>
                <span>
                  AI RECOMMENDATION
                </span>

                <h2>
                  {totals.protein < 40
                    ? "Prioritize protein today."
                    : "Keep your nutrition consistent."}
                </h2>

                <p>
                  FitMeal AI recommends
                  nutrient-dense meals around
                  your activity.
                </p>
              </div>
            </div>

            <div className="mealCards">
              {[
                [
                  "BREAKFAST",
                  "Oats + Milk + Banana",
                  "Carbs + protein to start the day.",
                  "08:00",
                ],
                [
                  "LUNCH",
                  "Rice + Dal + Chicken",
                  "Balanced meal for recovery and energy.",
                  "13:30",
                ],
                [
                  "PRE-WORKOUT",
                  "Banana + Oats",
                  "Simple fuel before training.",
                  "16:30",
                ],
                [
                  "POST-WORKOUT",
                  "Chicken + Rice",
                  "Protein and carbs after training.",
                  "19:00",
                ],
                [
                  "SNACK",
                  "Curd + Banana",
                  "Light and convenient snack.",
                  "11:00",
                ],
                [
                  "DINNER",
                  "Paneer + Roti",
                  "Balanced evening meal.",
                  "21:00",
                ],
              ].map(
                ([type, title, text, time]) => (
                  <div
                    className="mealCard"
                    key={type}
                  >
                    <div className="mealCardTop">
                      <span>{type}</span>
                      <b>{time}</b>
                    </div>

                    <div className="mealEmoji">
                      {type ===
                      "BREAKFAST"
                        ? "🥣"
                        : type ===
                          "LUNCH"
                        ? "🍛"
                        : type ===
                          "PRE-WORKOUT"
                        ? "🍌"
                        : type ===
                          "POST-WORKOUT"
                        ? "🍗"
                        : type ===
                          "SNACK"
                        ? "🥛"
                        : "🫓"}
                    </div>

                    <h3>{title}</h3>
                    <p>{text}</p>

                    <button
                      onClick={() => {
                        const first =
                          title
                            .split("+")[0]
                            .trim();

                        setSelectedFood(null);
                        setFoodQuery(first);
                        setPage("nutrition");
                      }}
                    >
                      Search Ingredient →
                    </button>
                  </div>
                )
              )}
            </div>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    DAILY FLOW
                  </span>
                  <h2>Meal Timing</h2>
                </div>
              </div>

              <div className="timeline">
                {[
                  ["08:00", "Breakfast"],
                  ["11:00", "Snack"],
                  ["13:30", "Lunch"],
                  ["16:30", "Pre-Workout"],
                  ["19:00", "Post-Workout"],
                  ["21:00", "Dinner"],
                ].map(
                  ([time, label]) => (
                    <div key={time}>
                      <b>{time}</b>
                      <span>{label}</span>
                    </div>
                  )
                )}
              </div>
            </section>
          </>
        )}

        {/* ================= PROGRESS ================= */}

        {page === "progress" && (
          <>
            <section className="pageIntro">
              <p>AI ANALYTICS</p>
              <h2>Progress Center</h2>
              <span>
                A live overview of your current
                activity.
              </span>
            </section>

            <div className="progressHero">
              <div className="progressBigRing">
                <div>
                  <strong>
                    {aiScore}
                  </strong>
                  <span>
                    AI SCORE
                  </span>
                </div>
              </div>

              <div>
                <span>
                  PERFORMANCE STATUS
                </span>

                <h2>
                  {aiScore >= 75
                    ? "Excellent momentum"
                    : aiScore >= 45
                    ? "Building momentum"
                    : "Time to activate"}
                </h2>

                <p>
                  Your score combines today's
                  nutrition logging, protein
                  intake and meal consistency.
                </p>

                {streak > 0 && (
                  <div
                    className="streakBadge"
                    style={{ marginTop: 12 }}
                  >
                    <span className="streakFlame">🔥</span>
                    {streak} day{streak === 1 ? "" : "s"} logging streak
                  </div>
                )}
              </div>
            </div>

            <div className="progressGrid">
              <div>
                <span>
                  WORKOUT DAYS
                </span>

                <strong>5 / 7</strong>

                <div className="progressBar">
                  <i
                    style={{
                      width: "71%",
                    }}
                  />
                </div>

                <small>
                  Weekly target
                </small>
              </div>

              <div>
                <span>
                  MEALS LOGGED
                </span>

                <strong>
                  {todayMeals.length}
                </strong>

                <div className="progressBar">
                  <i
                    style={{
                      width: `${Math.min(
                        todayMeals.length *
                          15,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <small>
                  Daily consistency
                </small>
              </div>

              <div>
                <span>
                  PROTEIN TODAY
                </span>

                <strong>
                  {totals.protein.toFixed(
                    1
                  )}
                  g
                </strong>

                <div className="progressBar">
                  <i
                    style={{
                      width: `${Math.min(
                        totals.protein *
                          1.25,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <small>
                  AI target tracking
                </small>
              </div>

              <div>
                <span>
                  CALORIES LOGGED
                </span>

                <strong>
                  {Math.round(
                    totals.calories
                  )}
                </strong>

                <div className="progressBar">
                  <i
                    style={{
                      width: `${Math.min(
                        totals.calories /
                          20,
                        100
                      )}%`,
                    }}
                  />
                </div>

                <small>
                  Daily energy
                </small>
              </div>
            </div>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    BODY WEIGHT
                  </span>

                  <h2>Weight Trend</h2>
                </div>

                <button
                  className="textButton"
                  onClick={() => setPage("leaderboard")}
                >
                  Log Weight →
                </button>
              </div>

              <WeightChart entries={weightHistory} />
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    STRENGTH
                  </span>

                  <h2>Personal Records</h2>
                </div>

                <button
                  className="textButton"
                  onClick={() => setPage("exercises")}
                >
                  Log a Set →
                </button>
              </div>

              <div className="volumeStatsRow">
                <div className="volumeStat">
                  <span>TODAY'S VOLUME</span>
                  <strong>{todayVolume.toLocaleString()} kg</strong>
                  <small>{todaySetCount} set{todaySetCount === 1 ? "" : "s"} logged</small>
                </div>
                <div className="volumeStat">
                  <span>THIS WEEK'S VOLUME</span>
                  <strong>{weeklyVolume.toLocaleString()} kg</strong>
                  <small>{weeklySetCount} set{weeklySetCount === 1 ? "" : "s"} logged</small>
                </div>
              </div>

              {Object.keys(bestSetByExercise).length === 0 ? (
                <div className="emptyState">
                  <strong>No sets logged yet</strong>
                  <span>Open any exercise in the Exercise Library and log a set to start tracking PRs.</span>
                </div>
              ) : (
                <div className="prGrid">
                  {Object.entries(bestSetByExercise).map(([exercise, log]) => (
                    <div className="prCard" key={exercise}>
                      <span>{exercise}</span>
                      <strong>
                        {log.weight}kg × {log.reps}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    AI FEEDBACK
                  </span>

                  <h2>
                    Today's Analysis
                  </h2>
                </div>
              </div>

              <div className="analysisGrid">
                <div>
                  <span>✦</span>
                  <strong>
                    Nutrition
                  </strong>
                  <p>
                    {aiInsight}
                  </p>
                </div>

                <div>
                  <span>⚡</span>
                  <strong>
                    Consistency
                  </strong>
                  <p>
                    {todayMeals.length >= 3
                      ? "Good logging consistency today."
                      : "Log more meals to improve your data quality."}
                  </p>
                </div>

                <div>
                  <span>🏋️</span>
                  <strong>
                    Training
                  </strong>
                  <p>
                    {today?.workouts
                      ?.length
                      ? "Your training focus is ready."
                      : "Recovery day detected."}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ================= EXERCISES ================= */}

        {page === "exercises" && (
          <>
            <section className="pageIntro">
              <p>AI EXERCISE INTELLIGENCE</p>
              <h2>Exercise Library</h2>
              <span>
                Explore movement cues and training
                guidance.
              </span>
            </section>

            <div className="exerciseAIBar">
              <div className="exerciseAIIcon">
                ✦
              </div>

              <div>
                <span>
                  FORM ASSISTANT ONLINE
                </span>

                <strong>
                  Select an exercise to view
                  technique cues.
                </strong>

                <div className="muscleLegend">
                  <i />
                  Red highlight = effective / targeted muscle area
                </div>
              </div>

              <button
                onClick={() =>
                  setPage("workout")
                }
              >
                View Workout →
              </button>
            </div>

            <div className="exerciseFilterBar">
              <input
                className="exerciseSearchInput"
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Search exercises — squat, curl, row..."
              />

              <div className="exerciseTabRow">
                {muscleGroups.map((group) => (
                  <button
                    key={group}
                    className={
                      exerciseFilter === group
                        ? "exerciseTab active"
                        : "exerciseTab"
                    }
                    onClick={() => setExerciseFilter(group)}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <div className="exerciseCount">
              {filteredExercises.length} exercise
              {filteredExercises.length === 1 ? "" : "s"}
              {exerciseFilter !== "All" ? ` in ${exerciseFilter}` : ""}
            </div>

            {filteredExercises.length === 0 ? (
              <div className="emptyState large">
                <span>▲</span>
                <strong>No exercises match</strong>
                <p>Try a different muscle group or clear your search.</p>
              </div>
            ) : (
            <div className="exerciseGrid">
              {filteredExercises.map(
                (exercise, index) => {
                  const {
                    muscle,
                    title,
                    description,
                    highlight,
                    pose,
                  } = exercise;

                  const open =
                    expandedExercise === title;

                  return (
                    <div
                      className={`exerciseCard ${
                        open
                          ? "exerciseCardOpen"
                          : ""
                      }`}
                      key={title}
                      onClick={() =>
                        setExpandedExercise(
                          open ? null : title
                        )
                      }
                    >
                      <div className="exerciseVisual">
                        <div className="exerciseNumber">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </div>

                        <div className="exerciseMuscleTag">
                          <i />
                          {highlight
                            .map(
                              (m) =>
                                MUSCLE_LABELS[m] ||
                                m
                            )
                            .join(" + ")}
                        </div>

                        <ExercisePosePair
                          exercise={exercise}
                          size={72}
                        />

                        <div className="exerciseGridGlow" />
                      </div>

                      <div className="exerciseInfo">
                        <span>
                          {muscle.toUpperCase()}
                        </span>

                        <h3>{title}</h3>

                        <p>
                          {description}
                        </p>

                        {bestSetByExercise[title] && (
                          <div className="exerciseBestLift">
                            🏆 Best: {bestSetByExercise[title].weight}kg ×{" "}
                            {bestSetByExercise[title].reps}
                          </div>
                        )}

                        <div
                          className="exerciseLogRow"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="number"
                            placeholder="kg"
                            value={setDraft[title]?.weight ?? ""}
                            onChange={(e) =>
                              setSetDraft((old) => ({
                                ...old,
                                [title]: {
                                  ...old[title],
                                  weight: e.target.value,
                                },
                              }))
                            }
                          />
                          <input
                            type="number"
                            placeholder="reps"
                            value={setDraft[title]?.reps ?? ""}
                            onChange={(e) =>
                              setSetDraft((old) => ({
                                ...old,
                                [title]: {
                                  ...old[title],
                                  reps: e.target.value,
                                },
                              }))
                            }
                          />
                          <button onClick={() => logSet(title)}>
                            Log Set
                          </button>
                        </div>

                        <b>
                          {open
                            ? "CLOSE GUIDE ↑"
                            : "OPEN FORM GUIDE ↓"}
                        </b>
                      </div>

                      {open && (
                        <div className="exerciseSteps">
                          {[
                            [
                              "01",
                              "SETUP",
                              "Position yourself correctly and brace your body.",
                              "start",
                            ],
                            [
                              "02",
                              "EXECUTE",
                              description,
                              "end",
                            ],
                            [
                              "03",
                              "CONTROL",
                              "Return slowly and keep the movement controlled.",
                              "start",
                            ],
                          ].map(
                            ([
                              number,
                              label,
                              text,
                              frame,
                            ]) => (
                              <div
                                className="stepItem"
                                key={number}
                              >
                                <div className="stepFigure">
                                  <ExerciseFigure
                                    highlight={
                                      highlight
                                    }
                                    arm={
                                      pose[frame]
                                        .arm ?? 8
                                    }
                                    arm2={
                                      pose[frame]
                                        .arm2 ?? 0
                                    }
                                    leg={
                                      pose[frame]
                                        .leg ?? 4
                                    }
                                    leg2={
                                      pose[frame]
                                        .leg2 ?? 0
                                    }
                                    size={38}
                                  />
                                </div>

                                <div>
                                  <span>
                                    {number}
                                  </span>

                                  <b>
                                    {label}
                                  </b>

                                  <p>
                                    {text}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {open && (
                        <div
                          className="exerciseDetailExtra"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="restTimerBox">
                            <div className="restTimerHead">
                              <span>REST TIMER</span>
                              {restTimer &&
                                restTimer.exercise === title && (
                                  <b>
                                    {restTimer.secondsLeft === 0
                                      ? "Rest's over"
                                      : restTimer.running
                                      ? "Running"
                                      : "Paused"}
                                  </b>
                                )}
                            </div>

                            <div className="restTimerRow">
                              <div
                                className={
                                  restTimer &&
                                  restTimer.exercise === title &&
                                  restTimer.running
                                    ? "restTimerDial restTimerDialActive"
                                    : "restTimerDial"
                                }
                              >
                                {restTimer && restTimer.exercise === title
                                  ? `${Math.floor(
                                      restTimer.secondsLeft / 60
                                    )}:${String(
                                      restTimer.secondsLeft % 60
                                    ).padStart(2, "0")}`
                                  : "1:00"}
                              </div>

                              <div className="restTimerActions">
                                <button onClick={() => resetRestTimer(title, 30)}>
                                  30s
                                </button>
                                <button onClick={() => resetRestTimer(title, 60)}>
                                  60s
                                </button>
                                <button onClick={() => resetRestTimer(title, 90)}>
                                  90s
                                </button>
                                <button
                                  className="restTimerToggle"
                                  onClick={() => toggleRestTimer(title)}
                                >
                                  {restTimer &&
                                  restTimer.exercise === title &&
                                  restTimer.running
                                    ? "Pause"
                                    : "Start"}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="exerciseHistoryNotesRow">
                            <div className="exerciseHistoryBox">
                              <span className="exerciseDetailLabel">
                                RECENT SETS
                              </span>

                              {historyForExercise(title).length === 0 ? (
                                <div className="exerciseHistoryEmpty">
                                  No sets logged yet for this exercise.
                                </div>
                              ) : (
                                <div className="exerciseHistoryList">
                                  {historyForExercise(title)
                                    .slice(0, 6)
                                    .map((log) => (
                                      <div
                                        className="exerciseHistoryRow"
                                        key={log.id}
                                      >
                                        <span>{log.date}</span>
                                        <b>
                                          {log.weight}kg × {log.reps}
                                        </b>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>

                            <div className="exerciseNotesBox">
                              <span className="exerciseDetailLabel">
                                YOUR NOTES
                              </span>
                              <textarea
                                value={exerciseNotes[title] || ""}
                                onChange={(e) =>
                                  setExerciseNote(title, e.target.value)
                                }
                                placeholder="Form cues, machine settings, reminders..."
                                rows={4}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
            )}
          </>
        )}

        {/* ================= PROFILE ================= */}

        {page === "profile" && (
          <>
            <section className="pageIntro">
              <p>ACCOUNT CONTROL</p>
              <h2>Profile & Settings</h2>
              <span>
                Manage your FitMeal AI experience.
              </span>
            </section>

            <section className="profileHero">
              <div className="profileBigAvatar">
                {name
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <span>FITMEAL MEMBER</span>
                <h2>{name}</h2>
                <p>
                  Current weight:{" "}
                  <strong>
                    {weight} kg
                  </strong>
                </p>
                {streak > 0 && (
                  <div className="streakBadge" style={{ marginTop: 8 }}>
                    <span className="streakFlame">🔥</span>
                    {streak} day{streak === 1 ? "" : "s"} streak
                  </div>
                )}
              </div>

              <div className="profileScore">
                <span>AI SCORE</span>
                <strong>{aiScore}</strong>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    INTERFACE
                  </span>
                  <h2>Appearance</h2>
                </div>
              </div>

              <div className="appearanceSetting">
                <div>
                  <strong>
                    Interface theme
                  </strong>

                  <p>
                    Switch between dark and light
                    FitMeal AI.
                  </p>
                </div>

                <button
                  className="themeToggle bigThemeToggle"
                  onClick={toggleTheme}
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <span
                    className={
                      darkMode
                        ? "activeTheme"
                        : ""
                    }
                  >
                    ☾ Dark
                  </span>

                  <span
                    className={
                      !darkMode
                        ? "activeTheme"
                        : ""
                    }
                  >
                    ☀ Light
                  </span>

                  <i className={darkMode ? "themeToggleKnob" : "themeToggleKnob themeToggleKnobLight"} />
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    DAILY GOALS
                  </span>
                  <h2>Nutrition Targets</h2>
                </div>
              </div>

              <div className="targetInputs">
                <div>
                  <label>Calorie target (kcal)</label>
                  <input
                    type="number"
                    value={targetDraft.calorieTarget}
                    onChange={(e) =>
                      setTargetDraft((old) => ({
                        ...old,
                        calorieTarget: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label>Protein target (g)</label>
                  <input
                    type="number"
                    value={targetDraft.proteinTarget}
                    onChange={(e) =>
                      setTargetDraft((old) => ({
                        ...old,
                        proteinTarget: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label>Water target (ml)</label>
                  <input
                    type="number"
                    value={targetDraft.waterTarget}
                    onChange={(e) =>
                      setTargetDraft((old) => ({
                        ...old,
                        waterTarget: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <button className="outlineButton" onClick={saveTargets}>
                Save Targets
              </button>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    PREFERENCES
                  </span>
                  <h2>
                    Notifications
                  </h2>
                </div>
              </div>

              <div className="settingRow">
                <div>
                  <strong>
                    AI reminders
                  </strong>

                  <p>
                    Receive reminders about your
                    daily plan.
                  </p>
                </div>

                <button
                  className={
                    reminders
                      ? "toggle active"
                      : "toggle"
                  }
                  onClick={() =>
                    setReminders(
                      !reminders
                    )
                  }
                >
                  <i />
                </button>
              </div>

              <button
                className="outlineButton"
                onClick={
                  enableNotification
                }
              >
                Enable Browser Notifications
              </button>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    YOUR DATA
                  </span>
                  <h2>Backup & Restore</h2>
                </div>
              </div>

              <p className="backupNote">
                Export everything FitMeal AI has stored on this device — profile, meals,
                water logs, exercise history, weight trend and targets — as a single JSON
                file. Import it back here (or on another device) to restore it.
              </p>

              <div className="backupActions">
                <button className="outlineButton" onClick={exportData}>
                  ⇩ Export Backup (.json)
                </button>

                <label className="outlineButton backupImportLabel">
                  ⇧ Import Backup
                  <input
                    type="file"
                    accept="application/json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) importData(file);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </section>

            <section className="panel dangerPanel">
              <div>
                <span className="panelEyebrow">
                  DANGER ZONE
                </span>

                <h2>
                  Reset Application
                </h2>

                <p>
                  Remove your saved profile,
                  workout split and meal history.
                </p>
              </div>

              <button
                className="danger"
                onClick={resetApp}
              >
                Reset All Data
              </button>
            </section>
          </>
        )}

        {/* ================= LEADERBOARD ================= */}

        {page === "leaderboard" && (
          <>
            <section className="pageIntro">
              <p>AI SOCIAL COMPETITION</p>
              <h2>Friends Leaderboard</h2>
              <span>
                Compete with friends on protein, weight loss and body fat loss.
              </span>
            </section>

           <section className="panel">
  <div className="panelHeader">
    <div>
      <span className="panelEyebrow">
        YOUR CODE
      </span>
      <h2>Add Friends</h2>
    </div>

    {friendCode && (
      <span
        className="badge"
        style={{ cursor: "pointer", fontSize: "13px", padding: "9px 12px" }}
        onClick={() => {
          navigator.clipboard.writeText(friendCode);
          pushToast("Friend code copied", "", "success");
        }}
        title="Click to copy"
      >
        {friendCode} ⧉
      </span>
    )}
  </div>

  <div className="quickMeal">
    <input
      value={friendCode}
      readOnly
      placeholder="Your friend code"
    />
    <input
      value={addFriendCode}
      onChange={(e) =>
        setAddFriendCode(e.target.value)
      }
      placeholder="Enter a friend's code"
    />
    <button onClick={sendFriendRequest}>
      + Add Friend
    </button>
  </div>

              {incomingRequests.length > 0 &&
                incomingRequests.map((req) => (
                  <div className="friendRow" key={req.requestId}>
                    <div className="friendRankBadge">
                      {req.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="friendRowInfo">
                      <strong>{req.name}</strong>
                      <span>wants to be friends</span>
                    </div>
                    <div className="friendRowActions">
                      <button
                        className="acceptBtn"
                        onClick={() =>
                          respondToRequest(req.requestId, "accept")
                        }
                      >
                        Accept
                      </button>
                      <button
                        className="deleteBtn"
                        onClick={() =>
                          respondToRequest(req.requestId, "decline")
                        }
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

              {outgoingRequests.length > 0 &&
                outgoingRequests.map((req) => (
                  <div className="friendRow" key={req.requestId}>
                    <div className="friendRankBadge">
                      {req.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="friendRowInfo">
                      <strong>{req.name}</strong>
                      <span>request pending</span>
                    </div>
                  </div>
                ))}

              {friends.length === 0 ? (
                <div className="emptyState" style={{ marginTop: 12 }}>
                  <strong>No friends yet</strong>
                  <span>Share your code above to start a leaderboard.</span>
                </div>
              ) : (
                friends.map((f) => (
                  <div className="friendRow" key={f.id}>
                    <div className="friendRankBadge">
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="friendRowInfo">
                      <strong>{f.name}</strong>
                      <span>{f.points} pts all-time</span>
                    </div>
                    <button
                      className="deleteBtn"
                      onClick={() => removeFriend(f.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </section>

            <section className="panel quickMealPanel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    WEEKLY CHECK-IN
                  </span>
                  <h2>Log Today's Stats</h2>
                </div>
              </div>

              <div className="quickMeal">
                <input
                  type="number"
                  value={statWeight}
                  onChange={(e) => setStatWeight(e.target.value)}
                  placeholder="Weight (kg)"
                />
                <input
                  type="number"
                  value={statBodyFat}
                  onChange={(e) => setStatBodyFat(e.target.value)}
                  placeholder="Body fat % (optional)"
                />
                <button onClick={logStats}>Save</button>
              </div>
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">
                    {leaderboard
                      ? `WEEK OF ${leaderboard.weekStart}`
                      : "THIS WEEK"}
                  </span>
                  <h2>Leaderboard</h2>
                </div>

                <div className="themeToggle tabToggle">
                  {[
                    ["protein", "Protein"],
                    ["weightLoss", "Weight Loss"],
                    ["bodyFatLoss", "Body Fat"],
                  ].map(([key, label]) => (
                    <span
                      key={key}
                      className={
                        leaderboardTab === key ? "activeTheme" : ""
                      }
                      onClick={() => setLeaderboardTab(key)}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {!leaderboard ||
              leaderboard.rankings[leaderboardTab].length === 0 ? (
                <div className="emptyState large">
                  <span>★</span>
                  <strong>Not enough data yet</strong>
                  <p>
                    Add a friend and log a few days of stats to see
                    rankings.
                  </p>
                </div>
              ) : (
                leaderboard.rankings[leaderboardTab].map(
                  (row, index) => (
                    <div className="leaderboardRow" key={row.id}>
                      <div
                        className={`friendRankBadge ${
                          index === 0
                            ? "rankGold"
                            : index === 1
                            ? "rankSilver"
                            : index === 2
                            ? "rankBronze"
                            : ""
                        }`}
                      >
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : index + 1}
                      </div>
                      <div className="friendRowInfo">
                        <strong>{row.name}</strong>
                        <span>
                          {leaderboardTab === "protein"
                            ? "this week"
                            : leaderboardTab === "weightLoss"
                            ? "lost this week"
                            : "body fat lost this week"}
                        </span>
                      </div>
                      <div className="friendRowValue">
                        {leaderboardTab === "protein"
                          ? `${row.value.toFixed(1)}g`
                          : leaderboardTab === "weightLoss"
                          ? `${row.value > 0 ? row.value.toFixed(1) : 0} kg`
                          : `${row.value > 0 ? row.value.toFixed(1) : 0}%`}
                      </div>
                    </div>
                  )
                )
              )}
            </section>

            <section className="panel">
              <div className="panelHeader">
                <div>
                  <span className="panelEyebrow">ALL-TIME</span>
                  <h2>Points Standings</h2>
                </div>
              </div>

              {leaderboard &&
                leaderboard.points.map((p, index) => (
                  <div className="leaderboardRow" key={p.id}>
                    <div
                      className={`friendRankBadge ${
                        index === 0
                          ? "rankGold"
                          : index === 1
                          ? "rankSilver"
                          : index === 2
                          ? "rankBronze"
                          : ""
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="friendRowInfo">
                      <strong>{p.name}</strong>
                      <span>Earned by winning weekly challenges</span>
                    </div>
                    <div className="friendRowValue">{p.points} pts</div>
                  </div>
                ))}
            </section>
          </>
        )}
      </main>

      <nav className="bottomNav">
        {[
          ["dashboard", "⌂", "Home"],
          ["nutrition", "🍽️", "Meals"],
          ["workout", "🏋️", "Workout"],
          ["progress", "📊", "Progress"],
          ["profile", "👤", "Profile"],
        ].map(([key, icon, label]) => (
          <button
            key={key}
            className={page === key ? "navActive" : ""}
            onClick={() => setPage(key)}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      <button className="fab" onClick={() => setPage("nutrition")}>
        ＋
      </button>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <ConfirmModal
        config={confirmConfig}
        onCancel={closeConfirm}
        onConfirm={runConfirm}
      />
    </div>
  );
}

export default App;
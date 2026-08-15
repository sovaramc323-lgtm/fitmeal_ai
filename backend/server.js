JS
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");
 
const app = express();
app.use(cors());
app.use(express.json());
 
const JWT_SECRET = process.env.JWT_SECRET;
 
// ===== REGISTER =====
app.post("/api/register", async (req, res) => {
  const { name, email, password, weight } = req.body;
 
  if (!name || !email || !password || !weight) {
    return res.status(400).json({ message: "All fields are required" });
  }
 
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
 
    const sql = "INSERT INTO users (name, email, password, weight) VALUES (?, ?, ?, ?)";
    db.query(sql, [name, email, hashedPassword, weight], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already registered" });
        }
        console.error(err);
        return res.status(500).json({ message: "Failed to register" });
      }
 
      const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ message: "Registered successfully", token, userId: result.insertId, name });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
 
// ===== LOGIN =====
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
 
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }
 
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
 
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
 
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
 
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Logged in", token, userId: user.id, name: user.name, weight: user.weight });
  });
});
 
// ===== AUTH MIDDLEWARE =====
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });
 
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
 
// ===== GET CURRENT USER =====
app.get("/api/me", requireAuth, (req, res) => {
  db.query("SELECT id, name, email, weight FROM users WHERE id = ?", [req.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(results[0]);
  });
});
 
// ===== GET USERS (existing) =====
app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
    res.json(results);
  });
});
 
// ===== MEALS =====
app.post("/api/meals", requireAuth, (req, res) => {
  const { name, quantity, calories, protein, carbs } = req.body;
  const sql = "INSERT INTO meals (user_id, name, quantity, calories, protein, carbs) VALUES (?, ?, ?, ?, ?, ?)";
 
  db.query(sql, [req.userId, name, quantity, calories, protein, carbs], (err, result) => {
    if (err) return res.status(500).json({ message: "Failed to save meal" });
    res.json({ message: "Meal saved", mealId: result.insertId });
  });
});
 
app.get("/api/meals", requireAuth, (req, res) => {
  db.query("SELECT * FROM meals WHERE user_id = ? ORDER BY logged_at DESC", [req.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Failed to fetch meals" });
    res.json(results);
  });
});
 
app.listen(process.env.PORT || 5000, () => {
  console.log(`FitMeal AI Backend running at http://localhost:${process.env.PORT || 5000}`);
});
 
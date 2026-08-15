require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

// SAVE USER
app.post("/api/user", (req, res) => {
  const { name, weight } = req.body;

  if (!name || !weight) {
    return res.status(400).json({
      message: "Name and weight are required"
    });
  }

  const sql = "INSERT INTO users (name, weight) VALUES (?, ?)";

  db.query(sql, [name, weight], (err, result) => {
    if (err) {
      console.error("MySQL Error:", err);

      return res.status(500).json({
        message: "Failed to save user"
      });
    }

    res.json({
      message: "User saved successfully",
      userId: result.insertId
    });
  });
});

// GET USERS
app.get("/api/users", (req, res) => {
  db.query("SELECT * FROM users ORDER BY id DESC", (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Failed to fetch users"
      });
    }

    res.json(results);
  });
});

app.listen(5000, () => {
  console.log("FitMeal AI Backend running at https://fitmealai-production.up.railway.app/api/user");
});
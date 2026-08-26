require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

// ===== HELPERS =====
function generateFriendCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "A1B2C3D4"
}

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

// ===== REGISTER =====
app.post("/api/register", async (req, res) => {
  const { name, email, password, weight } = req.body;

  if (!name || !email || !password || !weight) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const friendCode = generateFriendCode();

    const sql =
      "INSERT INTO users (name, email, password, weight, friend_code) VALUES (?, ?, ?, ?, ?)";

    db.query(sql, [name, email, hashedPassword, weight, friendCode], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already registered" });
        }
        console.error(err);
        return res.status(500).json({ message: "Failed to register" });
      }

      db.query("INSERT INTO points (user_id, points) VALUES (?, 0)", [result.insertId]);

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
  const sql =
    "INSERT INTO meals (user_id, name, quantity, calories, protein, carbs) VALUES (?, ?, ?, ?, ?, ?)";

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

// ================= FRIENDS =================

// Get my own friend code
app.get("/api/friends/code", requireAuth, (req, res) => {
  db.query("SELECT friend_code FROM users WHERE id = ?", [req.userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });
    res.json({ friendCode: results[0].friend_code });
  });
});

// Get my friends + incoming/outgoing requests
app.get("/api/friends", requireAuth, (req, res) => {
  const friendsSql = `
    SELECT u.id, u.name, COALESCE(p.points, 0) AS points
    FROM friends f
    JOIN users u ON u.id = f.friend_id
    LEFT JOIN points p ON p.user_id = u.id
    WHERE f.user_id = ?
  `;

  const incomingSql = `
    SELECT fr.id AS requestId, u.id AS senderId, u.name
    FROM friend_requests fr
    JOIN users u ON u.id = fr.sender_id
    WHERE fr.receiver_id = ? AND fr.status = 'pending'
  `;

  const outgoingSql = `
    SELECT fr.id AS requestId, u.id AS receiverId, u.name
    FROM friend_requests fr
    JOIN users u ON u.id = fr.receiver_id
    WHERE fr.sender_id = ? AND fr.status = 'pending'
  `;

  db.query(friendsSql, [req.userId], (err, friends) => {
    if (err) return res.status(500).json({ message: "Server error" });

    db.query(incomingSql, [req.userId], (err2, incoming) => {
      if (err2) return res.status(500).json({ message: "Server error" });

      db.query(outgoingSql, [req.userId], (err3, outgoing) => {
        if (err3) return res.status(500).json({ message: "Server error" });

        res.json({ friends, incoming, outgoing });
      });
    });
  });
});

// Send a friend request using a friend code
app.post("/api/friends/request", requireAuth, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ message: "Friend code required" });

  db.query("SELECT id FROM users WHERE friend_code = ?", [code.trim().toUpperCase()], (err, results) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (results.length === 0) return res.status(404).json({ message: "No user with that code" });

    const targetId = results[0].id;

    if (targetId === req.userId) {
      return res.status(400).json({ message: "You can't add yourself" });
    }

    db.query(
      "SELECT id FROM friends WHERE user_id = ? AND friend_id = ?",
      [req.userId, targetId],
      (err2, existing) => {
        if (err2) return res.status(500).json({ message: "Server error" });
        if (existing.length > 0) {
          return res.status(409).json({ message: "Already friends" });
        }

        const sql = `
          INSERT INTO friend_requests (sender_id, receiver_id, status)
          VALUES (?, ?, 'pending')
          ON DUPLICATE KEY UPDATE status = 'pending'
        `;

        db.query(sql, [req.userId, targetId], (err3) => {
          if (err3) return res.status(500).json({ message: "Failed to send request" });
          res.json({ message: "Request sent" });
        });
      }
    );
  });
});

// Accept or decline a request
app.post("/api/friends/respond", requireAuth, (req, res) => {
  const { requestId, action } = req.body;
  if (!requestId || !["accept", "decline"].includes(action)) {
    return res.status(400).json({ message: "Invalid request" });
  }

  db.query(
    "SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ?",
    [requestId, req.userId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (results.length === 0) return res.status(404).json({ message: "Request not found" });

      const request = results[0];

      if (action === "decline") {
        db.query("UPDATE friend_requests SET status = 'declined' WHERE id = ?", [requestId]);
        return res.json({ message: "Declined" });
      }

      db.query("UPDATE friend_requests SET status = 'accepted' WHERE id = ?", [requestId], (err2) => {
        if (err2) return res.status(500).json({ message: "Server error" });

        // Insert both directions of the friendship
        db.query(
          "INSERT IGNORE INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)",
          [request.sender_id, request.receiver_id, request.receiver_id, request.sender_id],
          (err3) => {
            if (err3) return res.status(500).json({ message: "Server error" });
            res.json({ message: "Friend added" });
          }
        );
      });
    }
  );
});

// Remove a friend (both directions)
app.delete("/api/friends/:friendId", requireAuth, (req, res) => {
  const { friendId } = req.params;

  db.query(
    "DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
    [req.userId, friendId, friendId, req.userId],
    (err) => {
      if (err) return res.status(500).json({ message: "Server error" });
      res.json({ message: "Friend removed" });
    }
  );
});

// ================= WEIGHT LOG =================

app.post("/api/weight-log", requireAuth, (req, res) => {
  const { weight, bodyFat } = req.body;
  if (!weight) return res.status(400).json({ message: "Weight required" });

  db.query(
    "INSERT INTO weight_logs (user_id, weight, body_fat) VALUES (?, ?, ?)",
    [req.userId, weight, bodyFat || null],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Failed to log stats" });
      res.json({ message: "Stats logged", logId: result.insertId });
    }
  );
});

// ================= LEADERBOARD =================

app.get("/api/leaderboard", requireAuth, (req, res) => {
  const weekStart = getWeekStart();
  const weekStartStr = weekStart.toISOString().slice(0, 19).replace("T", " ");

  // Get my friend group (me + friends)
  db.query("SELECT friend_id FROM friends WHERE user_id = ?", [req.userId], (err, friendRows) => {
    if (err) return res.status(500).json({ message: "Server error" });

    const groupIds = [req.userId, ...friendRows.map((r) => r.friend_id)];
    const placeholders = groupIds.map(() => "?").join(",");

    // Protein this week (sum from meals)
    const proteinSql = `
      SELECT u.id, u.name, COALESCE(SUM(m.protein), 0) AS value
      FROM users u
      LEFT JOIN meals m ON m.user_id = u.id AND m.logged_at >= ?
      WHERE u.id IN (${placeholders})
      GROUP BY u.id, u.name
      ORDER BY value DESC
    `;

    db.query(proteinSql, [weekStartStr, ...groupIds], (err2, proteinRows) => {
      if (err2) return res.status(500).json({ message: "Server error" });

      // Weight loss / body fat loss: compare earliest vs latest log this week per user
      const logsSql = `
        SELECT user_id, weight, body_fat, logged_at
        FROM weight_logs
        WHERE user_id IN (${placeholders}) AND logged_at >= ?
        ORDER BY logged_at ASC
      `;

      db.query(logsSql, [...groupIds, weekStartStr], (err3, logs) => {
        if (err3) return res.status(500).json({ message: "Server error" });

        const byUser = {};
        logs.forEach((log) => {
          if (!byUser[log.user_id]) byUser[log.user_id] = { first: log, last: log };
          byUser[log.user_id].last = log;
        });

        const namesById = {};
        proteinRows.forEach((r) => (namesById[r.id] = r.name));

        const weightLoss = Object.entries(byUser).map(([userId, { first, last }]) => ({
          id: Number(userId),
          name: namesById[userId] || "Unknown",
          value: Number(first.weight) - Number(last.weight),
        }));

        const bodyFatLoss = Object.entries(byUser)
          .filter(([, { first, last }]) => first.body_fat != null && last.body_fat != null)
          .map(([userId, { first, last }]) => ({
            id: Number(userId),
            name: namesById[userId] || "Unknown",
            value: Number(first.body_fat) - Number(last.body_fat),
          }));

        // All-time points
        const pointsSql = `
          SELECT u.id, u.name, COALESCE(p.points, 0) AS points
          FROM users u
          LEFT JOIN points p ON p.user_id = u.id
          WHERE u.id IN (${placeholders})
          ORDER BY points DESC
        `;

        db.query(pointsSql, groupIds, (err4, pointsRows) => {
          if (err4) return res.status(500).json({ message: "Server error" });

          res.json({
            weekStart: weekStart.toISOString().slice(0, 10),
            rankings: {
              protein: proteinRows.map((r) => ({ id: r.id, name: r.name, value: Number(r.value) })),
              weightLoss: weightLoss.sort((a, b) => b.value - a.value),
              bodyFatLoss: bodyFatLoss.sort((a, b) => b.value - a.value),
            },
            points: pointsRows,
          });
        });
      });
    });
  });
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`FitMeal AI Backend running at http://localhost:${process.env.PORT || 5000}`);
});
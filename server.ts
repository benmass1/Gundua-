import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import Parser from "rss-parser";

dotenv.config();

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:gundua.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const parser = new Parser();

// Initialize Database
async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      bio TEXT,
      avatar TEXT,
      points INTEGER DEFAULT 1000,
      likes INTEGER DEFAULT 0,
      is_verified BOOLEAN DEFAULT 0,
      is_vip BOOLEAN DEFAULT 0,
      role TEXT DEFAULT 'user',
      gender TEXT,
      age INTEGER,
      language TEXT DEFAULT 'Swahili',
      notifications_enabled BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id TEXT,
      receiver_id TEXT,
      content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      liker_id TEXT,
      liked_id TEXT,
      UNIQUE(liker_id, liked_id)
    );

    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id TEXT,
      receiver_id TEXT,
      gift_type TEXT,
      cost INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function startServer() {
  await initDb();
  const app = express();
  app.use(express.json({ limit: '100mb' }));
  const PORT = 3000;

  // --- API ROUTES ---

  // User Auth & Management
  app.post("/api/auth/login", async (req, res) => {
    const { email, name } = req.body;
    try {
      let result = await db.execute({
        sql: "SELECT * FROM users WHERE email = ?",
        args: [email]
      });
      let user = result.rows[0];
      
      if (!user) {
        const id = Math.random().toString(36).substr(2, 9);
        const role = email.includes("admin") ? "admin" : "user";
        await db.execute({
          sql: "INSERT INTO users (id, name, email, role, avatar) VALUES (?, ?, ?, ?, ?)",
          args: [id, name || email.split("@")[0], email, role, `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`]
        });
        result = await db.execute({
          sql: "SELECT * FROM users WHERE email = ?",
          args: [email]
        });
        user = result.rows[0];
      }
      res.json(user);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/users", async (req, res) => {
    try {
      const result = await db.execute("SELECT * FROM users");
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/users/update", async (req, res) => {
    const { id, name, bio, avatar, points, gender, age, language, notifications_enabled } = req.body;
    try {
      const result = await db.execute({
        sql: "SELECT * FROM users WHERE id = ?",
        args: [id]
      });
      const currentUser = result.rows[0] as any;
      
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const newName = name !== undefined ? name : currentUser.name;
      const newBio = bio !== undefined ? bio : currentUser.bio;
      const newAvatar = avatar !== undefined ? avatar : currentUser.avatar;
      const newPoints = points !== undefined ? points : currentUser.points;
      const newGender = gender !== undefined ? gender : currentUser.gender;
      const newAge = age !== undefined ? age : currentUser.age;
      const newLanguage = language !== undefined ? language : currentUser.language;
      const newNotifications = notifications_enabled !== undefined ? notifications_enabled : currentUser.notifications_enabled;

      await db.execute({
        sql: "UPDATE users SET name = ?, bio = ?, avatar = ?, points = ?, gender = ?, age = ?, language = ?, notifications_enabled = ? WHERE id = ?",
        args: [newName, newBio, newAvatar, newPoints, newGender, newAge, newLanguage, newNotifications, id]
      });
      
      const updatedResult = await db.execute({
        sql: "SELECT * FROM users WHERE id = ?",
        args: [id]
      });
      res.json(updatedResult.rows[0]);
    } catch (e) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Social Interactions
  app.post("/api/social/like", async (req, res) => {
    const { likerId, likedId } = req.body;
    try {
      await db.execute({
        sql: "INSERT INTO likes (liker_id, liked_id) VALUES (?, ?)",
        args: [likerId, likedId]
      });
      await db.execute({
        sql: "UPDATE users SET likes = likes + 1 WHERE id = ?",
        args: [likedId]
      });
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Already liked" });
    }
  });

  app.post("/api/social/gift", async (req, res) => {
    const { senderId, receiverId, giftType, cost } = req.body;
    try {
      const result = await db.execute({
        sql: "SELECT points FROM users WHERE id = ?",
        args: [senderId]
      });
      const sender = result.rows[0] as any;
      
      if (sender.points < cost) {
        return res.status(400).json({ error: "Insufficient points" });
      }

      await db.execute({
        sql: "UPDATE users SET points = points - ? WHERE id = ?",
        args: [cost, senderId]
      });
      await db.execute({
        sql: "INSERT INTO gifts (sender_id, receiver_id, gift_type, cost) VALUES (?, ?, ?, ?)",
        args: [senderId, receiverId, giftType, cost]
      });
      
      res.json({ success: true, newPoints: sender.points - cost });
    } catch (e) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/social/invite", async (req, res) => {
    const { userId } = req.body;
    try {
      await db.execute({
        sql: "UPDATE users SET points = points + 50 WHERE id = ?",
        args: [userId]
      });
      const result = await db.execute({
        sql: "SELECT points FROM users WHERE id = ?",
        args: [userId]
      });
      const updatedUser = result.rows[0] as any;
      res.json({ success: true, newPoints: updatedUser.points });
    } catch (e) {
      res.status(500).json({ error: "Failed to award bonus" });
    }
  });

  // Messaging
  app.get("/api/messages/:userId/:otherId", async (req, res) => {
    const { userId, otherId } = req.params;
    try {
      const result = await db.execute({
        sql: `
          SELECT * FROM messages 
          WHERE (sender_id = ? AND receiver_id = ?) 
          OR (sender_id = ? AND receiver_id = ?)
          ORDER BY timestamp ASC
        `,
        args: [userId, otherId, otherId, userId]
      });
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/messages/send", async (req, res) => {
    const { senderId, receiverId, content } = req.body;
    try {
      await db.execute({
        sql: "INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)",
        args: [senderId, receiverId, content]
      });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // External API Proxies
  app.get("/api/external/news", async (req, res) => {
    try {
      const feed = await parser.parseURL("https://www.bbc.com/swahili/index.xml");
      const news = feed.items.slice(0, 5).map(item => ({
        title: item.title || "Habari Mpya",
        category: item.categories?.[0] || "Habari"
      }));
      res.json(news);
    } catch (e) {
      console.error("RSS Error:", e);
      res.json([
        { title: "Mkutano wa EAC waanza leo jijini Arusha", category: "Siasa" },
        { title: "Bei ya kahawa yapanda katika soko la dunia", category: "Uchumi" }
      ]);
    }
  });

  app.get("/api/external/weather", async (req, res) => {
    // Simulated weather API
    res.json({
      temp: 28,
      condition: "Jua kali",
      city: "Dar es Salaam"
    });
  });

  app.get("/api/external/quote", async (req, res) => {
    try {
      const resp = await fetch("https://api.adviceslip.com/advice");
      const data = await resp.json();
      res.json(data.slip);
    } catch (e) {
      res.json({ advice: "Ishi kila siku kana kwamba ni ya mwisho." });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

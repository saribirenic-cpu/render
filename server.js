const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// In-memory "database"
const apiKeys = [];

// Generate new API key
app.post("/generate-key", (req, res) => {
  const { user } = req.body;

  // Generate a random key
  const apiKey = crypto.randomBytes(16).toString("hex");

  const newKey = {
    user: user || "dummy_user",
    apiKey,
    createdAt: new Date(),
  };

  apiKeys.push(newKey);

  res.json({
    message: "API key created successfully",
    data: newKey,
  });
});

// Get all keys
app.get("/keys", (req, res) => {
  res.json(apiKeys);
});

// Validate a key
app.post("/validate", (req, res) => {
  const { apiKey } = req.body;
  const found = apiKeys.find((k) => k.apiKey === apiKey);

  if (found) {
    res.json({ valid: true, user: found.user });
  } else {
    res.status(401).json({ valid: false, message: "Invalid API key" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));

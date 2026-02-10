const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// ── Security & Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Rate limiting – 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    is_success: false,
    official_email: "lavish2052.be23@chitkara.edu.in",
    error: "Too many requests. Please try again later.",
  },
});
app.use(limiter);

// ── Constants ────────────────────────────────────────────────────────
const OFFICIAL_EMAIL = "lavish2052.be23@chitkara.edu.in";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBogpu9Z5yYPYJjFmUMa8JmgOT6bFycc2A";

// ── Helper Functions ─────────────────────────────────────────────────

/**
 * Build a success response object.
 */
function successResponse(data) {
  return {
    is_success: true,
    official_email: OFFICIAL_EMAIL,
    data,
  };
}

/**
 * Build an error response object.
 */
function errorResponse(message) {
  return {
    is_success: false,
    official_email: OFFICIAL_EMAIL,
    error: message,
  };
}

/**
 * Generate Fibonacci series of length n.
 * n must be a positive integer.
 */
function fibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const series = [0, 1];
  for (let i = 2; i < n; i++) {
    series.push(series[i - 1] + series[i - 2]);
  }
  return series;
}

/**
 * Check if a number is prime.
 */
function isPrime(num) {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}

/**
 * Filter prime numbers from an array.
 */
function filterPrimes(arr) {
  return arr.filter(isPrime);
}

/**
 * Compute GCD of two numbers.
 */
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

/**
 * Compute LCM of two numbers.
 */
function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Compute LCM of an array of integers.
 */
function lcmArray(arr) {
  return arr.reduce((acc, val) => lcm(acc, val), 1);
}

/**
 * Compute HCF (GCD) of an array of integers.
 */
function hcfArray(arr) {
  return arr.reduce((acc, val) => gcd(acc, val));
}

/**
 * Call Google Gemini for a single-word answer.
 * Tries multiple models as fallback in case of quota issues.
 */
async function askAI(question) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

  const prompt = `Answer the following question in exactly ONE word. Do not include any punctuation, explanation, or extra text. Just one word.\n\nQuestion: ${question}`;

  let lastError = null;
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text().trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, "");
      return text;
    } catch (err) {
      lastError = err;
      console.error(`Model ${modelName} failed:`, err.message);
      continue;
    }
  }
  throw lastError || new Error("All AI models failed.");
}

// ── Validation Helpers ───────────────────────────────────────────────

function isValidInteger(val) {
  return Number.isInteger(val);
}

function isValidIntegerArray(val) {
  return Array.isArray(val) && val.length > 0 && val.every(Number.isInteger);
}

function isNonEmptyString(val) {
  return typeof val === "string" && val.trim().length > 0;
}

// ── ROUTES ───────────────────────────────────────────────────────────

/**
 * GET /health — Health check
 */
app.get("/health", (_req, res) => {
  return res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL,
  });
});

/**
 * GET /bfhl — Also respond on root for convenience
 */
app.get("/bfhl", (_req, res) => {
  return res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL,
  });
});

/**
 * POST /bfhl — Main logic endpoint
 */
app.post("/bfhl", async (req, res) => {
  try {
    const body = req.body;

    // Guard: body must be a non-null object
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json(errorResponse("Request body must be a valid JSON object."));
    }

    // Determine which key is present
    const validKeys = ["fibonacci", "prime", "lcm", "hcf", "AI"];
    const presentKeys = validKeys.filter((k) => body.hasOwnProperty(k));

    if (presentKeys.length === 0) {
      return res
        .status(400)
        .json(errorResponse("Request must contain exactly one of: fibonacci, prime, lcm, hcf, AI."));
    }

    if (presentKeys.length > 1) {
      return res
        .status(400)
        .json(errorResponse("Request must contain exactly one of: fibonacci, prime, lcm, hcf, AI."));
    }

    const key = presentKeys[0];
    const value = body[key];

    // ── fibonacci ──────────────────────────────────────────────
    if (key === "fibonacci") {
      if (!isValidInteger(value) || value < 0) {
        return res
          .status(400)
          .json(errorResponse("'fibonacci' must be a non-negative integer."));
      }
      return res.status(200).json(successResponse(fibonacci(value)));
    }

    // ── prime ──────────────────────────────────────────────────
    if (key === "prime") {
      if (!isValidIntegerArray(value)) {
        return res
          .status(400)
          .json(errorResponse("'prime' must be a non-empty array of integers."));
      }
      return res.status(200).json(successResponse(filterPrimes(value)));
    }

    // ── lcm ────────────────────────────────────────────────────
    if (key === "lcm") {
      if (!isValidIntegerArray(value)) {
        return res
          .status(400)
          .json(errorResponse("'lcm' must be a non-empty array of integers."));
      }
      return res.status(200).json(successResponse(lcmArray(value)));
    }

    // ── hcf ────────────────────────────────────────────────────
    if (key === "hcf") {
      if (!isValidIntegerArray(value)) {
        return res
          .status(400)
          .json(errorResponse("'hcf' must be a non-empty array of integers."));
      }
      return res.status(200).json(successResponse(hcfArray(value)));
    }

    // ── AI ─────────────────────────────────────────────────────
    if (key === "AI") {
      if (!isNonEmptyString(value)) {
        return res
          .status(400)
          .json(errorResponse("'AI' must be a non-empty string question."));
      }
      try {
        const answer = await askAI(value);
        return res.status(200).json(successResponse(answer));
      } catch (aiErr) {
        console.error("AI service error:", aiErr.message || aiErr);
        return res.status(503).json(errorResponse("AI service is temporarily unavailable. Please try again later."));
      }
    }
  } catch (err) {
    console.error("Unhandled error:", err.message || err);
    return res.status(500).json(errorResponse("Internal server error."));
  }
});

// ── Catch-all for undefined routes ───────────────────────────────────
app.use((_req, res) => {
  return res.status(404).json(errorResponse("Route not found."));
});

// ── Start server (local dev) ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

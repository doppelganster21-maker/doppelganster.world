// backend/server.js
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { GoogleAuth } from "google-auth-library";

dotenv.config();

const app = express();

// ---------------- PERFORMANCE MIDDLEWARE ----------------
// Gzip compress all responses
app.use(compression({ level: 6, threshold: 1024 }));

app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;

// ---------------- PATH SETUP ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- CLOUDINARY ----------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------- SUPABASE ----------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------- MULTER ----------------
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// ---------------- API ROUTES ----------------

// GET all images
app.get("/api/images", async (req, res) => {
  let localImages = [];
  try {
    const dataPath = path.join(__dirname, "data.json");
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, "utf8");
      localImages = JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error reading local data.json:", e);
  }

  let supabaseImages = [];
  try {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      supabaseImages = data;
    }
  } catch (err) {
    console.error("Error fetching Supabase images:", err);
  }
  const seenUrls = new Set();
  const seenEmails = new Set();
  const uniqueCombined = [];

  for (const item of [...localImages, ...supabaseImages]) {
    const normalizedUrl = (item.url || '').trim().toLowerCase();
    const normalizedEmail = (item.email || '').trim().toLowerCase();

    if (normalizedUrl && seenUrls.has(normalizedUrl)) {
      continue; // Skip duplicate image URL
    }
    if (normalizedEmail && seenEmails.has(normalizedEmail)) {
      continue; // Skip duplicate email address
    }

    if (normalizedUrl) seenUrls.add(normalizedUrl);
    if (normalizedEmail) seenEmails.add(normalizedEmail);
    uniqueCombined.push(item);
  }

  return res.json(uniqueCombined);
});

// POST upload
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const { name, email, reward, currency } = req.body;
    
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: "Invalid email address. Please enter a valid email (e.g. user@example.com)." });
    }

    // Validate reward amount (minimum 100)
    const rewardNum = Number(reward);
    if (isNaN(rewardNum) || rewardNum < 100) {
      return res.status(400).json({ error: "Bounty reward cannot be less than 100. Please enter an amount of 100 or higher." });
    }

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Upload buffer to Cloudinary
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "doppelganster" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });
    };

    const result = await streamUpload(req.file.buffer);

    const userIdHeader = req.body.user_id || req.headers["x-user-id"] || email;

    // Store metadata in Supabase and return the inserted row
    const { data, error } = await supabase
      .from("images")
      .insert([
        {
          name: name || "Anonymous",
          email: email || "",
          reward: reward ? Number(reward) : 0,
          currency: currency || "₹",
          url: result.secure_url,
        },
      ])
      .select(); // ✅ ensures Supabase returns the inserted row

    if (error) throw error;

    return res.json(data[0]); // ✅ no more null error
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Helper to extract Cloudinary public ID from secure_url
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const parts = url.split("/image/upload/");
    if (parts.length < 2) return null;
    const pathAfterUpload = parts[1];
    const pathParts = pathAfterUpload.split("/");
    let startIdx = 0;
    if (pathParts[0].startsWith("v") && /^\d+$/.test(pathParts[0].substring(1))) {
      startIdx = 1;
    }
    const publicIdWithExt = pathParts.slice(startIdx).join("/");
    const lastDotIdx = publicIdWithExt.lastIndexOf(".");
    if (lastDotIdx === -1) return publicIdWithExt;
    return publicIdWithExt.substring(0, lastDotIdx);
  } catch (err) {
    console.error("Error parsing Cloudinary public ID:", err);
    return null;
  }
};

// DELETE /api/images/:id (User can only delete their own image, or admin can delete any)
app.delete("/api/images/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.headers["x-user-id"] || req.headers["x-user-email"];
    const requestingUserEmail = req.headers["x-user-email"];

    console.log(`[DELETE] Request from User ID/Email: ${requestingUser}, Admin Header Email: ${requestingUserEmail}`);

    if (!requestingUser) {
      return res.status(401).json({ error: "Authentication required to delete photos." });
    }

    // Fetch image from Supabase to verify owner
    const { data: image, error: fetchErr } = await supabase
      .from("images")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !image) {
      return res.status(404).json({ error: "Image record not found." });
    }

    // Verify ownership against email (since images table doesn't have user_id)
    const reqUserLower = requestingUser.trim().toLowerCase();
    const ownerEmail = (image.email || "").toString().trim().toLowerCase();
    const reqUserEmailLower = (requestingUserEmail || "").trim().toLowerCase();

    // Check if requesting user is the platform owner
    const isPlatformOwner = reqUserEmailLower === "doppelganster21@gmail.com" || reqUserLower === "doppelganster21@gmail.com";

    // Match if platform owner, or if the requester's email matches the record's email
    const isOwner = isPlatformOwner || 
                    (ownerEmail && reqUserEmailLower && ownerEmail === reqUserEmailLower) || 
                    (ownerEmail && ownerEmail === reqUserLower);

    if (!isOwner) {
      return res.status(403).json({ error: "Unauthorized. You can only delete your own uploaded photos." });
    }

    // Delete image from Cloudinary
    const publicId = getPublicIdFromUrl(image.url);
    if (publicId) {
      try {
        const destroyResult = await cloudinary.uploader.destroy(publicId);
        console.log(`Cloudinary destroy response for ${publicId}:`, destroyResult);
      } catch (cloudErr) {
        console.error("Cloudinary destroy error:", cloudErr);
      }
    }

    // Delete row from Supabase
    const { error: deleteErr } = await supabase
      .from("images")
      .delete()
      .eq("id", id);

    if (deleteErr) throw deleteErr;

    return res.json({ success: true, message: "Photo and details deleted successfully." });
  } catch (err) {
    console.error("Delete photo error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat - Doppelganger Platform AI Assistant
const GROQ_API_KEY = process.env.GROQ_API_KEY;

app.post("/api/chat", async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY is not configured in .env file." });
    }
    const { message, history } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required." });
    }

    const systemPrompt = `You are the official expert AI Assistant for Doppelganger.world. Your core mission is to provide comprehensive, accurate, friendly, and well-structured assistance regarding:

1. THE DOPPELGANGER PLATFORM (https://www.doppelganger.world):
- Photo Upload & AI Validation: Users upload high-resolution, front-facing portrait photos (JPG, PNG, WEBP, up to 10MB limit). The frontend image validator checks for facial presence before storing files securely in Cloudinary and indexing metadata in Supabase.
- Bounty Reward System: Photo owners set a custom look-alike reward (minimum 100) in their preferred currency (₹ INR, $ USD, € EUR, £ GBP). Community spotters browse the gallery grid to find matching real-life doubles and claim the reward bounty upon verification.
- Search & Active Gallery: Users can filter gallery entries by full name or keyword, paginate through listings, and share specific bounties directly via WhatsApp or Twitter (X).
- Privacy & Account Protection: Contact emails remain private and confidential. Only public display details (Name, Bounty Amount, Portrait URL) are shown in the public gallery. Users can request photo removals at any time.
- Creator / Developer: Engineered and founded by Umesh Jonwal.

2. SCIENCE & GENETICS OF TWIN STRANGERS:
- DNA & Epigenetics (Dr. Manel Esteller Study): Groundbreaking 2022 research published in "Cell Reports" by the Josep Carreras Leukaemia Research Institute proved that unrelated human look-alikes with near-identical faces share matching genetic sequence variants (SNPs) and similar physical traits (height, weight, habits) despite having no direct family heritage.
- Facial Recognition Math & Algorithms: Modern facial AI measures 68 distinct facial landmarks (interpupillary distance, eye depth, nasal width, philtrum shape, jawline angle). Facial images are vectorized into high-dimensional embeddings and matched using Cosine Similarity metrics.
- Neurobiology & FFA: The human brain processes faces in the Fusiform Face Area (FFA). Human perception can distinguish 1-in-a-trillion feature combinations.

3. HISTORY, FOLKLORE & MYTHOLOGY OF DOPPELGÄNGERS:
- Etymology: The word originates from German "Doppelgänger" meaning "double-walker" or "double-goer".
- Historical Sightings:
  * Abraham Lincoln: Saw a dual reflection of his face in a mirror shortly before his inauguration.
  * Percy Bysshe Shelley: Encountered his double on a balcony silently pointing out to sea before his untimely demise.
  * Johann Wolfgang von Goethe: Saw his exact double riding towards him on horseback in Drusenheim.
  * Catherine the Great: Her royal guards witnessed her phantom double sitting on the imperial throne while she was asleep in her bed.
- Psychological Phenomena: Related to Autoscopy (perceiving one's body in external space), Pareidolia (seeing facial structures in random patterns), and Capgras syndrome.

INSTRUCTIONS FOR RESPONSES:
- Structure your answers clearly using bold headings, bullet points, and numbered lists where helpful.
- Keep tone enthusiastic, welcoming, and helpful.
- For platform support, provide clear step-by-step guidance.
- Answer ONLY questions related to the Doppelganger platform, bounty rewards, look-alike science, genetic research, or historical doppelgänger lore.
- For off-topic questions (e.g. general programming, math homework, cooking, political debates), politely respond: "I am specialized exclusively as the Doppelganger.world Platform & Look-Alike Guide. I can help you upload photos, manage bounty rewards, or explore the fascinating science and history of doppelgängers!"`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-6) : []),
      { role: "user", content: message.trim() }
    ];

    let response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    let data = await response.json();

    // Fallback if model name is unsupported on API server endpoint
    if (!response.ok && data.error && data.error.message && data.error.message.includes("model")) {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: messages,
          temperature: 0.7,
          max_tokens: 500
        })
      });
      data = await response.json();
    }

    if (!response.ok) {
      throw new Error(data.error?.message || "Groq API error");
    }

    const reply = data.choices && data.choices[0] ? data.choices[0].message.content : "No response generated.";
    return res.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return res.status(500).json({ error: "AI Assistant error: " + err.message });
  }
});

// ---------------- BLOG SYSTEM ENDPOINTS ----------------
const BLOGS_FILE_PATH = path.join(__dirname, "blogs.json");

// Helper to read blogs from JSON
const readBlogsFromFile = () => {
  try {
    if (!fs.existsSync(BLOGS_FILE_PATH)) {
      fs.writeFileSync(BLOGS_FILE_PATH, JSON.stringify([]));
    }
    const raw = fs.readFileSync(BLOGS_FILE_PATH, "utf8");
    return JSON.parse(raw || "[]");
  } catch (err) {
    console.error("Error reading blogs.json:", err);
    return [];
  }
};

// Helper to write blogs to JSON
const writeBlogsToFile = (blogs) => {
  try {
    fs.writeFileSync(BLOGS_FILE_PATH, JSON.stringify(blogs, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing blogs.json:", err);
  }
};

// Helper to dynamically rebuild public/sitemap.xml
const rebuildSitemap = () => {
  try {
    const publicDir = path.join(__dirname, "public");
    const sitemapPath = path.join(publicDir, "sitemap.xml");

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 1. Add static pages (using pretty URLs)
    const staticUrls = [
      { loc: "https://www.doppelganger.world/", changefreq: "daily", priority: "1.0" },
      { loc: "https://www.doppelganger.world/blog", changefreq: "weekly", priority: "0.9" },
      { loc: "https://www.doppelganger.world/faq", changefreq: "monthly", priority: "0.8" },
      { loc: "https://www.doppelganger.world/contact", changefreq: "monthly", priority: "0.7" },
      { loc: "https://www.doppelganger.world/about", changefreq: "monthly", priority: "0.6" },
      { loc: "https://www.doppelganger.world/privacy", changefreq: "yearly", priority: "0.5" },
      { loc: "https://www.doppelganger.world/terms", changefreq: "yearly", priority: "0.5" },
      { loc: "https://www.doppelganger.world/cookie-policy", changefreq: "yearly", priority: "0.4" },
      { loc: "https://www.doppelganger.world/disclaimer", changefreq: "yearly", priority: "0.4" },
      { loc: "https://www.doppelganger.world/sitemap-page", changefreq: "monthly", priority: "0.4" }
    ];

    staticUrls.forEach(url => {
      xml += `  <url>\n`;
      xml += `    <loc>${url.loc}</loc>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // 2. Add dynamic blogs from blogs.json
    const dynamicBlogs = readBlogsFromFile();
    const categories = new Set();
    const tags = new Set();

    dynamicBlogs.forEach(blog => {
      xml += `  <url>\n`;
      xml += `    <loc>https://www.doppelganger.world/${blog.slug}.html</loc>\n`;
      const blogDate = blog.date ? blog.date.split("T")[0] : new Date().toISOString().split("T")[0];
      xml += `    <lastmod>${blogDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;

      if (blog.category) categories.add(blog.category.toLowerCase().replace(/[^a-z0-9-_]/g, ""));
      if (blog.tags && Array.isArray(blog.tags)) {
        blog.tags.forEach(t => tags.add(t.toLowerCase().replace(/[^a-z0-9-_]/g, "")));
      }
    });

    // 3. Add dynamic category pages
    categories.forEach(cat => {
      xml += `  <url>\n`;
      xml += `    <loc>https://www.doppelganger.world/category/${cat}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });

    // 4. Add dynamic tag pages
    tags.forEach(tag => {
      xml += `  <url>\n`;
      xml += `    <loc>https://www.doppelganger.world/tag/${tag}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });

    // 5. Add RSS Feed location
    xml += `  <url>\n`;
    xml += `    <loc>https://www.doppelganger.world/rss.xml</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.5</priority>\n`;
    xml += `  </url>\n`;

    xml += `</urlset>\n`;

    fs.writeFileSync(sitemapPath, xml, "utf8");
    console.log("ℹ️ Sitemap rebuilt successfully at public/sitemap.xml");
  } catch (err) {
    console.error("❌ Error rebuilding sitemap:", err);
  }
};

// Helper to notify Google Indexing API
const notifyGoogleIndexing = async (url, type = "URL_UPDATED") => {
  const keyPath = path.join(__dirname, "service_account.json");
  if (!fs.existsSync(keyPath)) {
    console.log("ℹ️ Google Indexing API: service_account.json not found. Skipping live indexing notification.");
    return;
  }

  try {
    const auth = new GoogleAuth({
      keyFile: keyPath,
      scopes: ["https://www.googleapis.com/auth/indexing"],
    });
    const client = await auth.getClient();
    const res = await client.request({
      url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
      method: "POST",
      data: {
        url: url,
        type: type,
      },
    });
    console.log(`🚀 Google Indexing API success for \${url} (\${type}):`, res.data);
  } catch (err) {
    console.error(`❌ Google Indexing API error for \${url}:`, err.message);
  }
};

// GET all blogs
app.get("/api/blogs", (req, res) => {
  const blogs = readBlogsFromFile();
  // Return blogs sorted by date descending (newest first)
  const sortedBlogs = [...blogs].sort((a, b) => new Date(b.date) - new Date(a.date));
  return res.json(sortedBlogs);
});

// POST upload blog image (Cloudinary)
app.post("/api/blog-upload", upload.single("file"), async (req, res) => {
  try {
    const adminEmail = req.headers["x-user-email"];
    if (!adminEmail || adminEmail.trim().toLowerCase() !== "doppelganster21@gmail.com") {
      return res.status(403).json({ error: "Unauthorized. Only the platform owner can upload blog images." });
    }

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Upload buffer to Cloudinary
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "doppelganster-blogs" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });
    };

    const result = await streamUpload(req.file.buffer);
    return res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Blog image upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to generate dynamic SEO Blog HTML page
const generateBlogHtml = (blog) => {
  const { title, slug, description, keywords, category, readTime, imageUrl, bodyContent, date } = blog;
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const dateIso = dateObj.toISOString();

  // Escape metadata
  const escTitle = title.replace(/"/g, '&quot;');
  const escDesc = description.replace(/"/g, '&quot;');
  const escKeywords = keywords.replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#000000" />

  <title>${escTitle} | Doppelganger World</title>

  <!-- Canonical -->
  <link rel="canonical" href="https://www.doppelganger.world/${slug}.html">

  <!-- SEO Meta -->
  <meta name="description" content="${escDesc}">
  <meta name="keywords" content="${escKeywords}">
  <meta name="author" content="Doppelganger.world">
  <meta name="robots" content="index, follow">

  <!-- OPEN GRAPH / FACEBOOK -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://www.doppelganger.world/${slug}.html" />
  <meta property="og:title" content="${escTitle} | Doppelganger World" />
  <meta property="og:description" content="${escDesc}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:site_name" content="Doppelganger.world" />

  <!-- TWITTER CARDS -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escTitle} | Doppelganger World" />
  <meta name="twitter:description" content="${escDesc}" />
  <meta name="twitter:image" content="${imageUrl}" />

  <!-- STRUCTURED DATA -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${escTitle}",
    "image": [
      "${imageUrl}"
    ],
    "datePublished": "${dateIso}",
    "dateModified": "${dateIso}",
    "author": [
      {
        "@type": "Organization",
        "name": "Doppelganger Science Team",
        "url": "https://www.doppelganger.world/"
      }
    ],
    "publisher": {
      "@type": "Organization",
      "name": "Doppelganger.world",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.doppelganger.world/logo-dark.png"
      }
    },
    "description": "${escDesc}",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://www.doppelganger.world/${slug}.html"
    }
  }
  </script>

  <link rel="icon" id="siteFavicon" type="image/png" href="/logo-dark.png" />

  <!-- PERFORMANCE: Non-blocking Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" /></noscript>

  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/ad-styles.css" />
  <link rel="stylesheet" href="/cookie-consent.css" />
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7208166578795598"
     crossorigin="anonymous"></script>
  <script src="/theme.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>



  <style>
    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 24px;
    }
    .breadcrumbs a {
      color: var(--text-muted);
      font-weight: 500;
    }
    .breadcrumbs a:hover {
      color: var(--accent-primary);
    }
    .breadcrumbs span {
      font-size: 10px;
    }
    .article-badge {
      display: inline-block;
      padding: 4px 12px;
      background: var(--badge-bg);
      color: var(--badge-text);
      border-radius: 50px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .article-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 13px;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .article-body h2 {
      font-size: 22px;
      font-weight: 700;
      color: var(--accent-primary);
      margin-top: 32px;
      margin-bottom: 12px;
    }
    .article-body p {
      color: var(--text-secondary);
      font-size: 15px;
      line-height: 1.7;
      margin-bottom: 18px;
    }
    .article-body ul, .article-body ol {
      margin-bottom: 18px;
      padding-left: 20px;
    }
    .article-body li {
      color: var(--text-secondary);
      font-size: 15px;
      line-height: 1.7;
      margin-bottom: 8px;
    }
    .sidebar-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .sidebar-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .recent-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .recent-links a {
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
    }
    .recent-links a:hover {
      color: var(--accent-primary);
    }
    .recent-links li.active a {
      color: var(--accent-primary);
      font-weight: 700;
    }
    .cta-card {
      background: var(--accent-gradient);
      border-radius: 20px;
      padding: 28px;
      color: #ffffff;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: var(--shadow-card);
    }
    .cta-card::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%);
      pointer-events: none;
    }
  </style>
</head>
<body>
  <!-- HEADER & NAVBAR -->
  <header class="navbar">
    <div class="nav-wrapper">
      <a href="/" class="brand" title="Doppelganger Home">
        <div class="logo">
          <img src="/logo-dark.png" alt="Doppelganger Logo" class="logo-dark" width="34" height="34" fetchpriority="high" />
          <img src="/logo-light.png" alt="Doppelganger Logo" class="logo-light" width="34" height="34" />
        </div>
        <div class="brand-text">
          <span class="brand-name">Doppelganger</span>
          <p>Find Your Real-Life Double</p>
        </div>
      </a>

      <div class="nav-controls">
        <nav class="main-nav" aria-label="Main Navigation">
          <a href="/" title="Home Page">Home</a>
          <a href="/blog.html" class="active" title="Blog Page">Blog</a>
          <a href="/AboutUs.html" title="About Us">About</a>
          <a href="/faq.html" title="FAQ">FAQ</a>
          <a href="/contact.html" title="Contact">Contact</a>
        </nav>
        <div id="authNavContainer" style="display: flex; align-items: center; gap: 8px; margin-right: 6px;">
          <button id="googleSignInBtn" class="btn secondary" type="button" style="padding: 6px 14px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; border-radius: 50px;">
            <svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            Google Sign In
          </button>
          <div id="userProfileBadge" style="display: none; align-items: center; gap: 8px;">
            <div id="userAvatar" style="width: 30px; height: 30px; border-radius: 50%; background: var(--accent-gradient); color: #fff; font-weight: 700; font-size: 13px; display: flex; align-items: center; justify-content: center;">G</div>
            <span id="userDisplayName" style="font-size: 13px; font-weight: 600; color: var(--text-main); max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">User</span>
            <button id="signOutBtn" type="button" title="Sign out of Google" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 12px; text-decoration: underline;">Sign Out</button>
          </div>
        </div>

        <button class="theme-toggle-btn" type="button"></button>

        <button class="mobile-menu-btn" type="button" aria-label="Toggle navigation menu" aria-expanded="false">
          <svg class="icon-hamburger" viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          <svg class="icon-close" viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- Ambient Lighting Background -->
  <div class="ambient-glow ambient-glow-1"></div>
  <div class="ambient-glow ambient-glow-2"></div>

  <div class="container page-fade-in" style="margin-top: 20px; margin-bottom: 50px;">
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span>&rarr;</span>
      <a href="/blog.html">Blog</a>
      <span>&rarr;</span>
      <span style="color: var(--text-main);">${title}</span>
    </nav>

    <div style="display: flex; gap: 30px; flex-wrap: wrap;">
      <!-- LEFT ARTICLE CONTENT -->
      <article style="flex: 2.5; min-width: 320px; background: var(--bg-card); padding: 32px; border-radius: 20px; border: 1px solid var(--border-color); box-shadow: var(--shadow-card);">
        <span class="article-badge">${category}</span>
        <h1 style="font-size: 32px; font-weight: 800; color: var(--text-main); margin-bottom: 12px; line-height: 1.25;">${title}</h1>
        
        <div class="article-meta">
          <span>By <strong>Doppelganger Science Team</strong></span>
          <span>&bull;</span>
          <span>${formattedDate}</span>
          <span>&bull;</span>
          <span>${readTime}</span>
          <!-- Dynamic admin delete wrapper -->
          <span id="adminDeleteWrapper" style="display: none; margin-left: auto;">
            <button onclick="window.deleteCurrentBlog('${slug}')" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 50px; padding: 4px 12px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s ease;" type="button">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Delete Article (Admin)
            </button>
          </span>
        </div>

        <img src="${imageUrl}" alt="${escTitle}" style="width: 100%; max-height: 420px; object-fit: cover; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 24px;" />

        <div class="article-body">
          ${bodyContent}
        </div>

        <!-- Dynamic Related Articles Section -->
        <div class="related-articles-section" style="margin-top: 40px; border-top: 1px solid var(--border-color); padding-top: 32px;">
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-bottom: 20px;">Related Articles</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
            ${(() => {
              try {
                const allBlogs = readBlogsFromFile();
                const candidates = allBlogs.filter(b => b.slug !== slug);
                const scored = candidates.map(b => {
                  let score = 0;
                  if (b.category === category) score += 5;
                  if (b.tags && blog.tags && Array.isArray(b.tags) && Array.isArray(blog.tags)) {
                    const commonTags = b.tags.filter(t => blog.tags.includes(t));
                    score += commonTags.length * 2;
                  }
                  return { blog: b, score };
                });
                scored.sort((a, b) => b.score - a.score || new Date(b.blog.date) - new Date(a.blog.date));
                const top4 = scored.slice(0, 4).map(s => s.blog);
                return top4.map(b => `
                  <div class="related-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: all 0.2s ease;">
                    <img src="/${b.imageUrl}" alt="${b.title.replace(/"/g, '&quot;')}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color);" />
                    <span style="font-size: 10px; font-weight: 700; color: var(--accent-primary); text-transform: uppercase;">${b.category}</span>
                    <a href="/${b.slug}.html" style="font-size: 13px; font-weight: 700; color: var(--text-main); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 36px; text-decoration: none;">${b.title}</a>
                  </div>
                `).join('\n');
              } catch (e) {
                console.error("Error generating related articles:", e);
                return '';
              }
            })()}
          </div>
        </div>

        <!-- FAQs Section -->
        ${blog.faqs && blog.faqs.length > 0 ? `
        <div class="faqs-section" style="margin-top: 40px; border-top: 1px solid var(--border-color); padding-top: 32px;">
          <h3 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-bottom: 20px;">Frequently Asked Questions</h3>
          ${blog.faqs.map(f => `
            <div class="faq-item" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px; margin-bottom: 12px;">
              <div class="faq-question" style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Q: ${f.q}</div>
              <div class="faq-answer" style="font-size: 14px; line-height: 1.6; color: var(--text-secondary);">${f.a}</div>
            </div>
          `).join('\n')}
        </div>
        ` : ''}

        <!-- Post Article CTA -->
        <div style="margin-top: 40px; padding: 24px; background: rgba(168, 85, 247, 0.08); border: 1px dashed var(--accent-primary); border-radius: 16px; text-align: center;">
          <h3 style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">Find Your Real-Life Twin Stranger</h3>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px; max-width: 500px; margin-left: auto; margin-right: auto;">
            Upload your portrait photo, set a bounty reward, and let our facial similarity scanner search the global database.
          </p>
          <a href="/" class="btn primary" style="padding: 10px 24px; font-size: 14px; border-radius: 50px; font-weight: 700;">Start Face Scan Now</a>
        </div>
      </article>

      <!-- RIGHT SIDEBAR -->
      <aside style="flex: 1; min-width: 280px; display: flex; flex-direction: column; gap: 0;">
        <!-- Search -->
        <div class="sidebar-card">
          <h3 class="sidebar-title">Search Articles</h3>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="sidebarSearch" placeholder="Type keyword..." style="flex: 1; padding: 10px 14px; border-radius: 50px; border: 1px solid var(--border-color); background: var(--bg-input); color: var(--text-main); font-size: 13px;" />
            <button type="button" id="sidebarSearchBtn" class="btn secondary" style="padding: 8px 14px; font-size: 13px; border-radius: 50px;">Go</button>
          </div>
        </div>

        <!-- Recent posts -->
        <div class="sidebar-card">
          <h3 class="sidebar-title">Articles</h3>
          <ul class="recent-links">
            ${(() => {
              try {
                const allBlogs = readBlogsFromFile();
                const sorted = [...allBlogs].sort((a, b) => new Date(b.date) - new Date(a.date));
                const top10 = sorted.slice(0, 10);
                return top10.map(b => {
                  const isActive = b.slug === slug;
                  return `<li class="${isActive ? 'active' : ''}"><a href="${b.slug}.html">${b.title}</a></li>`;
                }).join('\n            ');
              } catch (e) {
                console.error("Error generating dynamic sidebar:", e);
                return `<li><a href="blog1.html">What Is a Doppelganger?</a></li>`;
              }
            })()}
          </ul>
        </div>

        <!-- Bounty CTA -->
        <div class="cta-card">
          <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 10px;">Active Look-Alike Bounties</h3>
          <p style="font-size: 13px; line-height: 1.5; margin-bottom: 20px; opacity: 0.9;">
            Browse submissions, spot look-alike matches, and claim reward bounties up to ₹10,000+!
          </p>
          <a href="/" class="btn secondary" style="background: #ffffff; color: #7c3aed; border: none; font-weight: 700; padding: 10px 20px; font-size: 13px; border-radius: 50px; display: inline-block;">Browse Gallery</a>
        </div>
      </aside>
    </div>
  </div>

  <footer class="site-footer" role="contentinfo">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="footer-brand">
          <img src="/logo-dark.png" alt="Doppelganger Logo" class="footer-logo logo-dark" width="36" height="36" />
          <img src="/logo-light.png" alt="Doppelganger Logo" class="footer-logo logo-light" width="36" height="36" />
          <span>Doppelganger.world</span>
        </div>
        <p class="footer-tagline">Find your real-life look-alike using AI facial matching technology.</p>
        <p class="footer-contact">✉ <a href="mailto:contact@doppelganger.world">contact@doppelganger.world</a></p>
      </div>
      <div class="footer-col">
        <h4>Navigation</h4>
        <a href="/">Home</a>
        <a href="/blog.html">Blog</a>
        <a href="/AboutUs.html">About Us</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
        <a href="/sitemap.html">Sitemap</a>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <a href="/privacy.html">Privacy Policy</a>
        <a href="/terms.html">Terms &amp; Conditions</a>
        <a href="/cookie-policy.html">Cookie Policy</a>
        <a href="/disclaimer.html">Disclaimer</a>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">&copy; <span id="year"></span> Doppelganger.world. All rights reserved.</div>
      <div class="footer-legal-note">Built with ❤️ by <a href="https://www.linkedin.com/in/javawithumesh" target="_blank" rel="noopener">Umesh Jonwal</a></div>
    </div>
  </footer>

  <script src="/script.js" defer></script>
  <script src="/chat.js" defer></script>
  <script src="/ad-components.js" defer></script>
  <script src="/cookie-consent.js" defer></script>
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-6E7PBHRN0P"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-6E7PBHRN0P');
  </script>
  <!-- Microsoft Clarity -->
  <script type="text/javascript">
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,"clarity","script","YOUR_CLARITY_ID");
  </script>
  <script>
    document.getElementById('year').textContent = new Date().getFullYear();

    // Search redirection to main blog page
    const searchInput = document.getElementById('sidebarSearch');
    const searchBtn = document.getElementById('sidebarSearchBtn');
    
    function performSearch() {
      const query = searchInput.value.trim();
      if (query) {
        window.location.href = '/blog.html?q=' + encodeURIComponent(query);
      }
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
      });
    }
    if (searchBtn) {
      searchBtn.addEventListener('click', performSearch);
    }
  </script>
</body>
</html>
`;
};

// POST publish new blog
app.post("/api/blogs", async (req, res) => {
  try {
    const adminEmail = req.headers["x-user-email"];
    if (!adminEmail || adminEmail.trim().toLowerCase() !== "doppelganster21@gmail.com") {
      return res.status(403).json({ error: "Unauthorized. Only the platform owner can write blogs." });
    }

    const { title, slug, description, keywords, category, readTime, imageUrl, bodyContent } = req.body;

    if (!title || !slug || !description || !keywords || !category || !readTime || !imageUrl || !bodyContent) {
      return res.status(400).json({ error: "All fields are required to publish a blog post." });
    }

    // Format slug
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
    if (!cleanSlug) return res.status(400).json({ error: "Invalid SEO slug." });

    const blogs = readBlogsFromFile();
    
    // Check duplicate slug
    const duplicate = blogs.find(b => b.slug === cleanSlug);
    if (duplicate) {
      return res.status(400).json({ error: "A blog post with this SEO slug already exists." });
    }

    const newBlog = {
      title,
      slug: cleanSlug,
      description,
      keywords,
      category,
      readTime,
      imageUrl,
      bodyContent,
      date: new Date().toISOString()
    };

    // Save to blogs.json
    blogs.push(newBlog);
    writeBlogsToFile(blogs);

    // Generate and write the static HTML page in public/
    const htmlContent = generateBlogHtml(newBlog);
    const htmlFilePath = path.join(__dirname, "public", `${cleanSlug}.html`);
    fs.writeFileSync(htmlFilePath, htmlContent, "utf8");

    console.log(`✅ Static blog page created successfully: ${cleanSlug}.html`);

    // Automatically rebuild sitemap and notify Google Indexing API
    rebuildSitemap();
    notifyGoogleIndexing(`https://www.doppelganger.world/${cleanSlug}.html`, "URL_UPDATED");

    return res.status(201).json({ success: true, blog: newBlog });
  } catch (err) {
    console.error("Publish blog error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE a dynamic blog post
app.delete("/api/blogs/:slug", async (req, res) => {
  try {
    const adminEmail = req.headers["x-user-email"];
    if (!adminEmail || adminEmail.trim().toLowerCase() !== "doppelganster21@gmail.com") {
      return res.status(403).json({ error: "Unauthorized. Only the platform owner can delete blog posts." });
    }

    const { slug } = req.params;
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");

    const blogs = readBlogsFromFile();
    const blogIndex = blogs.findIndex(b => b.slug === cleanSlug);

    if (blogIndex === -1) {
      return res.status(404).json({ error: "Blog post not found in database." });
    }

    // Remove from blogs.json
    blogs.splice(blogIndex, 1);
    writeBlogsToFile(blogs);

    // Delete static HTML file from public folder
    const htmlFilePath = path.join(__dirname, "public", `${cleanSlug}.html`);
    if (fs.existsSync(htmlFilePath)) {
      fs.unlinkSync(htmlFilePath);
      console.log(`🗑️ Deleted static blog file: ${cleanSlug}.html`);
    }

    // Automatically rebuild sitemap and notify Google Indexing API of deletion
    rebuildSitemap();
    notifyGoogleIndexing(`https://www.doppelganger.world/${cleanSlug}.html`, "URL_DELETED");

    return res.json({ success: true, message: "Blog post deleted successfully." });
  } catch (err) {
    console.error("Delete blog error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SERVE FRONTEND ----------------

// Security + performance headers on every response
app.use((req, res, next) => {
  // Security headers (good for AdSense trust)
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.clarity.ms https://*.google-analytics.com blob: https://pagead2.googlesyndication.com https://*.googlesyndication.com https://googleads.g.doubleclick.net https://*.doubleclick.net https://*.google.com https://tpc.googlesyndication.com https://*.adtrafficquality.google https://ep2.adtrafficquality.google https://cdn.jsdelivr.net https://*.supabase.co; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://res.cloudinary.com https://www.clarity.ms https://*.google-analytics.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://www.googletagmanager.com https://*.adtrafficquality.google https://ep1.adtrafficquality.google; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.groq.com https://api.groq.com/openai/v1/chat/completions https://*.supabase.co https://r.clarity.ms https://*.google-analytics.com https://*.analytics.google.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google https://ep1.adtrafficquality.google; frame-src 'self' https://*.supabase.co https://googleads.g.doubleclick.net https://*.doubleclick.net https://*.google.com https://*.googlesyndication.com https://*.adtrafficquality.google https://ep2.adtrafficquality.google;");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");

  // Cache-control: long cache for static assets, must-revalidate for HTML
  // IMPORTANT: no-store breaks bfcache — use no-cache instead
  const url = req.path;
  if (/\.(css|js|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|webp|gif|ico|mp4|webm)$/i.test(url)) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  } else if (/\.html?$/.test(url) || url === "/" || !url.includes(".")) {
    // no-cache allows bfcache (back/forward); browser still revalidates with server
    res.setHeader("Cache-Control", "no-cache");
  } else {
    res.setHeader("Cache-Control", "public, max-age=86400");
  }
  next();
});

// Dynamic CSS Minification cache
const cssCache = new Map();

app.get("/*.css", (req, res, next) => {
  const cssPath = path.join(__dirname, "public", req.path);
  if (!fs.existsSync(cssPath)) {
    return next();
  }

  try {
    const stats = fs.statSync(cssPath);
    const cacheKey = req.path;
    const cached = cssCache.get(cacheKey);

    // If cached and file hasn't changed, serve cached
    if (cached && cached.mtime >= stats.mtimeMs) {
      res.setHeader("Content-Type", "text/css");
      return res.send(cached.content);
    }

    // Otherwise, read, minify, cache, and serve
    const rawContent = fs.readFileSync(cssPath, "utf8");
    const minified = rawContent
      .replace(/\/\*[\s\S]*?\*\//g, "") // remove comments
      .replace(/\s+/g, " ")             // collapse multiple spaces/newlines
      .replace(/\s*([{}|:;,])\s*/g, "$1") // remove spaces around separators
      .trim();

    cssCache.set(cacheKey, {
      content: minified,
      mtime: stats.mtimeMs
    });

    res.setHeader("Content-Type", "text/css");
    return res.send(minified);
  } catch (err) {
    console.error(`Error minifying CSS for ${req.path}:`, err);
    next(); // fallback to static serving if minification fails
  }
});

// Dynamic JS Minification cache
const jsCache = new Map();

app.get("/*.js", (req, res, next) => {
  const jsPath = path.join(__dirname, "public", req.path);
  if (!fs.existsSync(jsPath) || req.path.includes("node_modules")) {
    return next();
  }

  try {
    const stats = fs.statSync(jsPath);
    const cacheKey = req.path;
    const cached = jsCache.get(cacheKey);

    // If cached and file hasn't changed, serve cached
    if (cached && cached.mtime >= stats.mtimeMs) {
      res.setHeader("Content-Type", "application/javascript");
      return res.send(cached.content);
    }

    // Otherwise, read, minify, cache, and serve
    const rawContent = fs.readFileSync(jsPath, "utf8");
    
    // Safe robust line-by-line JS minification:
    const minified = rawContent
      .split("\n")
      .map(line => {
        let cleanLine = line.trim();
        if (cleanLine.startsWith("//")) {
          return "";
        }
        // Remove trailing comment if it starts with space + // (preserves URL double slashes)
        const commentIdx = cleanLine.indexOf(" //");
        if (commentIdx !== -1) {
          cleanLine = cleanLine.substring(0, commentIdx).trim();
        }
        return cleanLine;
      })
      .filter(line => line.length > 0)
      .join("\n")
      .replace(/\/\*[\s\S]*?\*\//g, ""); // remove block comments

    jsCache.set(cacheKey, {
      content: minified,
      mtime: stats.mtimeMs
    });

    res.setHeader("Content-Type", "application/javascript");
    return res.send(minified);
  } catch (err) {
    console.error(`Error minifying JS for ${req.path}:`, err);
    next(); // fallback to static serving
  }
// ---------------- CRITICAL ADS.TXT, ROBOTS.TXT & SITEMAP ROUTES ----------------
app.get("/ads.txt", (req, res) => {
  const adsPath = path.join(__dirname, "public", "ads.txt");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  if (fs.existsSync(adsPath)) {
    return res.sendFile(adsPath);
  }
  return res.send("google.com, pub-7208166578795598, DIRECT, f08c47fec0942fa0\n");
});

app.get("/robots.txt", (req, res) => {
  const robotsPath = path.join(__dirname, "public", "robots.txt");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  if (fs.existsSync(robotsPath)) {
    return res.sendFile(robotsPath);
  }
  return res.send("User-agent: *\nAllow: /\nSitemap: https://www.doppelganger.world/sitemap.xml\n");
});

app.get("/sitemap.xml", (req, res) => {
  const sitemapPath = path.join(__dirname, "public", "sitemap.xml");
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  if (fs.existsSync(sitemapPath)) {
    return res.sendFile(sitemapPath);
  }
  return res.status(404).send("<error>Sitemap not found</error>");
});

app.use(express.static(path.join(__dirname, "public"), { etag: true, lastModified: true }));


// Clean URL routes — serve specific HTML files for pretty URLs
const pageRoutes = {
  "/about":         "AboutUs.html",
  "/blog":          "blog.html",
  "/contact":       "contact.html",
  "/faq":           "faq.html",
  "/privacy":       "privacy.html",
  "/terms":         "terms.html",
  "/cookie-policy": "cookie-policy.html",
  "/disclaimer":    "disclaimer.html",
  "/sitemap-page":  "sitemap.html",
};

Object.entries(pageRoutes).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    const filePath = path.join(__dirname, "public", file);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.redirect("/");
    }
  });
});

// Clean category URLs
app.get("/category/:cat", (req, res) => {
  const cat = req.params.cat.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
  const filePath = path.join(__dirname, "public", `category-${cat}.html`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.redirect("/blog");
  }
});

// Clean tag URLs
app.get("/tag/:tag", (req, res) => {
  const tag = req.params.tag.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "");
  const filePath = path.join(__dirname, "public", `tag-${tag}.html`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.redirect("/blog");
  }
});

// Legacy Terms redirect (old broken filename)
app.get("/Term%26condtion.html", (req, res) => {
  res.redirect(301, "/terms.html");
});

// Fallback for SPA or unknown routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  // Automatically rebuild sitemap on server boot
  rebuildSitemap();
});

// Test Supabase connection on server start
(async () => {
  const { data, error } = await supabase
    .from("images") // change this to your real table name
    .select("*")
    .limit(1);

  if (error) {
    console.error("❌ Supabase test failed:", error.message);
  } else {
    console.log("✅ Supabase connection OK. Sample data:", data);
  }
})();

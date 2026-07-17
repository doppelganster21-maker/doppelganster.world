// backend/generate_blogs.js
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("❌ Missing GROQ_API_KEY in .env");
  process.exit(1);
}

const blogsFile = path.join(__dirname, 'blogs.json');
const publicDir = path.join(__dirname, 'public');
const imagesDir = path.join(publicDir, 'images');

// Prepare directories
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

// Read existing blogs.json database
const readBlogs = () => {
  if (!fs.existsSync(blogsFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
  } catch (err) {
    console.error("Error reading blogs.json:", err);
    return [];
  }
};

// Write to blogs.json database
const writeBlogs = (data) => {
  fs.writeFileSync(blogsFile, JSON.stringify(data, null, 2), 'utf8');
};

// List of target 25 topics from the top 50 topics requested
const targetTopics = [
  {
    id: 1,
    title: "What Is a Doppelganger?",
    slug: "what-is-a-doppelganger",
    category: "History",
    keywords: "doppelganger meaning, what is a doppelganger, lookalike meaning, double goer folklore",
    focusKeyword: "what is a doppelganger",
    tags: ["folklore", "doppelganger", "history", "mysteries"]
  },
  {
    id: 2,
    title: "History of Doppelgangers",
    slug: "history-of-doppelgangers",
    category: "History",
    keywords: "history of doppelgangers, doppelganger historical accounts, double spirit history, folklore double goer",
    focusKeyword: "history of doppelgangers",
    tags: ["history", "folklore", "superstitions", "myths"]
  },
  {
    id: 3,
    title: "AI Face Recognition Explained",
    slug: "ai-face-recognition-explained",
    category: "AI",
    keywords: "AI face recognition, how facial recognition works, face identification systems, biometrics guide",
    focusKeyword: "AI face recognition explained",
    tags: ["AI", "technology", "face-recognition", "biometrics"]
  },
  {
    id: 4,
    title: "How Face Similarity AI Works",
    slug: "how-face-similarity-ai-works",
    category: "Machine Learning",
    keywords: "face similarity AI, facial landmark matching, similarity score algorithm, how face match works",
    focusKeyword: "how face similarity AI works",
    tags: ["machine-learning", "algorithms", "face-recognition", "math"]
  },
  {
    id: 5,
    title: "Celebrity Lookalike Finder",
    slug: "celebrity-lookalike-finder",
    category: "Celebrity",
    keywords: "celebrity lookalike finder, celebrity twin match, find celebrity doppelganger, lookalike face scan",
    focusKeyword: "celebrity lookalike finder",
    tags: ["celebrity", "entertainment", "lookalike", "fun"]
  },
  {
    id: 6,
    title: "Historical Doppelgangers",
    slug: "historical-doppelgangers",
    category: "History",
    keywords: "historical doppelgangers, historical figures twin lookalike, time travel celebrity twins",
    focusKeyword: "historical doppelgangers",
    tags: ["history", "celebrity", "lookalike", "art"]
  },
  {
    id: 7,
    title: "Anime Character Lookalike",
    slug: "anime-character-lookalike",
    category: "Entertainment",
    keywords: "anime character lookalike, find anime twin, facial matching anime, scan face to anime",
    focusKeyword: "anime character lookalike",
    tags: ["anime", "entertainment", "fun", "lookalike"]
  },
  {
    id: 8,
    title: "Movie Character Lookalike",
    slug: "movie-character-lookalike",
    category: "Entertainment",
    keywords: "movie character lookalike, fictional character twins, cartoon lookalike scanner, movie twin match",
    focusKeyword: "movie character lookalike",
    tags: ["entertainment", "movies", "fictional-characters", "lookalike"]
  },
  {
    id: 9,
    title: "Twin Finder Technology",
    slug: "twin-finder-technology",
    category: "Technology",
    keywords: "twin finder technology, find twin stranger, global lookalike search, facial matching database",
    focusKeyword: "twin finder technology",
    tags: ["technology", "guides", "face-recognition", "databases"]
  },
  {
    id: 10,
    title: "AI Face Matching Accuracy",
    slug: "ai-face-matching-accuracy",
    category: "Face Recognition",
    keywords: "AI face matching accuracy, facial recognition precision, False Acceptance Rate, biometrics benchmark",
    focusKeyword: "AI face matching accuracy",
    tags: ["face-recognition", "security", "technology", "machine-learning"]
  },
  {
    id: 11,
    title: "Facial Recognition vs Face Matching",
    slug: "facial-recognition-vs-face-matching",
    category: "Face Recognition",
    keywords: "facial recognition vs face matching, 1:1 vs 1:N recognition, verification vs identification, facial authentication",
    focusKeyword: "facial recognition vs face matching",
    tags: ["face-recognition", "technology", "security", "privacy"]
  },
  {
    id: 12,
    title: "AI Face Search Guide",
    slug: "ai-face-search-guide",
    category: "Guides",
    keywords: "AI face search guide, search face online, reverse image search face, lookalike tracking",
    focusKeyword: "AI face search guide",
    tags: ["guides", "tutorials", "privacy", "search"]
  },
  {
    id: 13,
    title: "Face Recognition Privacy",
    slug: "face-recognition-privacy",
    category: "Privacy",
    keywords: "face recognition privacy, biometric data security, optical scanning tracking laws, opt out biometric database",
    focusKeyword: "face recognition privacy",
    tags: ["privacy", "security", "laws", "ethics"]
  },
  {
    id: 14,
    title: "AI Ethics in Face Recognition",
    slug: "ai-ethics-in-face-recognition",
    category: "Security",
    keywords: "AI ethics in face recognition, bias in facial scanning, algorithm discrimination, ethical AI standards",
    focusKeyword: "AI ethics in face recognition",
    tags: ["ethics", "AI", "privacy", "security"]
  },
  {
    id: 15,
    title: "Deepfake vs Face Matching",
    slug: "deepfake-vs-face-matching",
    category: "Technology",
    keywords: "deepfake vs face matching, deepfake detection, synthetic identity vs biometric face match, digital twin",
    focusKeyword: "deepfake vs face matching",
    tags: ["technology", "security", "machine-learning", "fun"]
  },
  {
    id: 16,
    title: "How to Upload Better Photos",
    slug: "how-to-upload-better-photos",
    category: "Guides",
    keywords: "how to upload better photos, facial scan photo tips, camera resolution face scanner, selfie lighting guide",
    focusKeyword: "how to upload better photos",
    tags: ["guides", "tutorials", "photography", "tips"]
  },
  {
    id: 17,
    title: "Best Lighting for Face Matching",
    slug: "best-lighting-for-face-matching",
    category: "Tutorials",
    keywords: "best lighting for face matching, flat lighting portrait, selfie lighting setups, how shadows affect face scans",
    focusKeyword: "best lighting for face matching",
    tags: ["tutorials", "photography", "guides", "tips"]
  },
  {
    id: 18,
    title: "Common Face Matching Mistakes",
    slug: "common-face-matching-mistakes",
    category: "Guides",
    keywords: "common face matching mistakes, photo distortion lookup, why face scanners fail, landmark alignment errors",
    focusKeyword: "common face matching mistakes",
    tags: ["guides", "tips", "tutorials", "technology"]
  },
  {
    id: 19,
    title: "AI Vision Models Explained",
    slug: "ai-vision-models-explained",
    category: "Machine Learning",
    keywords: "AI vision models explained, convolutional neural networks vision, ResNet, Vision Transformer face matching",
    focusKeyword: "AI vision models explained",
    tags: ["machine-learning", "AI", "technology", "research"]
  },
  {
    id: 20,
    title: "Computer Vision Basics",
    slug: "computer-vision-basics",
    category: "Machine Learning",
    keywords: "computer vision basics, image pixel array, edge detection kernels, how computers read images",
    focusKeyword: "computer vision basics",
    tags: ["machine-learning", "technology", "tutorials", "math"]
  },
  {
    id: 21,
    title: "Facial Landmarks Explained",
    slug: "facial-landmarks-explained",
    category: "Face Recognition",
    keywords: "facial landmarks explained, 68 landmark point model, dlib face detection points, facial coordinate mapping",
    focusKeyword: "facial landmarks explained",
    tags: ["face-recognition", "technology", "math", "machine-learning"]
  },
  {
    id: 22,
    title: "Neural Networks for Face Recognition",
    slug: "neural-networks-for-face-recognition",
    category: "Machine Learning",
    keywords: "neural networks for face recognition, deep CNN facial verification, FaceNet triplet loss, training facial models",
    focusKeyword: "neural networks for face recognition",
    tags: ["machine-learning", "technology", "algorithms", "AI"]
  },
  {
    id: 23,
    title: "Machine Learning Behind AI Faces",
    slug: "machine-learning-behind-ai-faces",
    category: "Machine Learning",
    keywords: "machine learning behind AI faces, biometric database scaling, face embedding vector distance, model optimization",
    focusKeyword: "machine learning behind AI faces",
    tags: ["machine-learning", "AI", "technology", "algorithms"]
  },
  {
    id: 24,
    title: "Face Embeddings Explained",
    slug: "face-embeddings-explained",
    category: "Face Recognition",
    keywords: "face embeddings explained, high-dimensional face vectors, cosine distance facial recognition, vector databases",
    focusKeyword: "face embeddings explained",
    tags: ["face-recognition", "machine-learning", "technology", "math"]
  },
  {
    id: 25,
    title: "How AI Detects Faces",
    slug: "how-ai-detects-faces",
    category: "Face Recognition",
    keywords: "how AI detects faces, Viola-Jones algorithm, MTCNN face detection, YOLO face detector",
    focusKeyword: "how AI detects faces",
    tags: ["face-recognition", "AI", "technology", "machine-learning"]
  }
];

// Helper to query Groq model for article content
const fetchArticleFromGroq = async (topic) => {
  const systemPrompt = `You are an expert tech writer, SEO copywriter, and facial recognition researcher.
Generate a comprehensive, production-ready blog article about the topic. The response MUST be ONLY a JSON object containing the article structure.

Requirements:
- Article must be extremely informative, conversational but professional, factual, and 2,000 to 4,000 words long.
- Include a detailed intro, 8-15 distinct detailed sections, real-world examples, expert tips, common mistakes, a detailed FAQ section with exactly 8 questions, a conclusion, and a clear call-to-action.
- Format the body content strictly as clean, semantic HTML with H2, H3, paragraphs, bullet lists, and tables (include at least 1 formatted HTML comparison table). Do not include H1 in the bodyContent.
- Strictly return a valid JSON object matching the schema below:
{
  "title": "SEO Optimized Article Title",
  "metaTitle": "Meta Title (Max 60 chars)",
  "description": "Meta description (150-160 chars)",
  "readTime": "12 Min Read",
  "bodyContent": "HTML content here",
  "faqs": [
    { "q": "Question?", "a": "Answer details..." },
    ... exactly 8 questions
  ]
}`;

  const userPrompt = `Generate a 2,500 word article on: "${topic.title}".
Focus Keyword: "${topic.focusKeyword}"
Secondary Keywords: "${topic.keywords}"
Category: "${topic.category}"

Please output ONLY a JSON block. Use valid JSON encoding (escape quotes correctly). No trailing text outside JSON.`;

  const maxRetries = 6;
  let attempt = 0;
  let delay = 5000; // start with 5 seconds delay

  while (attempt < maxRetries) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          max_tokens: 6000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        })
      });

      if (response.status === 429) {
        attempt++;
        console.warn(`⚠️ Rate limit (429) encountered. Retrying in ${delay / 1000}s (Attempt ${attempt}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, delay));
        delay *= 2; // exponential backoff
        continue;
      }

      if (!response.ok) {
        throw new Error(`Groq API returned error status ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed for ${topic.title}:`, err);
      attempt++;
      if (attempt >= maxRetries) {
        return null;
      }
      await new Promise(r => setTimeout(r, delay));
      delay *= 1.5;
    }
  }
  return null;
};

// Generates procedural SVG for blog post featured image
const generateProceduralSvg = (title, category, slug) => {
  const gradientColors = {
    "History": ["#ec4899", "#8b5cf6"],
    "AI": ["#3b82f6", "#10b981"],
    "Machine Learning": ["#6366f1", "#a855f7"],
    "Celebrity": ["#f59e0b", "#ec4899"],
    "Entertainment": ["#ef4444", "#f59e0b"],
    "Face Recognition": ["#06b6d4", "#3b82f6"],
    "Guides": ["#10b981", "#06b6d4"],
    "Privacy": ["#14b8a6", "#6366f1"],
    "Security": ["#ef4444", "#3b82f6"],
    "Tutorials": ["#f59e0b", "#10b981"]
  };

  const colors = gradientColors[category] || ["#a855f7", "#6366f1"];

  // Split title into two lines for rendering
  const words = title.split(" ");
  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ");
  const line2 = words.slice(Math.ceil(words.length / 2)).join(" ");

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" height="100%">
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1"/>
      </pattern>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="40" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="rgba(255, 255, 255, 0.7)" />
      </linearGradient>
    </defs>

    <rect width="800" height="450" fill="#030712" />
    <rect width="800" height="450" fill="url(#grid)" />

    <circle cx="100" cy="100" r="180" fill="${colors[0]}" opacity="0.12" filter="url(#glow)" />
    <circle cx="700" cy="350" r="220" fill="${colors[1]}" opacity="0.1" filter="url(#glow)" />
    <circle cx="400" cy="225" r="140" fill="#3b82f6" opacity="0.08" filter="url(#glow)" />

    <g opacity="0.25" transform="translate(620, 225)">
      <circle r="120" fill="none" stroke="${colors[0]}" stroke-width="1" stroke-dasharray="10 15" />
      <circle r="90" fill="none" stroke="${colors[1]}" stroke-width="2" />
      <circle r="60" fill="none" stroke="#ffffff" stroke-width="0.5" stroke-dasharray="5 5" />
      <line x1="-140" y1="0" x2="140" y2="0" stroke="${colors[0]}" stroke-width="1" />
      <circle cx="0" cy="0" r="6" fill="${colors[0]}" />
    </g>

    <rect x="50" y="50" width="700" height="350" rx="20" fill="rgba(255, 255, 255, 0.01)" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.5" />

    <text x="80" y="95" font-family="'Outfit', 'Inter', sans-serif" font-size="11" font-weight="900" fill="rgba(255, 255, 255, 0.4)" letter-spacing="3">DOPPELGANGER RESEARCH</text>

    <rect x="80" y="120" width="120" height="26" rx="13" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1" />
    <circle cx="95" cy="133" r="4" fill="${colors[0]}" />
    <text x="108" y="137" font-family="'Inter', sans-serif" font-size="10" font-weight="800" fill="#ffffff">${category.toUpperCase()}</text>

    <text x="80" y="210" font-family="'Outfit', 'Inter', sans-serif" font-size="28" font-weight="800" fill="url(#textGrad)" letter-spacing="-1">${line1}</text>
    <text x="80" y="255" font-family="'Outfit', 'Inter', sans-serif" font-size="28" font-weight="800" fill="url(#textGrad)" letter-spacing="-1">${line2}</text>

    <text x="80" y="360" font-family="'Inter', sans-serif" font-size="12" font-weight="600" fill="rgba(255, 255, 255, 0.5)">Doppelganger.world AI Look-Alike Finder</text>
  </svg>`;

  const svgFilePath = path.join(imagesDir, `${slug}.svg`);
  fs.writeFileSync(svgFilePath, svgContent, 'utf8');
  return `images/${slug}.svg`;
};

// Generates individual category and tag static pages
const generateCategoryAndTagPages = (blogs) => {
  console.log("Creating category and tag index pages...");

  // Extract unique categories and tags
  const categories = new Set();
  const tagsMap = new Map();

  blogs.forEach(b => {
    if (b.category) categories.add(b.category);
    if (b.tags && Array.isArray(b.tags)) {
      b.tags.forEach(t => {
        const cleanT = t.toLowerCase().replace(/[^a-z0-9-_]/g, "");
        if (!tagsMap.has(cleanT)) tagsMap.set(cleanT, []);
        tagsMap.get(cleanT).push(b);
      });
    }
  });

  // Base layout function for category/tag list
  const getIndexHtml = (title, items, typeStr, activeName) => {
    const cardMarkup = items.map(blog => `
      <div class="card spotlight-card blog-card" style="padding: 24px; display: flex; flex-direction: column; height: 100%;">
        <img class="blog-card-image" src="/${blog.imageUrl}" alt="${blog.title}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px; margin-bottom: 16px; border: 1px solid var(--border-color);" />
        <div class="blog-card-content" style="display: flex; flex-direction: column; flex: 1;">
          <div class="blog-card-meta">${blog.category} • ${blog.readTime || '5 Min Read'}</div>
          <h2 class="blog-card-title" style="font-size: 20px; font-weight: 800; margin-bottom: 10px; color: var(--text-main);">${blog.title}</h2>
          <p class="blog-card-desc" style="color: var(--text-secondary); font-size: 14px; line-height: 1.5; margin-bottom: 20px;">${blog.description}</p>
          <a href="/${blog.slug}.html" class="btn secondary blog-card-btn" style="padding: 8px 16px; font-size: 14px; align-self: flex-start;">Read Article &rarr;</a>
        </div>
      </div>
    `).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Doppelganger World</title>
  <meta name="description" content="Browse our library of look-alike research, guides, and tutorials for ${activeName}.">
  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/ad-styles.css" />
  <link rel="stylesheet" href="/cookie-consent.css" />
  <script src="/theme.js"></script>
</head>
<body>
  <!-- HEADER & NAVBAR -->
  <header class="navbar">
    <div class="nav-wrapper">
      <a href="/" class="brand">
        <div class="logo">
          <img src="/logo-dark.png" alt="Doppelganger Logo" class="logo-dark" width="34" height="34" />
          <img src="/logo-light.png" alt="Doppelganger Logo" class="logo-light" width="34" height="34" />
        </div>
        <div class="brand-text">
          <span class="brand-name">Doppelganger</span>
          <p>Find Your Real-Life Double</p>
        </div>
      </a>
      <nav class="main-nav">
        <a href="/">Home</a>
        <a href="/blog.html">Blog</a>
        <a href="/faq.html">FAQ</a>
        <a href="/contact.html">Contact</a>
      </nav>
      <button class="theme-toggle-btn" type="button"></button>
    </div>
  </header>

  <div class="container page-fade-in" style="margin-top: 40px; margin-bottom: 80px;">
    <nav class="breadcrumbs" style="display: flex; gap: 8px; font-size: 13px; color: var(--text-muted); margin-bottom: 24px;">
      <a href="/" style="color: var(--text-muted);">Home</a>
      <span>&rarr;</span>
      <a href="/blog.html" style="color: var(--text-muted);">Blog</a>
      <span>&rarr;</span>
      <span style="color: var(--text-main);">${typeStr}: ${activeName}</span>
    </nav>

    <section style="margin-bottom: 40px; padding: 32px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px;">
      <h1 style="font-size: 32px; font-weight: 800; color: var(--text-main);">${title}</h1>
      <p style="color: var(--text-secondary); margin-top: 8px;">Discover and learn about ${activeName} with our articles.</p>
    </section>

    <div class="blog-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
      ${cardMarkup}
    </div>
  </div>

  <footer class="site-footer">
    <div class="footer-grid" style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 40px; padding: 40px 0;">
      <div>
        <h4>Doppelganger.world</h4>
        <p style="font-size: 13px; max-width: 300px; color: var(--text-muted);">Find your real-life lookalike using AI facial matching technology.</p>
      </div>
      <div>
        <h4>Links</h4>
        <a href="/" style="display: block; margin-bottom: 8px; color: var(--text-muted);">Home</a>
        <a href="/blog.html" style="display: block; margin-bottom: 8px; color: var(--text-muted);">Blog</a>
      </div>
    </div>
  </footer>
</body>
</html>`;
  };

  // Write category files
  categories.forEach(cat => {
    const cleanCat = cat.toLowerCase().replace(/[^a-z0-9-_]/g, "");
    const matchingBlogs = blogs.filter(b => b.category === cat);
    const html = getIndexHtml(`${cat} Articles`, matchingBlogs, "Category", cat);
    fs.writeFileSync(path.join(publicDir, `category-${cleanCat}.html`), html, 'utf8');
  });

  // Write tag files
  tagsMap.forEach((matchingBlogs, tag) => {
    const html = getIndexHtml(`Articles tagged with #${tag}`, matchingBlogs, "Tag", `#${tag}`);
    fs.writeFileSync(path.join(publicDir, `tag-${tag}.html`), html, 'utf8');
  });
};

// Generates public/rss.xml feed
const generateRssFeed = (blogs) => {
  console.log("Generating RSS feed...");
  let xml = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
  xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
  xml += `<channel>\n`;
  xml += `  <title>Doppelganger.world Blog Feed</title>\n`;
  xml += `  <link>https://www.doppelganger.world/blog</link>\n`;
  xml += `  <description>Latest insights, guides, and research in AI Facial recognition, doppelgangers and genetics from Doppelganger.world</description>\n`;
  xml += `  <language>en-us</language>\n`;
  xml += `  <atom:link href="https://www.doppelganger.world/rss.xml" rel="self" type="application/rss+xml" />\n`;

  blogs.slice(0, 20).forEach(blog => {
    const pubDate = new Date(blog.date || Date.now()).toUTCString();
    xml += `  <item>\n`;
    xml += `    <title><![CDATA[${blog.title}]]></title>\n`;
    xml += `    <link>https://www.doppelganger.world/${blog.slug}.html</link>\n`;
    xml += `    <guid>https://www.doppelganger.world/${blog.slug}.html</guid>\n`;
    xml += `    <pubDate>${pubDate}</pubDate>\n`;
    xml += `    <description><![CDATA[${blog.description}]]></description>\n`;
    xml += `  </item>\n`;
  });

  xml += `</channel>\n`;
  xml += `</rss>\n`;

  fs.writeFileSync(path.join(publicDir, 'rss.xml'), xml, 'utf8');
};

// Generates public/search-index.json
const generateSearchIndex = (blogs) => {
  console.log("Generating search index...");
  const searchIndex = blogs.map(b => ({
    title: b.title,
    slug: b.slug,
    description: b.description,
    keywords: b.keywords,
    category: b.category,
    tags: b.tags || []
  }));

  fs.writeFileSync(path.join(publicDir, 'search-index.json'), JSON.stringify(searchIndex, null, 2), 'utf8');
};

// Main generator execution loop
const run = async () => {
  const existingBlogs = readBlogs();
  console.log(`Starting generation. Existing blogs in database: ${existingBlogs.length}`);

  for (let i = 0; i < targetTopics.length; i++) {
    const topic = targetTopics[i];

    // Check if topic is already generated and saved in blogs.json to avoid duplication
    const alreadyExists = existingBlogs.some(b => b.slug === topic.slug);
    if (alreadyExists) {
      console.log(`⏭️ Article for ${topic.title} already exists in blogs.json. Skipping generation.`);
      continue;
    }

    console.log(`Generating: [${i+1}/${targetTopics.length}] "${topic.title}"`);
    const result = await fetchArticleFromGroq(topic);

    if (result) {
      // Procedurally generate featured SVG (unless topic 1 which uses our custom png)
      let imageUrl = "";
      if (topic.slug === "what-is-a-doppelganger") {
        imageUrl = "images/what_is_doppelganger.png";
      } else {
        imageUrl = generateProceduralSvg(result.title, topic.category, topic.slug);
      }

      const newBlog = {
        title: result.title,
        slug: topic.slug,
        description: result.description,
        keywords: topic.keywords,
        category: topic.category,
        readTime: result.readTime || "10 Min Read",
        imageUrl: imageUrl,
        bodyContent: result.bodyContent,
        date: new Date().toISOString(),
        tags: topic.tags,
        faqs: result.faqs
      };

      existingBlogs.push(newBlog);
      writeBlogs(existingBlogs);

      console.log(`✅ Saved article content for: ${topic.title}`);
    } else {
      console.error(`❌ Skipped "${topic.title}" due to API errors.`);
    }

    // Wait a brief period to comply with API rate limits
    await new Promise(r => setTimeout(r, 2000));
  }

  // Compile all pages, rebuild metadata feeds and static indexes
  const finalBlogs = readBlogs();
  generateCategoryAndTagPages(finalBlogs);
  generateRssFeed(finalBlogs);
  generateSearchIndex(finalBlogs);

  // Compile static blog HTML pages for all entries
  try {
    console.log("Triggering static pages compilation...");
    execSync('node compile_pages.js', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error("Static HTML compilation error:", err);
  }

  console.log("🎉 All 25 articles processed and auxiliary files generated!");
};

run().catch(console.error);

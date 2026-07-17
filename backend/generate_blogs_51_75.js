// backend/generate_blogs_51_75.js
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

// Read existing blogs
const readBlogs = () => {
  if (!fs.existsSync(blogsFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
  } catch (err) {
    console.error("Error reading blogs.json:", err);
    return [];
  }
};

// Write to blogs.json
const writeBlogs = (data) => {
  fs.writeFileSync(blogsFile, JSON.stringify(data, null, 2), 'utf8');
};

// List of target articles #51-75
const targetTopics = [
  {
    id: 51,
    title: "How to Find Your Celebrity Doppelganger Using AI",
    slug: "how-to-find-your-celebrity-doppelganger-using-ai",
    category: "Celebrity",
    keywords: "how to find your celebrity doppelganger, find celebrity lookalike, celebrity doppelganger finder, celebrity twin match, face similarity check",
    focusKeyword: "how to find your celebrity doppelganger",
    tags: ["celebrity", "AI", "lookalike", "guides"]
  },
  {
    id: 52,
    title: "Best Free AI Face Matching Tools Compared",
    slug: "best-free-ai-face-matching-tools-compared",
    category: "AI",
    keywords: "free AI face matching tools, best face match apps, free doppelganger scanner, face similarity tools, photo twin search",
    focusKeyword: "free AI face matching tools",
    tags: ["AI", "technology", "lookalike", "guides"]
  },
  {
    id: 53,
    title: "How Accurate Are Celebrity Lookalike Apps?",
    slug: "how-accurate-are-celebrity-lookalike-apps",
    category: "Face Recognition",
    keywords: "celebrity lookalike app accuracy, do celebrity lookalike apps work, face recognition precision, false positive lookalike, biometrics check",
    focusKeyword: "celebrity lookalike app accuracy",
    tags: ["celebrity", "face-recognition", "technology", "algorithms"]
  },
  {
    id: 54,
    title: "Face Matching vs Reverse Image Search: What's the Difference?",
    slug: "face-matching-vs-reverse-image-search-whats-the-difference",
    category: "Technology",
    keywords: "face matching vs reverse image search, facial recognition difference, image lookup face, search image by face, how reverse search works",
    focusKeyword: "face matching vs reverse image search",
    tags: ["technology", "search", "biometrics", "guides"]
  },
  {
    id: 55,
    title: "Can AI Find Your Long-Lost Twin?",
    slug: "can-ai-find-your-long-lost-twin",
    category: "Science",
    keywords: "can AI find your twin, find twin stranger online, long lost twin match, biological family finder, global face database scan",
    focusKeyword: "can AI find your twin",
    tags: ["AI", "technology", "research", "mysteries"]
  },
  {
    id: 56,
    title: "The Science Behind Why Unrelated People Look Alike",
    slug: "the-science-behind-why-unrelated-people-look-alike",
    category: "Science",
    keywords: "why unrelated people look alike, genetic lookalike science, doppelganger DNA research, twin strangers genetics, facial structure similarity",
    focusKeyword: "why unrelated people look alike",
    tags: ["history", "art", "research", "lookalike"]
  },
  {
    id: 57,
    title: "How AI Detects Facial Features in Seconds",
    slug: "how-ai-detects-facial-features-in-seconds",
    category: "Face Recognition",
    keywords: "how AI detects facial features, facial detection algorithms, face mapping nodes, deep learning computer vision, real-time face scan",
    focusKeyword: "how AI detects facial features",
    tags: ["face-recognition", "AI", "technology", "machine-learning"]
  },
  {
    id: 58,
    title: "Best Photo Tips for More Accurate Face Matching Results",
    slug: "best-photo-tips-for-more-accurate-face-matching-results",
    category: "Guides",
    keywords: "face matching photo tips, better face scan lighting, photo upload guidelines, selfie angle matching, clear face portrait",
    focusKeyword: "face matching photo tips",
    tags: ["guides", "tips", "photography", "tutorials"]
  },
  {
    id: 59,
    title: "Understanding Face Embeddings in Simple Terms",
    slug: "understanding-face-embeddings-in-simple-terms",
    category: "Machine Learning",
    keywords: "understanding face embeddings, what is a face embedding, vector face representation, high dimensional face mapping, face recognition math",
    focusKeyword: "understanding face embeddings",
    tags: ["machine-learning", "technology", "math", "algorithms"]
  },
  {
    id: 60,
    title: "AI Face Recognition in Smartphones Explained",
    slug: "ai-face-recognition-in-smartphones-explained",
    category: "Technology",
    keywords: "smartphone face recognition, phone facial unlock, 3D face scan mobile, smartphone biometric security, face ID technology",
    focusKeyword: "smartphone face recognition",
    tags: ["technology", "security", "face-recognition", "biometrics"]
  },
  {
    id: 61,
    title: "How Facial Recognition Is Used at Airports",
    slug: "how-facial-recognition-is-used-at-airports",
    category: "Security",
    keywords: "facial recognition at airports, airport biometric boarding, customs face scan, border security biometric check, travel facial verification",
    focusKeyword: "facial recognition at airports",
    tags: ["security", "technology", "privacy", "laws"]
  },
  {
    id: 62,
    title: "The Evolution of Face Recognition Technology",
    slug: "the-evolution-of-face-recognition-technology",
    category: "History",
    keywords: "history of face recognition, evolution of biometrics, history of facial scanning, computer vision timeline, facial matching origin",
    focusKeyword: "history of face recognition",
    tags: ["history", "technology", "face-recognition", "research"]
  },
  {
    id: 63,
    title: "Face Recognition Myths You Should Stop Believing",
    slug: "face-recognition-myths-you-should-stop-believing",
    category: "Technology",
    keywords: "face recognition myths, facial scanning misconceptions, how biometrics can be fooled, facial unlock safety, myths of face match",
    focusKeyword: "face recognition myths",
    tags: ["technology", "myths", "security", "privacy"]
  },
  {
    id: 64,
    title: "How to Protect Your Privacy When Using AI Face Apps",
    slug: "how-to-protect-your-privacy-when-using-ai-face-apps",
    category: "Privacy",
    keywords: "protect privacy face apps, AI face app security, opt out face database, biometric data privacy, check facial scan terms",
    focusKeyword: "protect privacy face apps",
    tags: ["privacy", "security", "guides", "tips"]
  },
  {
    id: 65,
    title: "AI Face Recognition Laws Around the World",
    slug: "ai-face-recognition-laws-around-the-world",
    category: "Laws",
    keywords: "facial recognition laws, biometric data regulations, GDPR facial scanning, state biometrics laws, privacy legislation AI",
    focusKeyword: "facial recognition laws",
    tags: ["laws", "privacy", "security", "ethics"]
  },
  {
    id: 66,
    title: "What Makes a Good Face Matching Algorithm?",
    slug: "what-makes-a-good-face-matching-algorithm",
    category: "Machine Learning",
    keywords: "best face matching algorithm, facial similarity models, deep learning face verification, Siamese network face match, computer vision scoring",
    focusKeyword: "best face matching algorithm",
    tags: ["machine-learning", "algorithms", "math", "technology"]
  },
  {
    id: 67,
    title: "How Computer Vision Understands Human Faces",
    slug: "how-computer-vision-understands-human-faces",
    category: "Machine Learning",
    keywords: "how computer vision works, computer reads human face, machine learning image processing, facial feature neural network, visual models",
    focusKeyword: "how computer vision works",
    tags: ["machine-learning", "technology", "AI", "research"]
  },
  {
    id: 68,
    title: "AI Face Matching for Family History and Genealogy",
    slug: "ai-face-matching-for-family-history-and-genealogy",
    category: "History",
    keywords: "AI genealogy face matching, heritage lookalike scanner, family history twin search, DNA family similarity, scan old family photos",
    focusKeyword: "AI genealogy face matching",
    tags: ["history", "research", "technology", "lookalike"]
  },
  {
    id: 69,
    title: "Can AI Predict Family Resemblance?",
    slug: "can-ai-predict-family-resemblance",
    category: "Science",
    keywords: "can AI predict family resemblance, predict baby face AI, family feature genetics, hereditary face structure, sibling resemblance match",
    focusKeyword: "can AI predict family resemblance",
    tags: ["AI", "research", "math", "technology"]
  },
  {
    id: 70,
    title: "Why Twins Sometimes Fool Face Recognition Systems",
    slug: "why-twins-sometimes-fool-face-recognition-systems",
    category: "Face Recognition",
    keywords: "twins fool face recognition, identical twins biometric match, face unlock identical twins, twin stranger verification error, biometric twins problem",
    focusKeyword: "twins fool face recognition",
    tags: ["face-recognition", "technology", "security", "biometrics"]
  },
  {
    id: 71,
    title: "The Future of AI Face Matching: Trends for the Next 10 Years",
    slug: "the-future-of-ai-face-matching-trends-for-the-next-10-years",
    category: "Technology",
    keywords: "future of AI face matching, biometrics trends 2030, face scanning future, smart vision advancements, next-gen identity matching",
    focusKeyword: "future of AI face matching",
    tags: ["technology", "AI", "machine-learning", "research"]
  },
  {
    id: 72,
    title: "How Businesses Use AI Face Recognition Today",
    slug: "how-businesses-use-ai-face-recognition-today",
    category: "Technology",
    keywords: "commercial face recognition, businesses use biometric scan, retail face tracking, employee facial attendance, facial check-in business",
    focusKeyword: "commercial face recognition",
    tags: ["technology", "security", "business", "ethics"]
  },
  {
    id: 73,
    title: "Common Errors in Face Matching and How to Avoid Them",
    slug: "common-errors-in-face-matching-and-how-to-avoid-them",
    category: "Guides",
    keywords: "face matching errors, facial scanner errors, avoid scan failures, bad lighting face mismatch, landmark mapping fail",
    focusKeyword: "face matching errors",
    tags: ["guides", "tips", "tutorials", "technology"]
  },
  {
    id: 74,
    title: "The Complete Beginner's Guide to Facial Biometrics",
    slug: "the-complete-beginners-guide-to-facial-biometrics",
    category: "Guides",
    keywords: "facial biometrics guide, facial biometrics for beginners, what are biometrics, face scan 101, security face mapping",
    focusKeyword: "facial biometrics guide",
    tags: ["guides", "tutorials", "biometrics", "technology"]
  },
  {
    id: 75,
    title: "Behind the Technology of Doppelganger.world: How Our AI Works",
    slug: "behind-the-technology-of-doppelganger-world-how-our-ai-works",
    category: "Technology",
    keywords: "how Doppelganger.world works, our face matching technology, Doppelganger AI scanner, behind the scenes face scanner, twin stranger algorithm",
    focusKeyword: "how Doppelganger.world works",
    tags: ["technology", "algorithms", "doppelganger", "AI"]
  }
];

// Helper to query Groq model for article content
const fetchArticleFromGroq = async (topic, existingLinksList) => {
  const systemPrompt = `You are an award-winning AI technical writer, SEO strategist, Google Search expert, and content marketing specialist at Doppelganger.world.
Your task is to write a premium, in-depth blog post about the topic. The post must satisfy Google's Helpful Content guidelines and satisfy E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness). Avoid AI spam, repetitive headings, or filler content. Write naturally like a professional technology journalist.

Key Content Requirements:
1. Do NOT include H1 in the bodyContent.
2. Add a detailed Introduction.
3. Add a "Table of Contents" section immediately after the Introduction. It must be formatted as an HTML block listing the H2 headings as local anchor links (e.g. <a href="#section-1">1. Heading</a>).
4. Strictly generate a MINIMUM of 10 distinct, detailed H2 sections in the article body. Every H2 must have a unique ID matching the TOC (e.g., <h2 id="section-1">).
5. Each H2 section should contain multiple H3 sections where appropriate.
6. The article must contain:
   - bullet lists
   - at least one formatted HTML comparison table (use clean, semantic, accessible tables with 📊 emojis in headers)
   - real-world examples and step-by-step guides
   - expert tips, warnings (e.g., ⚠️ warning boxes), and best practices
   - industry insights and future trends
7. Integrate exactly 8 to 12 natural, contextual internal links to other articles on Doppelganger.world. You MUST select pages from the provided List of Existing Pages below. Format them as anchor tags using absolute paths: e.g. <a href="/slug.html">anchor text</a>.
8. Include a Call to Action (CTA) at the very end of the bodyContent encouraging readers to try AI Face Matching on Doppelganger.world, upload a photo, find their celebrity doppelganger, explore related articles, or share the post.
9. Accessibility: Use semantic markup, appropriate ARIA-friendly elements, and readable formatting.
10. Google AdSense: distinguish advertising clearly, use educational content, and make no misleading or clickbait claims.
11. Image prompts: You must generate:
    - heroImagePrompt (detailed, copyright-safe prompt for AI image generators)
    - supportingImagePrompts (array of exactly 3 detailed image prompts)
    - infographicPrompt (detailed prompt to generate an infographic)
    - socialMediaPreviewPrompt (detailed prompt for social media preview image)
12. Schema: Provide structured data fields (seoData, faqs - at least 10 detailed questions and answers).

List of Existing Pages to Link To (choose 8 to 12):
${existingLinksList}

Your response MUST be ONLY a JSON object containing the article structure. Do not include markdown code block syntax (like \`\`\`json) or any pre/post text. Ensure all quotes inside HTML are properly escaped.

JSON Schema matching strictly:
{
  "title": "SEO Optimized Article Title (H1)",
  "metaTitle": "Meta Title (Max 60 chars)",
  "description": "Meta description (150-160 chars)",
  "readTime": "12 Min Read",
  "bodyContent": "Complete body HTML content starting from Introduction, Table of Contents, 10+ H2s, H3s, tables, lists, tips, warnings, and CTA at the end.",
  "faqs": [
    { "q": "Detailed Question 1?", "a": "Detailed, helpful, and unique answer 1." },
    ... at least 10 questions
  ],
  "imagePrompts": {
    "heroImagePrompt": "A detailed, copyright-safe prompt...",
    "supportingImagePrompts": [
      "Prompt 1...",
      "Prompt 2...",
      "Prompt 3..."
    ],
    "infographicPrompt": "Detailed prompt for infographic...",
    "socialMediaPreviewPrompt": "Detailed prompt for social preview..."
  },
  "seoData": {
    "primaryKeyword": "Keyword",
    "secondaryKeywords": ["Keyword 1", "Keyword 2"],
    "searchIntent": "Informational",
    "imageAltText": "SEO-friendly alt text for featured image"
  }
}`;

  const userPrompt = `Generate a comprehensive, premium 1,500-word article on: "${topic.title}".
Focus Keyword: "${topic.focusKeyword}"
Secondary Keywords: "${topic.keywords}"
Category: "${topic.category}"

Please output ONLY the raw JSON block without any formatting wrapper. Use valid JSON encoding.`;

  const maxRetries = 6;
  let attempt = 0;
  let delay = 6000;

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
          max_tokens: 3500,
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
        delay *= 2.5; // exponential backoff
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
      delay *= 2;
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
    "Tutorials": ["#f59e0b", "#10b981"],
    "Laws": ["#ef4444", "#f59e0b"],
    "Science": ["#10b981", "#6366f1"]
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

// Main execution loop
const run = async () => {
  const existingBlogs = readBlogs();
  console.log(`Starting generation for Articles #51-75. Existing count: ${existingBlogs.length}`);

  const existingLinksList = [
    "- /blog1.html (Title: \"What Is a Doppelganger? The Science Behind Look-Alikes\")",
    "- /blog2.html (Title: \"What Is a Twin Stranger? Finding Your Unrelated Double\")",
    "- /blog5.html (Title: \"How to Find Your Doppelganger Online — Step-by-Step Guide\")",
    "- /blog8.html (Title: \"Twin Stranger Meaning & Fascinating Facts\")",
    "- /what-is-a-doppelganger.html (Title: \"What Is a Doppelganger?\")",
    "- /history-of-doppelgangers.html (Title: \"History of Doppelgangers\")",
    "- /ai-face-recognition-explained.html (Title: \"AI Face Recognition Explained\")",
    "- /how-face-similarity-ai-works.html (Title: \"How Face Similarity AI Works\")",
    "- /celebrity-lookalike-finder.html (Title: \"Celebrity Lookalike Finder\")",
    "- /twin-finder-technology.html (Title: \"Twin Finder Technology\")",
    "- /ai-face-matching-accuracy.html (Title: \"AI Face Matching Accuracy\")",
    "- /facial-recognition-vs-face-matching.html (Title: \"Facial Recognition vs Face Matching\")",
    "- /ai-face-search-guide.html (Title: \"AI Face Search Guide\")",
    "- /face-recognition-privacy.html (Title: \"Face Recognition Privacy\")",
    "- /ai-ethics-in-face-recognition.html (Title: \"AI Ethics in Face Recognition\")",
    "- /how-to-upload-better-photos.html (Title: \"How to Upload Better Photos\")",
    "- /best-lighting-for-face-matching.html (Title: \"Best Lighting for Face Matching\")",
    "- /common-face-matching-mistakes.html (Title: \"Common Face Matching Mistakes\")",
    "- /face-embeddings-explained.html (Title: \"Face Embeddings Explained\")"
  ].join("\n");

  for (let i = 0; i < targetTopics.length; i++) {
    const topic = targetTopics[i];

    // Check if already generated to avoid wasting tokens and hitting rate limits
    const alreadyExists = existingBlogs.some(b => b.slug === topic.slug);
    if (alreadyExists) {
      console.log(`⏭️ [${topic.id}] Article "${topic.title}" already exists. Skipping.`);
      continue;
    }

    console.log(`⏳ Generating [${i+1}/${targetTopics.length}] (ID: ${topic.id}) - "${topic.title}"...`);
    const result = await fetchArticleFromGroq(topic, existingLinksList);

    if (result) {
      // Create featured image
      const imageUrl = generateProceduralSvg(result.title, topic.category, topic.slug);

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
        faqs: result.faqs,
        // Preserve extra fields requested
        metaTitle: result.metaTitle,
        imagePrompts: result.imagePrompts,
        seoData: result.seoData,
        author: "Doppelganger Science Team"
      };

      // Read current blogs, push, and write immediately in case script gets cut off
      const currentBlogsList = readBlogs();
      currentBlogsList.push(newBlog);
      writeBlogs(currentBlogsList);

      console.log(`✅ Saved article: ${topic.title}`);
    } else {
      console.error(`❌ Failed to generate article: "${topic.title}". Retrying in next run.`);
    }

    // Rate-limiting delay (3.5 seconds)
    await new Promise(r => setTimeout(r, 3500));
  }

  console.log("🎉 Content generation complete! Now you must run 'compile_all.js' to generate the files.");
};

run().catch(console.error);

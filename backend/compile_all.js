// backend/compile_all.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogsFile = path.join(__dirname, 'blogs.json');
const publicDir = path.join(__dirname, 'public');

const readBlogs = () => {
  if (!fs.existsSync(blogsFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(blogsFile, 'utf8'));
  } catch (err) {
    console.error("Error reading blogs.json:", err);
    return [];
  }
};

// 1. Generates category and tag index pages
const generateCategoryAndTagPages = (blogs) => {
  console.log("Creating category and tag index pages...");
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

  const getIndexHtml = (title, items, typeStr, activeName) => {
    const cardMarkup = items.map(blog => `
      <div class="card spotlight-card blog-card" style="padding: 24px; display: flex; flex-direction: column; height: 100%;">
        <img class="blog-card-image" src="/${blog.imageUrl}" alt="${blog.title.replace(/"/g, '&quot;')}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px; margin-bottom: 16px; border: 1px solid var(--border-color);" />
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

  categories.forEach(cat => {
    const cleanCat = cat.toLowerCase().replace(/[^a-z0-9-_]/g, "");
    const matchingBlogs = blogs.filter(b => b.category === cat);
    const html = getIndexHtml(`${cat} Articles`, matchingBlogs, "Category", cat);
    fs.writeFileSync(path.join(publicDir, `category-${cleanCat}.html`), html, 'utf8');
  });

  tagsMap.forEach((matchingBlogs, tag) => {
    const html = getIndexHtml(`Articles tagged with #${tag}`, matchingBlogs, "Tag", `#${tag}`);
    fs.writeFileSync(path.join(publicDir, `tag-${tag}.html`), html, 'utf8');
  });
  console.log("✅ Category and tag index pages compiled!");
};

// 2. Generates RSS XML Feed (sorted descending by date)
const generateRssFeed = (blogs) => {
  console.log("Generating RSS feed...");
  const sortedBlogs = [...blogs].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  let xml = `<?xml version="1.0" encoding="UTF-8" ?>\n`;
  xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
  xml += `<channel>\n`;
  xml += `  <title>Doppelganger.world Blog Feed</title>\n`;
  xml += `  <link>https://www.doppelganger.world/blog</link>\n`;
  xml += `  <description>Latest insights, guides, and research in AI Facial recognition, doppelgangers and genetics from Doppelganger.world</description>\n`;
  xml += `  <language>en-us</language>\n`;
  xml += `  <atom:link href="https://www.doppelganger.world/rss.xml" rel="self" type="application/rss+xml" />\n`;

  sortedBlogs.slice(0, 20).forEach(blog => {
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
  console.log("✅ RSS Feed compiled!");
};

// 3. Generates Search Index
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
  console.log("✅ Search Index compiled!");
};

// 4. Generates XML Sitemap
const generateXmlSitemap = (blogs) => {
  console.log("Generating XML sitemap...");
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

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

  const categories = new Set();
  const tags = new Set();

  // Add all static blog pages
  for (let i = 1; i <= 11; i++) {
    xml += `  <url>\n`;
    xml += `    <loc>https://www.doppelganger.world/blog${i}.html</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  blogs.forEach(blog => {
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

  categories.forEach(cat => {
    xml += `  <url>\n`;
    xml += `    <loc>https://www.doppelganger.world/category/${cat}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `  </url>\n`;
  });

  tags.forEach(tag => {
    xml += `  <url>\n`;
    xml += `    <loc>https://www.doppelganger.world/tag/${tag}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
  console.log("✅ XML Sitemap compiled!");
};

// 5. Generates sitemap.html dynamically
const generateHtmlSitemap = (blogs) => {
  console.log("Generating HTML sitemap...");
  
  // List of hardcoded static blogs
  const staticBlogs = [
    { slug: "blog1", title: "What Is a Doppelganger? The Science Behind Look-Alikes" },
    { slug: "blog2", title: "What Is a Twin Stranger? Finding Your Unrelated Double" },
    { slug: "blog3", title: "What Does 'Doppelgangster' Mean? Origins & Pop Culture" },
    { slug: "blog4", title: "Why Do Doppelgangers Exist? Genetics & Probability" },
    { slug: "blog5", title: "How to Find Your Doppelganger Online — Step-by-Step Guide" },
    { slug: "blog6", title: "Doppelganger Meaning & Science — A Deep Dive" },
    { slug: "blog7", title: "Find My Doppelganger Online — Complete Guide" },
    { slug: "blog8", title: "Twin Stranger Meaning & Fascinating Facts" },
    { slug: "blog9", title: "Doppelganger D&D 5e — Complete Monster Guide" },
    { slug: "blog10", title: "Naomi Klein's Doppelganger — Book Review & Summary" },
    { slug: "blog11", title: "Olsen Twins & Celebrity Look-Alikes — Who's Your Famous Double?" }
  ];

  // Compile combined blogs list
  const allBlogsList = [
    ...staticBlogs.map(b => `<li><a href="/${b.slug}.html">${b.title}</a></li>`),
    ...blogs.map(b => `<li><a href="/${b.slug}.html">${b.title}</a></li>`)
  ].join("\n          ");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#000000" />

  <title>Sitemap – Doppelganger.world | All Pages</title>
  <meta name="description" content="Browse the complete sitemap of Doppelganger.world — find all pages, blog articles, and resources in one place." />
  <meta name="keywords" content="doppelganger sitemap, doppelganger.world pages, site index" />
  <meta name="author" content="Doppelganger.world" />
  <meta name="robots" content="index, follow" />

  <link rel="canonical" href="https://www.doppelganger.world/sitemap.html" />

  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://www.doppelganger.world/sitemap.html" />
  <meta property="og:title" content="Sitemap – Doppelganger.world" />
  <meta property="og:description" content="All pages and blog articles on Doppelganger.world in one place." />
  <meta property="og:image" content="https://www.doppelganger.world/logo-dark.png" />
  <meta property="og:site_name" content="Doppelganger.world" />

  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Sitemap – Doppelganger.world" />
  <meta name="twitter:description" content="Browse every page and blog article on Doppelganger.world." />

  <link rel="icon" type="image/png" href="/logo-dark.png" />
  <link rel="stylesheet" href="/styles.css" />
  <link rel="stylesheet" href="/ad-styles.css" />
  <link rel="stylesheet" href="/cookie-consent.css" />
  <!-- PERFORMANCE: Non-blocking Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" onload="this.onload=null;this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" /></noscript>
  <script src="/theme.js"></script>
</head>
<body>

  <header class="navbar">
    <div class="nav-wrapper">
      <a href="/" class="brand" title="Doppelganger Home">
        <div class="logo">
          <img src="/logo-dark.png" alt="Doppelganger Logo" class="logo-dark" />
          <img src="/logo-light.png" alt="Doppelganger Logo" class="logo-light" />
        </div>
        <div class="brand-text">
          <span class="brand-name">Doppelganger</span>
          <p>Find Your Real-Life Double</p>
        </div>
      </a>
      <div class="nav-controls">
        <nav class="main-nav" aria-label="Main Navigation">
          <a href="/" title="Home">Home</a>
          <a href="/blog.html" title="Blog">Blog</a>
          <a href="/AboutUs.html" title="About Us">About</a>
          <a href="/faq.html" title="FAQ">FAQ</a>
          <a href="/contact.html" title="Contact">Contact</a>
        </nav>
        <button class="theme-toggle-btn" type="button" aria-label="Toggle theme"></button>
        <button class="mobile-menu-btn" type="button" aria-label="Toggle navigation menu" aria-expanded="false">
          <svg class="icon-hamburger" viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none">
            <line x1="9" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="12" y1="18" x2="20" y2="18" />
          </svg>
          <svg class="icon-close" viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <div class="ambient-glow ambient-glow-1"></div>
  <div class="ambient-glow ambient-glow-2"></div>

  <div class="container page-fade-in" style="margin-top: 32px; margin-bottom: 60px; max-width: 960px;">

    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/">Home</a>
      <span>&rsaquo;</span>
      <span>Sitemap</span>
    </nav>

    <div style="text-align: center; margin-bottom: 48px;">
      <span style="display: inline-block; padding: 5px 16px; background: rgba(168,85,247,0.12); border: 1px solid rgba(168,85,247,0.3); border-radius: 50px; font-size: 13px; font-weight: 700; color: var(--accent-primary); margin-bottom: 16px; letter-spacing: 0.05em; text-transform: uppercase;">Site Index</span>
      <h1 style="font-size: clamp(28px,5vw,46px); font-weight: 900; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 16px; line-height: 1.2;">Sitemap</h1>
      <p style="font-size: 16px; color: var(--text-secondary); max-width: 520px; margin: 0 auto; line-height: 1.7;">Find every page and article on Doppelganger.world in one place. Also available as an <a href="/sitemap.xml" style="color: var(--accent-primary);">XML sitemap</a>.</p>
    </div>

    <div class="sitemap-grid">

      <!-- Main Pages -->
      <div class="sitemap-section">
        <h2 class="sitemap-section-title">
          <span class="sitemap-icon">🏠</span> Main Pages
        </h2>
        <ul class="sitemap-links">
          <li><a href="/">Home — Find Your Look-Alike</a></li>
          <li><a href="/blog.html">Blog — Doppelganger Articles</a></li>
          <li><a href="/AboutUs.html">About Us</a></li>
          <li><a href="/faq.html">FAQ — Frequently Asked Questions</a></li>
          <li><a href="/contact.html">Contact Us</a></li>
        </ul>
      </div>

      <!-- Legal Pages -->
      <div class="sitemap-section">
        <h2 class="sitemap-section-title">
          <span class="sitemap-icon">⚖️</span> Legal & Policies
        </h2>
        <ul class="sitemap-links">
          <li><a href="/privacy.html">Privacy Policy</a></li>
          <li><a href="/terms.html">Terms &amp; Conditions</a></li>
          <li><a href="/cookie-policy.html">Cookie Policy</a></li>
          <li><a href="/disclaimer.html">Disclaimer</a></li>
        </ul>
      </div>

      <!-- Blog Articles -->
      <div class="sitemap-section sitemap-section-full">
        <h2 class="sitemap-section-title">
          <span class="sitemap-icon">📝</span> Blog Articles
        </h2>
        <ul class="sitemap-links sitemap-links-grid">
          ${allBlogsList}
        </ul>
      </div>

    </div>

    <!-- XML Sitemap link -->
    <div style="margin-top: 48px; padding: 24px 28px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 200px;">
        <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">XML Sitemap for Search Engines</h3>
        <p style="font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5;">Our machine-readable sitemap is submitted to Google Search Console and Bing Webmaster Tools.</p>
      </div>
      <a href="/sitemap.xml" class="btn secondary" style="padding: 10px 20px; font-size: 13px; border-radius: 50px; font-weight: 700; white-space: nowrap;" target="_blank" rel="noopener">View sitemap.xml</a>
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
  <script src="/breadcrumb.js" defer></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-6E7PBHRN0P"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-6E7PBHRN0P');
  </script>
  <script>document.getElementById('year').textContent = new Date().getFullYear();</script>

  <style>
    .sitemap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    @media (max-width: 640px) { .sitemap-grid { grid-template-columns: 1fr; } }
    .sitemap-section-full { grid-column: 1 / -1; }
    .sitemap-section { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px 28px; }
    .sitemap-section-title { font-size: 15px; font-weight: 800; color: var(--text-main); margin-bottom: 18px; text-transform: uppercase; letter-spacing: 0.06em; display: flex; align-items: center; gap: 8px; }
    .sitemap-icon { font-size: 18px; }
    .sitemap-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
    .sitemap-links a { color: var(--text-secondary); font-size: 14px; font-weight: 500; text-decoration: none; transition: color 0.2s; padding-left: 14px; border-left: 2px solid transparent; transition: all 0.2s; }
    .sitemap-links a:hover { color: var(--accent-primary); border-left-color: var(--accent-primary); padding-left: 18px; }
    .sitemap-links-grid { columns: 2; gap: 10px; }
    @media (max-width: 600px) { .sitemap-links-grid { columns: 1; } }
    .breadcrumbs { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); margin-bottom: 28px; }
    .breadcrumbs a { color: var(--text-muted); text-decoration: none; }
    .breadcrumbs a:hover { color: var(--accent-primary); }
  </style>
</body>
</html>`;

  fs.writeFileSync(path.join(publicDir, 'sitemap.html'), html, 'utf8');
  console.log("✅ HTML Sitemap compiled!");
};

// Main build runner
const compileAll = () => {
  const blogs = readBlogs();
  console.log(`Starting compilation for all ${blogs.length} blogs in database...`);

  // Run child compilation processes
  generateCategoryAndTagPages(blogs);
  generateRssFeed(blogs);
  generateSearchIndex(blogs);
  generateXmlSitemap(blogs);
  generateHtmlSitemap(blogs);

  // Compile individual static HTML articles
  try {
    console.log("Triggering static pages compilation...");
    execSync('node compile_pages.js', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error("Static HTML compilation error:", err);
  }

  console.log("🎉 All auxiliary files and static HTML pages compiled successfully!");
};

compileAll();

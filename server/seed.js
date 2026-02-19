/**
 * Database seeder script (run via `npm run seed`).
 * Clears all existing data, then creates two sample collections
 * ("Blog Posts" and "Products") with realistic entries so the
 * app has content to display during development.
 */

require('dotenv').config();
const { getDb, initDatabase } = require('./src/config/database');

/**
 * Main seed function.
 * Initializes the database, wipes existing data, creates two
 * collections with field definitions, and inserts sample entries
 * (4 blog posts, 3 products).
 */
function seed() {
  initDatabase();
  const db = getDb();

  // Clear existing data (entries first to respect foreign key order)
  db.exec('DELETE FROM entries');
  db.exec('DELETE FROM collections');

  // Create Blog Posts collection
  const blogFields = [
    { name: 'title', type: 'string', required: true, label: 'Title', maxLength: 200 },
    { name: 'body', type: 'markdown', required: true, label: 'Body' },
    { name: 'category', type: 'select', required: true, label: 'Category', options: ['tech', 'news', 'tutorial', 'opinion'] },
    { name: 'is_featured', type: 'boolean', required: false, label: 'Featured', default: false },
    { name: 'publish_date', type: 'date', required: false, label: 'Publish Date' },
  ];

  const blogResult = db.prepare(`
    INSERT INTO collections (name, slug, description, fields)
    VALUES (?, ?, ?, ?)
  `).run('Blog Posts', 'blog-posts', 'Company blog with news and tutorials', JSON.stringify(blogFields));

  const blogId = blogResult.lastInsertRowid;

  // Create Products collection
  const productFields = [
    { name: 'name', type: 'string', required: true, label: 'Product Name', maxLength: 150 },
    { name: 'description', type: 'markdown', required: true, label: 'Description' },
    { name: 'price', type: 'number', required: true, label: 'Price', min: 0 },
    { name: 'in_stock', type: 'boolean', required: false, label: 'In Stock', default: true },
    { name: 'category', type: 'select', required: true, label: 'Category', options: ['electronics', 'software', 'accessories', 'services'] },
  ];

  const productResult = db.prepare(`
    INSERT INTO collections (name, slug, description, fields)
    VALUES (?, ?, ?, ?)
  `).run('Products', 'products', 'Product catalog with pricing and details', JSON.stringify(productFields));

  const productId = productResult.lastInsertRowid;

  // Insert blog entries
  const insertEntry = db.prepare(`
    INSERT INTO entries (collection_id, data, status) VALUES (?, ?, ?)
  `);

  insertEntry.run(blogId, JSON.stringify({
    title: 'Getting Started with Dynamic CMS',
    body: `# Getting Started with Dynamic CMS

Welcome to our **dynamic headless CMS**! This system lets you create and manage content collections without writing any code.

## Key Features

- **Dynamic Collections**: Define your content structure on the fly
- **Markdown Support**: Write rich content with full markdown
- **REST API**: Every collection gets an automatic API endpoint
- **Live Preview**: See your markdown rendered in real-time

## How It Works

1. Create a collection in the admin panel
2. Define fields (text, numbers, markdown, etc.)
3. Add entries through the admin interface
4. Access content via the API or public site

\`\`\`javascript
// Fetching content is simple
const response = await fetch('/api/content/blog-posts');
const { data } = await response.json();
\`\`\`

> The database IS the API specification. No server restart needed!`,
    category: 'tutorial',
    is_featured: true,
    publish_date: '2025-01-15',
  }), 'published');

  insertEntry.run(blogId, JSON.stringify({
    title: 'Why Headless CMS is the Future',
    body: `# Why Headless CMS is the Future

The web development landscape is shifting. Traditional monolithic CMS platforms are giving way to **headless architectures** that separate content management from presentation.

## The Problem with Traditional CMS

Traditional CMS platforms like WordPress bundle everything together:
- Content storage
- Template rendering
- Frontend delivery

This tight coupling creates limitations when you want to deliver content across multiple channels.

## The Headless Advantage

| Feature | Traditional | Headless |
|---------|------------|----------|
| API-first | No | **Yes** |
| Multi-channel | Limited | **Unlimited** |
| Frontend freedom | Locked in | **Any framework** |
| Performance | Heavy | **Lightweight** |

## Who's Using Headless?

Companies like *Netflix*, *Nike*, and *Spotify* have all moved to headless architectures for their content needs.

The future is **decoupled**, **API-driven**, and **developer-friendly**.`,
    category: 'opinion',
    is_featured: false,
    publish_date: '2025-02-01',
  }), 'published');

  insertEntry.run(blogId, JSON.stringify({
    title: 'Building REST APIs with Express',
    body: `# Building REST APIs with Express

Express.js remains one of the most popular frameworks for building REST APIs in Node.js. Let's explore some best practices.

## Project Structure

A clean project structure makes your API maintainable:

\`\`\`
server/
  src/
    routes/      # Route definitions
    services/    # Business logic
    middleware/  # Express middleware
    utils/       # Helper functions
\`\`\`

## Error Handling

Always use a centralized error handler:

\`\`\`javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
\`\`\`

## Best Practices

- Use **async/await** with proper error catching
- Validate input at the **boundary**
- Return consistent response shapes
- Use proper HTTP status codes`,
    category: 'tech',
    is_featured: true,
    publish_date: '2025-01-20',
  }), 'published');

  insertEntry.run(blogId, JSON.stringify({
    title: 'Upcoming Features (Draft)',
    body: `# Upcoming Features

This is a draft post about features we're planning.

## Planned

- [ ] User authentication
- [ ] Media uploads
- [ ] Webhooks
- [ ] API rate limiting`,
    category: 'news',
    is_featured: false,
    publish_date: '',
  }), 'draft');

  // Insert product entries
  insertEntry.run(productId, JSON.stringify({
    name: 'CMS Pro License',
    description: `# CMS Pro License

Unlock the full power of our headless CMS platform.

## What's Included

- **Unlimited collections** and entries
- Priority support via email and chat
- Custom field types
- Advanced querying and filtering

## Getting Started

After purchase, you'll receive an activation key via email. Simply enter it in the admin panel under *Settings > License*.

> Upgrade anytime. Your data is always yours.`,
    price: 99.99,
    in_stock: true,
    category: 'software',
  }), 'published');

  insertEntry.run(productId, JSON.stringify({
    name: 'Developer Toolkit',
    description: `# Developer Toolkit

Everything you need to build and extend the CMS.

## Contents

1. **CLI Tool** - Scaffold projects from the terminal
2. **SDK** - JavaScript client library
3. **VS Code Extension** - Syntax highlighting for templates
4. **Docker Images** - Pre-configured containers

\`\`\`bash
npm install @cms/toolkit
cms init my-project
\`\`\`

Perfect for teams who want to hit the ground running.`,
    price: 49.99,
    in_stock: true,
    category: 'software',
  }), 'published');

  insertEntry.run(productId, JSON.stringify({
    name: 'USB-C Docking Station',
    description: `# USB-C Docking Station

A premium docking station for your development workstation.

## Specifications

- **Ports**: 3x USB-A, 2x USB-C, HDMI 2.1, DisplayPort
- **Power Delivery**: 100W pass-through charging
- **Ethernet**: Gigabit RJ45
- **Compatibility**: Windows, macOS, Linux

Built with **aluminum housing** for durability and heat dissipation.`,
    price: 129.99,
    in_stock: true,
    category: 'electronics',
  }), 'published');

  console.log('Seed complete!');
  console.log(`  - Created "Blog Posts" collection with ${3} published + 1 draft entries`);
  console.log(`  - Created "Products" collection with ${3} published entries`);
}

try {
  seed();
} catch (err) {
  console.error('Seed failed:', err);
  process.exit(1);
}

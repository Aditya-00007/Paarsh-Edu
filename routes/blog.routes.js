import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to blogs JSON file
const BLOGS_FILE = path.join(__dirname, "../data/blogs.json");

// Helper function to read blogs from file
async function readBlogs() {
  try {
    const data = await fs.readFile(BLOGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Helper function to write blogs to file
async function writeBlogs(blogs) {
  await fs.writeFile(BLOGS_FILE, JSON.stringify(blogs, null, 2), "utf-8");
}

// Helper function to generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Helper function to generate unique ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Get all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await readBlogs();
    return res.render("Backend/blogManagement.ejs", { blogs });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error loading blogs");
  }
});

// Create new blog
router.post("/add", async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      authorName,
      authorAvatar,
      category,
      tags,
      readTime,
      status,
      featured,
    } = req.body;

    const blogs = await readBlogs();

    const newBlog = {
      _id: generateId(),
      title,
      slug: slug || generateSlug(title),
      excerpt,
      content,
      featuredImage,
      author: {
        name: authorName || "Admin",
        avatar: authorAvatar || "",
      },
      category: category || "Technology",
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      views: 0,
      likes: 0,
      readTime: readTime || "5 min read",
      status: status || "draft",
      featured: featured === "true",
      publishedAt: status === "published" ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    blogs.unshift(newBlog);
    await writeBlogs(blogs);

    res.redirect("/blog-management");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to create blog");
  }
});

// Update blog
router.post("/update/:id", async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      authorName,
      category,
      tags,
      readTime,
      status,
      featured,
    } = req.body;

    const blogs = await readBlogs();
    const blogIndex = blogs.findIndex((b) => b._id === req.params.id);

    if (blogIndex === -1) {
      return res.status(404).send("Blog not found");
    }

    const blog = blogs[blogIndex];

    // Update blog fields
    blog.title = title;
    blog.slug = slug || generateSlug(title);
    blog.excerpt = excerpt;
    blog.content = content;
    blog.featuredImage = featuredImage;
    blog.author.name = authorName || "Admin";
    blog.category = category;
    blog.tags = tags ? tags.split(",").map((t) => t.trim()) : [];
    blog.readTime = readTime;
    blog.status = status;
    blog.featured = featured === "true";
    blog.updatedAt = new Date().toISOString();

    // Set publishedAt if status changed to published
    if (status === "published" && !blog.publishedAt) {
      blog.publishedAt = new Date().toISOString();
    }

    blogs[blogIndex] = blog;
    await writeBlogs(blogs);

    res.redirect("/blog-management");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to update blog");
  }
});

// Delete single blog
router.delete("/delete/:id", async (req, res) => {
  try {
    const blogs = await readBlogs();
    const filteredBlogs = blogs.filter((b) => b._id !== req.params.id);
    await writeBlogs(filteredBlogs);
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE BLOG ERROR:", error);
    res.status(500).json({ success: false });
  }
});

// Delete all blogs
router.delete("/delete-all", async (req, res) => {
  try {
    await writeBlogs([]);
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE ALL BLOGS ERROR:", error);
    res.status(500).json({ success: false });
  }
});

export default router;
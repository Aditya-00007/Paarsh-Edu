import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Blog from "../models/Blog.js";  

dotenv.config();

const __filename = fileURLToPath(import.meta.url);

const router = express.Router();


// GET - Blog Management Page (Admin)
router.get('/', async (req, res) => {
    try {

        //  removed .lean()
        const blogs = await Blog.find().sort({ createdAt: -1 });

        res.render('Backend/blogManagement', { blogs });

    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).send('Error loading blogs');
    }
});

router.get('/:id', async (req, res) => {
    try {

        //  removed .lean()
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).render('error', { 
                message: 'Blog not found' 
            });
        }

        // Increment views
        await Blog.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

        //  removed .lean()
        const blogs = await Blog.find({ published: true })
            .sort({ createdAt: -1 })
            .limit(10);

        res.render('Backend/blog-details', { 
            blog,
            blogs,
            page: 'blogs'
        });

    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).render('error', { 
            message: 'Failed to load blog',
            error
        });
    }
});

// GET - Add Blog Page (Admin)
router.get('/add', (req, res) => {
    res.render('Backend/add-blog');
});

// POST - Create New Blog (Admin)
router.post('/add', async (req, res) => {
    try {

        const { title, excerpt, content, image, author, category, tags, published } = req.body;

        const newBlog = new Blog({
            title,
            excerpt,
            content,
            image,
            author: author || 'Admin',
            category,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            published: published === 'on' || published === true
        });

        await newBlog.save();
        res.redirect('/admin/blogs');

    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).send('Error creating blog');
    }
});

// GET - Edit Blog Page (Admin)
router.get('/edit/:id', async (req, res) => {
    try {

        // ❌ removed .lean()
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).send('Blog not found');
        }

        res.render('Backend/edit-blog', { blog });

    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).send('Error loading blog');
    }
});


// POST - Update Blog (Admin)
router.post('/edit/:id', async (req, res) => {
    try {

        const { title, excerpt, content, image, author, category, tags, published } = req.body;

        await Blog.findByIdAndUpdate(req.params.id, {
            title,
            excerpt,
            content,
            image,
            author,
            category,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            published: published === 'on' || published === true,
            updatedAt: Date.now()
        });

        res.redirect('/admin/blogs');

    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).send('Error updating blog');
    }
});


// DELETE - Delete Blog (Admin)
router.delete('/:id', async (req, res) => {
    try {

        await Blog.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Blog deleted successfully' });

    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ success: false, message: 'Error deleting blog' });
    }
});

export default router;
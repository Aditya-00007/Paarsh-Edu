import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    excerpt: {
        type: String,
        required: true,
        maxLength: 250
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true,
        default: "Admin"
    },
    category: {
        type: String,
        required: true,
        enum: ["Technology", "Education", "Career", "Tips & Tricks", "News", "Tutorial", "Other"],
        default: "Education"
    },
    tags: [{
        type: String
    }],
    comments: [commentSchema],
    published: {
        type: Boolean,
        default: true
    },
    views: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Virtual for formatted date
blogSchema.virtual("date").get(function() {
    return this.createdAt.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
    });
});

// Ensure virtuals are included when converting to JSON
blogSchema.set("toJSON", { virtuals: true });
blogSchema.set("toObject", { virtuals: true });

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;

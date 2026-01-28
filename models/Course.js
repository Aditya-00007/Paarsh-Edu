import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    /* ================= BASIC INFO ================= */
    title: {
      type: String,
      required: true,
      trim: true,
    },

    shortDescription: {
      type: String,
      required: true,
    },

    fullDescription: {
      type: String,
    },

    thumbnail: {
      type: String, // image URL / uploaded path
      required: true,
    },

    introVideo: {
      type: String, // video URL / uploaded path
    },

    /* ================= META DETAILS ================= */
    duration: {
      type: String, // "30 Days"
      required: true,
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },

    languages: [
      {
        type: String, // English, Hindi, Spanish
      },
    ],

    certificate: {
      type: Boolean,
      default: false,
    },

    /* ================= PRICING ================= */
    fee: {
      type: Number,
      required: true,
    },

    paymentType: {
      type: String,
      enum: ["one-time", "subscription"],
      default: "one-time",
    },

    accessType: {
      type: String,
      default: "Lifetime access",
    },

    /* ================= COURSE CONTENT ================= */
    courseIncludes: [
      {
        type: String,
      },
    ],

    syllabusOverview: {
      type: String,
    },

    syllabusTopics: [
      {
        type: String,
      },
    ],

    syllabusFile: {
      type: String, // PDF download link
    },

    prerequisites: [
      {
        type: String,
      },
    ],
    /* ================= INSTRUCTOR ================= */

    instructor: {
      name: {
        type: String,
        trim: true,
      },
      bio: {
        type: String,
        trim: true,
      },
      designation: {
        type: String,
        trim: true,
      },
    },

    /* ================= CATEGORY & TAGS ================= */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    tags: [
      {
        type: String,
      },
    ],

    /* ================= ADMIN / SYSTEM ================= */
    intakeLimit: {
      type: Number,
      default: 10,
    },

    enrolledCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "full"],
      default: "active",
    },
  },
  { timestamps: true },
);

const Course = mongoose.model("Course", courseSchema);
export default Course;

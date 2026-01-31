import mongoose from "mongoose";

const courseSyllabusSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    moduleTitle: {
      type: String, // "Module 1: Web Basics"
      required: true,
    },

    moduleOrder: {
      type: Number,
      required: true,
    },

    items: [
      {
        itemType: {
          type: String,
          enum: ["topic", "assignment", "test"],
          required: true,
        },

        title: {
          type: String, // "HTML Basics", "Assignment 1", "Test 1"
          required: true,
        },

        description: {
          type: String,
        },

        order: {
          type: Number,
          required: true,
        },

        maxScore: {
          type: Number, // for test/assignment
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("CourseContent", courseSyllabusSchema);

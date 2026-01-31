import mongoose from "mongoose";

const studentCourseSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completedItems: [
      {
        syllabusItemId: mongoose.Schema.Types.ObjectId,
        completedAt: Date,
      },
    ],

    assignments: [
      {
        syllabusItemId: mongoose.Schema.Types.ObjectId,
        status: {
          type: String,
          enum: ["pending", "submitted", "checked"],
          default: "pending",
        },
        score: Number,
      },
    ],

    tests: [
      {
        syllabusItemId: mongoose.Schema.Types.ObjectId,
        score: Number,
        status: {
          type: String,
          enum: ["not_attempted", "attempted"],
          default: "not_attempted",
        },
      },
    ],

    ratingGiven: {
      type: Number,
      min: 1,
      max: 5,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("StudentCourse", studentCourseSchema);

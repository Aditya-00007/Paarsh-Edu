import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    fee: {
      type: Number,
      required: true,
    },

    duration: {
      type: String,
      default: "1 Month",
    },

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

    description: {
      type: String,
    },

    category: {
      type: String,
      enum: ["programming", "design", "marketing", "data-science", "web-development"],
    },

    syllabusFile: {
      type: String, 
    },

    revenueGenerated: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);

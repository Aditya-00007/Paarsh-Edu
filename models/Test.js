import mongoose from "mongoose";
const testSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    syllabusItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // links to test item
    },

    title: {
      type: String,
      required: true,
    },

    durationMinutes: Number,

    questions: [
      {
        question: String,
        options: [String],
        correctOptionIndex: Number, // 0,1,2,3
        marks: {
          type: Number,
          default: 1,
        },
      },
    ],

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Test", testSchema);

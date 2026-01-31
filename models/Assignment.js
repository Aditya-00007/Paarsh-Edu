import mongoose from "mongoose";
const assignmentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    syllabusItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // links to assignment item
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String, // text task
      required: true,
    },

    instructions: String,

    dueDate: Date,

    maxMarks: {
      type: Number,
      default: 10,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Assignment", assignmentSchema);

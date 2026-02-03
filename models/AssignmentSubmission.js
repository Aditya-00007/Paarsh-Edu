import mongoose from "mongoose";

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    /* ================= STUDENT ================= */
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
    },

    /* ================= COURSE ================= */
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    courseName: {
      type: String,
      required: true,
    },

    /* ================= ASSIGNMENT ================= */
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },

    syllabusItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // assignment item
    },

    assignmentTitle: {
      type: String,
      required: true,
    },

    /* ================= ANSWER ================= */
    answerVideoUrl: {
      type: String,
      required: true, // YouTube link
    },

    /* ================= EVALUATION ================= */
    score: {
      type: Number,
      default: null, // null until evaluated
    },

    feedback: {
      type: String,
    },

    isChecked: {
      type: Boolean,
      default: false,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "AssignmentSubmission",
  assignmentSubmissionSchema
);
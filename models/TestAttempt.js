import mongoose from "mongoose";

const testAttemptSchema = new mongoose.Schema(
  {
// TestAttempt.js
student: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Student",
  required: true
}
,

    studentName: {
      type: String,
      required: true,
    },

    /* COURSE */
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    courseName: {
      type: String,
      required: true,
    },

    /* TEST */
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },

    syllabusItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    testTitle: {
      type: String,
      required: true,
    },

    /* ANSWERS */
    answers: [
      {
        questionIndex: Number,
        selectedOptionIndex: Number,
        isCorrect: Boolean,
        marksAwarded: Number,
      },
    ],

    /* RESULT */
    totalQuestions: Number,

    totalMarks: Number,

    score: {
      type: Number,
      required: true,
    },

    percentage: {
      type: Number,
    },

    timeTakenSeconds: Number,

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TestAttempt", testAttemptSchema);
import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    interviewNo: {
      type: Number,
      required: true,
      min: 1,
      max: 4
    },

    meetingLink: {
      type: String,
      required: true,
      trim: true
    },

    scheduledAt: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "pending_result",
        "placed",
        "not_placed",
        "absent"
      ],
      default: "scheduled"
    },

    companyFeedback: {
      type: String,
      trim: true
    },

    adminRemarks: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Interview", interviewSchema);

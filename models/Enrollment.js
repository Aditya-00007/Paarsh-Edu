import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    progress: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    assignmentsCompleted: {
      type: Number,
      default: 0,
    },
    totalAssignments: {
      type: Number,
      default: 0,
    },
    // placments
    placementStatus: {
      type: String,
      enum: ["inactive", "active"],
      default: "inactive",
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Enrollment", enrollmentSchema);

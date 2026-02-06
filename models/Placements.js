import mongoose from "mongoose";

const placementSchema = new mongoose.Schema(
  {
    enrollment: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Enrollment",
  required: true,
  unique: true
},

    totalCallsAllowed: {
      type: Number,
      default: 4
    },

    callsUsed: {
      type: Number,
      default: 0,
      min: 0,
      max: 4
    },

    currentStatus: {
      type: String,
      enum: ["not_started", "in_process", "placed", "closed"],
      default: "not_started"
    },

    placedCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },

    placedAt: {
      type: Date
    },

    remarks: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Placement", placementSchema);

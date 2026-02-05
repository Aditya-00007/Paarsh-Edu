import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema(
  {
    // Basic user details
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // From where enquiry came
    source: {
      type: String,
      enum: ["course", "contact", "homepage"],
      required: true,
    },

    // If enquiry is from a course
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },

    courseName: {
      type: String,
      default: null,
    },

    // Message / reason
    message: {
      type: String,
      default: "",
    },

    // Admin handling
    status: {
      type: String,
      enum: ["new", "contacted", "enrolled", "closed"],
      default: "new",
    },

    // Admin notes
    adminRemark: {
      type: String,
      default: "",
    },

    // When admin contacted user
    contactedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

export default mongoose.model("Enquiry", enquirySchema);
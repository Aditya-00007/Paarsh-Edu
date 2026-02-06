import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    industry: {
      type: String,
      trim: true
    },

    location: {
      type: String,
      trim: true
    },

    //  Company official email
    companyEmail: {
      type: String,
      trim: true,
      lowercase: true
    },

    //  HR details
    hrName: {
      type: String,
      trim: true
    },

    hrEmail: {
      type: String,
      trim: true,
      lowercase: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);

import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    domain: {
      type: String, // IT, NON-IT
      required: true,
      trim: true,
    },

    subDomain: {
      type: String, // Programming, Data Analytics
      required: true,
      trim: true,
    },

    tagline: {
      type: String,
    },

    description: {
      type: String,
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);
export default Category;

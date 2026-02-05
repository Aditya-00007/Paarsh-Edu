import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true // store HASHED password only
    },

    lastLoginAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true // adds createdAt & updatedAt automatically
  }
);

export default mongoose.model("Admin", adminSchema);

import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    syllabusItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // points to item inside CourseSyllabus
    },

    lectureTitle: {
      type: String,
      required: true,
    },

    shortDescription: String,

    lectureType: {
      type: String,
      enum: ["video", "live"],
      required: true,
    },

    videoUrl: String,

    liveClass: {
      meetingLink: String,
      scheduledAt: Date,
      duration: String,
    },

    lectureOrder: {
      type: Number,
      default: 0,
    },

    isPreview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Lecture || mongoose.model("Lecture", lectureSchema);

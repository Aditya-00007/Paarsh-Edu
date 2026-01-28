import mongoose from "mongoose";

const courseContentSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    /*  SECTION (TOPIC)  */
    sectionTitle: {
      type: String, // e.g. "Basics of C"
      required: true,
    },

    sectionOrder: {
      type: Number,
      default: 0,
    },

    /*  LECTURE (SUB TOPIC)  */
    topic: {
      type: String, // e.g. "Variables"
      required: true,
    },

    subTopic: {
      type: String, // e.g. "Data types"
    },

    lectureTitle: {
      type: String,
      required: true,
    },

    shortDescription: {
      type: String,
    },

    lectureType: {
      type: String,
      enum: ["video", "live"],
      required: true,
    },

    videoUrl: {
      type: String,
    },

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
 
  isPublished: {
    type: Boolean,
    default: false, // admin controls visibility
   },
  },
  { timestamps: true }
);

const CourseContent = mongoose.model("CourseContent", courseContentSchema);
export default CourseContent;


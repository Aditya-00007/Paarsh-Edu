import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "eduplatform/lectures",
    resource_type: "video", // 🔑 THIS enables streaming
    allowed_formats: ["mp4", "mov", "webm"],
    public_id: (req, file) => {
      const name = file.originalname.split(".")[0];
      return `${Date.now()}-${name}`;
    },
  },
});

const uploadLectureVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB (safe for demo videos)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"), false);
    }
  },
});

export { uploadLectureVideo };

import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const pdfStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "eduplatform/syllabus",
    resource_type: "raw", // IMPORTANT for PDFs
    format: "pdf",
    public_id: (req, file) => {
      const name = file.originalname.split(".")[0];
      return `${Date.now()}-${name}`;
    },
  },
});

const uploadSyllabusPDF = multer({
  storage: pdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"), false);
    } else {
      cb(null, true);
    }
  },
});

export { uploadSyllabusPDF };

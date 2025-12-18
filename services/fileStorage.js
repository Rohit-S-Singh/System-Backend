export const storeFile = async (file) => {
  // Phase 2: mock storage (replace with S3/Cloudinary later)
  return {
    url: `uploads/${Date.now()}-${file.originalname}`,
    fileType: file.mimetype.includes("pdf") ? "pdf" : "docx",
  };
};

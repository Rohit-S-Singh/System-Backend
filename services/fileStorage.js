import { supabase } from "../config/supabase.js";

export const storeFile = async (file, userId) => {
  const fileExt = file.originalname.split(".").pop();
  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from("realhired")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage
    .from("realhired")
    .getPublicUrl(filePath);

  return {
    url: data.publicUrl,           
    fileType: fileExt === "pdf" ? "pdf" : "docx",
    fileName,
  };
};


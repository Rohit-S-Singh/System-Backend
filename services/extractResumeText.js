import mammoth from "mammoth";

export const extractResumeText = async (file) => {
  // ================= PDF =================
  if (file.mimetype === "application/pdf") {
    // 🔑 Dynamic import (ESM-safe)
    const pdfParseModule = await import("pdf-parse");

    // pdf-parse may expose function in different ways
    const pdfParse =
      pdfParseModule.default || pdfParseModule;

    const data = await pdfParse(file.buffer);
    return data.text;
  }

  // ================= DOCX =================
  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({
      buffer: file.buffer,
    });
    return result.value;
  }

  throw new Error("Unsupported file type");
};

import mammoth from "mammoth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export const extractResumeText = async (file) => {
  // ================= PDF =================
  if (file.mimetype === "application/pdf") {
    const data = await pdfParse.PDFParse(file.buffer);
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

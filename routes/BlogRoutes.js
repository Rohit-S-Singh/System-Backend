// routes/blog.routes.js
import express from "express";
import {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
} from "../controller/Blogs.js";

const router = express.Router();

router.post("/", createBlog);
router.get("/", getAllBlogs);
router.get("/:slug", getBlogBySlug);
router.put("/:id", updateBlog);
router.delete("/:id", deleteBlog);

export default router;
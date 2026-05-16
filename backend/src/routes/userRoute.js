import express from "express";
import { authMe, searchUsers, getUserProfile, updateProfile, test } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authMe);
router.patch("/me", updateProfile);
router.get("/search", searchUsers);
router.get("/:userId", getUserProfile);
router.get("/test", test);

export default router;
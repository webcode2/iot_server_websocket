import express from "express";
import { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff } from "../controller/authController";


const router = express.Router();

router.post("/", createStaff);
router.get("/", getAllStaff);
router.get("/:id", getStaffById);
router.put("/:id", updateStaff);
router.delete("/:id", deleteStaff);

export default router;

import express from 'express';
import { exportAttendance } from "../../controller/libraryController.js";
const router = express.Router();


router.get('/export-attendance', exportAttendance);





export default router

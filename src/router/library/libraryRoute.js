import express from 'express';
import { exportAttendance, getAttendance } from "../../controller/libraryController.js";
const router = express.Router();


router.get('/export-attendance', exportAttendance);
router.get('/get-logs', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    try {
        const result = await getAttendance({ page, pageSize });
        res.status(200).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch attendance." });
    }
});






export default router

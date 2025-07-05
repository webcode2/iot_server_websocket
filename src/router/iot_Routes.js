import express from 'express';
import { exportAttendance } from './libraryRoute.js';
const router = express.Router();

// Create new IoT device
router.post('/devices', async (req, res) => {
  try {
    const device = await IoTModel.createDevice(
      req.body.name,
      req.body.email,
      req.body.password
    );
    res.status(201).json(device);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Get device data
router.post('/data/:appId', async (req, res) => {
  try {
    const data = await IoTModel.getDeviceData(req.params.appId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




router.get('/library/export-attendance', exportAttendance);








export default router

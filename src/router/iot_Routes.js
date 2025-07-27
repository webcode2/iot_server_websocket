import express from 'express';
import { deleteDevice, getAllDevices, getDevice, updateDevice } from "../controller/deviceController.js";
import { authMiddleware } from "../config/authMiddleware.js";
const router = express.Router();

// Create new IoT device
router.post('/devices/', async (req, res) => {
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
// get many
router.get("/devices/", authMiddleware, getAllDevices)

// Get device data
router.get('/devices/:appId/', getDevice) 

// update Device
router.put('devices/:appId/', updateDevice)

// delete device
router.delete("/devices/:appId/", deleteDevice)






export default router

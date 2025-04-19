const { db } = require("../db/config");
const { iotDevices, iotData } = require('../db/schema');
const { eq } = require('drizzle-orm');

class IoTModel {
  // Device operations
  static async createDevice(name, email, password) {
    const [device] = await db.insert(iotDevices)
      .values({ name, email, password })
      .returning();
    return device;
  }

  static async getDeviceById(id) {
    const [device] = await db.select()
      .from(iotDevices)
      .where(eq(iotDevices.id, id));
    return device;
  }

  // Data operations
  static async addData(appId, logData) {
    const [data] = await db.insert(iotData)
      .values({ appId, logData })
      .returning();
    return data;
  }

  static async getDeviceData(appId) {
    return await db.select()
      .from(iotData)
      .where(eq(iotData.appId, appId));
  }
}

module.exports = IoTModel;
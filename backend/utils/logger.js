const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const ActivityLog = require('../models/Activity');

const logActivity = async ({ user, action, route, method, details }) => {
  try {
    await ActivityLog.create({ user, action, route, method, details });

    const filePath = path.join(__dirname, '../logs/activity_log.xlsx');
    let workbook, worksheet;

    if (fs.existsSync(filePath)) {
      workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      worksheet = workbook.getWorksheet('Logs');
    } else {
      workbook = new ExcelJS.Workbook();
      worksheet = workbook.addWorksheet('Logs');
      worksheet.addRow(['User ID', 'Action', 'Route', 'Method', 'Timestamp', 'Details']);
    }

    worksheet.addRow([
      user,
      action,
      route,
      method,
      new Date().toISOString(),
      JSON.stringify(details)
    ]);

    await workbook.xlsx.writeFile(filePath);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

module.exports = { logActivity };

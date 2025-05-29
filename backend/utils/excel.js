// utils/excel.js
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const exportLeadsToExcel = (leads) => {
  const exportDir = path.join(__dirname, '../exports');
  const exportPath = path.join(exportDir, 'leads_export.xlsx');

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  const worksheet = XLSX.utils.json_to_sheet(leads);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

  XLSX.writeFile(workbook, exportPath);
  return exportPath;
};

const importLeadsFromExcel = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return data;
};

module.exports = { exportLeadsToExcel, importLeadsFromExcel };

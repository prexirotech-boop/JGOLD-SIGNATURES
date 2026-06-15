const fs = require('fs');

const filePath = 'c:\\Users\\Admin\\Downloads\\n50k-blueprint-sales_1\\src\\pages\\AdminDashboard.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// We want to remove the sections for:
// - AdminAnnouncements
// - AdminCoupons
// - AdminQnA
// - AdminReviews
// These sections are between:
// // ─── ANNOUNCEMENT BROADCAST MODULE ───────────────────────────────────────────
// and
// function AdminOverview() {

const startIndex = content.indexOf('// ─── ANNOUNCEMENT BROADCAST MODULE ───────────────────────────────────────────');
const endIndex = content.indexOf('function AdminOverview()');

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
  const newContent = content.substring(0, startIndex) + content.substring(endIndex);
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Successfully edited AdminDashboard.jsx!');
} else {
  console.log('Failed to find start or end index! startIndex:', startIndex, 'endIndex:', endIndex);
}

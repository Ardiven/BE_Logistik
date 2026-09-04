require('dotenv').config();
const db = require('./src/config/database');
async function check() {
  const [cols] = await db.query('DESCRIBE jadwal');
  console.log(cols);
  
  const [mentor] = await db.query('DESCRIBE mentor');
  console.log(mentor);
  process.exit();
}
check();

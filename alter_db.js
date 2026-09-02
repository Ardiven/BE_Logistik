const db = require('./src/config/database');

async function alter() {
  try {
    await db.query('ALTER TABLE room_requests ADD COLUMN processed_by_name VARCHAR(255)');
    console.log("Successfully added processed_by_name column.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists.");
    } else {
      console.error("Error:", e);
    }
  } finally {
    process.exit();
  }
}

alter();

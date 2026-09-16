const db = require('./src/config/database');

async function fixCollation() {
  try {
    await db.query(`ALTER TABLE room_requests CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await db.query(`ALTER TABLE ketua_kelompok CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await db.query(`ALTER TABLE pic_ketua_kelompok CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await db.query(`ALTER TABLE mentor CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log("Successfully converted collations to utf8mb4_unicode_ci");
  } catch (e) {
    console.error("Error updating collations:", e);
  }
  process.exit();
}

fixCollation();

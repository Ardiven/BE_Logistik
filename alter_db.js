const db = require('./src/config/database');

async function alter() {
  try {
    await db.query('ALTER TABLE room_requests ADD COLUMN processed_by_nrp VARCHAR(50)');
    console.log("Successfully added processed_by_nrp column.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column processed_by_nrp already exists.");
    } else {
      console.error("Error:", e);
    }
  }

  try {
    await db.query('RENAME TABLE admin TO data_tim;');
    console.log("Successfully renamed admin to data_tim.");
  } catch (e) {
    console.log("Table rename error or already renamed:", e.message);
  }

  try {
    await db.query("ALTER TABLE data_tim ADD COLUMN role ENUM('BPH', 'BPHK', 'Anggota') DEFAULT 'Anggota'");
    console.log("Successfully added role column.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column role already exists.");
    } else {
      console.error("Error adding role:", e.message);
    }
  }

  try {
    await db.query("ALTER TABLE data_tim ADD COLUMN tim VARCHAR(255) NULL");
    console.log("Successfully added tim column.");
    
    // Migrate existing data: if bidang = 'logistik', set tim = 'logistik' and bidang = 'office'
    await db.query("UPDATE data_tim SET tim = 'logistik', bidang = 'office' WHERE bidang = 'logistik'");
    console.log("Migrated existing data to new tim/bidang structure.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column tim already exists.");
    } else {
      console.error("Error adding tim:", e.message);
    }
  }

  try {
    await db.query('ALTER TABLE room_requests ADD COLUMN sla_notified BOOLEAN DEFAULT FALSE');
    console.log("Successfully added sla_notified column.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column sla_notified already exists.");
    } else {
      console.error("Error adding sla_notified:", e.message);
    }
  }

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(255) PRIMARY KEY,
        setting_value TEXT NOT NULL
      )
    `);
    console.log("Successfully created settings table.");
    
    // Insert default email template
    await db.query(`INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('FRIDAY_EMAIL_SUBJECT', 'Reminder: Peminjaman Ruangan untuk Logistik')`);
    await db.query(`INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('FRIDAY_EMAIL_HTML', '<p>Halo {{nama}},</p><p>Ini adalah pengingat otomatis bagi Ketua Kelompok yang biasanya meminjam ruangan.</p><p>Mohon pastikan untuk melakukan peminjaman ruangan jika diperlukan, agar tidak lupa.</p><br/><p>Terima kasih,</p><p>Sistem Logistik TPS</p>')`);
    await db.query(`INSERT IGNORE INTO settings (setting_key, setting_value) VALUES ('IS_FRIDAY_EMAIL_ENABLED', 'true')`);
    
  } catch (e) {
    console.error("Error creating/inserting settings:", e.message);
  }
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS pic_ketua_kelompok (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nrp VARCHAR(50) NOT NULL UNIQUE
      )
    `);
    console.log("Successfully created pic_ketua_kelompok table.");

    await db.query("ALTER TABLE ketua_kelompok ADD COLUMN pic_id INT NULL");
    console.log("Successfully added pic_id to ketua_kelompok.");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column pic_id already exists.");
    } else {
      console.error("Error creating pic_ketua_kelompok / altering ketua_kelompok:", e.message);
    }
  }
  
  process.exit();
}

alter();

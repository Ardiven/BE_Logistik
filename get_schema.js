const db = require('./src/config/database');

async function checkData() {
    try {
        const [admin] = await db.query('SELECT * FROM admin');
        console.log('admin table:', admin);
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkData();


const fs = require('fs');
const db = require('./src/config/database');

async function dumpSchema() {
    try {
        const [tables] = await db.query('SHOW TABLES');
        
        let schema = '';
        
        for (const row of tables) {
            const tableName = row[Object.keys(row)[0]];
            const [createTable] = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
            schema += `-- Table structure for table \`${tableName}\`\n`;
            schema += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            schema += createTable[0]['Create Table'] + ';\n\n';
        }
        
        fs.writeFileSync('tps_schema.sql', schema);
        console.log('Schema dumped to tps_schema.sql');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
dumpSchema();

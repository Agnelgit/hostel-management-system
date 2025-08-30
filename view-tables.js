import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'AgData@25',
  database: 'hostel_management_system'
};

async function viewTable(tableName) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log(`\n📊 Table: ${tableName.toUpperCase()}`);
    console.log('='.repeat(60));
    
    const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
    
    if (rows.length === 0) {
      console.log('  (No data found)');
      return;
    }
    
    // Display column headers
    const columns = Object.keys(rows[0]);
    console.log('  ' + columns.join(' | '));
    console.log('  ' + '-'.repeat(columns.join(' | ').length));
    
    // Display data rows (limit to first 10 for readability)
    rows.slice(0, 10).forEach(row => {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'string' && value.length > 20) {
          return value.substring(0, 20) + '...';
        }
        return String(value);
      });
      console.log('  ' + values.join(' | '));
    });
    
    if (rows.length > 10) {
      console.log(`  ... and ${rows.length - 10} more records`);
    }
    
    console.log(`\n  Total records: ${rows.length}`);
    
  } catch (error) {
    console.error(`Error reading table ${tableName}:`, error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function main() {
  const tables = ['users', 'students', 'rooms', 'room_allocations', 'fee_records', 'complaints', 'visitors'];
  
  for (const table of tables) {
    await viewTable(table);
  }
}

main(); 
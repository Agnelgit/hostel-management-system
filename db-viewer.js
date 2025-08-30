import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'AgData@25',
  database: 'hostel_management_system'
};

async function viewTableData(tableName) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log(`\n🔍 TABLE: ${tableName.toUpperCase()}`);
    console.log('─'.repeat(80));
    
    const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
    
    if (rows.length === 0) {
      console.log('  📭 No data found in this table');
      return;
    }
    
    console.log(`  📊 Found ${rows.length} record(s)`);
    console.log('');
    
    // Show first few records in a simple format
    rows.slice(0, 5).forEach((row, index) => {
      console.log(`  Record ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        const displayValue = value === null ? 'NULL' : String(value);
        console.log(`    ${key}: ${displayValue}`);
      });
      console.log('');
    });
    
    if (rows.length > 5) {
      console.log(`  ... and ${rows.length - 5} more records`);
    }
    
  } catch (error) {
    console.error(`❌ Error reading ${tableName}:`, error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function main() {
  console.log('🏠 HOSTEL MANAGEMENT SYSTEM DATABASE VIEWER');
  console.log('='.repeat(80));
  
  const tables = [
    'users',
    'students', 
    'rooms',
    'room_allocations',
    'fee_records',
    'complaints',
    'visitors'
  ];
  
  for (const table of tables) {
    await viewTableData(table);
  }
  
  console.log('\n✅ Database viewing completed!');
}

main().catch(console.error); 
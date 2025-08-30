import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'AgData@25',
  database: 'hostel_management_system'
};

async function viewDatabase() {
  let connection;
  
  try {
    console.log('🔗 Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Get all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📋 Available tables:');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    // View data from each table
    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`\n📊 Table: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(50));
      
      try {
        const [rows] = await connection.query(`SELECT * FROM ${tableName}`);
        
        if (rows.length === 0) {
          console.log('  (No data found)');
        } else {
          // Display column headers
          const columns = Object.keys(rows[0]);
          console.log('  ' + columns.join(' | '));
          console.log('  ' + '-'.repeat(columns.join(' | ').length));
          
          // Display data rows
          rows.forEach(row => {
            const values = columns.map(col => {
              const value = row[col];
              return value === null ? 'NULL' : String(value);
            });
            console.log('  ' + values.join(' | '));
          });
          
          console.log(`\n  Total records: ${rows.length}`);
        }
      } catch (error) {
        console.log(`  Error reading table ${tableName}: ${error.message}`);
      }
      
      console.log('\n' + '='.repeat(80));
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Make sure MySQL is running on your system');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Check your MySQL username and password');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

viewDatabase(); 
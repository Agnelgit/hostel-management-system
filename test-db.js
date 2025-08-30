import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'AgData@25',
  database: process.env.DB_NAME || 'hostel_management_system'
};

async function testDatabase() {
  let connection;
  
  try {
    console.log('Testing database connection...');
    console.log('Config:', { ...dbConfig, password: '***' });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection successful!');
    
    // Test query
    const [users] = await connection.execute('SELECT * FROM users LIMIT 1');
    console.log('✅ Query successful! Found', users.length, 'users');
    
    if (users.length > 0) {
      console.log('Sample user:', { id: users[0].id, username: users[0].username, role: users[0].role });
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error number:', error.errno);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testDatabase(); 
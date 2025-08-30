import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'AgData@25',
  multipleStatements: true
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('Connecting to MySQL...');
    connection = await mysql.createConnection(dbConfig);
    
    // Create database first
    console.log('Creating database...');
    await connection.query('CREATE DATABASE IF NOT EXISTS hostel_management_system');
    await connection.query('USE hostel_management_system');
    
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250806061500_sweet_fog.sql');
    let migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Remove the CREATE DATABASE and USE statements from the migration
    migrationSQL = migrationSQL.replace(/CREATE DATABASE IF NOT EXISTS hostel_management_system;?\s*USE hostel_management_system;?\s*/gi, '');
    
    console.log('Executing database setup...');
    await connection.query(migrationSQL);
    
    console.log('✅ Database setup completed successfully!');
    console.log('Database: hostel_management_system');
    console.log('Tables created: users, students, rooms, room_allocations, fee_records, complaints, visitors');
    console.log('Sample data inserted: admin and warden users, sample rooms');
    console.log('');
    console.log('Login credentials:');
    console.log('Admin: admin / password');
    console.log('Warden: warden / password');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
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

setupDatabase(); 
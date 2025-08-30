import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'AgData@25',
  database: process.env.DB_NAME || 'hostel_management_system'
};

async function setupStudent() {
  let connection;
  
  try {
    console.log('Setting up student user and sample data...');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection successful!');
    
    // Create student user
    const hashedPassword = await bcrypt.hash('password', 10);
    await connection.execute(`
      INSERT IGNORE INTO users (username, email, password, role) 
      VALUES ('student', 'student@hostel.com', ?, 'student')
    `, [hashedPassword]);
    console.log('✅ Student user created/updated');
    
    // Get the student user ID
    const [users] = await connection.execute('SELECT id FROM users WHERE username = ?', ['student']);
    const studentUserId = users[0].id;
    
    // Create student record
    await connection.execute(`
      INSERT IGNORE INTO students (user_id, student_id, first_name, last_name, email, course, year_of_study, status) 
      VALUES (?, 'STU001', 'John', 'Doe', 'student@hostel.com', 'Computer Science', 2, 'active')
    `, [studentUserId]);
    console.log('✅ Student record created/updated');
    
    // Get the student ID
    const [students] = await connection.execute('SELECT id FROM students WHERE user_id = ?', [studentUserId]);
    const studentId = students[0].id;
    
    // Create sample fee records
    await connection.execute(`
      INSERT IGNORE INTO fee_records (student_id, amount, fee_type, due_date, status) 
      VALUES 
        (?, 8000.00, 'monthly', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'pending'),
        (?, 5000.00, 'security', CURDATE(), 'paid'),
        (?, 2000.00, 'maintenance', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'overdue')
    `, [studentId, studentId, studentId]);
    console.log('✅ Sample fee records created');
    
    // Create sample complaints
    await connection.execute(`
      INSERT IGNORE INTO complaints (student_id, title, description, category, priority, status) 
      VALUES 
        (?, 'Water Issue', 'No water supply in room since morning', 'maintenance', 'high', 'open'),
        (?, 'Cleaning Request', 'Room needs cleaning service', 'cleanliness', 'medium', 'in_progress')
    `, [studentId, studentId]);
    console.log('✅ Sample complaints created');
    
    // Create sample visitors
    await connection.execute(`
      INSERT IGNORE INTO visitors (student_id, visitor_name, visitor_phone, purpose, entry_time, status) 
      VALUES 
        (?, 'Jane Doe', '9876543210', 'Family visit', NOW(), 'entered'),
        (?, 'Mike Smith', '9876543211', 'Study group', DATE_SUB(NOW(), INTERVAL 2 HOUR), 'exited')
    `, [studentId, studentId]);
    console.log('✅ Sample visitors created');
    
    console.log('✅ Student setup completed successfully!');
    console.log('Login credentials: student / password');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error number:', error.errno);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupStudent(); 
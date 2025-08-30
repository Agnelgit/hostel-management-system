-- Hostel Management System Database Schema

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS hostel_management_system;
USE hostel_management_system;

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'warden', 'student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    address TEXT,
    course VARCHAR(100),
    year_of_study INT,
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(15),
    admission_date DATE,
    status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    floor INT NOT NULL,
    capacity INT NOT NULL DEFAULT 2,
    current_occupancy INT DEFAULT 0,
    room_type ENUM('single', 'double', 'triple') DEFAULT 'double',
    monthly_fee DECIMAL(10, 2) NOT NULL,
    status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room allocations table
CREATE TABLE IF NOT EXISTS room_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    room_id INT NOT NULL,
    allocation_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'ended') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Fee records table
CREATE TABLE IF NOT EXISTS fee_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    fee_type ENUM('monthly', 'security', 'maintenance', 'other') DEFAULT 'monthly',
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method ENUM('cash', 'card', 'bank_transfer', 'online') DEFAULT 'cash',
    status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category ENUM('maintenance', 'cleanliness', 'food', 'security', 'other') DEFAULT 'other',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    assigned_to INT,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Visitors table
CREATE TABLE IF NOT EXISTS visitors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    visitor_name VARCHAR(100) NOT NULL,
    visitor_phone VARCHAR(15),
    purpose VARCHAR(200) NOT NULL,
    entry_time DATETIME NOT NULL,
    exit_time DATETIME,
    id_type ENUM('aadhar', 'driving_license', 'passport', 'other') DEFAULT 'aadhar',
    id_number VARCHAR(50),
    status ENUM('entered', 'exited') DEFAULT 'entered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Insert sample data

-- Insert admin user
INSERT IGNORE INTO users (username, email, password, role) VALUES 
('admin', 'admin@hostel.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('warden', 'warden@hostel.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'warden'),
('student', 'student@hostel.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');

-- Insert sample rooms
INSERT IGNORE INTO rooms (room_number, floor, capacity, room_type, monthly_fee) VALUES 
('101', 1, 2, 'double', 8000.00),
('102', 1, 2, 'double', 8000.00),
('103', 1, 1, 'single', 12000.00),
('201', 2, 2, 'double', 8500.00),
('202', 2, 2, 'double', 8500.00),
('203', 2, 3, 'triple', 6000.00);

-- Insert sample student
INSERT IGNORE INTO students (user_id, student_id, first_name, last_name, email, course, year_of_study, status) VALUES 
(3, 'STU001', 'John', 'Doe', 'student@hostel.com', 'Computer Science', 2, 'active');

-- Insert sample fee records for student
INSERT IGNORE INTO fee_records (student_id, amount, fee_type, due_date, status) VALUES 
(1, 8000.00, 'monthly', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 'pending'),
(1, 5000.00, 'security', CURDATE(), 'paid'),
(1, 2000.00, 'maintenance', DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'overdue');

-- Insert sample complaints for student
INSERT IGNORE INTO complaints (student_id, title, description, category, priority, status) VALUES 
(1, 'Water Issue', 'No water supply in room since morning', 'maintenance', 'high', 'open'),
(1, 'Cleaning Request', 'Room needs cleaning service', 'cleanliness', 'medium', 'in_progress');

-- Insert sample visitors for student
INSERT IGNORE INTO visitors (student_id, visitor_name, visitor_phone, purpose, entry_time, status) VALUES 
(1, 'Jane Doe', '9876543210', 'Family visit', NOW(), 'entered'),
(1, 'Mike Smith', '9876543211', 'Study group', DATE_SUB(NOW(), INTERVAL 2 HOUR), 'exited');
# Hostel Management System

A comprehensive web application for managing hostel operations including student management, room allocation, fee collection, complaints, and visitor management.

## Features

### 🔐 Multi-Role Authentication
- **Admin**: Full system access and management
- **Warden**: Student and room management, complaint handling
- **Student**: Personal dashboard, fee viewing, complaint submission, visitor management

### 👥 Student Features
- **Personal Dashboard**: View room details, fee summary, recent complaints
- **Fee Management**: View fee history, pending payments, payment status
- **Complaint System**: Submit new complaints, track complaint status
- **Visitor Management**: Register visitors, track entry/exit times

### 🏢 Administrative Features
- **Student Management**: Add, edit, delete student records
- **Room Management**: Room allocation, capacity management
- **Fee Management**: Generate fee records, track payments
- **Complaint Handling**: Assign complaints, update status, add resolution notes
- **Visitor Tracking**: Monitor all visitor entries and exits
- **Reports**: Generate comprehensive reports and analytics

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Styling**: Tailwind CSS
- **Authentication**: JWT + bcrypt
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hostel-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=hostel_management_system
   JWT_SECRET=your_jwt_secret
   ```

4. **Set up the database**
   ```bash
   node setup-database.js
   node setup-student.js
   ```

5. **Start the servers**
   ```bash
   # Start backend server (in server directory)
   npm start
   
   # Start frontend (in root directory)
   npm run dev
   ```

## Demo Accounts

### Admin Access
- **Username**: admin
- **Password**: password
- **Access**: Full system management

### Warden Access
- **Username**: warden
- **Password**: password
- **Access**: Student and room management

### Student Access
- **Username**: student
- **Password**: password
- **Access**: Personal dashboard and features

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Students
- `GET /api/students` - Get all students (admin/warden)
- `GET /api/students/:id` - Get student by ID
- `GET /api/students/user/:userId` - Get student by user ID
- `GET /api/students/:id/fees` - Get student fees
- `GET /api/students/:id/complaints` - Get student complaints
- `GET /api/students/:id/visitors` - Get student visitors
- `POST /api/students` - Create new student (admin)
- `PUT /api/students/:id` - Update student (admin/warden)
- `DELETE /api/students/:id` - Delete student (admin)

### Complaints
- `GET /api/complaints` - Get complaints (filtered by role)
- `POST /api/complaints` - Create complaint
- `PUT /api/complaints/:id` - Update complaint status (admin/warden)

### Visitors
- `GET /api/visitors` - Get visitors (filtered by role)
- `POST /api/visitors` - Register visitor entry
- `PUT /api/visitors/:id/exit` - Register visitor exit

### Fees
- `GET /api/fees` - Get fee records
- `POST /api/fees` - Create fee record
- `PUT /api/fees/:id/pay` - Mark fee as paid

## Database Schema

The system uses the following main tables:
- `users` - User authentication and roles
- `students` - Student information and profiles
- `rooms` - Room details and capacity
- `room_allocations` - Student-room assignments
- `fee_records` - Fee tracking and payments
- `complaints` - Student complaints and resolutions
- `visitors` - Visitor entry/exit tracking

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user roles
- **Password Hashing**: Bcrypt encryption for passwords
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository. 
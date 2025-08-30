import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=AgData@25
DB_NAME=hostel_management_system

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=3001
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('Location:', envPath);
  console.log('');
  console.log('Content:');
  console.log(envContent);
} catch (error) {
  console.error('❌ Failed to create .env file:', error.message);
  console.log('');
  console.log('Please create the .env file manually with this content:');
  console.log(envContent);
} 
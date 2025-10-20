export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'warden' | 'student';
}

export interface Student {
  id: number;
  user_id?: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  course?: string;
  year_of_study?: number;
  guardian_name?: string;
  guardian_phone?: string;
  admission_date?: string;
  status: 'active' | 'inactive' | 'graduated';
  room_number?: string;
  allocation_date?: string;
  created_at: string;
  // aggregated report fields
  pending_fees_total?: number;
  active_complaints_count?: number;
  active_visitors_count?: number;
}

export interface Room {
  id: number;
  room_number: string;
  floor: number;
  capacity: number;
  current_occupancy: number;
  room_type: 'single' | 'double' | 'triple';
  monthly_fee: number;
  status: 'available' | 'occupied' | 'maintenance';
  occupants?: string;
  created_at: string;
}

export interface FeeRecord {
  id: number;
  student_id: number;
  student_name?: string;
  student_id_number?: string;
  amount: number;
  fee_type: 'monthly' | 'security' | 'maintenance' | 'other';
  due_date: string;
  paid_date?: string;
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'online';
  status: 'pending' | 'paid' | 'overdue';
  remarks?: string;
  created_at: string;
}

export interface Complaint {
  id: number;
  student_id: number;
  student_name?: string;
  student_id_number?: string;
  title: string;
  description: string;
  category: 'maintenance' | 'cleanliness' | 'food' | 'security' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: number;
  assigned_to_name?: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface Visitor {
  id: number;
  student_id: number;
  student_name?: string;
  student_id_number?: string;
  visitor_name: string;
  visitor_phone?: string;
  purpose: string;
  entry_time: string;
  exit_time?: string;
  id_type: 'aadhar' | 'driving_license' | 'passport' | 'other';
  id_number?: string;
  status: 'entered' | 'exited';
  created_at: string;
}

export interface DashboardStats {
  total_students: number;
  total_rooms: number;
  available_rooms: number;
  open_complaints: number;
  current_visitors: number;
  pending_fees: number;
}
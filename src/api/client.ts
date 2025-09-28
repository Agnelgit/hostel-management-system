import { User, Student, Room, FeeRecord, Complaint, Visitor, DashboardStats } from '../types/index.js';

const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(username: string, password: string): Promise<{ token: string; user: User }> {
    return this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(userData: Partial<User> & { password: string }): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Students endpoints
  async getStudents(): Promise<Student[]> {
    return this.request<Student[]>('/students');
  }

  async getStudent(id: number): Promise<Student> {
    return this.request<Student>(`/students/${id}`);
  }

  async getStudentByUserId(userId: number): Promise<Student> {
    return this.request<Student>(`/students/user/${userId}`);
  }

  async getStudentFees(studentId: number): Promise<FeeRecord[]> {
    return this.request<FeeRecord[]>(`/students/${studentId}/fees`);
  }

  async getStudentComplaints(studentId: number): Promise<Complaint[]> {
    return this.request<Complaint[]>(`/students/${studentId}/complaints`);
  }

  async getStudentVisitors(studentId: number): Promise<Visitor[]> {
    return this.request<Visitor[]>(`/students/${studentId}/visitors`);
  }

  async createStudent(studentData: Omit<Student, 'id' | 'created_at'>): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  async updateStudent(id: number, studentData: Partial<Student>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  }

  async deleteStudent(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/students/${id}`, {
      method: 'DELETE',
    });
  }

  // Rooms endpoints
  async getRooms(): Promise<Room[]> {
    return this.request<Room[]>('/rooms');
  }

  async allocateRoom(allocationData: { student_id: number; room_id: number; allocation_date: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>('/rooms/allocate', {
      method: 'POST',
      body: JSON.stringify(allocationData),
    });
  }

  async deallocateRoom(allocationId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/rooms/deallocate/${allocationId}`, {
      method: 'POST',
    });
  }

  // Fees endpoints
  async getFees(): Promise<FeeRecord[]> {
    return this.request<FeeRecord[]>('/fees');
  }

  async createFee(feeData: Omit<FeeRecord, 'id' | 'created_at' | 'student_name' | 'student_id_number'>): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>('/fees', {
      method: 'POST',
      body: JSON.stringify(feeData),
    });
  }

  async payFee(feeId: number, paymentData: { payment_method: string; remarks?: string }): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/fees/${feeId}/pay`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    });
  }

  async getFeeSummary(): Promise<{ total_records: number; total_collected: number; total_pending: number; total_overdue: number }> {
    return this.request<{ total_records: number; total_collected: number; total_pending: number; total_overdue: number }>('/fees/summary');
  }

  // Complaints endpoints
  async getComplaints(): Promise<Complaint[]> {
    return this.request<Complaint[]>('/complaints');
  }

  async createComplaint(complaintData: Omit<Complaint, 'id' | 'created_at' | 'student_name' | 'student_id_number' | 'assigned_to_name'>): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>('/complaints', {
      method: 'POST',
      body: JSON.stringify(complaintData),
    });
  }

  async updateComplaint(id: number, updateData: Partial<Complaint>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // Visitors endpoints
  async getVisitors(): Promise<Visitor[]> {
    return this.request<Visitor[]>('/visitors');
  }

  async registerVisitor(visitorData: Omit<Visitor, 'id' | 'created_at' | 'student_name' | 'student_id_number' | 'exit_time' | 'status'>): Promise<{ message: string; id: number }> {
    return this.request<{ message: string; id: number }>('/visitors', {
      method: 'POST',
      body: JSON.stringify(visitorData),
    });
  }

  async exitVisitor(visitorId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/visitors/${visitorId}/exit`, {
      method: 'PUT',
    });
  }

  // Reports endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/reports/dashboard');
  }

  async getMonthlyReport(month: number, year: number): Promise<Array<{ category: string; value: number; count: number }>> {
    return this.request<Array<{ category: string; value: number; count: number }>>(`/reports/monthly?month=${month}&year=${year}`);
  }

  async getStudentReport(studentId: number): Promise<{ student: Student; fees: FeeRecord[]; complaints: Complaint[]; visitors: Visitor[] }> {
    return this.request<{ student: Student; fees: FeeRecord[]; complaints: Complaint[]; visitors: Visitor[] }>(`/reports/student/${studentId}`);
  }
}

const apiClient = new ApiClient();

export default apiClient;
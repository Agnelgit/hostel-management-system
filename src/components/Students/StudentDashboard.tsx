import React, { useState, useEffect } from 'react';
import { Home, CreditCard, MessageSquare, UserCheck, DollarSign } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../api/client';
import { Student, FeeRecord, Complaint, Visitor } from '../../types';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Get student profile
        const studentData = await apiClient.getStudentByUserId(user?.id || 0);
        setStudent(studentData);

        // Get student's fees
        const feesData = await apiClient.getStudentFees(studentData.id);
        setFees(feesData);

        // Get student's complaints
        const complaintsData = await apiClient.getStudentComplaints(studentData.id);
        setComplaints(complaintsData);

        // Get student's visitors
        const visitorsData = await apiClient.getStudentVisitors(studentData.id);
        setVisitors(visitorsData);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchStudentData();
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const pendingFees = fees.filter(fee => fee.status === 'pending' || fee.status === 'overdue');
  const recentComplaints = complaints.slice(0, 3);
  const recentVisitors = visitors.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Home className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
      </div>

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {student?.first_name} {student?.last_name}!
        </h2>
        <p className="text-blue-100">
          Student ID: {student?.student_id} • Course: {student?.course} • Year: {student?.year_of_study}
        </p>
        {student?.room_number && (
          <p className="text-blue-100 mt-2">
            Room: {student?.room_number}
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="flex justify-end">
        <button
          onClick={async () => {
            if (!student) return;
            try {
              const report = await apiClient.getStudentReport(student.id);
              const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${student.student_id || student.first_name}_report.json`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (error) {
              console.error('Error generating report:', error);
              alert('Failed to generate report');
            }
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg mb-4 hover:bg-indigo-700"
        >
          Download My Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Pending Fees</p>
              <p className="text-2xl font-bold text-gray-900">{pendingFees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Open Complaints</p>
              <p className="text-2xl font-bold text-gray-900">
                {complaints.filter(c => c.status === 'open' || c.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Today's Visitors</p>
              <p className="text-2xl font-bold text-gray-900">
                {visitors.filter(v => {
                  const today = new Date().toDateString();
                  return new Date(v.entry_time).toDateString() === today;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-600" />
            Recent Complaints
          </h3>
          {recentComplaints.length > 0 ? (
            <div className="space-y-3">
              {recentComplaints.map((complaint) => (
                <div key={complaint.id} className="border-l-4 border-orange-500 pl-3">
                  <p className="font-medium text-gray-900">{complaint.title}</p>
                  <p className="text-sm text-gray-600">{complaint.description.substring(0, 50)}...</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      complaint.status === 'open' ? 'bg-red-100 text-red-800' :
                      complaint.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {complaint.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No complaints yet</p>
          )}
        </div>

        {/* Recent Visitors */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-600" />
            Recent Visitors
          </h3>
          {recentVisitors.length > 0 ? (
            <div className="space-y-3">
              {recentVisitors.map((visitor) => (
                <div key={visitor.id} className="border-l-4 border-purple-500 pl-3">
                  <p className="font-medium text-gray-900">{visitor.visitor_name}</p>
                  <p className="text-sm text-gray-600">{visitor.purpose}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      visitor.status === 'entered' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {visitor.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(visitor.entry_time).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No visitors yet</p>
          )}
        </div>
      </div>

      {/* Fee Summary */}
      {pendingFees.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-red-600" />
            Pending Fees
          </h3>
          <div className="space-y-3">
            {pendingFees.map((fee) => (
              <div key={fee.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{fee.fee_type}</p>
                  <p className="text-sm text-gray-600">Due: {new Date(fee.due_date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">₹{fee.amount}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    fee.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {fee.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard; 
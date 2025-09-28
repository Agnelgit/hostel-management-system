import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../api/client';
import { FeeRecord, Student } from '../../types';

const StudentFees: React.FC = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  useEffect(() => {
    const fetchFees = async () => {
      try {
        if (user?.role === 'student') {
          // Get student profile first
          const studentData = await apiClient.getStudentByUserId(user?.id || 0);
          setStudent(studentData);

          // Get student's fees
          const feesData = await apiClient.getStudentFees(studentData.id);
          setFees(feesData);
        } else {
          // Admin / Warden: fetch all fees
          const feesData = await apiClient.getFees();
          setFees(feesData);
        }
      } catch (error) {
        console.error('Error fetching fees:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchFees();
    }
  }, [user?.id, user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredFees = fees.filter(fee => {
    if (filter === 'all') return true;
    return fee.status === filter;
  });

  const totalPending = fees.filter(f => f.status === 'pending' || f.status === 'overdue')
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const totalPaid = fees.filter(f => f.status === 'paid')
    .reduce((sum, f) => sum + Number(f.amount), 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">My Fees</h1>
      </div>

      {/* Student Info */}
      {user?.role === 'student' && student && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Student ID</p>
              <p className="font-medium text-gray-900">{student.student_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Course</p>
              <p className="font-medium text-gray-900">{student.course} - Year {student.year_of_study}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Total Pending</p>
              <p className="text-2xl font-bold text-red-600">₹{totalPending.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">₹{totalPaid.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Overdue Fees</p>
              <p className="text-2xl font-bold text-orange-600">
                {fees.filter(f => f.status === 'overdue').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Fee Records</h2>
          <div className="flex space-x-2">
            {(['all', 'pending', 'paid', 'overdue'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredFees.length > 0 ? (
          <div className="space-y-4">
            {filteredFees.map((fee) => (
              <div key={fee.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(fee.status)}
                    <div>
                      <h3 className="font-medium text-gray-900 capitalize">
                        {fee.fee_type.replace('_', ' ')} Fee
                      </h3>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(fee.due_date).toLocaleDateString()}
                      </p>
                      {fee.remarks && (
                        <p className="text-sm text-gray-500 mt-1">{fee.remarks}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">₹{fee.amount}</p>
                    <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(fee.status)}`}>
                      {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                    </span>
                    {fee.paid_date && (
                      <p className="text-sm text-gray-500 mt-1">
                        Paid: {new Date(fee.paid_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                {user?.role !== 'student' && (
                  <div className="mt-3 text-sm text-gray-600">
                    Student: {fee.student_name || '—'} • ID: {fee.student_id_number || '—'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No fees found for the selected filter</p>
          </div>
        )}
      </div>

      {/* Payment Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Payment Instructions</h3>
        <div className="space-y-2 text-blue-800">
          <p>• Pending fees can be paid at the hostel office during office hours</p>
          <p>• Online payment options will be available soon</p>
          <p>• Please keep your payment receipts for future reference</p>
          <p>• Contact the hostel office for any payment-related queries</p>
        </div>
      </div>
    </div>
  );
};

export default StudentFees; 
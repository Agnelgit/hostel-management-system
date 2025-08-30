import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, LogIn, LogOut, Calendar, Phone } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../api/client';
import { Visitor, Student } from '../../types';

const StudentVisitors: React.FC = () => {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'entered' | 'exited'>('all');

  // Form state
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_phone: '',
    purpose: '',
    id_type: 'aadhar' as const,
    id_number: ''
  });

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        // Get student profile first
        const studentData = await apiClient.getStudentByUserId(user?.id || 0);
        setStudent(studentData);

        // Get student's visitors
        const visitorsData = await apiClient.getStudentVisitors(studentData.id);
        setVisitors(visitorsData);
      } catch (error) {
        console.error('Error fetching visitors:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchVisitors();
    }
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!student) return;

    try {
      const newVisitor = await apiClient.registerVisitor({
        student_id: student.id,
        visitor_name: formData.visitor_name,
        visitor_phone: formData.visitor_phone,
        purpose: formData.purpose,
        id_type: formData.id_type,
        id_number: formData.id_number,
        entry_time: new Date().toISOString()
      });

      // Refresh visitors list
      const updatedVisitors = await apiClient.getStudentVisitors(student.id);
      setVisitors(updatedVisitors);

      // Reset form
      setFormData({
        visitor_name: '',
        visitor_phone: '',
        purpose: '',
        id_type: 'aadhar',
        id_number: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error registering visitor:', error);
    }
  };

  const handleExitVisitor = async (visitorId: number) => {
    try {
      await apiClient.exitVisitor(visitorId);
      
      // Refresh visitors list
      if (student) {
        const updatedVisitors = await apiClient.getStudentVisitors(student.id);
        setVisitors(updatedVisitors);
      }
    } catch (error) {
      console.error('Error updating visitor exit:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filteredVisitors = visitors.filter(visitor => {
    if (filter === 'all') return true;
    return visitor.status === filter;
  });

  const todayVisitors = visitors.filter(visitor => {
    const today = new Date().toDateString();
    return new Date(visitor.entry_time).toDateString() === today;
  });

  const getStatusIcon = (status: string) => {
    return status === 'entered' ? 
      <LogIn className="w-5 h-5 text-green-600" /> : 
      <LogOut className="w-5 h-5 text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    return status === 'entered' ? 
      'bg-green-100 text-green-800' : 
      'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Visitor Management</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Register Visitor
        </button>
      </div>

      {/* Today's Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Visitors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{todayVisitors.length}</p>
            <p className="text-sm text-blue-600">Total Visitors</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {todayVisitors.filter(v => v.status === 'entered').length}
            </p>
            <p className="text-sm text-green-600">Currently Inside</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">
              {todayVisitors.filter(v => v.status === 'exited').length}
            </p>
            <p className="text-sm text-gray-600">Exited</p>
          </div>
        </div>
      </div>

      {/* New Visitor Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Register New Visitor</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visitor Name *
                </label>
                <input
                  type="text"
                  value={formData.visitor_name}
                  onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full name of visitor"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.visitor_phone}
                  onChange={(e) => setFormData({ ...formData, visitor_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contact number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose of Visit *
              </label>
              <textarea
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Reason for visiting"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Type
                </label>
                <select
                  value={formData.id_type}
                  onChange={(e) => setFormData({ ...formData, id_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="aadhar">Aadhar Card</option>
                  <option value="driving_license">Driving License</option>
                  <option value="passport">Passport</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  value={formData.id_number}
                  onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ID number"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Register Visitor
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Visitor History</h2>
          <div className="flex space-x-2">
            {(['all', 'entered', 'exited'] as const).map((status) => (
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

        {filteredVisitors.length > 0 ? (
          <div className="space-y-4">
            {filteredVisitors.map((visitor) => (
              <div key={visitor.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(visitor.status)}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{visitor.visitor_name}</h3>
                      <p className="text-gray-600 mt-1">{visitor.purpose}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(visitor.status)}`}>
                          {visitor.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {visitor.id_type.replace('_', ' ')}
                        </span>
                        {visitor.id_number && (
                          <span className="text-xs text-gray-500">
                            ID: {visitor.id_number}
                          </span>
                        )}
                        {visitor.visitor_phone && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {visitor.visitor_phone}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Entry: {new Date(visitor.entry_time).toLocaleString()}
                        </span>
                        {visitor.exit_time && (
                          <span className="flex items-center gap-1">
                            <LogOut className="w-3 h-3" />
                            Exit: {new Date(visitor.exit_time).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {visitor.status === 'entered' && (
                    <button
                      onClick={() => handleExitVisitor(visitor.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Mark Exit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No visitors found for the selected filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentVisitors; 
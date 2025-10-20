import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Student } from '../../types';
import StudentDetailAdmin from './StudentDetailAdmin';

const ReportsList: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const data = await apiClient.getStudents();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students for reports:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="bg-white rounded-xl shadow-sm p-6">Loading...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Fees</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Complaints</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Visitors</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{s.first_name} {s.last_name}</div>
                  <div className="text-sm text-gray-500">{s.student_id}</div>
                </td>
                <td className="px-6 py-4">₹ {s.pending_fees_total ?? 0}</td>
                <td className="px-6 py-4">{s.active_complaints_count ?? 0}</td>
                <td className="px-6 py-4">{s.active_visitors_count ?? 0}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => setSelected(s.id)} className="text-blue-600 hover:underline">View Report</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && <StudentDetailAdmin studentId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default ReportsList;

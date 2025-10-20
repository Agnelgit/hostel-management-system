import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Visitor } from '../../types';

const AdminVisitors: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const data = await apiClient.getVisitors();
        setVisitors(data);
      } catch (error) {
        console.error('Error fetching visitors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVisitors();
  }, []);

  if (loading) return <div className="p-6">Loading visitors...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Visitor Records</h2>
      <div className="bg-white rounded-xl shadow-sm p-6">
        {visitors.length === 0 ? (
          <div className="text-gray-500">No visitors found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Visitor</th>
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">Purpose</th>
                  <th className="px-4 py-2 text-left">Entry</th>
                  <th className="px-4 py-2 text-left">Exit</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map(v => (
                  <tr key={v.id} className="border-t">
                    <td className="px-4 py-2">{v.visitor_name}</td>
                    <td className="px-4 py-2">{v.student_name} ({v.student_id_number})</td>
                    <td className="px-4 py-2">{v.purpose}</td>
                    <td className="px-4 py-2">{new Date(v.entry_time).toLocaleString()}</td>
                    <td className="px-4 py-2">{v.exit_time ? new Date(v.exit_time).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVisitors;

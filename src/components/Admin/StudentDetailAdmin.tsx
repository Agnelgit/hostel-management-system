import React, { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Student, FeeRecord, Complaint, Visitor } from '../../types';
import { X } from 'lucide-react';

interface Props {
  studentId: number;
  onClose: () => void;
}

const StudentDetailAdmin: React.FC<Props> = ({ studentId, onClose }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const s = await apiClient.getStudent(studentId);
        setStudent(s);
        const f = await apiClient.getStudentFees(studentId);
        setFees(f);
        const c = await apiClient.getStudentComplaints(studentId);
        setComplaints(c);
        const v = await apiClient.getStudentVisitors(studentId);
        setVisitors(v);
      } catch (error) {
        console.error('Error fetching student detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [studentId]);

  const downloadReport = async () => {
    try {
      const report = await apiClient.getStudentReport(studentId);
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.student.student_id || report.student.first_name}_report.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">Loading...</div>
    </div>
  );

  if (!student) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-[90%] max-w-4xl bg-white rounded-lg shadow-lg overflow-auto max-h-[90%]">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{student.first_name} {student.last_name} — {student.student_id}</h3>
          <div className="flex items-center gap-2">
            <button onClick={downloadReport} className="bg-green-600 text-white px-3 py-1 rounded">Download Report</button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded"><X /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Student ID</p>
              <p className="font-medium">{student.student_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{student.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{student.phone || '-'}</p>
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-2">Fees</h4>
            {fees.length === 0 ? <div className="text-sm text-gray-500">No fee records</div> : (
              <div className="space-y-2">
                {fees.map(f => (
                  <div key={f.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <div className="font-medium">{f.fee_type}</div>
                      <div className="text-sm text-gray-500">Due: {new Date(f.due_date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{f.amount}</div>
                      <div className="text-sm text-gray-500">{f.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-md font-semibold mb-2">Complaints</h4>
            {complaints.length === 0 ? <div className="text-sm text-gray-500">No complaints</div> : (
              <div className="space-y-2">
                {complaints.map(c => (
                  <div key={c.id} className="p-3 border rounded">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-sm text-gray-600">{c.description}</div>
                    <div className="text-xs text-gray-500 mt-1">Status: {c.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-md font-semibold mb-2">Visitors</h4>
            {visitors.length === 0 ? <div className="text-sm text-gray-500">No visitors</div> : (
              <div className="space-y-2">
                {visitors.map(v => (
                  <div key={v.id} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">{v.visitor_name}</div>
                      <div className="text-sm text-gray-600">{v.purpose}</div>
                    </div>
                    <div className="text-xs text-gray-500">{new Date(v.entry_time).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailAdmin;

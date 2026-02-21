import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { examAPI, violationAPI, submissionAPI } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';
import toast from 'react-hot-toast';

const ExamMonitor = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [violations, setViolations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeStudents, setActiveStudents] = useState(new Set());
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentCode, setStudentCode] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    loadData();
    socketRef.current = initSocket();

    if (socketRef.current) {
      // Faculty monitors the exam, doesn't join as participant
      socketRef.current.emit('monitor-exam', { examId: id });

      socketRef.current.on('user-joined', ({ userId, role }) => {
        if (role === 'student') {
          setActiveStudents(prev => new Set([...prev, userId]));
          toast.success(`Student joined the exam`);
          loadData();
        }
      });

      socketRef.current.on('user-left', ({ userId }) => {
        setActiveStudents(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        toast.info(`Student left the exam`);
      });

      socketRef.current.on('violation-detected', ({ violation, studentId, count }) => {
        setViolations(prev => [violation, ...prev]);
        toast.error(`Violation detected: ${violation.type}`);
        loadData();
      });

      socketRef.current.on('student-blocked', ({ studentId, violationCount }) => {
        toast.error(`Student has been blocked (${violationCount} violations)`);
        loadData();
      });

      socketRef.current.on('student-code-update', ({ studentId, questionId, code, language }) => {
        setStudentCode(prev => ({
          ...prev,
          [studentId]: { questionId, code, language, timestamp: new Date() }
        }));
      });
    }

    // Refresh data every 10 seconds
    const interval = setInterval(loadData, 10000);

    return () => {
      clearInterval(interval);
      if (socketRef.current) {
        socketRef.current.emit('stop-monitoring', { examId: id });
        disconnectSocket();
      }
    };
  }, [id]);

  const loadData = async () => {
    try {
      const [examRes, sessionsRes, violationsRes, submissionsRes] = await Promise.all([
        examAPI.getById(id),
        examAPI.getSessions(id),
        violationAPI.getByExam(id),
        submissionAPI.getByExam(id)
      ]);

      setExam(examRes.data);
      setSessions(sessionsRes.data);
      setViolations(violationsRes.data);
      setSubmissions(submissionsRes.data);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      toast.error('Failed to load monitoring data: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleResetViolations = async (sessionId) => {
    if (!confirm('Are you sure you want to reset all violations for this student?')) {
      return;
    }

    try {
      await violationAPI.resetViolations(sessionId);
      toast.success('Violations reset successfully');
      // Reload all data to get updated violation counts
      await loadData();
      // Close and reopen modal to show updated data
      const currentStudent = selectedStudent;
      setSelectedStudent(null);
      setTimeout(() => setSelectedStudent(currentStudent), 100);
    } catch (error) {
      toast.error('Failed to reset violations: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUnblockStudent = async (sessionId) => {
    if (!confirm('Are you sure you want to unblock this student? They will be able to continue the exam.')) {
      return;
    }

    try {
      await examAPI.unblockStudent(id, sessionId);
      toast.success('Student unblocked successfully');
      // Reload all data to get updated session status
      await loadData();
      // Close and reopen modal to show updated data
      const currentStudent = selectedStudent;
      setSelectedStudent(null);
      setTimeout(() => setSelectedStudent(currentStudent), 100);
    } catch (error) {
      toast.error('Failed to unblock student: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStudentViolations = (studentId) => {
    return violations.filter(v => v.student?.id === studentId);
  };

  const getStudentSubmissions = (studentId) => {
    return submissions.filter(s => s.student?.id === studentId);
  };

  const getViolationColor = (severity) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getTimeRemaining = () => {
    if (!exam) return 'N/A';
    const now = new Date();
    const end = new Date(exam.endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Exam Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const getExamStatus = () => {
    if (!exam) return 'Loading...';
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (now < start) return { text: 'Not Started', color: 'text-blue-600' };
    if (now > end) return { text: 'Ended', color: 'text-gray-600' };
    return { text: 'Active', color: 'text-green-600' };
  };

  // Group violations by student
  const violationsByStudent = violations.reduce((acc, v) => {
    const studentId = v.student?.id;
    if (!acc[studentId]) {
      acc[studentId] = [];
    }
    acc[studentId].push(v);
    return acc;
  }, {});

  // Group submissions by student
  const submissionsByStudent = submissions.reduce((acc, s) => {
    const studentId = s.student?.id;
    if (!acc[studentId]) {
      acc[studentId] = [];
    }
    acc[studentId].push(s);
    return acc;
  }, {});

  // Get unique students from sessions
  const allStudents = sessions.map(s => s.student).filter(Boolean);

  if (!exam) {
    return <Layout><div>Loading...</div></Layout>;
  }

  const status = getExamStatus();

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{exam.title}</h1>
              <p className="text-gray-600 mt-1">{exam.description}</p>
              <div className="mt-3 flex items-center space-x-4 text-sm">
                <span className={`font-semibold ${status.color}`}>{status.text}</span>
                <span className="text-gray-600">{getTimeRemaining()}</span>
                <span className="text-gray-600">Class: {exam.class?.name}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{activeStudents.size}</div>
              <div className="text-sm text-gray-600">Active Students</div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Total Students</h3>
            <p className="text-4xl font-bold mt-2">{allStudents.length}</p>
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Submissions</h3>
            <p className="text-4xl font-bold mt-2">{submissions.length}</p>
          </div>
          <div className="bg-red-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Violations</h3>
            <p className="text-4xl font-bold mt-2">{violations.length}</p>
          </div>
          <div className="bg-purple-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Questions</h3>
            <p className="text-4xl font-bold mt-2">{exam.questions?.length || 0}</p>
          </div>
        </div>

        {/* Student Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Student Overview</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Violations</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submissions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allStudents.map((student) => {
                  const studentViolations = violationsByStudent[student.id] || [];
                  const studentSubmissions = submissionsByStudent[student.id] || [];
                  const studentSession = sessions.find(s => s.student.id === student.id);
                  const isActive = activeStudents.has(student.id);
                  const sessionStatus = studentSession?.status || 'not_started';
                  
                  return (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          sessionStatus === 'completed' ? 'bg-blue-100 text-blue-800' :
                          sessionStatus === 'blocked' ? 'bg-red-100 text-red-800' :
                          isActive ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sessionStatus === 'completed' ? 'Completed' :
                           sessionStatus === 'blocked' ? 'Blocked' :
                           isActive ? 'Active' : 'Not Started'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          studentViolations.length === 0 ? 'bg-green-100 text-green-800' :
                          studentViolations.length < exam.maxViolations ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {studentViolations.length} / {exam.maxViolations}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {studentSubmissions.length} / {exam.questions?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Violations */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Violations</h2>
          {violations.length === 0 ? (
            <p className="text-gray-500">No violations detected</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {violations.slice(0, 20).map((violation) => (
                <div
                  key={violation.id}
                  className={`border-l-4 pl-4 py-2 ${getViolationColor(violation.severity)}`}
                >
                  <div className="flex justify-between">
                    <span className="font-semibold">{violation.student?.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(violation.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{violation.type}</p>
                  <p className="text-sm text-gray-600">{violation.description}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    violation.severity === 'high' ? 'bg-red-200 text-red-800' :
                    violation.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-blue-200 text-blue-800'
                  }`}>
                    {violation.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
          {submissions.length === 0 ? (
            <p className="text-gray-500">No submissions yet</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {submissions.slice(0, 20).map((submission) => (
                <div key={submission.id} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50">
                  <div className="flex justify-between">
                    <span className="font-semibold">{submission.student?.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Question {submission.question} - {submission.language}
                  </p>
                  {submission.score !== undefined && submission.score !== null && (
                    <p className="text-sm text-green-600">Score: {submission.score}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Student Violations */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold">Violations ({violationsByStudent[selectedStudent.id]?.length || 0})</h3>
                  {violationsByStudent[selectedStudent.id]?.length > 0 && (
                    <button
                      onClick={() => {
                        const studentSession = sessions.find(s => s.student.id === selectedStudent.id);
                        if (studentSession) {
                          handleResetViolations(studentSession.id);
                        }
                      }}
                      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                    >
                      Reset Violations
                    </button>
                  )}
                </div>
                {violationsByStudent[selectedStudent.id]?.length > 0 ? (
                  <div className="space-y-2">
                    {violationsByStudent[selectedStudent.id].map((v) => (
                      <div key={v.id} className={`border-l-4 pl-3 py-2 ${getViolationColor(v.severity)}`}>
                        <div className="flex justify-between">
                          <span className="font-medium">{v.type}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(v.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{v.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No violations</p>
                )}
              </div>

              {/* Unblock Student Button */}
              {(() => {
                const studentSession = sessions.find(s => s.student.id === selectedStudent.id);
                if (studentSession?.status === 'blocked') {
                  return (
                    <div className="mb-6">
                      <button
                        onClick={() => handleUnblockStudent(studentSession.id)}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
                      >
                        Unblock Student & Allow Retake
                      </button>
                      <p className="text-sm text-gray-600 mt-2">
                        This will unblock the student and allow them to continue the exam.
                      </p>
                    </div>
                  );
                }
              })()}

              {/* Student Submissions */}
              <div>
                <h3 className="text-lg font-bold mb-2">Submissions ({submissionsByStudent[selectedStudent.id]?.length || 0})</h3>
                {submissionsByStudent[selectedStudent.id]?.length > 0 ? (
                  <div className="space-y-3">
                    {submissionsByStudent[selectedStudent.id].map((s) => (
                      <div key={s.id} className="border rounded p-3 bg-gray-50">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Question {s.question}</span>
                          <span className="text-sm text-gray-500">{s.language}</span>
                        </div>
                        <pre className="bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
                          {s.code}
                        </pre>
                        {s.output && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">Output:</span>
                            <pre className="bg-gray-100 p-2 rounded text-sm mt-1">{s.output}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No submissions yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ExamMonitor;

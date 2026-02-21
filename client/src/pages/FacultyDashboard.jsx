import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { classAPI, examAPI } from '../services/api';
import toast from 'react-hot-toast';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    classId: '',
    startTime: '',
    endTime: '',
    duration: 60,
    maxViolations: 3,
    allowedLanguages: ['javascript', 'python', 'java', 'c', 'cpp'],
    questions: [{ questionNumber: 1, title: '', description: '', points: 10, testCases: [] }]
  });

  useEffect(() => {
    if (user?.role !== 'faculty') {
      navigate('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [classesRes, examsRes] = await Promise.all([
        classAPI.getAll(),
        examAPI.getAll()
      ]);
      
      setClasses(classesRes.data);
      setExams(examsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await examAPI.create(examForm);
      toast.success('Exam created successfully');
      setShowExamModal(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create exam');
    }
  };

  const handleLanguageToggle = (lang) => {
    const current = examForm.allowedLanguages;
    if (current.includes(lang)) {
      setExamForm({ ...examForm, allowedLanguages: current.filter(l => l !== lang) });
    } else {
      setExamForm({ ...examForm, allowedLanguages: [...current, lang] });
    }
  };

  const addQuestion = () => {
    setExamForm({
      ...examForm,
      questions: [...examForm.questions, {
        questionNumber: examForm.questions.length + 1,
        title: '',
        description: '',
        points: 10,
        testCases: []
      }]
    });
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...examForm.questions];
    updated[index][field] = value;
    setExamForm({ ...examForm, questions: updated });
  };

  const removeQuestion = (index) => {
    const updated = examForm.questions.filter((_, i) => i !== index);
    setExamForm({ ...examForm, questions: updated });
  };

  const getExamStatus = (exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (now < start) return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    if (now > end) return { text: 'Ended', color: 'bg-gray-100 text-gray-800' };
    return { text: 'Active', color: 'bg-green-100 text-green-800' };
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Faculty Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">My Classes</h3>
            <p className="text-4xl font-bold mt-2">{classes.length}</p>
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">My Exams</h3>
            <p className="text-4xl font-bold mt-2">{exams.length}</p>
          </div>
          <div className="bg-purple-500 text-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Active Exams</h3>
            <p className="text-4xl font-bold mt-2">
              {exams.filter(e => {
                const now = new Date();
                return now >= new Date(e.startTime) && now <= new Date(e.endTime);
              }).length}
            </p>
          </div>
        </div>

        {/* My Classes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">My Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <div key={cls.id} className="border rounded-lg p-4">
                <h3 className="font-bold text-lg">{cls.name}</h3>
                <p className="text-sm text-gray-600">{cls.code}</p>
                <p className="text-sm mt-2">{cls.students?.length || 0} students enrolled</p>
                <button
                  onClick={() => navigate(`/classes/${cls.id}`)}
                  className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* My Exams */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">My Exams</h2>
            <button
              onClick={() => setShowExamModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create Exam
            </button>
          </div>

          <div className="space-y-3">
            {exams.map((exam) => {
              const status = getExamStatus(exam);
              return (
                <div key={exam.id} className="border-l-4 border-blue-500 pl-4 py-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{exam.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{exam.description}</p>
                      <div className="mt-2 text-sm text-gray-500 space-y-1">
                        <p>Class: {exam.class?.name}</p>
                        <p>Duration: {exam.duration} minutes</p>
                        <p>Max Violations: {exam.maxViolations}</p>
                        <p>Questions: {exam.questions?.length || 0}</p>
                        <p>Start: {new Date(exam.startTime).toLocaleString()}</p>
                        <p>End: {new Date(exam.endTime).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => navigate(`/exam/${exam.id}/monitor`)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                      >
                        Monitor Live
                      </button>
                      <button
                        onClick={() => navigate(`/exam/${exam.id}/edit`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Exam Modal */}
        {showExamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-8 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Create New Exam</h2>
              <form onSubmit={handleCreateExam} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      value={examForm.title}
                      onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Class</label>
                    <select
                      value={examForm.classId}
                      onChange={(e) => setExamForm({ ...examForm, classId: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select Class</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={examForm.description}
                    onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="datetime-local"
                      value={examForm.startTime}
                      onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="datetime-local"
                      value={examForm.endTime}
                      onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (min)</label>
                    <input
                      type="number"
                      value={examForm.duration}
                      onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Violations</label>
                  <input
                    type="number"
                    value={examForm.maxViolations}
                    onChange={(e) => setExamForm({ ...examForm, maxViolations: parseInt(e.target.value) })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {['javascript', 'python', 'java', 'c', 'cpp'].map((lang) => (
                      <label key={lang} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={examForm.allowedLanguages.includes(lang)}
                          onChange={() => handleLanguageToggle(lang)}
                          className="rounded"
                        />
                        <span className="text-sm">{lang}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Questions</label>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Question
                    </button>
                  </div>
                  {examForm.questions.map((q, idx) => (
                    <div key={idx} className="border p-3 rounded mb-2">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold">Question {idx + 1}</span>
                        {examForm.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Question Title"
                        value={q.title}
                        onChange={(e) => updateQuestion(idx, 'title', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                        required
                      />
                      <textarea
                        placeholder="Question Description"
                        value={q.description}
                        onChange={(e) => updateQuestion(idx, 'description', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                        rows="2"
                      />
                      <input
                        type="number"
                        placeholder="Points"
                        value={q.points}
                        onChange={(e) => updateQuestion(idx, 'points', parseInt(e.target.value))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                        min="1"
                        required
                      />
                    </div>
                  ))}
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  >
                    Create Exam
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExamModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FacultyDashboard;

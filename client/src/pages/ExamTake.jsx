import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { examAPI, codeAPI, submissionAPI } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';
import ProctoringSystem from '../components/ProctoringSystem';
import toast from 'react-hot-toast';

const ExamTake = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [executing, setExecuting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [fullscreenReady, setFullscreenReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const socketRef = useRef(null);
  const autoSaveInterval = useRef(null);
  const hasSubmitted = useRef(false);

  // Enter fullscreen via user gesture (browser requires a click)
  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        await document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        await document.documentElement.mozRequestFullScreen();
      }
      setFullscreenReady(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      toast.error('Fullscreen is required to take the exam. Please try again.');
    }
  };

  useEffect(() => {
    loadExam();
    socketRef.current = initSocket();

    if (socketRef.current) {
      socketRef.current.emit('join-exam', { examId: id });
    }

    // Auto-save every 30 seconds
    autoSaveInterval.current = setInterval(() => {
      handleAutoSave();
    }, 30000);

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
      if (socketRef.current) {
        socketRef.current.emit('leave-exam', { examId: id });
        disconnectSocket();
      }
      // Exit fullscreen when leaving exam
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [id]);

  useEffect(() => {
    if (!session || session.status !== 'in_progress' || !exam) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(session.startedAt)) / 1000);
      const remaining = (exam.duration * 60) - elapsed;
      
      if (remaining <= 0) {
        handleAutoSubmit('Time expired');
      } else {
        setTimeLeft(remaining);
        
        // Warning at 5 minutes
        if (remaining === 300) {
          toast.warning('5 minutes remaining!');
        }
        // Warning at 1 minute
        if (remaining === 60) {
          toast.error('1 minute remaining!');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session, exam]);

  const loadExam = async () => {
    try {
      const [examRes, sessionRes] = await Promise.all([
        examAPI.getById(id),
        examAPI.getSession(id)
      ]);
      
      setExam(examRes.data);
      setSession(sessionRes.data);
      
      if (sessionRes.data?.status === 'blocked') {
        setIsBlocked(true);
        toast.error('You are blocked from this exam');
        setTimeout(() => navigate('/exams'), 2000);
        return;
      }

      if (sessionRes.data?.status === 'completed') {
        toast.info('You have already completed this exam');
        setTimeout(() => navigate('/exams'), 2000);
        return;
      }

      if (examRes.data.allowedLanguages?.length > 0) {
        setLanguage(examRes.data.allowedLanguages[0]);
      }
    } catch (error) {
      toast.error('Failed to load exam');
      navigate('/exams');
    }
  };

  const handleAutoSave = async () => {
    if (!code.trim() || !exam || hasSubmitted.current) return;

    setAutoSaving(true);
    try {
      await submissionAPI.create({
        examId: id,
        questionId: exam.questions[currentQuestion].questionNumber,
        code,
        language,
        output
      });
      
      if (socketRef.current) {
        socketRef.current.emit('code-update', {
          examId: id,
          questionId: exam.questions[currentQuestion].questionNumber,
          code,
          language
        });
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleExecuteCode = async () => {
    setExecuting(true);
    setOutput('Executing...');

    try {
      const response = await codeAPI.execute(code, language, input);
      setOutput(response.data.output || response.data.error || 'No output');
      
      if (socketRef.current) {
        socketRef.current.emit('code-update', {
          examId: id,
          questionId: exam.questions[currentQuestion].questionNumber,
          code,
          language
        });
      }
    } catch (error) {
      setOutput('Execution error: ' + (error.response?.data?.error || error.message));
    } finally {
      setExecuting(false);
    }
  };

  const handleSaveSubmission = async () => {
    if (hasSubmitted.current) return;

    try {
      await submissionAPI.create({
        examId: id,
        questionId: exam.questions[currentQuestion].questionNumber,
        code,
        language,
        output
      });
      toast.success('Code saved successfully');
    } catch (error) {
      toast.error('Failed to save code');
    }
  };

  const handleAutoSubmit = async (reason) => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;
    setIsSubmitting(true); // disable proctoring before navigation

    toast.info(`Auto-submitting exam: ${reason}`);
    
    try {
      // Save current code
      if (code.trim()) {
        await submissionAPI.create({
          examId: id,
          questionId: exam.questions[currentQuestion].questionNumber,
          code,
          language,
          output
        });
      }

      // Submit exam
      await examAPI.submit(id);
      toast.success('Exam submitted successfully');
      setTimeout(() => navigate('/exams'), 2000);
    } catch (error) {
      toast.error('Failed to submit exam');
      hasSubmitted.current = false;
    }
  };

  const handleSubmitExam = async () => {
    if (hasSubmitted.current) return;

    if (!confirm('Are you sure you want to submit the exam? This action cannot be undone.')) {
      return;
    }

    hasSubmitted.current = true;
    setIsSubmitting(true); // disable proctoring before navigation

    try {
      // Save current code
      if (code.trim()) {
        await handleSaveSubmission();
      }

      // Submit exam
      await examAPI.submit(id);
      toast.success('Exam submitted successfully');
      setTimeout(() => navigate('/exams'), 2000);
    } catch (error) {
      toast.error('Failed to submit exam');
      hasSubmitted.current = false;
    }
  };

  const handleViolation = (count) => {
    if (count >= exam?.maxViolations) {
      handleAutoSubmit('Excessive violations detected');
    }
  };

  const handleBlock = () => {
    setIsBlocked(true);
    handleAutoSubmit('Blocked due to violations');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Blocked screen
  if (isBlocked) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Blocked</h1>
          <p>You have been blocked from this exam due to violations.</p>
        </div>
      </div>
    );
  }

  // Fullscreen gate — must come before loading check so the button is always shown first
  // Browser requires a user gesture (click) to enter fullscreen — cannot do it programmatically on load
  if (!fullscreenReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-6">🖥️</div>
          <h1 className="text-3xl font-bold mb-4">
            {exam ? exam.title : 'Exam'}
          </h1>
          <p className="text-gray-300 mb-2">This exam requires fullscreen mode.</p>
          <p className="text-gray-400 text-sm mb-8">
            Exiting fullscreen, switching tabs, or opening other windows will be recorded as violations.
          </p>
          <button
            onClick={enterFullscreen}
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-10 py-4 rounded-xl transition-colors shadow-lg"
          >
            Enter Fullscreen &amp; Start Exam
          </button>
          {!exam && (
            <p className="text-gray-500 text-sm mt-4">Loading exam details...</p>
          )}
        </div>
      </div>
    );
  }

  // Loading check after fullscreen gate
  if (!exam || !session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  const question = exam.questions[currentQuestion];

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Proctoring System */}
      <ProctoringSystem
        sessionId={session.id}
        examId={id}
        onViolation={handleViolation}
        onBlock={handleBlock}
        socket={socketRef.current}
        disabled={isSubmitting}
      />

      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{exam.title}</h1>
          <p className="text-sm text-gray-400">Question {currentQuestion + 1} of {exam.questions.length}</p>
        </div>
        <div className="flex items-center space-x-6">
          {autoSaving && (
            <span className="text-sm text-yellow-400">Saving...</span>
          )}
          <span className={`text-lg font-mono ${timeLeft < 300 ? 'text-red-400 animate-pulse' : ''}`}>
            Time Left: {formatTime(timeLeft)}
          </span>
          <button
            onClick={handleSubmitExam}
            disabled={hasSubmitted.current}
            className="bg-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            Submit Exam Early
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Question Panel */}
        <div className="w-1/3 bg-gray-800 text-white p-6 overflow-y-auto">
          <div className="mb-6">
            <div className="flex space-x-2 mb-4 flex-wrap">
              {exam.questions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleAutoSave();
                    setCurrentQuestion(idx);
                    setCode('');
                    setOutput('');
                  }}
                  className={`px-3 py-1 rounded mb-2 ${
                    idx === currentQuestion ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  Q{idx + 1}
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2">
            Question {question.questionNumber}
          </h2>
          <h3 className="text-xl mb-4">{question.title}</h3>
          <p className="text-gray-300 mb-4 whitespace-pre-wrap">{question.description}</p>
          <p className="text-sm text-gray-400">Points: {question.points}</p>

          {question.testCases?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Test Cases:</h4>
              {question.testCases.map((tc, idx) => (
                <div key={idx} className="bg-gray-700 p-3 rounded mb-2 text-sm">
                  <p><span className="text-gray-400">Input:</span> {tc.input}</p>
                  <p><span className="text-gray-400">Expected:</span> {tc.expectedOutput}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-800 px-4 py-2 flex items-center space-x-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-700 text-white px-3 py-1 rounded"
            >
              {exam.allowedLanguages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <button
              onClick={handleExecuteCode}
              disabled={executing || !code.trim()}
              className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 disabled:bg-gray-600"
            >
              {executing ? 'Running...' : 'Run Code'}
            </button>
            <button
              onClick={handleSaveSubmission}
              disabled={!code.trim()}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:bg-gray-600"
            >
              Save
            </button>
          </div>

          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true,
                contextmenu: false, // Disable right-click context menu
                quickSuggestions: false, // Disable auto-suggestions
                parameterHints: { enabled: false }, // Disable parameter hints
                suggestOnTriggerCharacters: false, // Disable suggestions
                acceptSuggestionOnCommitCharacter: false,
                tabCompletion: 'off',
                wordBasedSuggestions: false,
                selectionClipboard: false // Disable selection clipboard
              }}
            />
          </div>

          {/* Output Panel */}
          <div className="h-48 bg-gray-800 border-t border-gray-700">
            <div className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold flex justify-between items-center">
              <span>Output</span>
              <button
                onClick={() => setOutput('')}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear
              </button>
            </div>
            <div 
              className="p-4 text-white font-mono text-sm overflow-y-auto h-40"
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              style={{ userSelect: 'none' }}
            >
              <pre className="whitespace-pre-wrap">{output || 'Run your code to see output...'}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-600 text-white px-4 py-2 text-center text-sm">
        ⚠️ Do not switch tabs, exit fullscreen, or close this window. All actions are being monitored.
      </div>
    </div>
  );
};

export default ExamTake;

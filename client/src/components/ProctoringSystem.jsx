import { useEffect, useRef, useState } from 'react';
import { violationAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProctoringSystem = ({ sessionId, examId, onViolation, onBlock, socket }) => {
  const [violations, setViolations] = useState(0);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const faceDetectionInterval = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    isInitializedRef.current = false;
    let cleanupListeners = null;
    
    // Delay initialization to avoid triggering violations on page load
    const initTimer = setTimeout(() => {
      if (isMountedRef.current) {
        initializeProctoring();
        cleanupListeners = setupEventListeners();
        isInitializedRef.current = true;
      }
    }, 2000); // Wait 2 seconds before starting proctoring

    return () => {
      isMountedRef.current = false;
      isInitializedRef.current = false;
      clearTimeout(initTimer);
      if (cleanupListeners) {
        cleanupListeners();
      }
      cleanup();
    };
  }, []);

  const initializeProctoring = async () => {
    try {
      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      
      // Note: Camera and microphone are optional now
      // Try to get them but don't fail if not available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setIsWebcamActive(true);
        setIsMicActive(true);

        // Start face detection only if camera is available
        startFaceDetection();
      } catch (mediaError) {
        // Camera/mic not available - that's okay, continue without them
        console.log('Camera/microphone not available, continuing without them');
      }
    } catch (error) {
      console.error('Error initializing proctoring:', error);
    }
  };

  const startFaceDetection = () => {
    // Face detection is optional now - only run if camera is available
    if (!videoRef.current) return;
    
    faceDetectionInterval.current = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        // Video is playing - basic check (optional monitoring)
        // Not reporting violations for face detection anymore
      }
    }, 10000); // Check every 10 seconds
  };

  const setupEventListeners = () => {
    // Store handler references for cleanup
    const handlers = {
      visibilityChange: null,
      blur: null,
      fullscreenChange: null,
      contextMenu: null,
      copy: null,
      paste: null,
      cut: null,
      keyDown: null,
      beforeUnload: null,
      offline: null,
      online: null,
      devToolsInterval: null
    };

    // Tab switch / Window blur - Only report if initialized and mounted
    handlers.visibilityChange = () => {
      if (document.hidden && isMountedRef.current && isInitializedRef.current) {
        reportViolation('tab_switch', 'Student switched tabs or minimized window', 'high');
      }
    };

    handlers.blur = () => {
      if (isMountedRef.current && isInitializedRef.current) {
        reportViolation('window_blur', 'Student switched to another window', 'high');
      }
    };

    // Fullscreen exit - Only report if initialized and mounted
    handlers.fullscreenChange = () => {
      if (!document.fullscreenElement && isMountedRef.current && isInitializedRef.current) {
        reportViolation('exit_fullscreen', 'Student exited fullscreen mode', 'high');
        // Try to re-enter fullscreen
        setTimeout(() => {
          if (document.documentElement.requestFullscreen && isMountedRef.current) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        }, 1000);
      }
    };

    // Right-click
    handlers.contextMenu = (e) => {
      if (isMountedRef.current && isInitializedRef.current) {
        e.preventDefault();
        reportViolation('right_click', 'Student attempted to right-click', 'medium');
      }
    };

    // Copy/Paste - BLOCK EVERYWHERE including Monaco editor
    handlers.copy = (e) => {
      if (isMountedRef.current && isInitializedRef.current) {
        e.preventDefault();
        reportViolation('copy_attempt', 'Student attempted to copy content', 'high');
      }
    };

    handlers.paste = (e) => {
      if (isMountedRef.current && isInitializedRef.current) {
        e.preventDefault();
        reportViolation('paste_attempt', 'Student attempted to paste content', 'high');
      }
    };

    handlers.cut = (e) => {
      if (isMountedRef.current && isInitializedRef.current) {
        e.preventDefault();
        reportViolation('cut_attempt', 'Student attempted to cut content', 'high');
      }
    };

    // DevTools detection
    const detectDevTools = () => {
      if (!isMountedRef.current || !isInitializedRef.current) return;
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        reportViolation('devtools_open', 'Developer tools detected', 'high');
      }
    };

    // Page refresh
    handlers.beforeUnload = (e) => {
      if (isMountedRef.current && isInitializedRef.current) {
        e.preventDefault();
        reportViolation('page_refresh', 'Student attempted to refresh page', 'high');
        e.returnValue = '';
      }
    };

    // Network disconnect
    handlers.offline = () => {
      if (isMountedRef.current && isInitializedRef.current) {
        reportViolation('network_disconnect', 'Network connection lost', 'high');
      }
    };

    handlers.online = () => {
      if (isMountedRef.current && isInitializedRef.current) {
        toast.success('Network connection restored');
      }
    };

    // Keyboard shortcuts - BLOCK EVERYWHERE including Monaco editor
    handlers.keyDown = (e) => {
      if (!isMountedRef.current || !isInitializedRef.current) return;
      
      // Block copy/paste/cut shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          reportViolation('keyboard_shortcut', 'Blocked keyboard shortcut: Ctrl+C', 'high');
        }
        if (e.key === 'v' || e.key === 'V') {
          e.preventDefault();
          reportViolation('keyboard_shortcut', 'Blocked keyboard shortcut: Ctrl+V', 'high');
        }
        if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          reportViolation('keyboard_shortcut', 'Blocked keyboard shortcut: Ctrl+X', 'high');
        }
        // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
        if (e.key === 'F12' || (e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
          e.preventDefault();
          reportViolation('devtools_attempt', 'Attempted to open developer tools', 'high');
        }
      }
      // Block F12 key alone
      if (e.key === 'F12') {
        e.preventDefault();
        reportViolation('devtools_attempt', 'Attempted to open developer tools', 'high');
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handlers.visibilityChange);
    window.addEventListener('blur', handlers.blur);
    document.addEventListener('fullscreenchange', handlers.fullscreenChange);
    document.addEventListener('contextmenu', handlers.contextMenu);
    document.addEventListener('copy', handlers.copy);
    document.addEventListener('paste', handlers.paste);
    document.addEventListener('cut', handlers.cut);
    document.addEventListener('keydown', handlers.keyDown);
    window.addEventListener('beforeunload', handlers.beforeUnload);
    window.addEventListener('offline', handlers.offline);
    window.addEventListener('online', handlers.online);

    // DevTools detection interval
    handlers.devToolsInterval = setInterval(detectDevTools, 1000);

    // Return cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handlers.visibilityChange);
      window.removeEventListener('blur', handlers.blur);
      document.removeEventListener('fullscreenchange', handlers.fullscreenChange);
      document.removeEventListener('contextmenu', handlers.contextMenu);
      document.removeEventListener('copy', handlers.copy);
      document.removeEventListener('paste', handlers.paste);
      document.removeEventListener('cut', handlers.cut);
      document.removeEventListener('keydown', handlers.keyDown);
      window.removeEventListener('beforeunload', handlers.beforeUnload);
      window.removeEventListener('offline', handlers.offline);
      window.removeEventListener('online', handlers.online);
      if (handlers.devToolsInterval) {
        clearInterval(handlers.devToolsInterval);
      }
    };
  };

  const reportViolation = async (type, description, severity = 'medium') => {
    // Don't report if component is unmounted or not initialized
    if (!isMountedRef.current || !isInitializedRef.current) return;
    
    try {
      const response = await violationAPI.create({
        sessionId,
        type,
        description,
        severity
      });

      const newCount = response.data.violationCount;
      setViolations(newCount);

      // Emit to socket for real-time monitoring
      if (socket) {
        socket.emit('violation-detected', {
          examId,
          sessionId,
          type,
          description,
          severity,
          count: newCount
        });
      }

      // Show toast
      toast.error(`Violation detected: ${description}`);

      // Call parent callback
      if (onViolation) {
        onViolation(newCount);
      }

      // Check if blocked
      if (response.data.blocked) {
        toast.error('You have been blocked from this exam due to excessive violations!');
        if (onBlock) {
          onBlock();
        }
      }
    } catch (error) {
      console.error('Error reporting violation:', error);
    }
  };

  const cleanup = () => {
    // Stop webcam
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Clear intervals
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current);
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${violations === 0 ? 'bg-green-500' : violations < 3 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <span className="text-xs font-semibold">Violations: {violations}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs font-semibold">Proctoring Active</span>
        </div>
        {isWebcamActive && (
          <>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs font-semibold">Camera (Optional)</span>
            </div>
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-32 h-24 bg-black rounded"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ProctoringSystem;

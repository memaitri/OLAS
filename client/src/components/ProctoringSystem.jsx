import { useEffect, useRef, useState } from 'react';
import { violationAPI } from '../services/api';
import toast from 'react-hot-toast';

const ProctoringSystem = ({ sessionId, examId, onViolation, onBlock, socket, disabled }) => {
  const [violations, setViolations] = useState(0);
  const isMountedRef = useRef(true);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    isInitializedRef.current = false;
    let cleanupListeners = null;

    // Delay initialization to avoid triggering violations on page load
    const initTimer = setTimeout(() => {
      if (isMountedRef.current) {
        cleanupListeners = setupEventListeners();
        isInitializedRef.current = true;
      }
    }, 2000);

    return () => {
      isMountedRef.current = false;
      isInitializedRef.current = false;
      clearTimeout(initTimer);
      if (cleanupListeners) {
        cleanupListeners();
      }
    };
  }, []);

  const setupEventListeners = () => {
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

    // Tab switch / Window blur
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

    // Fullscreen exit
    handlers.fullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      if (!isFullscreen && isMountedRef.current && isInitializedRef.current) {
        reportViolation('exit_fullscreen', 'Student exited fullscreen mode', 'high');
        // Try to re-enter fullscreen
        setTimeout(() => {
          if (isMountedRef.current) {
            const el = document.documentElement;
            if (el.requestFullscreen) {
              el.requestFullscreen().catch(() => {});
            } else if (el.webkitRequestFullscreen) {
              el.webkitRequestFullscreen();
            } else if (el.mozRequestFullScreen) {
              el.mozRequestFullScreen();
            }
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

    // Copy/Paste/Cut
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

    // Keyboard shortcuts
    handlers.keyDown = (e) => {
      if (!isMountedRef.current || !isInitializedRef.current) return;

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
        if (e.key === 'F12' || (e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
          e.preventDefault();
          reportViolation('devtools_attempt', 'Attempted to open developer tools', 'high');
        }
      }
      if (e.key === 'F12') {
        e.preventDefault();
        reportViolation('devtools_attempt', 'Attempted to open developer tools', 'high');
      }
    };

    // Register listeners
    document.addEventListener('visibilitychange', handlers.visibilityChange);
    window.addEventListener('blur', handlers.blur);
    document.addEventListener('fullscreenchange', handlers.fullscreenChange);
    document.addEventListener('webkitfullscreenchange', handlers.fullscreenChange);
    document.addEventListener('mozfullscreenchange', handlers.fullscreenChange);
    document.addEventListener('contextmenu', handlers.contextMenu);
    document.addEventListener('copy', handlers.copy);
    document.addEventListener('paste', handlers.paste);
    document.addEventListener('cut', handlers.cut);
    document.addEventListener('keydown', handlers.keyDown);
    window.addEventListener('beforeunload', handlers.beforeUnload);
    window.addEventListener('offline', handlers.offline);
    window.addEventListener('online', handlers.online);

    handlers.devToolsInterval = setInterval(detectDevTools, 1000);

    return () => {
      document.removeEventListener('visibilitychange', handlers.visibilityChange);
      window.removeEventListener('blur', handlers.blur);
      document.removeEventListener('fullscreenchange', handlers.fullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handlers.fullscreenChange);
      document.removeEventListener('mozfullscreenchange', handlers.fullscreenChange);
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
    // Don't report if disabled, unmounted, or not initialized
    if (disabled || !isMountedRef.current || !isInitializedRef.current) return;

    try {
      const response = await violationAPI.create({
        sessionId,
        type,
        description,
        severity
      });

      const newCount = response.data.violationCount;
      setViolations(newCount);

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

      toast.error(`Violation detected: ${description}`);

      if (onViolation) {
        onViolation(newCount);
      }

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

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg px-4 py-3 space-y-1">
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${violations === 0 ? 'bg-green-500' : violations < 3 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <span className="text-xs font-semibold text-white">Violations: {violations}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          <span className="text-xs font-semibold text-white">Proctoring Active</span>
        </div>
      </div>
    </div>
  );
};

export default ProctoringSystem;

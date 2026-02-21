# Proctoring Scope Fix - Violations Only in Exams

## Issue Fixed

**Problem**: Violations were being triggered in faculty view and other pages, not just during exams.

**Root Cause**: 
- ProctoringSystem component registers global event listeners (document/window level)
- Event listeners were not properly checking if component was still mounted
- When navigating away from exam page, listeners remained active
- Faculty/admin pages were triggering violations unintentionally

---

## Solution Implemented

### 1. Added Mount Status Tracking
```javascript
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;
  
  // ... initialization
  
  return () => {
    isMountedRef.current = false; // Mark as unmounted
    setIsInitialized(false);
    cleanup();
  };
}, []);
```

### 2. Updated All Event Handlers
Every event handler now checks:
- `isInitialized` - Proctoring has started (after 2-second delay)
- `isMountedRef.current` - Component is still mounted (on exam page)

```javascript
const handleCopy = (e) => {
  if (isInitialized && isMountedRef.current) {
    e.preventDefault();
    reportViolation('copy_attempt', '...', 'high');
  }
};
```

### 3. Updated reportViolation Function
```javascript
const reportViolation = async (type, description, severity) => {
  // Don't report if component is unmounted or not initialized
  if (!isMountedRef.current || !isInitialized) return;
  
  // ... rest of violation reporting
};
```

---

## How It Works

### Exam Page (ExamTake.jsx)
```
1. Student navigates to /exam/:id/take
2. ProctoringSystem component mounts
3. isMountedRef.current = true
4. Wait 2 seconds (initialization delay)
5. isInitialized = true
6. Event listeners start monitoring
7. Violations can be reported
```

### Leaving Exam Page
```
1. Student navigates away (or faculty views monitoring)
2. ProctoringSystem component unmounts
3. isMountedRef.current = false
4. isInitialized = false
5. Event listeners still exist but check isMountedRef
6. No violations reported (checks fail)
7. Cleanup removes all listeners
```

### Faculty/Admin Pages
```
1. Faculty views monitoring page
2. ProctoringSystem NOT rendered
3. No event listeners registered
4. No violations possible
5. Faculty can copy/paste freely
```

---

## Event Listener Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│  Exam Page Lifecycle                                     │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Mount Component                                         │
│  └─> isMountedRef.current = true                        │
│      └─> Wait 2 seconds                                 │
│          └─> isInitialized = true                       │
│              └─> Register event listeners               │
│                  └─> Violations can be reported         │
│                                                           │
│  Unmount Component                                       │
│  └─> isMountedRef.current = false                       │
│      └─> isInitialized = false                          │
│          └─> Event listeners check isMountedRef         │
│              └─> No violations reported                 │
│                  └─> Cleanup removes listeners          │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Checks in Place

### Before Reporting Violation
```javascript
// Check 1: Component must be mounted
if (!isMountedRef.current) return;

// Check 2: Proctoring must be initialized
if (!isInitialized) return;

// Check 3: Event must be relevant (e.g., document.hidden for tab switch)
if (document.hidden && isInitialized && isMountedRef.current) {
  reportViolation(...);
}
```

### Event Handler Pattern
```javascript
const handleEvent = (e) => {
  // Triple check
  if (!isInitialized || !isMountedRef.current) return;
  
  // Prevent default if needed
  e.preventDefault();
  
  // Report violation
  reportViolation(...);
};
```

---

## Files Modified

### `client/src/components/ProctoringSystem.jsx`
- Added `isMountedRef` to track mount status
- Updated `useEffect` to set/unset mounted flag
- Updated all event handlers to check `isMountedRef.current`
- Updated `reportViolation` to check mount status
- Ensures violations only reported when component is mounted

---

## Testing Checklist

### Test 1: Violations Only in Exam
- [x] Student starts exam
- [x] Violations can be triggered
- [x] Student leaves exam
- [x] No violations triggered on other pages

### Test 2: Faculty Can Work Freely
- [x] Faculty logs in
- [x] Faculty views monitoring page
- [x] Faculty can copy/paste
- [x] Faculty can right-click
- [x] No violations triggered

### Test 3: Admin Can Work Freely
- [x] Admin logs in
- [x] Admin views dashboard
- [x] Admin can copy/paste
- [x] Admin can right-click
- [x] No violations triggered

### Test 4: Multiple Page Navigation
- [x] Student starts exam (violations active)
- [x] Student leaves exam (violations stop)
- [x] Student views dashboard (no violations)
- [x] Student starts exam again (violations active)

### Test 5: Component Cleanup
- [x] Event listeners registered on mount
- [x] Event listeners check mount status
- [x] Event listeners removed on unmount
- [x] No memory leaks

---

## Before vs After

### Before (Broken)
```
❌ Faculty views monitoring → Violations triggered
❌ Admin views dashboard → Violations triggered
❌ Student views exam list → Violations triggered
❌ Copy/paste blocked everywhere
❌ Right-click blocked everywhere
```

### After (Fixed)
```
✅ Faculty views monitoring → No violations
✅ Admin views dashboard → No violations
✅ Student views exam list → No violations
✅ Copy/paste only blocked in exam
✅ Right-click only blocked in exam
✅ Violations ONLY during active exam
```

---

## Component Scope

### Where ProctoringSystem is Used
```
✅ /exam/:id/take (ExamTake.jsx) - ONLY HERE
❌ /exam/:id/monitor (ExamMonitor.jsx) - NOT HERE
❌ /dashboard (Dashboard.jsx) - NOT HERE
❌ /exams (Exams.jsx) - NOT HERE
❌ Any other page - NOT HERE
```

### Event Listener Scope
```
Global listeners (document/window level)
BUT
Only active when:
  1. Component is mounted (exam page)
  2. Component is initialized (after 2s delay)
  3. isMountedRef.current === true
```

---

## Key Improvements

### 1. Mount Status Tracking
- `isMountedRef` tracks if component is currently mounted
- Prevents violations after navigation away
- Ensures clean component lifecycle

### 2. Double-Check Pattern
- Every handler checks both `isInitialized` AND `isMountedRef.current`
- Redundant checks ensure no false violations
- Fail-safe approach

### 3. Proper Cleanup
- `isMountedRef.current = false` on unmount
- `isInitialized = false` on unmount
- All event listeners removed
- No lingering effects

---

## Edge Cases Handled

### Case 1: Quick Navigation
```
Student starts exam → Immediately leaves
- Component mounts
- isMountedRef = true
- Before 2s delay completes, student leaves
- Component unmounts
- isMountedRef = false
- No violations triggered (not initialized yet)
```

### Case 2: Multiple Tabs
```
Tab 1: Student taking exam (violations active)
Tab 2: Faculty monitoring (no violations)
- Each tab has separate component instances
- Each tracks its own mount status
- No interference between tabs
```

### Case 3: Browser Back Button
```
Student in exam → Presses back button
- Component unmounts
- isMountedRef = false
- Event listeners still exist briefly
- But checks fail (isMountedRef = false)
- No violations reported
- Cleanup removes listeners
```

---

## Performance Impact

### Before
- Event listeners always active
- Violations checked on every page
- Unnecessary API calls
- Poor performance

### After
- Event listeners only active in exam
- Violations only checked when needed
- No unnecessary API calls
- Better performance

---

## Security Considerations

### Still Secure
- Violations only reported during exam
- All checks still in place
- No security holes introduced
- Students cannot bypass proctoring

### Improved UX
- Faculty can work normally
- Admin can work normally
- No false violations
- Better user experience

---

## Future Improvements

### 1. Route-Based Activation
```javascript
// Only activate proctoring on exam routes
const location = useLocation();
const isExamRoute = location.pathname.includes('/exam/') && 
                    location.pathname.includes('/take');
```

### 2. Context-Based Proctoring
```javascript
// Use React Context to manage proctoring state
const { isProctoringActive } = useProctoringContext();
```

### 3. Service Worker Approach
```javascript
// Use service worker for more robust monitoring
// Separate from React component lifecycle
```

---

## Success Criteria

✅ Violations only triggered during exams
✅ Faculty can work freely without violations
✅ Admin can work freely without violations
✅ Students can navigate freely outside exams
✅ Component properly cleans up on unmount
✅ No memory leaks
✅ No false violations
✅ Proper mount status tracking

---

**Status**: FIXED ✅
**Last Updated**: 2024
**Version**: 1.2.0

# Fullscreen & Copy/Paste Fixes - COMPLETE LOCKDOWN

## Issues Fixed

### 1. Automatic Fullscreen on Exam Start
- **Problem**: Fullscreen was not automatically activated when student clicked "Take Exam"
- **Solution**: 
  - Added automatic fullscreen request in `ExamTake.jsx` component's `useEffect` hook
  - Fullscreen is now triggered immediately when the exam page loads
  - Shows error toast if fullscreen permission is denied
  - Automatically exits fullscreen when student leaves the exam

### 2. Copy/Paste Blocked EVERYWHERE (Including IDE)
- **Problem**: Students could copy/paste in the code editor and output area
- **Solution**:
  - Copy/paste/cut is now COMPLETELY BLOCKED throughout the entire exam
  - Blocked in Monaco code editor
  - Blocked in output/terminal area
  - Blocked in question panel
  - Blocked everywhere on the page
  - All violations reported as HIGH severity

## Implementation Details

### ExamTake.jsx Changes

#### 1. Automatic Fullscreen
```javascript
useEffect(() => {
  // Request fullscreen immediately when component mounts
  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      toast.error('Please allow fullscreen to take the exam');
    }
  };

  enterFullscreen();
  // ... rest of initialization
}, [id]);
```

#### 2. Monaco Editor Restrictions
```javascript
<Editor
  options={{
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: 'on',
    automaticLayout: true,
    contextmenu: false, // Disable right-click
    quickSuggestions: false, // Disable auto-suggestions
    parameterHints: { enabled: false },
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnCommitCharacter: false,
    tabCompletion: 'off',
    wordBasedSuggestions: false,
    selectionClipboard: false // Disable clipboard
  }}
/>
```

#### 3. Output Area Protection
```javascript
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
```

### ProctoringSystem.jsx Changes

#### 1. Complete Copy/Cut/Paste Blocking
```javascript
// BLOCK EVERYWHERE - No exceptions
const handleCopy = (e) => {
  e.preventDefault();
  reportViolation('copy_attempt', 'Student attempted to copy content', 'high');
};

const handlePaste = (e) => {
  e.preventDefault();
  reportViolation('paste_attempt', 'Student attempted to paste content', 'high');
};

const handleCut = (e) => {
  e.preventDefault();
  reportViolation('cut_attempt', 'Student attempted to cut content', 'high');
};
```

#### 2. Complete Keyboard Shortcut Blocking
```javascript
// Block Ctrl+C, Ctrl+V, Ctrl+X EVERYWHERE
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
}
```

## Protected Areas

### ❌ Copy/Paste BLOCKED EVERYWHERE
- Monaco code editor (IDE)
- Output/terminal area
- Question description panel
- All text areas
- Right-click context menu disabled everywhere

### ✅ Students CAN Still:
- Type code manually in the editor
- Use arrow keys, backspace, delete
- Use basic text editing (no copy/paste)
- Run and test their code
- Submit their work

## User Experience

### When Student Starts Exam
1. Student clicks "Take Exam" button
2. Browser automatically enters fullscreen mode
3. If permission denied, error toast appears
4. Student must allow fullscreen to continue

### When Student Tries to Copy (Anywhere)
1. Student selects text anywhere on the page
2. Presses Ctrl+C
3. **Result**: 
   - Copy is blocked
   - Violation reported: "Student attempted to copy content" (HIGH severity)
   - Toast notification appears
   - Violation count increases

### When Student Tries to Paste (Anywhere)
1. Student presses Ctrl+V
2. **Result**:
   - Paste is blocked
   - Violation reported: "Student attempted to paste content" (HIGH severity)
   - Toast notification appears
   - Violation count increases

### When Student Right-Clicks
1. Student right-clicks anywhere
2. **Result**:
   - Context menu blocked
   - Violation reported: "Student attempted to right-click" (MEDIUM severity)
   - Toast notification appears

## Violation Types

### Copy/Paste Violations (HIGH Severity)
- `copy_attempt` - Student tried to copy (HIGH severity)
- `cut_attempt` - Student tried to cut (HIGH severity)
- `paste_attempt` - Student tried to paste (HIGH severity)
- `keyboard_shortcut` - Student used Ctrl+C/V/X (HIGH severity)

### Other Violations
- `right_click` - Student right-clicked (MEDIUM severity)
- `devtools_attempt` - Student tried to open DevTools (HIGH severity)
- `exit_fullscreen` - Student exited fullscreen (HIGH severity)
- `tab_switch` - Student switched tabs (HIGH severity)

## Testing Checklist

- [x] Fullscreen activates automatically when exam starts
- [x] Cannot copy text from code editor (Ctrl+C blocked)
- [x] Cannot paste into code editor (Ctrl+V blocked)
- [x] Cannot cut from code editor (Ctrl+X blocked)
- [x] Cannot copy text from output area
- [x] Cannot paste into output area
- [x] Cannot right-click anywhere
- [x] Context menu disabled in Monaco editor
- [x] All copy/paste attempts report HIGH severity violations
- [x] Students can still type code manually
- [x] Students can still run and test code

## Security Features

### Multi-Layer Protection
1. **Event Handlers** - Block copy/cut/paste events globally
2. **Keyboard Shortcuts** - Block Ctrl+C/V/X globally
3. **Monaco Options** - Disable context menu and clipboard in editor
4. **CSS** - userSelect: none on output area
5. **Right-Click** - Blocked everywhere

### Violation Tracking
- All attempts are logged to database
- Real-time reporting to faculty via Socket.IO
- High severity violations count toward blocking threshold
- Faculty can see all violation attempts in monitoring dashboard

## How Students Should Work

### ✅ Allowed Actions
- Type code manually in the editor
- Use keyboard for navigation (arrows, home, end)
- Use backspace and delete keys
- Select text with mouse/keyboard
- Run code to see output
- Save and submit code

### ❌ Blocked Actions
- Copy code from anywhere
- Paste code from anywhere
- Cut code from anywhere
- Right-click for context menu
- Use Ctrl+C, Ctrl+V, Ctrl+X
- Open developer tools
- Exit fullscreen
- Switch tabs

## Educational Justification

This complete lockdown ensures:
1. **Academic Integrity** - Students must write their own code
2. **Fair Assessment** - All students have the same restrictions
3. **Skill Verification** - Tests actual coding ability, not copy/paste skills
4. **Cheating Prevention** - Cannot copy from external sources or other students

## Known Limitations

1. **Students must type everything** - This is intentional for exam integrity
2. **No autocomplete** - Disabled to prevent assistance
3. **No code suggestions** - Students must know syntax
4. **Browser extensions** - Some might bypass, but violations are logged
5. **Accessibility** - May affect screen readers (consider accommodations)

## Accessibility Considerations

For students requiring accommodations:
- Faculty can reset violations if needed
- Faculty can unblock students
- Consider alternative exam formats for students with disabilities
- Provide extra time if typing speed is affected

## Future Enhancements

- [ ] Add typing speed analysis to detect unusual patterns
- [ ] Add code similarity detection
- [ ] Add AI-based code analysis
- [ ] Add keystroke logging for forensics
- [ ] Add screen recording (with permission)
- [ ] Add eye tracking (with permission)

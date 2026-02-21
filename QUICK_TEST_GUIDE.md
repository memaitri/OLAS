# Quick Test Guide - Fullscreen & Copy/Paste Protection

## Test 1: Automatic Fullscreen ✅

### Steps:
1. Login as student (student@olas.com / student123)
2. Go to "Exams" page
3. Click "Take Exam" on any active exam
4. **EXPECTED**: Browser automatically enters fullscreen mode
5. **VERIFY**: You see the exam in fullscreen with no browser UI visible

### If Fullscreen Fails:
- Check if browser blocked the fullscreen request
- Look for a permission prompt in the address bar
- Check browser console for error messages
- Try clicking "Allow" on the fullscreen permission prompt

---

## Test 2: Copy/Paste Blocked EVERYWHERE ✅

### Steps:
1. While in exam, write some code in the editor
2. Try to select text in the code editor
3. Press Ctrl+C to copy
4. **EXPECTED**: 
   - Copy is blocked
   - Violation toast appears: "Student attempted to copy content"
   - Violation count increases (HIGH severity)
5. Try Ctrl+V to paste
6. **EXPECTED**: 
   - Paste is blocked
   - Violation toast appears: "Student attempted to paste content"
   - Violation count increases (HIGH severity)

### In Output Area:
1. Click "Run Code" to see output
2. Try to select text in output
3. Try Ctrl+C
4. **EXPECTED**: Copy blocked, violation reported

### Right-Click Test:
1. Right-click anywhere (editor, output, question panel)
2. **EXPECTED**: Context menu blocked, violation reported

---

## Test 3: Students Must Type Manually ✅

### Steps:
1. While in exam, click in the Monaco code editor
2. Try to paste code with Ctrl+V
3. **EXPECTED**: Paste blocked, violation reported
4. Type code manually: `console.log("Hello World");`
5. **EXPECTED**: Typing works normally
6. Use backspace, delete, arrow keys
7. **EXPECTED**: All basic editing works
8. Try to copy your own code with Ctrl+C
9. **EXPECTED**: Copy blocked, violation reported

---

## Test 4: Fullscreen Exit Detection ✅

### Steps:
1. While in exam (fullscreen mode)
2. Press ESC key to exit fullscreen
3. **EXPECTED**:
   - Violation reported: "Student exited fullscreen mode"
   - Toast appears with violation message
   - System attempts to re-enter fullscreen after 1 second
   - Violation count increases

---

## Test 5: Cut Operation Blocked ✅

### Steps:
1. While in exam, try to select text in output area
2. Press Ctrl+X (cut)
3. **EXPECTED**: 
   - Cut is blocked
   - Violation reported: "Blocked keyboard shortcut: Ctrl+X"
   - Toast appears

### In Code Editor:
1. Select code in Monaco editor
2. Press Ctrl+X
3. **EXPECTED**: Cut works normally, NO violation

---

## Test 6: Right-Click Blocked ✅

### Steps:
1. Right-click anywhere in the exam page (except code editor)
2. **EXPECTED**: 
   - Context menu is blocked
   - Violation reported: "Student attempted to right-click"
   - Toast appears

---

## Visual Indicators

### Proctoring Widget (Top Right)
- **Green dot**: No violations
- **Yellow dot**: 1-2 violations
- **Red dot**: 3+ violations (blocked)
- **Blue dot**: Proctoring active

### Violation Toast Messages
- Red background with error icon
- Shows violation type and description
- Appears in top-right corner

---

## Expected Behavior Summary

| Action | Location | Result |
|--------|----------|--------|
| Start Exam | Exam page loads | ✅ Auto fullscreen |
| Copy (Ctrl+C) | Anywhere | ❌ Blocked + HIGH Violation |
| Paste (Ctrl+V) | Anywhere | ❌ Blocked + HIGH Violation |
| Cut (Ctrl+X) | Anywhere | ❌ Blocked + HIGH Violation |
| Right-click | Anywhere | ❌ Blocked + Violation |
| Select text | Anywhere | ⚠️ Allowed but can't copy |
| Type code | Code editor | ✅ Allowed |
| Backspace/Delete | Code editor | ✅ Allowed |
| Arrow keys | Code editor | ✅ Allowed |
| Exit fullscreen | Press ESC | ❌ Violation + Auto re-enter |
| Leave exam | Navigate away | ✅ Exit fullscreen cleanly |

---

## Troubleshooting

### Fullscreen Not Working
- **Issue**: Fullscreen doesn't activate
- **Solution**: Check browser permissions, allow fullscreen in browser settings
- **Check**: Browser console for error messages

### Copy/Paste Still Working
- **Issue**: Can still copy from editor or output
- **Solution**: Hard refresh (Ctrl+Shift+R) to clear cache
- **Check**: Verify violations are being reported in browser console
- **Note**: Copy/paste should be blocked EVERYWHERE now, including the code editor

### No Violations Reported
- **Issue**: Actions are blocked but no violations logged
- **Solution**: Check backend server is running, check Socket.IO connection
- **Check**: Browser console and server logs

### Fullscreen Keeps Exiting
- **Issue**: Fullscreen exits repeatedly
- **Solution**: This is expected if student presses ESC, system will re-enter
- **Check**: Look for violation messages

---

## Success Criteria

✅ Fullscreen activates automatically when exam starts
✅ Copy/paste/cut blocked EVERYWHERE (including code editor)
✅ Right-click blocked everywhere
✅ Text selection allowed but copy blocked
✅ Students can type code manually
✅ Students can use backspace, delete, arrow keys
✅ Violations reported for all blocked actions (HIGH severity)
✅ Fullscreen re-enters after exit attempt
✅ Clean exit when leaving exam

---

## Quick Commands

### Start Backend
```bash
cd server
npm run dev
```

### Start Frontend
```bash
cd client
npm run dev
```

### Check Logs
- Backend: Check terminal running server
- Frontend: Check browser console (F12)
- Socket.IO: Look for "violation-detected" events

---

## Demo Accounts

- **Student**: student@olas.com / student123
- **Faculty**: faculty@olas.com / faculty123 (to monitor violations)
- **Admin**: admin@olas.com / admin123

---

## Notes

- Test in Chrome/Edge for best results
- Firefox and Safari also supported
- Mobile browsers have limited fullscreen support
- Some browser extensions might interfere
- Test with clean browser profile for accurate results

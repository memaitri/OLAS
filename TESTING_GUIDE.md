# Testing Guide - Faculty Monitoring & Reset/Unblock Features

## Prerequisites
- Backend server running on http://localhost:5000
- Frontend running on http://localhost:5173
- Database seeded with demo data

## Test Accounts
- **Faculty**: faculty@olas.com / faculty123
- **Student**: student@olas.com / student123
- **Admin**: admin@olas.com / admin123

## Test Scenario 1: View Monitoring Data

1. Login as faculty (faculty@olas.com / faculty123)
2. Navigate to "Exams" page
3. Click "Monitor" on any active exam
4. Verify you can see:
   - Exam details and statistics
   - Student overview table with status
   - Violation counts per student
   - Recent violations list
   - Recent submissions list

**Expected Result**: All data loads without "Failed to load monitoring data" error. If there is an error, check the browser console for detailed error message.

## Test Scenario 2: Reset Violations

### Setup
1. Have a student take an exam and trigger some violations (tab switch, right-click, etc.)
2. Faculty should see violations in the monitoring page

### Test Steps
1. Login as faculty
2. Go to exam monitoring page
3. Find the student with violations
4. Click "View Details" on that student
5. Verify violations are listed
6. Click "Reset Violations" button
7. Confirm the action in the dialog
8. Verify:
   - Success toast appears
   - Violations list is now empty
   - Violation count shows 0

**Expected Result**: All violations are cleared and student can continue exam without violation count.

## Test Scenario 3: Unblock Student

### Setup
1. Have a student exceed the maximum violations (default: 3)
2. Student should be automatically blocked
3. Faculty should see student status as "Blocked"

### Test Steps
1. Login as faculty
2. Go to exam monitoring page
3. Find the blocked student (status shows "Blocked" in red)
4. Click "View Details" on that student
5. Verify "Unblock Student & Allow Retake" button appears (red button)
6. Click the unblock button
7. Confirm the action in the dialog
8. Verify:
   - Success toast appears
   - Student status changes to "Active" or "Not Started"
   - Student can now rejoin the exam

### Verify Student Can Rejoin
1. Login as the student
2. Navigate to the exam
3. Click "Start Exam"
4. Verify student can access the exam again

**Expected Result**: Student is unblocked and can retake the exam.

## Test Scenario 4: Real-time Updates

### Setup
1. Open two browser windows:
   - Window 1: Faculty monitoring page
   - Window 2: Student taking exam

### Test Steps
1. In Window 2 (student), trigger a violation (e.g., switch tabs)
2. In Window 1 (faculty), verify:
   - Violation appears in real-time
   - Toast notification shows
   - Violation count updates

3. In Window 1 (faculty), reset violations for the student
4. Verify real-time update occurs

5. If student is blocked, unblock them from Window 1
6. In Window 2, verify student can rejoin

**Expected Result**: All actions update in real-time via Socket.IO.

## Test Scenario 5: Error Handling

### Test Invalid Session
1. Login as faculty
2. Open browser console
3. Try to reset violations with invalid session ID
4. Verify error message is descriptive

### Test Unauthorized Access
1. Login as student
2. Try to access monitoring page directly
3. Verify access is denied

**Expected Result**: Proper error messages and authorization checks work.

## Common Issues & Solutions

### "Failed to load monitoring data"
- Check browser console for detailed error
- Verify backend server is running
- Check if JWT token is valid
- Verify database connection

### Violations not resetting
- Check if session ID is correct
- Verify faculty has permission
- Check server logs for errors

### Student cannot rejoin after unblock
- Verify session status changed to 'in_progress'
- Check if submittedAt was cleared
- Verify exam is still active (not ended)

### Real-time updates not working
- Check Socket.IO connection in browser console
- Verify both clients are in the same exam room
- Check server logs for Socket.IO events

## Success Criteria

✅ Faculty can view all monitoring data without errors
✅ Faculty can reset violations for any student
✅ Faculty can unblock blocked students
✅ Students can retake exam after being unblocked
✅ Real-time updates work via Socket.IO
✅ Confirmation dialogs appear before destructive actions
✅ Error messages are descriptive and helpful
✅ Only faculty/admin can access these features

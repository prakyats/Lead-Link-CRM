# 🧪 CRM Application - Manual Testing Guide

## 🚀 Quick Start

**Both servers should be running:**
- ✅ Backend: http://localhost:3001
- ✅ Frontend: http://localhost:5173

**Open your browser manually:**
1. Open Chrome/Edge/Firefox
2. Navigate to: **http://localhost:5173**

---

## 📋 Complete Testing Checklist

### ✅ Test 1: Login Page
**URL:** http://localhost:5173

**Steps:**
1. Verify login form is visible with email and password fields
2. Enter credentials:
   - Email: `admin@crm.com`
   - Password: `123456`
3. Click "Sign In" button
4. **Expected:** Redirect to `/dashboard`

**Troubleshooting:**
- If login fails, check browser console (F12) for errors
- Verify backend is responding: http://localhost:3001/api/auth/login

---

### ✅ Test 2: Dashboard
**URL:** http://localhost:5173/dashboard

**Check:**
- [ ] KPI cards display numbers (e.g., Total Leads: 20)
- [ ] KPI cards show trend percentages
- [ ] "Recent Leads" section shows leads from API
- [ ] "Upcoming Tasks" section shows tasks
- [ ] Clicking a lead navigates to customer detail page

**Expected Data:**
- Total Leads: ~20 (from leads.json)
- Active Customers: should show count of "converted" stage leads
- Recent Leads: 5 most recent leads listed

---

### ✅ Test 3: Kanban Board
**URL:** http://localhost:5173/kanban

**Check:**
- [ ] 4 columns visible: New, Contacted, Proposal, Converted
- [ ] Each column shows lead cards
- [ ] Column headers show count badges
- [ ] Cards display: company name, contact, value, priority

**Drag-Drop Test:**
1. Drag a card from "New" column
2. Drop it in "Contacted" column
3. Refresh the page (F5)
4. **Expected:** Card stays in "Contacted" column

**Troubleshooting:**
- If drag doesn't work, check console for errors
- Verify LeadsContext is loaded
- Check Network tab for PUT request to `/api/leads/:id/stage`

---

### ✅ Test 4: Tasks Page
**URL:** http://localhost:5173/tasks

**Check:**
- [ ] Stats cards show: Total, Pending, Completed counts
- [ ] Task list displays all tasks
- [ ] Filter tabs work (All / Pending / Completed)
- [ ] Tasks show priority badges (High/Medium/Low)
- [ ] Overdue tasks highlighted in red

**Toggle Completion Test:**
1. Click checkbox on any pending task
2. Task should get strikethrough and move to completed
3. Stats cards should update immediately
4. **Expected:** Network request to `/api/tasks/:id/complete`

---

### ✅ Test 5: Customer Detail
**URL:** http://localhost:5173/customer/1

**Check:**
- [ ] Company name displays as page title
- [ ] Customer avatar with first letter
- [ ] Lead score shows with star icon (e.g., 85/100)
- [ ] Risk status badge (green/orange/red)
- [ ] Deal value displays correctly
- [ ] Interaction timeline shows past activities
- [ ] Action buttons visible (Add Interaction, Schedule Follow-up, Download Summary)

**Test Different Customers:**
- Try `/customer/1`, `/customer/2`, `/customer/5`
- Each should load different customer data

---

### ✅ Test 6: Reports
**URL:** http://localhost:5173/reports

**Check:**
- [ ] 4 KPI cards at top
- [ ] Pie chart: Lead Distribution by Stage (4 sections)
- [ ] Line chart: Revenue Trend
- [ ] Bar chart: Weekly Activity
- [ ] Stacked bar chart: Follow-up Completion Rate
- [ ] Charts are interactive (hover shows tooltips)

---

### ✅ Test 7: PDF Preview & Download
**URL:** http://localhost:5173/pdf-preview/1

**Steps:**
1. Go to Customer Detail page (any customer)
2. Click "Download Summary" button
3. Should navigate to PDF Preview page
4. Click "Download PDF" button
5. **Expected:** PDF file downloads with filename: `{Company_Name}_Summary.pdf`

**Verify PDF Contents:**
- CRM Pro header
- Customer information section
- Deal information section  
- Recent interactions list
- Footer with confidential notice

---

### ✅ Test 8: Logout
**Steps:**
1. Click "Logout" button in sidebar
2. **Expected:** Redirect to login page
3. Try accessing `/dashboard` directly
4. **Expected:** Redirect back to login

---

## 🔧 Common Issues & Fixes

### Issue: "Cannot connect to server"
**Fix:**
```bash
# Restart backend
cd server
npm start
```

### Issue: Blank page or React errors
**Fix:**
```bash
# Restart frontend
npm run dev
```

### Issue: Login fails / 401 errors
**Fix:**
1. Check backend logs for errors
2. Verify `users.json` contains admin user
3. Check JWT_SECRET in `.env` file

### Issue: Drag-drop not working in Kanban
**Fix:**
1. Check browser console for errors
2. Verify `react-dnd` is installed
3. Hard refresh: Ctrl+Shift+R

### Issue: Data not loading
**Fix:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Check for failed API calls (red entries)
5. Click on failed request to see error details

---

## 📊 Expected API Calls

### On Dashboard Load:
- `GET /api/dashboard/kpis`
- `GET /api/dashboard/recent-leads`

### On Kanban Load:
- `GET /api/leads`

### On Drag-Drop in Kanban:
- `PUT /api/leads/:id/stage`

### On Tasks Load:
- `GET /api/tasks`

### On Task Toggle:
- `PUT /api/tasks/:id/complete`

### On Customer Detail Load:
- `GET /api/leads/:id`

---

## ✅ Success Criteria

**All tests pass if:**
1. ✅ Login works and redirects to dashboard
2. ✅ Dashboard shows real data (not mock)
3. ✅ Kanban drag-drop persists on refresh
4. ✅ Task completion toggle works instantly
5. ✅ Customer details load with interactions
6. ✅ Charts render without errors
7. ✅ PDF downloads successfully with real data
8. ✅ Logout clears authentication

---

## 🎯 Quick Verification

**Open browser console (F12) and run:**
```javascript
// Check if user is logged in
localStorage.getItem('token')

// Should show JWT token if logged in
```

**Check backend health:**
Visit: http://localhost:3001
Should see: "CRM API Server is running"

---

**Happy Testing! 🚀**

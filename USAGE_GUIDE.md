# Quick Usage Guide - Fixed Issues

## 🎯 Issue #4: Custom Student Fees (FIXED)

### Problem You Experienced
You added a student with monthly fee **4000** but vouchers were generated with **5000** (class default).

### How It's Fixed Now

#### Step-by-Step: Setting Custom Fees During Admission

1. **Start New Admission**
   - Navigate to Admission → New Admission Form

2. **Fill Student Information** (Step 1)
   - Enter all student details
   - Click "Next: Upload Documents"

3. **Upload Documents** (Step 2)
   - Upload required documents
   - Click "Next: Academic Details"

4. **Set Custom Fees** (Step 3)
   - Select Class → Default fees will appear in a **gray box**
   
   Example display:
   ```
   Class Default Fees:
   Admission: Rs. 5000    Monthly: Rs. 5000    Paper Fund: Rs. 500
   ```

5. **Enable Custom Fees**
   - Check the box: ☑️ **"Set Custom Fees for this Student"**
   - Fee input fields become editable

6. **Enter Your Custom Amounts**
   - Admission Fee: 4000 (or leave blank for default)
   - Monthly Fee: 4000 (your custom amount)
   - Paper Fund: (leave blank for default)
   - **Reason**: "Custom monthly fee agreed" (required!)

7. **Visual Confirmation**
   - Fields with custom amounts appear in **green** and **bold**
   - Fields left blank will use class defaults

8. **Continue & Submit**
   - Click "Next: Review & Submit"
   - Review all details
   - Click "Submit Admission"

9. **Result**
   - Student created ✅
   - Fee override saved ✅
   - Future vouchers will use Rs. 4000 monthly fee ✅

### Important Notes

**What gets saved:**
- Only fees that are DIFFERENT from class defaults
- `null` (blank) = use class default
- `0` = actually charge zero (free student)
- Any number = use that exact amount

**Example Override:**
```
Class Default:    Admission: 5000, Monthly: 5000, Paper: 500
You Enter:        Admission: (blank), Monthly: 4000, Paper: (blank)
What's Saved:     admission_fee: null, monthly_fee: 4000, paper_fund: null
Voucher Uses:     Admission: 5000, Monthly: 4000, Paper: 500
```

---

## 🖨️ Issue #3: Preview & Print Options (FIXED)

### New Feature 1: Preview Before Creating Vouchers

#### How to Preview Bulk Vouchers:

1. **Navigate to Fee Vouchers**
   - Go to Fee Management → Fee Vouchers

2. **Click "Generate Vouchers" Tab**

3. **Select Bulk Mode**
   - Choose "Bulk (Class/Section)" radio button

4. **Fill Generation Form**
   - Class: Select class
   - Section: Optional (blank = all sections)
   - Month: Select month
   - Year: Enter year
   - Due Date: Pick date
   - Fee Types: Check which fees to include

5. **Click "Preview Vouchers" Button** 👁️
   - A preview panel will appear below

6. **Review Preview**
   - Shows total students count
   - Shows total amount
   - Lists all students with their fees
   - Students with custom fees marked with ***** 

7. **Choose Action:**
   - **Cancel** → Close preview, no changes
   - **Print Without Saving** 🖨️ → PDF opens, no DB records
   - **Generate & Save** 💾 → Creates vouchers in database

### New Feature 2: Print Existing Vouchers

#### How to Print a Voucher:

1. **Go to Vouchers List**
   - Fee Management → Fee Vouchers → "Vouchers List" tab

2. **Find Your Voucher**
   - Use filters to narrow down
   - Or search by student name/roll number

3. **Click Print Icon** 🖨️
   - Located in the Actions column
   - Opens PDF in new browser tab
   - Browser print dialog appears automatically

4. **Print or Save**
   - Use Ctrl+P (Windows) or Cmd+P (Mac)
   - Or save from browser

**Difference from Download:**
- **Print** 🖨️ → Opens inline for immediate printing
- **Download** 📄 → Saves PDF file to computer

---

## 📋 Common Scenarios

### Scenario 1: Scholarship Student (50% off all fees)

**During Admission:**
1. Select class (defaults: 5000, 3000, 500)
2. Check "Set Custom Fees"
3. Enter:
   - Admission: 2500
   - Monthly: 1500
   - Paper: 250
4. Reason: "Merit scholarship - 50% discount"
5. Submit

**Result:** All vouchers use 50% amounts

---

### Scenario 2: Sibling Discount (Monthly only)

**During Admission:**
1. Select class (defaults: 5000, 3000, 500)
2. Check "Set Custom Fees"
3. Enter:
   - Admission: (blank)
   - Monthly: 2500
   - Paper: (blank)
4. Reason: "Sibling discount - Rs. 500 off monthly"
5. Submit

**Result:** 
- First voucher (admission): 5000 + 2500 + 500 = 8000
- Monthly vouchers: 2500 + 500 = 3000

---

### Scenario 3: Preview All February Vouchers

**Before Generating:**
1. Go to Generate Vouchers
2. Select Bulk mode
3. Class: Class 1
4. Month: February 2026
5. Click "Preview Vouchers" 👁️
6. Review list (shows who has custom fees)
7. Click "Print Without Saving" 🖨️ for principal's review
8. After approval, repeat and click "Generate & Save" 💾

---

## 🔍 Verification

### How to Check If Custom Fee Was Saved:

**Method 1: Generate a Voucher**
1. Go to Fee Vouchers → Generate
2. Select the student
3. Generate voucher
4. Check the amounts match your custom fee

**Method 2: Browser Console**
During admission, open Developer Tools (F12):
- Look for success message: "Fee override saved successfully"
- Or look for errors if it failed

### How to Check Preview Works:

1. Go to Generate Vouchers
2. Select Bulk mode and a class
3. Click "Preview Vouchers"
4. Should see:
   - Blue bordered preview panel
   - Student count
   - Fee details for each student
   - Asterisk (*) next to students with custom fees

---

## ⚠️ Important Rules

### Fee Override Rules:
- ✅ Works for FUTURE vouchers only
- ✅ Does NOT change existing vouchers
- ✅ One override per student per class
- ❌ Does NOT transfer when student promoted

### What Values Mean:
| Value | Meaning | Example |
|-------|---------|---------|
| Blank/null | Use class default | Blank → uses 5000 |
| 0 | Actually charge zero | 0 → Free admission |
| Number | Use that amount | 4000 → charge 4000 |

### Preview vs Generate:
| Action | Creates DB Records? | Use Case |
|--------|---------------------|----------|
| Preview | ❌ No | Review before deciding |
| Print Without Saving | ❌ No | Trial/approval/external use |
| Generate & Save | ✅ Yes | Normal voucher creation |

---

## 🐛 Troubleshooting

### Custom Fee Not Applied?

**Check:**
1. Was "Set Custom Fees" checkbox checked?
2. Was reason field filled?
3. Check browser console for errors
4. Are you viewing OLD vouchers? (try generating new one)

**Fix:**
- Re-admit the student OR
- Contact admin to set override manually

### Preview Not Showing?

**Check:**
1. Is class selected?
2. Are fee types checked?
3. Check browser console for errors
4. Is backend API running?

**Fix:**
- Reload page
- Check network connection
- Verify backend is running

### Print Opens Blank Page?

**Check:**
1. Popup blocker enabled?
2. Backend API accessible?
3. Browser console errors?

**Fix:**
- Allow popups for this site
- Check backend connection
- Try download instead

---

## 📞 Need Help?

If issues persist:

1. **Check Browser Console** (F12)
   - Look for red error messages
   - Share screenshot with developer

2. **Check Network Tab** (F12 → Network)
   - Look for failed API calls (red)
   - Check response messages

3. **Verify Backend**
   - Is the backend server running?
   - Test API endpoints directly

---

## ✅ Summary

**What's Fixed:**

1. ✅ Custom fees during admission now work
   - Enter 4000, get vouchers with 4000 ✅
   - Visual indicators show custom vs default
   - Reason tracking for audits

2. ✅ Preview before creating vouchers
   - See exactly what will be created
   - Spot check custom fees
   - Print for approval without commitment

3. ✅ Print existing vouchers
   - Quick print button
   - Opens inline for immediate printing
   - Download still available

**How to Use:**
- Set custom fees: Check box in admission form
- Preview vouchers: Click preview button in bulk generation
- Print voucher: Click print icon in voucher list

Everything is working now! 🎉

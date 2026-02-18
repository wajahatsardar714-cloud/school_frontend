# Quick Reference Card - Voucher System Fixes

## 🎯 Your Specific Issue - SOLVED ✅

### Problem You Had:
```
Actual Fee: 5000
Added with: 4000
Voucher shows: 5000 ❌ WRONG
```

### Now Fixed:
```
Actual Fee: 5000
Added with: 4000
Voucher shows: 4000 ✅ CORRECT
```

---

## 📋 How to Set Custom Fees (Issue #4)

### During New Admission:

1. **Basic Info** → Fill student details
2. **Documents** → Upload required docs
3. **Academic Info** → See this screen:

```
┌─────────────────────────────────────────┐
│ Class Default Fees:                     │
│ Admission: Rs. 5000  Monthly: Rs. 5000 │
│ Paper Fund: Rs. 500                     │
└─────────────────────────────────────────┘

☑️ Set Custom Fees for this Student

Admission Fee:  [  4000  ] ← green/bold
Monthly Fee:    [  4000  ] ← green/bold  
Paper Fund:     [   500  ] ← gray (default)

Reason: [Custom fee agreed] ← REQUIRED!
```

4. **Submit** → Custom fees saved automatically ✅

---

## 🖨️ How to Use Preview & Print (Issue #3)

### Option 1: Preview Before Creating

**When:** Generating bulk vouchers

**Steps:**
1. Fee Vouchers → Generate → Bulk mode
2. Select: Class, Month, Fee Types
3. Click: **"👁️ Preview Vouchers"**
4. See: List of all vouchers + totals
5. Choose:
   - 🖨️ **Print Without Saving** (trial)
   - 💾 **Generate & Save** (commit)
   - ❌ **Cancel** (go back)

### Option 2: Print Existing Voucher

**When:** Voucher already exists

**Steps:**
1. Fee Vouchers → List
2. Find voucher
3. Click: **🖨️** button
4. PDF opens in new tab
5. Press: Ctrl+P / Cmd+P to print

---

## 🔑 Key Differences

### Custom Fee Values:

| You Enter | What Happens |
|-----------|--------------|
| `4000` | Use 4000 (custom) ✅ |
| `Blank` | Use class default |
| `0` | Actually charge zero (free) |

### Preview vs Generate:

| Action | Saves to DB? | Use When |
|--------|--------------|----------|
| Preview | ❌ No | Want to review first |
| Print Without Save | ❌ No | Trial/approval needed |
| Generate & Save | ✅ Yes | Ready to commit |

### Print vs Download:

| Button | What Happens |
|--------|--------------|
| 🖨️ Print | Opens inline → Print dialog |
| 📄 Download | Saves file to computer |

---

## ⚡ Quick Examples

### Example 1: 50% Scholarship
```
Class Default: 5000
You Enter:     2500
Reason:        "50% scholarship"
Voucher:       2500 ✅
```

### Example 2: Sibling Discount
```
Class Default: Monthly 5000
You Enter:     Monthly 4500
Leave blank:   Admission, Paper (use defaults)
Reason:        "Sibling discount - Rs. 500"
Result:        Monthly vouchers use 4500 ✅
```

### Example 3: Free Admission
```
Class Default: Admission 5000
You Enter:     Admission 0
Reason:        "Admission waived"
Result:        First voucher free admission ✅
```

---

## ✅ Checklist

### Setting Custom Fee:
- [ ] Class selected (defaults show)
- [ ] "Set Custom Fees" checked
- [ ] Amount entered (or blank for default)
- [ ] Reason provided (required!)
- [ ] Submit successful
- [ ] Generate voucher to verify

### Using Preview:
- [ ] Bulk mode selected
- [ ] Class & month chosen
- [ ] Preview button clicked
- [ ] Review student list
- [ ] Check custom fee markers (*)
- [ ] Choose action (print/save/cancel)

### Printing Voucher:
- [ ] Find voucher in list
- [ ] Click print icon 🖨️
- [ ] PDF opens in new tab
- [ ] Print dialog appears
- [ ] Print or save

---

## 🐛 Troubleshooting

### Custom Fee Not Working?

**Check:**
1. ✅ Was "Set Custom Fees" checked?
2. ✅ Was reason filled?
3. ✅ Did submission succeed?
4. ✅ Are you viewing NEW voucher?

**Fix:** Re-admit student OR contact admin

### Preview Not Showing?

**Check:**
1. ✅ Class selected?
2. ✅ Backend running?
3. ✅ Console errors?

**Fix:** Reload page, check connection

### Print Opens Blank?

**Check:**
1. ✅ Popup allowed?
2. ✅ Backend accessible?

**Fix:** Allow popups, try download instead

---

## 📞 Quick Help

**Browser Console:**
- Windows: F12
- Mac: Cmd+Option+I

**Look for:**
- ✅ "Fee override saved successfully"
- ❌ Red error messages

**Common Errors:**
- "Failed to save fee override" → Backend issue
- "Preview failed" → API connection issue
- Blank PDF → Popup blocker

---

## 🎓 Remember

### Fee Override Rules:
- Only affects FUTURE vouchers
- Doesn't change OLD vouchers  
- One override per student per class
- Doesn't transfer on promotion

### Preview Benefits:
- Review before committing
- Spot check custom fees
- Get approval without saving
- Print trial copies

### Print Features:
- Quick access from list
- Opens inline for printing
- No download needed
- Download still available

---

## 📊 Visual Guide

### Admission Form Flow:
```
Select Class
    ↓
See Defaults (gray box)
    ↓
☑️ Enable Custom Fees
    ↓
Enter Amounts (green = custom)
    ↓
Enter Reason ← MUST FILL
    ↓
Submit
    ↓
Custom fees saved! ✅
```

### Preview Flow:
```
Fill Bulk Form
    ↓
Click "Preview" 👁️
    ↓
See Student List
    ↓
Choose Action:
  → Print (no save)
  → Save (create records)
  → Cancel (go back)
```

---

## 🚀 You're All Set!

**Issue #4:** Custom fees now work ✅
- Enter 4000 → Get 4000 vouchers

**Issue #3:** Preview & print available ✅
- Preview before creating
- Print without saving
- Direct print button

**Next Steps:**
1. Try adding a student with custom fees
2. Generate a voucher and verify amount
3. Try preview in bulk generation
4. Test print button on existing voucher

**Everything works!** 🎉

---

## 📝 Quick Commands

### Set Custom Monthly Fee:
```
1. New Admission → Academic Info
2. ☑️ Set Custom Fees
3. Monthly: 4000
4. Reason: "Your reason here"
5. Submit ✅
```

### Preview Bulk:
```
1. Fee Vouchers → Generate → Bulk
2. Select class + month
3. Click "Preview" 👁️
4. Review → Print/Save/Cancel
```

### Print Voucher:
```
1. Fee Vouchers → List
2. Find voucher
3. Click 🖨️
4. Print (Ctrl+P)
```

---

**That's it! Simple and straightforward.** 👍

**Need more details?** See:
- USAGE_GUIDE.md (detailed instructions)
- FIXES_IMPLEMENTED.md (technical docs)
- IMPLEMENTATION_SUMMARY.md (overview)

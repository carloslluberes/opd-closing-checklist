# OPD Closing Checklist

Daily duties checklist for Online Pickup & Delivery (OPD) associates to complete before end of shift.

## Purpose

This repository contains standardized closing procedures to ensure:
- All customer orders are properly handled
- Returns are processed correctly
- Work areas are clean and prepared for next shift
- Equipment and resources are secured

## Contents

### 🔥 Firebase Version (Centralized Tracking - Recommended)
- **`index-firebase.html`** - Firebase-integrated tracker with manager dashboard
- **`script-firebase.js`** - Firebase functionality
- **`firebase-config.js`** - Firebase configuration
- **`firestore.rules`** - Database security rules
- **`FIREBASE_SETUP.md`** - Complete setup instructions

### 💾 Local Version (Individual Tracking)
- `index.html` - Standalone tracker (no central database)
- `script.js` - Local storage functionality

### 📄 Documentation
- **`CLOSING_CHECKLIST.md`** - Complete checklist (Markdown)
- **`QUICK_REFERENCE.md`** - Quick reference guide
- `styles.css` - Shared styling for both versions

## 🔥 Firebase Version - Centralized Tracking (RECOMMENDED)

**Perfect for managers who need centralized visibility and reporting**

### Features
- 👤 **Associate View:**
  - Real-time progress tracking with visual progress bar
  - Auto-saves progress to Firebase
  - Date-stamped daily completion logs
  - Personal history view
  - Export individual data to CSV/JSON

- 📊 **Manager Dashboard:**
  - Real-time view of all associate submissions
  - Statistics: total submissions, completion rates, averages
  - Filter by date (today, week, month, all time)
  - See who's completed vs. in progress
  - Export all data for reporting
  - Track trends over time

### Quick Start

1. **Open:** `index-firebase.html`
2. **Associates:** Enter name → Complete checklist → Save to Firebase
3. **Managers:** Click "📊 Manager Dashboard" button
4. **Setup Required:** See `FIREBASE_SETUP.md` for one-time configuration

### Data Storage

- ✅ Centralized in Firebase (care-card-lite project)
- ✅ All associates' data visible to everyone
- ✅ Real-time synchronization
- ✅ Permanent record (cannot be deleted/modified)
- ✅ Internet required

---

## 💾 Local Version - Individual Tracking

**For associates who want private, offline tracking**

### Features
- ✅ Real-time progress tracking
- 💾 Saves to browser only (private)
- 📅 Personal completion history
- 📥 Export personal data
- 🔒 No data sharing
- 📴 Works offline

### How to Use

1. **Open:** `index.html`
2. **Complete checklist** and save
3. **Data stays on your device only**

## 📄 Markdown Version

For printing or offline reference, use:
- `CLOSING_CHECKLIST.md` - Full checklist with all details
- `QUICK_REFERENCE.md` - Quick guide for common scenarios

## Contributing

This is a private repository for team use. Contact the repository owner for access.

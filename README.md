# E‑Learning Platform — Frontend Only (HTML/CSS/JS)

This is a static, deployable **frontend-only** demo of an E‑Learning platform with gamification, built per your SRS. It uses **LocalStorage** to simulate a backend.

## Features
- Registration, Login (hashed in browser via SHA‑256), Logout
- Role‑based access: **Student**, **Faculty**, **Admin**
- Faculty: Course CRUD, Quiz CRUD, Quiz Builder
- Student: Attempt quiz, instant evaluation, feedback, points (+10 per correct), badges
- Leaderboard: Top Students by total points
- Dashboards for each role



## Quick Start
1. Unzip and open `index.html` in a modern browser, **or** host the folder on any static host (Netlify, Vercel, GitHub Pages).
2. Try these seeded accounts (set password on first login):
   - `admin@example.com` (admin)
   - `ada@example.com` (faculty)
   - `sam@example.com` (student)
3. Or register a new account (student/faculty).

## Project Structure
```
elearning-frontend/
  index.html
  assets/
    css/styles.css
    js/app.js
  README.md
```


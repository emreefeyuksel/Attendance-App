# ENGR 4451 Attendance (Static SPA)

A zero-backend attendance app that runs on GitHub Pages using localStorage.

- Instructor: username `Orkun Karabasoglu`, password `123456`
- Students: log in with student number (sample: `18070000013`, `19070001053`, `19070008012`)
- 6-digit code rotates every 30s; Excel export included.

## Run
Open `index.html` or deploy to GitHub Pages.

## Deploy to GitHub Pages
1. Create repo `Attendance-App` under your account.
2. Commit all files to the `main` branch.
3. In repo Settings → Pages, set Source to `Deploy from a branch`, Branch `main` (root).
4. Visit `https://<username>.github.io/Attendance-App/`.

## Notes
- The rotating code uses a shared seed saved in localStorage; instructor can rotate it from the panel. Students should refresh after seed rotation.
- No server/database is required.

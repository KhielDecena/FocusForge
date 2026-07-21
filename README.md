# FocusForge

FocusForge is a premium, distraction-resistant productivity web app designed to help users build focus, structure their day, and grow consistent habits with clarity and intention.

It combines a calm, modern interface with practical tools such as a focus timer, task management, habit tracking, progress analytics, and a personal dashboard—making it feel less like a generic to-do app and more like a digital companion for disciplined work.

## Why FocusForge?

FocusForge was created for people who want to:

- stay focused during deep work sessions
- organize priorities without clutter
- build habits that actually stick
- monitor progress through visual feedback and motivation
- keep their workspace calm, elegant, and productive

## Key Features

- Focus Mode with adjustable timer durations
- Ambient sound options for concentration
- Task management with categories and priority selection
- Habit tracking with recurring routines and streaks
- Progress dashboard with XP, levels, and achievements
- Statistics and calendar-based productivity insights
- Brain dump area for capturing ideas without losing momentum

## Tech Stack

FocusForge is built as a lightweight static web application using:

- HTML5
- CSS3
- Vanilla JavaScript

No build step is required, which makes the project simple to run, customize, and deploy.

## Project Structure

- [FocusForge/index.html](FocusForge/index.html) — main app entry point
- [FocusForge/assets/css](FocusForge/assets/css) — styling and visual design
- [FocusForge/assets/js](FocusForge/assets/js) — app logic and interactions
- [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) — GitHub Pages deployment workflow

## Getting Started

### Run locally

1. Clone the repository.
2. Open [FocusForge/index.html](FocusForge/index.html) in your browser, or serve the project with a simple local server.
3. For example, from the repository root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/FocusForge/
```

### Deployment

The project is configured to publish the [FocusForge](FocusForge) folder to GitHub Pages using the workflow in [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml).

## Install as a desktop app (PWA)

FocusForge now supports Progressive Web App (PWA) installation. This allows the web app to be installed on desktop and mobile and run in a standalone window just like a native app.

How to install:

- Serve the project (or deploy to GitHub Pages) and open the app URL in a modern browser (Chrome, Edge, or Brave recommended).
- On desktop in Chrome/Edge you should see an install icon in the address bar or in the browser menu. Choose "Install" to add FocusForge to your applications.
- Alternatively, use the "Install App" button in the app's sidebar if the browser supports the beforeinstallprompt flow.

Notes:
- The app includes a small service worker for offline loading and faster repeat visits.
- To update the installed app, redeploy — the service worker will refresh cached assets when the site activates a new version.

## Package as a native desktop app (optional)

If a native installer is preferred (Windows/macOS/Linux), FocusForge can be packaged using Electron or Tauri. Recommended steps (Electron):

1. Create a simple Electron wrapper that loads the local production build or remote URL.
2. Add packaging tools like electron-builder to produce installers for each platform.

If you want, I can add an Electron scaffold and packaging configuration next — tell me which platform(s) you want to target and I will create the necessary files.

## Design Philosophy

FocusForge emphasizes:

- clarity over complexity
- calm visuals over visual noise
- consistency over perfection
- meaningful progress over constant stimulation

## License

This project is available for personal and educational use. If you plan to use it commercially, please review the licensing terms of any third-party assets included in the project.

## Acknowledgment

Built as a modern, elegant productivity experience for focused work and intentional habit-building.

# Exercise Tracker

A modern web application for tracking workout sessions, exercises, and sets. Built with React, TypeScript, Vite, and Firebase.

## Features

- **User Authentication**: Secure email/password login and registration via Firebase Auth.
- **Workout Tracking**: Create and manage workout sessions.
- **Exercise Management**: detailed logging of exercises and sets.
- **Real-time Data**: Syncs data across devices using Cloud Firestore.
- **Modern UI**: Clean and responsive interface.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **State Management**: Zustand, React Query
- **Backend/BaaS**: Firebase (Auth, Firestore)
- **Styling**: Standard CSS (Custom Design System)
- **Routing**: React Router v7

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aman12122/exercise-tracker.git
   cd exercise-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Environment Variables:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration keys in `.env`

4. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/features`: Logic divided by domain (e.g., exercises, workouts).
- `src/pages`: Application views/routes.
- `src/components`: Reusable UI components.
- `src/services`: Firebase and API service layers.
- `src/store`: Global state management.

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

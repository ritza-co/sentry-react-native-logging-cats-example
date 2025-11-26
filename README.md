# sentry-react-native-logging-cats-example

A React Native cat voting app demonstrating Sentry's logging capabilities with a full-stack implementation.

**Stack:**
- **Frontend:** React Native (Expo), React Navigation, Sentry SDK
- **Backend:** Node.js, Express, SQLite

## Quick Start

Create a React Native project in Sentry and make a note of your DSN.

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
npm install
```

2. Start the backend server:

```bash
npm start
```

The server runs on `http://localhost:3000`.

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
npm install
```

2. Create `.env.local` and add your Sentry DSN:

```
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
EXPO_PUBLIC_API_URL=http://localhost:3000
```

3. Update `project` and `organization` under plugins in `app.json` with the details of your project in Sentry.

4. Start the app:

```bash
npm start
```

Then press `i` for iOS, `a` for Android, or `w` for web.

# EMR Appointment System

A full-stack Electronic Medical Record (EMR) Appointment System built using the MERN stack. The project is designed to support secure user authentication, role-based access, doctor scheduling, and patient appointment management.

## 1. Features

- User authentication using JSON Web Tokens (JWT).
- Role-based access for Super Admin, Receptionist, Doctor, and Patient.
- Appointment creation and status management.
- Doctor schedules and availability management.
- MongoDB database integration using Mongoose.
- Input validation using Zod.
- Password hashing using bcryptjs.
- Security middleware using Helmet and Express Rate Limit.
- Cookie handling using cookie-parser.
- Socket.IO integration for real-time communication.

*Note: Features should be described as complete only after they have been implemented and tested.*

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Password hashing | bcryptjs |
| Input validation | Zod |
| Security | Helmet, Express Rate Limit |
| Real-time communication | Socket.IO |
| Version control | Git |

## 3. Project Structure

```text
emr-appointment-system/
├── backend/
│   ├── models/
│   ├── middlewares/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   ├── package.json
│   └── .env
├── README.md
├── ENGINEERING_DECISIONS.md
├── API_DOCUMENTATION.md
└── DATABASE_SCHEMA.md
```

The folders shown inside `backend/` and `frontend/` represent the expected structure; the exact contents may vary with the implementation.

## 4. Prerequisites

Before running the project, install:

- Node.js and npm
- MongoDB locally or a MongoDB Atlas database
- Git
- Visual Studio Code or another code editor

## 5. Installation and Setup

### Step 1: Clone the repository

```bash
git clone <YOUR_GIT_REPOSITORY_URL>
cd emr-appointment-system
```

Replace `<YOUR_GIT_REPOSITORY_URL>` with your actual Git repository URL.

### Step 2: Install backend dependencies

```bash
cd backend
npm install
```

### Step 3: Configure backend environment variables

Create a `.env` file inside the `backend/` directory. Add the variable names required by your backend configuration.

For example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
CLIENT_URL=http://localhost:5173
```

**Important:** These names must match the variables referenced in your actual backend code. Replace the example values with your own configuration. Never commit real secrets, database credentials, or production tokens to Git.

### Step 4: Start the backend

From the `backend/` directory, run:

For normal startup:

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

The backend entry point is `server.js`. The backend is expected to run on port `5000` when configured accordingly.

### Step 5: Install frontend dependencies

Open a second terminal in the project root and run:

```bash
cd frontend
npm install
```

### Step 6: Configure the frontend API URL

If your frontend uses the `VITE_API_URL` environment variable, create a `.env` file inside `frontend/`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Make sure this URL matches the API base path configured by your backend.

### Step 7: Start the frontend

From the `frontend/` directory, run:

```bash
npm run dev
```

Open the local URL displayed in the terminal. With a default Vite configuration, this is commonly:

`http://localhost:5173`

## 6. Authentication and Authorization

The backend includes JWT-based authentication and role-based authorization middleware.

- Access tokens are used to authenticate protected API requests.
- Authentication middleware validates access tokens.
- Authorization middleware checks the user's role before granting access to restricted operations.
- Passwords should be hashed before being stored in the database.
- Refresh tokens are stored as hashes and have expiration information.
- Environment variables are used for secrets and application configuration.

## 7. Database

MongoDB is used as the database, with Mongoose schemas for validation and data modeling.

The currently documented models include:

- **User:** User details, email, phone, password, role, and account status.
- **Appointment:** Patient, doctor, appointment date, reason, status, and notes.
- **Schedule:** Doctor working days, sessions, breaks, and slot duration.
- **DoctorSchedule:** Doctor availability by day and time.
- **RefreshToken:** Hashed refresh tokens and expiration information.

For more details, see [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

## 8. API Documentation

The API documentation will describe the implemented endpoints, HTTP methods, authentication requirements, request bodies, and response formats.

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

## 9. Engineering Decisions

The project's architecture, data modeling, security approach, and design trade-offs are documented in [ENGINEERING_DECISIONS.md](ENGINEERING_DECISIONS.md).

## 10. Testing

Test the application workflows that are implemented in the project, including:

- User login and authentication.
- Role-based access restrictions.
- Appointment creation and status changes.
- Doctor schedule management.
- Validation and error handling.
- Unauthorized and expired-token requests.

Document which tests have actually been executed and their results.

## 11. Deployment

The frontend and backend can be deployed separately.

For deployment:

1. Deploy the frontend to a supported hosting platform.
2. Deploy the backend to a Node.js-compatible hosting platform.
3. Configure the production MongoDB connection.
4. Set the required environment variables on the hosting platform.
5. Configure CORS to permit the deployed frontend origin.
6. Set the frontend API URL to the deployed backend API.
7. Verify authentication, appointments, scheduling, and any real-time functionality in the deployed environment.

Add the deployed application URL here after successful deployment.

**Live Application URL:** Not yet provided.

## 12. Repository

**Git Repository:** Add your Git repository URL here.

## 13. Author

Add your name and relevant project or assessment details here.

## 14. License

This project currently uses the license specified in `backend/package.json`. Confirm the intended project-wide license before distributing the repository.


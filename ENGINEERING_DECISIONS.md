# Engineering Decisions

## 1. Technology Stack

- **Frontend:** React with Vite.
- **Backend:** Node.js and Express.js.
- **Database:** MongoDB with Mongoose for schema definition and data access.
- **Authentication:** JSON Web Tokens (JWT).
- **Real-time communication:** Socket.IO is configured in the backend.

## 2. Data Modeling

Mongoose schemas define the structure and validation rules for application data.

- `User` stores user details, login credentials, roles, and account status.
- `Appointment` stores patient and doctor references, appointment date, reason, status, and notes.
- `Schedule` stores doctors' working days, sessions, breaks, and appointment slot duration.
- `DoctorSchedule` stores individual doctor availability by day and time.
- `RefreshToken` stores hashed refresh tokens and expiration information.

Patient and doctor references point to `User` documents, with the user's role distinguishing the account type.

## 3. Authentication and Authorization

- JWT access tokens authenticate API requests.
- Authentication middleware validates access tokens and attaches the authenticated user's ID and role to the request.
- Role-based authorization restricts protected operations to permitted user roles.
- Passwords are excluded from normal user queries.
- Refresh tokens are stored as hashes, and expired token records can be removed using MongoDB's TTL index.

## 4. Validation and Error Handling

- Mongoose schema rules validate required fields, permitted values, and field formats.
- Appointment statuses and user roles use enumerated values.
- API middleware returns appropriate HTTP status codes for authentication and authorization failures.
- Server-side validation remains necessary even when the frontend validates user input.

## 5. Database Performance

- Appointment indexes support queries by patient and appointment date, and by doctor and appointment date.
- Schedule indexes support filtering by doctor and active status.
- A unique index prevents duplicate doctor schedules with identical day and time ranges.

## 6. Configuration and Security

- Environment variables are used for secrets and environment-specific configuration.
- JWT secrets must not be committed to version control.
- CORS should be configured for the intended frontend origin in production.
- Passwords should be hashed before storage and verified securely during login.

## 7. Limitations and Future Improvements

- Add automated tests for authentication, authorization, scheduling, and appointment workflows.
- Verify appointment-slot conflict prevention and concurrent booking behavior.
- Review audit logging and implement it where required.
- Validate real-time notification permissions and delivery behavior.
- Add production deployment instructions and monitoring.


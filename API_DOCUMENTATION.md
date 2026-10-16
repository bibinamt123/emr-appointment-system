# API Documentation — EMR Appointment System

## 1. Overview

The EMR Appointment System provides backend APIs for authentication, appointment management, doctor schedules, and appointment-slot operations.

**Backend:** Node.js and Express.js  
**Database:** MongoDB with Mongoose  
**Authentication:** JSON Web Tokens (JWT)

## 2. Base URL

Local development:

```text
http://localhost:5000/api/v1
```

The exact base URL and route paths must match the Express configuration in `backend/server.js` and the route files.

## 3. Authentication

Protected endpoints require a valid access token.

Include the token in the HTTP request header:

```http
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

The backend validates the token and checks the user's role where required.

Do not share access tokens, refresh tokens, or secret keys in documentation.

## 4. Authentication APIs

Authentication routes are defined in `backend/routes/authRoutes.js`.

| Operation | HTTP method | Endpoint |
|---|---|---|
| Register or create an account | To be verified | To be verified |
| Log in | To be verified | To be verified |
| Refresh an access token | To be verified | To be verified |
| Log out | To be verified | To be verified |

The exact operations, endpoint paths, request fields, and response formats must be confirmed from the route and controller implementations.

## 5. Appointment APIs

Appointment routes are defined in `backend/routes/appointmentRoutes.js`.

| Operation | HTTP method | Endpoint |
|---|---|---|
| Create an appointment | To be verified | To be verified |
| Retrieve appointments | To be verified | To be verified |
| Retrieve an appointment by ID | To be verified | To be verified |
| Update appointment details or status | To be verified | To be verified |
| Cancel an appointment | To be verified | To be verified |

Appointment records include references to a patient and doctor, an appointment date, a reason, a status, and optional notes.

Supported appointment statuses in the data model:

- `PENDING`
- `CONFIRMED`
- `ARRIVED`
- `COMPLETED`
- `CANCELLED`

The exact operations and role permissions must be verified against the implemented routes.

## 6. Doctor Schedule APIs

Doctor schedule routes are defined in `backend/routes/doctorScheduleRoutes.js`.

| Operation | HTTP method | Endpoint |
|---|---|---|
| Create a doctor schedule | To be verified | To be verified |
| Retrieve doctor schedules | To be verified | To be verified |
| Update a doctor schedule | To be verified | To be verified |
| Delete or deactivate a schedule | To be verified | To be verified |

The doctor schedule data model supports a doctor reference, day of the week, start time, end time, slot duration, and active status.

## 7. Schedule APIs

General schedule routes are defined in `backend/routes/scheduleRoutes.js`.

| Operation | HTTP method | Endpoint |
|---|---|---|
| Create a schedule | To be verified | To be verified |
| Retrieve schedules | To be verified | To be verified |
| Update a schedule | To be verified | To be verified |
| Deactivate a schedule | To be verified | To be verified |

The schedule model supports working days, sessions, breaks, department, slot duration, and active status.

## 8. Appointment Slot APIs

Slot-related routes are defined in `backend/routes/slotRoutes.js`.

| Operation | HTTP method | Endpoint |
|---|---|---|
| Retrieve available appointment slots | To be verified | To be verified |
| Retrieve slots for a doctor and date | To be verified | To be verified |

The exact slot query parameters, availability rules, and response format must be confirmed from the implementation.

## 9. Common HTTP Status Codes

The following status codes may be used depending on the implemented endpoint:

| Status | Meaning |
|---|---|
| `200 OK` | Request completed successfully |
| `201 Created` | Resource created successfully |
| `400 Bad Request` | Invalid request data |
| `401 Unauthorized` | Authentication is missing or invalid |
| `403 Forbidden` | User does not have permission |
| `404 Not Found` | Resource or endpoint was not found |
| `409 Conflict` | Request conflicts with existing data |
| `500 Internal Server Error` | Unexpected server error |

Confirm the actual status codes returned by each endpoint before submission.

## 10. Error Response Format

The authentication middleware returns errors in this format for missing, invalid, or expired access tokens:

```json
{
  "success": false,
  "message": "Invalid or expired access token"
}
```

For other endpoints, the error response structure may differ depending on the route or error-handling middleware.

## 11. Security

- Use access tokens for protected API requests.
- Enforce role-based authorization for restricted operations.
- Validate request data on the server.
- Hash passwords before storing them.
- Keep secrets and database credentials in environment variables.
- Use HTTPS in production.
- Restrict CORS to trusted frontend origins in production.

## 12. Testing

Test each implemented endpoint using an API client such as Postman or curl.

Verify:

- Successful and unsuccessful login attempts.
- Requests with missing, invalid, and expired tokens.
- Role-based access restrictions.
- Appointment creation and status updates.
- Doctor schedule creation and retrieval.
- Appointment-slot availability.
- Invalid request data and missing resources.

Record the actual endpoint, request body, response body, and status code for each tested operation.


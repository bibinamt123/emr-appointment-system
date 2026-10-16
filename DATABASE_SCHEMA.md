
# EMR Appointment System — Database Schema

## Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ APPOINTMENT : patient
    USER ||--o{ APPOINTMENT : doctor
    USER ||--o{ SCHEDULE : configures
    USER ||--o{ DOCTOR_SCHEDULE : has
    USER ||--o{ REFRESH_TOKEN : owns

    USER {
        ObjectId _id PK
        string name
        string email UK
        string phone
        string specialisation
        string password
        string role
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    APPOINTMENT {
        ObjectId _id PK
        ObjectId patient FK
        ObjectId doctor FK
        datetime appointmentDate
        string reason
        string status
        string notes
        datetime createdAt
        datetime updatedAt
    }

    SCHEDULE {
        ObjectId _id PK
        ObjectId doctor FK
        string department
        string[] workingDays
        array sessions
        number slotDuration
        boolean isActive
    }

    DOCTOR_SCHEDULE {
        ObjectId _id PK
        ObjectId doctor FK
        string dayOfWeek
        string startTime
        string endTime
        number slotDuration
        boolean isActive
    }

    REFRESH_TOKEN {
        ObjectId _id PK
        ObjectId user FK
        string tokenHash UK
        datetime expiresAt
    }
```

## Collections

### 1. User
Stores account information for Super Admins, Receptionists, Doctors, and Patients.

- name
- email (unique)
- phone
- specialisation (required for doctors)
- password (excluded from query results by default)
- role
- isActive
- createdAt, updatedAt

### 2. Appointment
Stores appointment bookings and their status.

- patient — reference to User
- doctor — reference to User
- appointmentDate
- reason
- status: PENDING, CONFIRMED, ARRIVED, COMPLETED, CANCELLED
- notes
- createdAt, updatedAt

### 3. Schedule
Stores doctor working days, sessions, break timings, department, and slot duration.

### 4. DoctorSchedule
Stores a doctor's schedule by weekday and time range.

### 5. RefreshToken
Stores hashed refresh tokens, user references, and expiry dates.

## Indexes

- User: unique email index.
- Appointment: patient + appointmentDate.
- Appointment: doctor + appointmentDate.
- Schedule: doctor + isActive.
- DoctorSchedule: unique doctor + dayOfWeek + startTime + endTime.
- RefreshToken: unique tokenHash and user index.
- RefreshToken: TTL index on expiresAt for expired token cleanup.

## Design Notes

- Appointment patient and doctor references point to User documents.
- Schedule and DoctorSchedule currently overlap in purpose; confirm whether both are required.
- Appointment indexes support date-based queries but do not, by themselves, prevent simultaneous double bookings.
- Verify Patient.js, Doctor.js, and AuditLog.js before documenting additional collections.


import { useCallback, useEffect, useState } from "react";
import "./SuperAdmin.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DEFAULT_SESSION = {
  startTime: "09:00",
  endTime: "17:00",
  breakStart: "13:00",
  breakEnd: "14:00",
};

export default function SuperAdmin({
  user,
  token,
  appointments = [],
  loading,
  loadAppointments,
  formatDate,
}) {
  // --------------------------------------------------
  // Staff account form state
  // --------------------------------------------------
  const [staffRole, setStaffRole] = useState("DOCTOR");
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffSpecialisation, setStaffSpecialisation] = useState("");

  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffMessage, setStaffMessage] = useState("");
  const [staffMessageType, setStaffMessageType] = useState("");

  // --------------------------------------------------
  // Staff directory state
  // --------------------------------------------------
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");

  // --------------------------------------------------
  // Doctor schedule state
  // --------------------------------------------------
  const [scheduleDoctorId, setScheduleDoctorId] = useState("");
  const [workingDays, setWorkingDays] = useState([]);
  const [sessions, setSessions] = useState([
    { ...DEFAULT_SESSION },
  ]);
  const [slotDuration, setSlotDuration] = useState("30");
  const [department, setDepartment] = useState("");

  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [scheduleMessageType, setScheduleMessageType] = useState("");

  // --------------------------------------------------
  // Appointment statistics
  // --------------------------------------------------
  const pendingCount = appointments.filter(
    (appointment) => appointment.status === "PENDING"
  ).length;

  const confirmedCount = appointments.filter(
    (appointment) => appointment.status === "CONFIRMED"
  ).length;

  const arrivedCount = appointments.filter(
    (appointment) => appointment.status === "ARRIVED"
  ).length;

  const activeDoctors = staffList.filter(
    (staff) =>
      staff.role === "DOCTOR" && staff.isActive !== false
  );

  // --------------------------------------------------
  // Load doctors and receptionists
  // --------------------------------------------------
  const loadStaff = useCallback(async () => {
    if (!token) {
      setStaffList([]);
      setStaffError("Please sign in again to view staff details.");
      return;
    }

    setStaffLoading(true);
    setStaffError("");

    try {
      const response = await fetch(`${API_URL}/auth/staff`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Could not load staff details."
        );
      }

      setStaffList(Array.isArray(data.staff) ? data.staff : []);
    } catch (error) {
      setStaffError(
        error.message || "Failed to load staff details."
      );
    } finally {
      setStaffLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // --------------------------------------------------
  // Staff account creation
  // --------------------------------------------------
  function handleRoleChange(role) {
    setStaffRole(role);
    setStaffMessage("");
    setStaffMessageType("");
  }

  async function handleCreateStaff(event) {
    event.preventDefault();

    setStaffMessage("");
    setStaffMessageType("");

    if (!token) {
      setStaffMessage(
        "Your session has expired. Please sign in again."
      );
      setStaffMessageType("error");
      return;
    }

    if (staffRole === "DOCTOR" && !staffSpecialisation.trim()) {
      setStaffMessage(
        "Please enter the doctor's specialisation."
      );
      setStaffMessageType("error");
      return;
    }

    setCreatingStaff(true);

    try {
      const staffData = {
        name: staffName.trim(),
        email: staffEmail.trim().toLowerCase(),
        phone: staffPhone.trim(),
        password: staffPassword,
        role: staffRole,
      };

      if (staffRole === "DOCTOR") {
        staffData.specialisation = staffSpecialisation.trim();
      }

      const response = await fetch(
        `${API_URL}/auth/create-staff`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(staffData),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Could not create the staff account."
        );
      }

      setStaffMessage(
        `${
          staffRole === "DOCTOR" ? "Doctor" : "Receptionist"
        } account created successfully.`
      );
      setStaffMessageType("success");

      setStaffName("");
      setStaffEmail("");
      setStaffPhone("");
      setStaffPassword("");
      setStaffSpecialisation("");

      await loadStaff();
    } catch (error) {
      setStaffMessage(
        error.message || "Something went wrong."
      );
      setStaffMessageType("error");
    } finally {
      setCreatingStaff(false);
    }
  }

  // --------------------------------------------------
  // Load a doctor's existing schedule
  // --------------------------------------------------
  async function handleScheduleDoctorChange(doctorId) {
    setScheduleDoctorId(doctorId);
    setScheduleMessage("");
    setScheduleMessageType("");

    setWorkingDays([]);
    setSessions([{ ...DEFAULT_SESSION }]);
    setSlotDuration("30");
    setDepartment("");

    if (!doctorId) {
      return;
    }

    if (!token) {
      setScheduleMessage("Please sign in again.");
      setScheduleMessageType("error");
      return;
    }

    setScheduleLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/schedules/${doctorId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 404) {
        setScheduleMessage(
          "No saved schedule found. Enter the doctor's working hours below."
        );
        setScheduleMessageType("info");
        return;
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Unable to load the doctor's schedule."
        );
      }

      const schedule = data.schedule;

      setWorkingDays(schedule.workingDays || []);

      setSessions(
        schedule.sessions?.length
          ? schedule.sessions.map((session) => ({
              startTime: session.startTime || "",
              endTime: session.endTime || "",
              breakStart: session.breakStart || "",
              breakEnd: session.breakEnd || "",
            }))
          : [{ ...DEFAULT_SESSION }]
      );

      setSlotDuration(String(schedule.slotDuration || 30));
      setDepartment(schedule.department || "");

      setScheduleMessage(
        "Existing schedule loaded. You can edit it below."
      );
      setScheduleMessageType("success");
    } catch (error) {
      setScheduleMessage(
        error.message || "Unable to load schedule."
      );
      setScheduleMessageType("error");
    } finally {
      setScheduleLoading(false);
    }
  }

  // --------------------------------------------------
  // Working day selection
  // --------------------------------------------------
  function toggleWorkingDay(day) {
    setWorkingDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((item) => item !== day)
        : [...currentDays, day]
    );
  }

  // --------------------------------------------------
  // Edit schedule sessions
  // --------------------------------------------------
  function updateSession(index, field, value) {
    setSessions((currentSessions) =>
      currentSessions.map((session, sessionIndex) =>
        sessionIndex === index
          ? { ...session, [field]: value }
          : session
      )
    );
  }

  function addSession() {
    setSessions((currentSessions) => [
      ...currentSessions,
      {
        startTime: "17:00",
        endTime: "18:00",
        breakStart: "",
        breakEnd: "",
      },
    ]);
  }

  function removeSession(index) {
    setSessions((currentSessions) =>
      currentSessions.filter(
        (_, sessionIndex) => sessionIndex !== index
      )
    );
  }

  // --------------------------------------------------
  // Save doctor schedule
  // --------------------------------------------------
  async function handleSaveSchedule(event) {
    event.preventDefault();

    setScheduleMessage("");
    setScheduleMessageType("");

    if (!token) {
      setScheduleMessage("Please sign in again.");
      setScheduleMessageType("error");
      return;
    }

    if (!scheduleDoctorId) {
      setScheduleMessage("Please select a doctor.");
      setScheduleMessageType("error");
      return;
    }

    if (workingDays.length === 0) {
      setScheduleMessage("Select at least one working day.");
      setScheduleMessageType("error");
      return;
    }

    if (sessions.length === 0) {
      setScheduleMessage("Add at least one working session.");
      setScheduleMessageType("error");
      return;
    }

    const toMinutes = (time) => {
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time || "")) {
        return NaN;
      }

      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    for (const session of sessions) {
      const start = toMinutes(session.startTime);
      const end = toMinutes(session.endTime);

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start >= end
      ) {
        setScheduleMessage(
          "Every session must have a valid start time before its end time."
        );
        setScheduleMessageType("error");
        return;
      }

      const hasBreakStart = Boolean(session.breakStart);
      const hasBreakEnd = Boolean(session.breakEnd);

      if (hasBreakStart !== hasBreakEnd) {
        setScheduleMessage(
          "Enter both break times, or leave both fields empty."
        );
        setScheduleMessageType("error");
        return;
      }

      if (hasBreakStart && hasBreakEnd) {
        const breakStart = toMinutes(session.breakStart);
        const breakEnd = toMinutes(session.breakEnd);

        if (
          !Number.isFinite(breakStart) ||
          !Number.isFinite(breakEnd) ||
          breakStart >= breakEnd ||
          breakStart < start ||
          breakEnd > end
        ) {
          setScheduleMessage(
            "Break times must be valid and within the working session."
          );
          setScheduleMessageType("error");
          return;
        }
      }
    }

    const sortedSessions = [...sessions].sort(
      (a, b) =>
        toMinutes(a.startTime) - toMinutes(b.startTime)
    );

    for (let index = 1; index < sortedSessions.length; index++) {
      if (
        toMinutes(sortedSessions[index].startTime) <
        toMinutes(sortedSessions[index - 1].endTime)
      ) {
        setScheduleMessage(
          "Working sessions must not overlap."
        );
        setScheduleMessageType("error");
        return;
      }
    }

    const duration = Number(slotDuration);

    if (
      !Number.isInteger(duration) ||
      duration <= 0 ||
      duration > 240
    ) {
      setScheduleMessage(
        "Enter a valid appointment duration between 1 and 240 minutes."
      );
      setScheduleMessageType("error");
      return;
    }

    setScheduleSaving(true);

    try {
      const response = await fetch(`${API_URL}/schedules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: scheduleDoctorId,
          department: department.trim(),
          workingDays,
          sessions: sessions.map((session) => ({
            startTime: session.startTime,
            endTime: session.endTime,
            breakStart: session.breakStart || "",
            breakEnd: session.breakEnd || "",
          })),
          slotDuration: duration,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Unable to save the schedule."
        );
      }

      setScheduleMessage(
        data.message || "Doctor schedule saved successfully."
      );
      setScheduleMessageType("success");
    } catch (error) {
      setScheduleMessage(
        error.message || "Failed to save schedule."
      );
      setScheduleMessageType("error");
    } finally {
      setScheduleSaving(false);
    }
  }

  // --------------------------------------------------
  // Dashboard UI
  // --------------------------------------------------
  return (
    <section className="super-admin">
      {/* Dashboard heading */}
      <div className="super-admin-heading">
        <div>
          <p className="eyebrow">SYSTEM ADMINISTRATION</p>
          <h2>Super Admin Dashboard</h2>
          <p>
            Welcome, {user?.name || "System Administrator"}.
            Manage staff and oversee clinic operations.
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadAppointments}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Appointment statistics */}
      <div className="super-admin-stats">
        <article className="admin-stat">
          <span>Total Appointments</span>
          <strong>{appointments.length}</strong>
        </article>

        <article className="admin-stat">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </article>

        <article className="admin-stat">
          <span>Confirmed</span>
          <strong>{confirmedCount}</strong>
        </article>

        <article className="admin-stat">
          <span>Patient Arrivals</span>
          <strong>{arrivedCount}</strong>
        </article>
      </div>

      {/* Create doctor or receptionist accounts */}
      <section className="panel">
        <h2>Staff Management</h2>

        <p className="panel-description">
          Create secure login accounts for doctors and receptionists.
        </p>

        <div className="staff-role-buttons">
          <button
            type="button"
            className={staffRole === "DOCTOR" ? "active" : ""}
            onClick={() => handleRoleChange("DOCTOR")}
            aria-pressed={staffRole === "DOCTOR"}
          >
            Create Doctor
          </button>

          <button
            type="button"
            className={
              staffRole === "RECEPTIONIST" ? "active" : ""
            }
            onClick={() => handleRoleChange("RECEPTIONIST")}
            aria-pressed={staffRole === "RECEPTIONIST"}
          >
            Create Receptionist
          </button>
        </div>

        <form className="staff-form" onSubmit={handleCreateStaff}>
          <h3>
            {staffRole === "DOCTOR"
              ? "New Doctor Account"
              : "New Receptionist Account"}
          </h3>

          <div className="staff-form-field">
            <label htmlFor="staff-name">Full Name</label>
            <input
              id="staff-name"
              type="text"
              value={staffName}
              onChange={(event) => setStaffName(event.target.value)}
              placeholder="Enter full name"
              required
              maxLength={100}
              autoComplete="name"
            />
          </div>

          <div className="staff-form-field">
            <label htmlFor="staff-email">Email Address</label>
            <input
              id="staff-email"
              type="email"
              value={staffEmail}
              onChange={(event) => setStaffEmail(event.target.value)}
              placeholder="Enter email address"
              required
              autoComplete="email"
            />
          </div>

          <div className="staff-form-field">
            <label htmlFor="staff-phone">Phone Number</label>
            <input
              id="staff-phone"
              type="tel"
              value={staffPhone}
              onChange={(event) => setStaffPhone(event.target.value)}
              placeholder="Enter phone number"
              required
              maxLength={20}
              autoComplete="tel"
            />
          </div>

          {staffRole === "DOCTOR" && (
            <div className="staff-form-field">
              <label htmlFor="staff-specialisation">
                Doctor Specialisation
              </label>

              <select
                id="staff-specialisation"
                value={staffSpecialisation}
                onChange={(event) =>
                  setStaffSpecialisation(event.target.value)
                }
                required
              >
                <option value="">Select specialisation</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Dentistry">Dentistry</option>
                <option value="ENT">ENT</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className="staff-form-field">
            <label htmlFor="staff-password">
              Temporary Password
            </label>

            <input
              id="staff-password"
              type="password"
              value={staffPassword}
              onChange={(event) =>
                setStaffPassword(event.target.value)
              }
              placeholder="Create a temporary password"
              minLength={8}
              required
              autoComplete="new-password"
            />

            <small>
              Password must contain at least 8 characters.
            </small>
          </div>

          {staffMessage && (
            <p
              className={`staff-message ${
                staffMessageType === "error"
                  ? "staff-message-error"
                  : "staff-message-success"
              }`}
              role="status"
              aria-live="polite"
            >
              {staffMessage}
            </p>
          )}

          <button
            type="submit"
            className="staff-submit-button"
            disabled={creatingStaff}
          >
            {creatingStaff
              ? "Creating Account..."
              : staffRole === "DOCTOR"
                ? "Create Doctor Account"
                : "Create Receptionist Account"}
          </button>
        </form>
      </section>

      {/* Staff directory */}
      <section className="panel">
        <div className="super-admin-heading">
          <div>
            <h2>Staff Directory</h2>
            <p className="panel-description">
              View registered doctors and receptionists.
            </p>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={loadStaff}
            disabled={staffLoading}
          >
            {staffLoading ? "Loading..." : "Refresh Staff"}
          </button>
        </div>

        {!staffLoading && staffError && (
          <div>
            <p
              className="staff-message staff-message-error"
              role="alert"
            >
              {staffError}
            </p>

            <button
              type="button"
              className="refresh-button"
              onClick={loadStaff}
            >
              Try Again
            </button>
          </div>
        )}

        {staffLoading ? (
          <p>Loading staff details...</p>
        ) : !staffError && staffList.length === 0 ? (
          <p>No doctors or receptionists found.</p>
        ) : !staffError ? (
          <>
            <p className="panel-description">
              Total staff members: {staffList.length}
            </p>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Specialisation</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff._id}>
                      <td>{staff.name || "—"}</td>
                      <td>{staff.email || "—"}</td>
                      <td>{staff.phone || "—"}</td>
                      <td>
                        {staff.role === "DOCTOR"
                          ? "Doctor"
                          : staff.role === "RECEPTIONIST"
                            ? "Receptionist"
                            : staff.role || "—"}
                      </td>
                      <td>
                        {staff.role === "DOCTOR"
                          ? staff.specialisation || "—"
                          : "—"}
                      </td>
                      <td>
                        <span className="admin-status">
                          {staff.isActive === false
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      {/* Manage doctor schedules */}
      <section className="panel">
        <h2>Manage Doctor Schedules</h2>

        <p className="panel-description">
          Set doctors' working days, working sessions, breaks, and
          appointment duration. Select a doctor to load an existing
          schedule or configure a new one.
        </p>

        <form
          className="staff-form"
          onSubmit={handleSaveSchedule}
        >
          <div className="staff-form-field">
            <label htmlFor="schedule-doctor">
              Select Doctor
            </label>

            <select
              id="schedule-doctor"
              value={scheduleDoctorId}
              onChange={(event) =>
                handleScheduleDoctorChange(event.target.value)
              }
              required
            >
              <option value="">Choose a doctor</option>

              {activeDoctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name} — {doctor.specialisation || "Doctor"}
                </option>
              ))}
            </select>
          </div>

          {staffLoading && <p>Loading doctor list...</p>}

          {!staffLoading && activeDoctors.length === 0 && (
            <p>
              No active doctors found. Create a doctor account first.
            </p>
          )}

          {scheduleLoading && (
            <p>Loading doctor's schedule...</p>
          )}

          <fieldset
            className="staff-form-field"
            disabled={!scheduleDoctorId || scheduleLoading}
          >
            <legend>Working Days</legend>

            <div className="staff-role-buttons">
              {WEEKDAYS.map((day) => (
                <label
                  key={day}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    margin: "6px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={workingDays.includes(day)}
                    onChange={() => toggleWorkingDay(day)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="staff-form-field">
            <label htmlFor="schedule-department">
              Department (optional)
            </label>

            <input
              id="schedule-department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              placeholder="e.g. General Medicine"
              maxLength={100}
              disabled={!scheduleDoctorId || scheduleLoading}
            />
          </div>

          <div className="staff-form-field">
            <label htmlFor="slot-duration">
              Appointment Duration
            </label>

            <select
              id="slot-duration"
              value={slotDuration}
              onChange={(event) =>
                setSlotDuration(event.target.value)
              }
              disabled={!scheduleDoctorId || scheduleLoading}
            >
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>

          <h3>Working Sessions</h3>

          {sessions.map((session, index) => (
            <div
              key={index}
              className="staff-form-field"
              style={{
                border: "1px solid #dbe2ea",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            >
              <h4>Session {index + 1}</h4>

              <label htmlFor={`session-start-${index}`}>
                Start Time
              </label>

              <input
                id={`session-start-${index}`}
                type="time"
                value={session.startTime}
                onChange={(event) =>
                  updateSession(index, "startTime", event.target.value)
                }
                required
                disabled={!scheduleDoctorId || scheduleLoading}
              />

              <label htmlFor={`session-end-${index}`}>
                End Time
              </label>

              <input
                id={`session-end-${index}`}
                type="time"
                value={session.endTime}
                onChange={(event) =>
                  updateSession(index, "endTime", event.target.value)
                }
                required
                disabled={!scheduleDoctorId || scheduleLoading}
              />

              <label htmlFor={`break-start-${index}`}>
                Break Start (optional)
              </label>

              <input
                id={`break-start-${index}`}
                type="time"
                value={session.breakStart}
                onChange={(event) =>
                  updateSession(index, "breakStart", event.target.value)
                }
                disabled={!scheduleDoctorId || scheduleLoading}
              />

              <label htmlFor={`break-end-${index}`}>
                Break End (optional)
              </label>

              <input
                id={`break-end-${index}`}
                type="time"
                value={session.breakEnd}
                onChange={(event) =>
                  updateSession(index, "breakEnd", event.target.value)
                }
                disabled={!scheduleDoctorId || scheduleLoading}
              />

              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSession(index)}
                  disabled={!scheduleDoctorId || scheduleLoading}
                >
                  Remove Session
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addSession}
            disabled={!scheduleDoctorId || scheduleLoading}
          >
            + Add Another Session
          </button>

          {scheduleMessage && (
            <p
              className={`staff-message ${
                scheduleMessageType === "error"
                  ? "staff-message-error"
                  : "staff-message-success"
              }`}
              role={scheduleMessageType === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {scheduleMessage}
            </p>
          )}

          <button
            type="submit"
            className="staff-submit-button"
            disabled={
              scheduleSaving ||
              scheduleLoading ||
              !scheduleDoctorId
            }
          >
            {scheduleSaving
              ? "Saving Schedule..."
              : "Save Doctor Schedule"}
          </button>
        </form>
      </section>

      {/* All appointments */}
      <section className="panel">
        <h2>All Appointments</h2>

        <p className="panel-description">
          Review appointments across the clinic.
        </p>

        {loading ? (
          <p>Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p>No appointments found.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date &amp; Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment._id}>
                    <td>
                      {appointment.patient?.name ||
                        appointment.patientName ||
                        "—"}
                    </td>

                    <td>
                      {appointment.doctor?.name ||
                        appointment.doctorName ||
                        "—"}
                    </td>

                    <td>
                      {formatDate
                        ? formatDate(appointment.appointmentDate)
                        : appointment.appointmentDate || "—"}
                    </td>

                    <td>{appointment.reason || "—"}</td>

                    <td>
                      <span className="admin-status">
                        {appointment.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

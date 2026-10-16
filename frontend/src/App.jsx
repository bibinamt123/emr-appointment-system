
import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

import Login from "./Login";
import ReceptionOverview from "./components/ReceptionOverview";
import PatientSearch from "./components/PatientSearch";
import BookAppointment from "./components/BookAppointment";
import AppointmentList from "./components/AppointmentList";
import SuperAdmin from "./components/SuperAdmin";
import PatientProfile from "./components/PatientProfile";
import DoctorProfile from "./components/DoctorProfile";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

function getSavedSession() {
  try {
    return {
      user: JSON.parse(localStorage.getItem("user") || "null"),
      token: localStorage.getItem("accessToken") || "",
      refreshToken: localStorage.getItem("refreshToken") || "",
    };
  } catch {
    return { user: null, token: "", refreshToken: "" };
  }
}

function App() {
  const [session] = useState(getSavedSession);

  const [user, setUser] = useState(session.user);
  const [token, setToken] = useState(session.token);
  const [refreshToken, setRefreshToken] = useState(
    session.refreshToken
  );

  const [role, setRole] = useState("PATIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [reason, setReason] = useState("General consultation");

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editDoctorId, setEditDoctorId] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editReason, setEditReason] = useState("");

  const patientSearchRef = useRef(null);
  const receptionistBookingRef = useRef(null);
  const appointmentListRef = useRef(null);

  const showMessage = useCallback((text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage("");
    setMessageType("success");
  }, []);

  const request = useCallback(
    async (path, options = {}, accessToken = token) => {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {}),
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || `Request failed (${response.status})`
        );
      }

      return data;
    },
    [token]
  );

  const scrollToSection = useCallback(
    (sectionRef, messageText) => {
      sectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      if (messageText) {
        showMessage(messageText);
      }
    },
    [showMessage]
  );

  function saveSession(data) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
  }

  // Update the logged-in user's profile.
  async function handleProfileSave(profileData) {
    if (!token) {
      throw new Error("Your session has expired. Please log in again.");
    }

    setProfileSaving(true);
    clearMessage();

    try {
      const data = await request("/auth/me/profile", {
        method: "PATCH",
        body: JSON.stringify(profileData),
      });

      if (!data.success || !data.user) {
        throw new Error(
          data.message || "Could not update your profile."
        );
      }

      const updatedUser = {
        ...user,
        ...data.user,
        id: data.user.id || data.user._id || user.id || user._id,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      showMessage("Profile updated successfully.");
      return data;
    } catch (error) {
      showMessage(
        error.message || "Could not update your profile.",
        "error"
      );
      throw error;
    } finally {
      setProfileSaving(false);
    }
  }

  // Login.
  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    clearMessage();

    try {
      const data = await request(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
        ""
      );

      if (!data.user || !data.accessToken || !data.refreshToken) {
        throw new Error(
          "Login response is missing session information."
        );
      }

      if (data.user.role !== role) {
        throw new Error("Please select the correct account type.");
      }

      saveSession(data);

      setPassword("");
      setAppointments([]);
      setDoctors([]);
      setDoctorId("");
      setSlots([]);
      setSelectedSlot("");
      setSelectedPatient(null);

      showMessage("Login successful.");
    } catch (error) {
      showMessage(
        error.message || "Could not connect to the server.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // Load appointments for the logged-in user's role.
  const loadAppointments = useCallback(async () => {
    if (!token || !user) return;

    const endpoints = {
      PATIENT: "/appointments/patient",
      DOCTOR: "/appointments/doctor",
      RECEPTIONIST: "/appointments/receptionist",
      SUPER_ADMIN: "/appointments/admin",
    };

    const endpoint = endpoints[user.role];

    if (!endpoint) {
      setAppointments([]);
      return;
    }

    try {
      const data = await request(endpoint);

      const list = Array.isArray(data.appointments)
        ? data.appointments
        : Array.isArray(data.data)
          ? data.data
          : [];

      setAppointments(list);
    } catch (error) {
      setAppointments([]);

      showMessage(
        error.message || "Could not load appointments.",
        "error"
      );
    }
  }, [token, user, request, showMessage]);

  // Load doctors for patient and receptionist booking.
  const loadDoctors = useCallback(async () => {
    if (
      !token ||
      !["PATIENT", "RECEPTIONIST"].includes(user?.role)
    ) {
      setDoctors([]);
      return;
    }

    setDoctorsLoading(true);

    try {
      const data = await request("/appointments/doctors");

      const list = Array.isArray(data.doctors)
        ? data.doctors
        : [];

      setDoctors(list);

      setDoctorId((currentId) => {
        if (list.some((doctor) => doctor._id === currentId)) {
          return currentId;
        }

        return list[0]?._id || "";
      });

      if (list.length === 0) {
        showMessage(
          "No active doctors are currently available.",
          "error"
        );
      }
    } catch (error) {
      setDoctors([]);
      setDoctorId("");

      showMessage(
        error.message || "Could not load doctors.",
        "error"
      );
    } finally {
      setDoctorsLoading(false);
    }
  }, [token, user, request, showMessage]);

  useEffect(() => {
    if (user && token) {
      loadAppointments();
    }
  }, [user, token, loadAppointments]);

  useEffect(() => {
    if (
      token &&
      ["PATIENT", "RECEPTIONIST"].includes(user?.role)
    ) {
      loadDoctors();
    }
  }, [user, token, loadDoctors]);

  // Find available slots for patient booking.
  async function findAvailableSlots(event) {
    event.preventDefault();
    clearMessage();

    setSlots([]);
    setSelectedSlot("");

    if (!doctorId || !appointmentDate) {
      showMessage(
        "Please select a doctor and appointment date.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const data = await request(
        `/slots/${encodeURIComponent(
          doctorId
        )}?date=${encodeURIComponent(appointmentDate)}`
      );

      const returnedSlots = Array.isArray(data.slots)
        ? data.slots
        : Array.isArray(data.data)
          ? data.data
          : [];

      const availableSlots = returnedSlots.filter(
        (slot) => slot.available && slot.startTime
      );

      setSlots(availableSlots);

      if (availableSlots.length === 0) {
        showMessage("No available slots for this date.", "error");
      } else {
        showMessage(
          `${availableSlots.length} available slot(s) found.`
        );
      }
    } catch (error) {
      showMessage(
        error.message || "Could not load available slots.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // Patient books an appointment.
  async function bookAppointment(event) {
    event.preventDefault();
    clearMessage();

    if (!doctorId) {
      showMessage("Please select a doctor.", "error");
      return;
    }

    if (!selectedSlot) {
      showMessage(
        "Please select an available time slot.",
        "error"
      );
      return;
    }

    if (!reason.trim()) {
      showMessage(
        "Please enter a reason for the appointment.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      await request("/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId,
          appointmentDate: selectedSlot,
          reason: reason.trim(),
        }),
      });

      setSlots([]);
      setSelectedSlot("");
      setReason("General consultation");

      showMessage("Appointment booked successfully.");
      await loadAppointments();
    } catch (error) {
      showMessage(
        error.message || "Could not book appointment.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // Update appointment status, including arrival when allowed by backend.
  async function updateStatus(appointmentId, status) {
    clearMessage();
    setLoading(true);

    try {
      const data = await request(
        `/appointments/${encodeURIComponent(appointmentId)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }
      );

      showMessage(
        data.message || "Appointment updated successfully."
      );

      await loadAppointments();
    } catch (error) {
      showMessage(
        error.message || "Could not update appointment.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // Begin editing an appointment.
  function startEditing(appointment) {
    const date = new Date(appointment.appointmentDate);

    if (Number.isNaN(date.getTime())) {
      showMessage("The appointment date is invalid.", "error");
      return;
    }

    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);

    setEditingAppointment(appointment);

    setEditDoctorId(
      appointment.doctor?._id || appointment.doctor || ""
    );

    setEditDate(localDate);
    setEditReason(appointment.reason || "");
    clearMessage();
  }

  function cancelEditing() {
    setEditingAppointment(null);
    setEditDoctorId("");
    setEditDate("");
    setEditReason("");
  }

  // Save appointment changes.
  async function saveAppointmentEdit(event) {
    event.preventDefault();
    clearMessage();

    if (
      !editingAppointment ||
      !editDoctorId ||
      !editDate ||
      !editReason.trim()
    ) {
      showMessage(
        "Please complete all appointment fields.",
        "error"
      );
      return;
    }

    if (new Date(editDate) <= new Date()) {
      showMessage(
        "Choose a future appointment date and time.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const data = await request(
        `/appointments/${encodeURIComponent(editingAppointment._id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            doctorId: editDoctorId,
            appointmentDate: new Date(editDate).toISOString(),
            reason: editReason.trim(),
          }),
        }
      );

      showMessage(
        data.message || "Appointment updated successfully."
      );

      cancelEditing();
      await loadAppointments();
    } catch (error) {
      showMessage(
        error.message || "Could not update appointment.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  // Logout.
  async function logout() {
    clearMessage();
    setLoading(true);

    try {
      if (refreshToken) {
        await request(
          "/auth/logout",
          {
            method: "POST",
            body: JSON.stringify({ refreshToken }),
          },
          ""
        );
      }
    } catch {
      showMessage(
        "Server logout could not be confirmed. Clearing this browser session.",
        "error"
      );
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      setUser(null);
      setToken("");
      setRefreshToken("");
      setAppointments([]);
      setDoctors([]);
      setDoctorId("");
      setSlots([]);
      setSelectedSlot("");
      setSelectedPatient(null);
      setEditingAppointment(null);
      setPassword("");
      setEmail("");
      setRole("PATIENT");
      setLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function formatTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (!user || !token) {
    return (
      <Login
        role={role}
        setRole={setRole}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        message={message}
        messageType={messageType}
        loading={loading}
        handleLogin={handleLogin}
      />
    );
  }

  const isPatient = user.role === "PATIENT";
  const isDoctor = user.role === "DOCTOR";
  const isReceptionist = user.role === "RECEPTIONIST";
  const isSuperAdmin = user.role === "SUPER_ADMIN";

  const pageTitle = isPatient
    ? "My Appointments"
    : isDoctor
      ? "Assigned Appointments"
      : isSuperAdmin
        ? "All Appointments"
        : "All Appointments";

  const pageDescription = isPatient
    ? "Book appointments and manage your visits."
    : isDoctor
      ? "Review and manage your assigned appointments."
      : isSuperAdmin
        ? "Manage the clinic system and oversee appointments."
        : "Review appointments and manage patient arrivals.";

  const pendingCount = appointments.filter(
    (appointment) => appointment.status === "PENDING"
  ).length;

  const confirmedCount = appointments.filter(
    (appointment) => appointment.status === "CONFIRMED"
  ).length;

  const arrivedCount = appointments.filter(
    (appointment) => appointment.status === "ARRIVED"
  ).length;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="brand">
          <div className="logo small-logo">EMR</div>

          <div>
            <h2>Appointment System</h2>
            <p>Healthcare management portal</p>
          </div>
        </div>

        <button
          className="logout-button"
          onClick={logout}
          disabled={loading || profileSaving}
        >
          Sign Out
        </button>
      </header>

      <section className="welcome-section">
        <p className="eyebrow">{user.role} PORTAL</p>
        <h1>Welcome, {user.name}!</h1>
        <p>{pageDescription}</p>
      </section>

      {message && (
        <p
          className={`message dashboard-message ${
            messageType === "error" ? "error-message" : ""
          }`}
          role="status"
        >
          {message}
        </p>
      )}

      {isPatient && (
        <PatientProfile
          user={user}
          onSave={handleProfileSave}
          saving={profileSaving}
        />
      )}

      {isDoctor && <DoctorProfile user={user} />}

      {/* Receptionist dashboard */}
      {isReceptionist && (
        <ReceptionOverview
          pendingCount={pendingCount}
          confirmedCount={confirmedCount}
          arrivedCount={arrivedCount}
          onSearchPatients={() =>
            scrollToSection(
              patientSearchRef,
              "Search for a patient below."
            )
          }
          onBookAppointment={() =>
            scrollToSection(
              receptionistBookingRef,
              selectedPatient
                ? `Booking appointment for ${selectedPatient.name}.`
                : "Please search for and select a patient first."
            )
          }
          onUpdateAppointments={() =>
            scrollToSection(
              appointmentListRef,
              "Review and manage appointments below."
            )
          }
          onViewArrivals={() =>
            scrollToSection(
              appointmentListRef,
              "Find an appointment and use its arrival status action."
            )
          }
        />
      )}

      {/* Receptionist patient search */}
      {isReceptionist && (
        <div ref={patientSearchRef} className="dashboard-section">
          <PatientSearch
            request={request}
            onSelectPatient={(patient) => {
              setSelectedPatient(patient);
              showMessage(`Selected patient: ${patient.name}`);
            }}
          />
        </div>
      )}

      {/* Receptionist appointment booking */}
      {isReceptionist && (
        <div
          ref={receptionistBookingRef}
          className="dashboard-section"
        >
          <BookAppointment
            selectedPatient={selectedPatient}
            request={request}
            onBooked={loadAppointments}
            showMessage={showMessage}
          />
        </div>
      )}

      {/* Patient appointment booking */}
      {isPatient && (
        <section className="panel">
          <h2>Book an Appointment</h2>

          <p className="panel-description">
            Choose a doctor and date to find available appointment times.
          </p>

          <form onSubmit={findAvailableSlots} className="booking-form">
            <label htmlFor="doctorId">Select Doctor</label>

            <select
              id="doctorId"
              value={doctorId}
              onChange={(event) => {
                setDoctorId(event.target.value);
                setSlots([]);
                setSelectedSlot("");
                clearMessage();
              }}
              required
              disabled={doctorsLoading || doctors.length === 0}
            >
              <option value="">
                {doctorsLoading
                  ? "Loading doctors..."
                  : "Choose a doctor"}
              </option>

              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name || "Doctor"}
                  {doctor.email ? ` (${doctor.email})` : ""}
                </option>
              ))}
            </select>

            {!doctorsLoading && doctors.length === 0 && (
              <p className="panel-description">
                No doctors loaded. Check the doctor-list endpoint and
                make sure active doctors exist.
              </p>
            )}

            <button
              type="button"
              className="refresh-button"
              onClick={loadDoctors}
              disabled={doctorsLoading || loading}
            >
              {doctorsLoading ? "Loading..." : "Refresh Doctors"}
            </button>

            <label htmlFor="appointmentDate">
              Appointment date
            </label>

            <input
              id="appointmentDate"
              type="date"
              value={appointmentDate}
              min={new Date(
                Date.now() - new Date().getTimezoneOffset() * 60000
              ).toISOString().slice(0, 10)}
              onChange={(event) => {
                setAppointmentDate(event.target.value);
                setSlots([]);
                setSelectedSlot("");
                clearMessage();
              }}
              required
            />

            <button
              type="submit"
              disabled={loading || doctorsLoading || !doctorId}
            >
              {loading ? "Searching..." : "Find Available Slots"}
            </button>
          </form>

          {slots.length > 0 && (
            <form onSubmit={bookAppointment} className="booking-form">
              <label htmlFor="reason">Reason for appointment</label>

              <input
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. General consultation"
                required
              />

              <h3 className="slots-heading">Available times</h3>

              <div className="slot-grid">
                {slots.map((slot) => (
                  <button
                    type="button"
                    key={slot.startTime}
                    className={`slot-choice ${
                      selectedSlot === slot.startTime ? "selected" : ""
                    }`}
                    onClick={() => setSelectedSlot(slot.startTime)}
                    aria-pressed={selectedSlot === slot.startTime}
                  >
                    {formatTime(slot.startTime)}
                  </button>
                ))}
              </div>

              {selectedSlot && (
                <p className="panel-description">
                  Selected appointment: {formatDate(selectedSlot)}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !selectedSlot}
              >
                {loading ? "Booking..." : "Confirm Booking"}
              </button>
            </form>
          )}
        </section>
      )}

      {/* Appointment list and management */}
      {!isSuperAdmin && (
        <div ref={appointmentListRef} className="dashboard-section">
          <AppointmentList
            appointments={appointments}
            loading={loading}
            isPatient={isPatient}
            isDoctor={isDoctor}
            isReceptionist={isReceptionist}
            pageTitle={pageTitle}
            loadAppointments={loadAppointments}
            updateStatus={updateStatus}
            formatDate={formatDate}
            startEditing={startEditing}
            editingAppointment={editingAppointment}
            doctors={doctors}
            editDoctorId={editDoctorId}
            setEditDoctorId={setEditDoctorId}
            editDate={editDate}
            setEditDate={setEditDate}
            editReason={editReason}
            setEditReason={setEditReason}
            saveAppointmentEdit={saveAppointmentEdit}
            cancelEditing={cancelEditing}
          />
        </div>
      )}

      {/* Super Admin dashboard */}
      {isSuperAdmin && (
        <SuperAdmin
          user={user}
          token={token}
          appointments={appointments}
          loading={loading}
          loadAppointments={loadAppointments}
          formatDate={formatDate}
        />
      )}

      <p className="footer dashboard-footer">
        EMR Healthcare Appointment Management
      </p>
    </main>
  );
}

export default App;

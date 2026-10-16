
import { useState } from "react";
import "./Login.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export default function Login({
  role,
  setRole,
  email,
  setEmail,
  password,
  setPassword,
  message,
  messageType,
  loading,
  handleLogin,
}) {
  const [screen, setScreen] = useState("roles");

  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientPassword, setPatientPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState("");
  const [registerMessageType, setRegisterMessageType] = useState("");

  const roleDetails = {
    PATIENT: {
      title: "Patient Sign In",
      description: "Book and manage your appointments",
      icon: "👤",
      cardClass: "patient-card",
    },
    DOCTOR: {
      title: "Doctor Sign In",
      description: "View and manage patient appointments",
      icon: "🩺",
      cardClass: "doctor-card",
    },
    RECEPTIONIST: {
      title: "Receptionist Sign In",
      description: "Manage appointments and patient arrivals",
      icon: "🧑‍💼",
      cardClass: "doctor-card",
    },
    SUPER_ADMIN: {
      title: "Super Admin Sign In",
      description: "Manage staff and system access",
      icon: "🔐",
      cardClass: "admin-card",
    },
  };

  function chooseRole(selectedRole) {
    setRole(selectedRole);
    setScreen("login");
    setRegisterMessage("");
    setRegisterMessageType("");
  }

  function goBack() {
    setScreen("roles");
    setEmail("");
    setPassword("");
    setRegisterMessage("");
    setRegisterMessageType("");
  }

  function openRegistration() {
    setRole("PATIENT");
    setPatientName("");
    setPatientEmail("");
    setPatientPassword("");
    setConfirmPassword("");
    setRegisterMessage("");
    setRegisterMessageType("");
    setScreen("register");
  }

  async function handlePatientRegistration(event) {
    event.preventDefault();

    setRegisterMessage("");
    setRegisterMessageType("");

    if (patientPassword.length < 8) {
      setRegisterMessage("Password must contain at least 8 characters.");
      setRegisterMessageType("error");
      return;
    }

    if (patientPassword !== confirmPassword) {
      setRegisterMessage("Passwords do not match.");
      setRegisterMessageType("error");
      return;
    }

    try {
      setRegisterLoading(true);

      const response = await fetch(
        `${API_URL}/auth/register-patient`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: patientName.trim(),
            email: patientEmail.trim().toLowerCase(),
              phone: patientPhone.trim(),

            password: patientPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Unable to create your patient account."
        );
      }

      setEmail(patientEmail.trim().toLowerCase());
      setPassword("");
      setPatientPassword("");
      setConfirmPassword("");
      setScreen("login");

      setRegisterMessage(
        "Patient account created successfully! Please sign in."
      );
      setRegisterMessageType("success");
    } catch (error) {
      setRegisterMessage(
        error.message || "Unable to connect to the server."
      );
      setRegisterMessageType("error");
    } finally {
      setRegisterLoading(false);
    }
  }

  const selectedRole = roleDetails[role];

  return (
    <main className="login-page">
      <section className="login-container">
        <div className="login-brand">
          <div className="login-logo">+</div>
          <h1>MediCare</h1>
          <p>EMR Appointment System</p>
        </div>

        {screen === "roles" && (
          <>
            <h2 className="login-title">Welcome</h2>
            <p className="login-description">
              Choose your account type to continue.
            </p>

            <div className="login-role-options">
              {Object.entries(roleDetails).map(
                ([roleName, details]) => (
                  <button
                    key={roleName}
                    type="button"
                    className={`login-role-card ${details.cardClass}`}
                    onClick={() => chooseRole(roleName)}
                  >
                    <span className="login-role-icon">
                      {details.icon}
                    </span>

                    <span className="login-role-name">
                      {roleName === "SUPER_ADMIN"
                        ? "Super Admin Login"
                        : `${roleName.charAt(0)}${roleName
                            .slice(1)
                            .toLowerCase()} Login`}
                    </span>

                    <span className="login-role-description">
                      {details.description}
                    </span>

                    <span className="login-role-arrow">→</span>
                  </button>
                )
              )}
            </div>

            {/* <button
              type="button"
              className="login-submit"
              onClick={openRegistration}
            >
              Create New Patient Account
            </button> */}
          </>
        )}

        {screen === "login" && (
          <>
            <h2 className="login-title">
              {selectedRole?.title || "Sign In"}
            </h2>

            <p className="login-description">
              Enter your registered account details.
            </p>

            {registerMessage && (
              <p
                className={`login-message ${
                  registerMessageType === "error"
                    ? "login-error"
                    : "login-success"
                }`}
                role="status"
              >
                {registerMessage}
              </p>
            )}

            <form className="login-form" onSubmit={handleLogin}>
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                autoComplete="username"
                required
              />

              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

              {message && (
                <p
                  className={`login-message ${
                    messageType === "error" ? "login-error" : ""
                  }`}
                  role="status"
                >
                  {message}
                </p>
              )}

              <button
                className="login-submit"
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {role === "PATIENT" && (
              <button
                type="button"
                className="login-register-link"
                onClick={openRegistration}
              >
                New patient? Create an account
              </button>
            )}

            <button
              type="button"
              className="login-back"
              onClick={goBack}
            >
              ← Back to account selection
            </button>
          </>
        )}

        {screen === "register" && (
          <>
            <h2 className="login-title">
              Create Patient Account
            </h2>

            <p className="login-description">
              Register to book and manage your appointments.
            </p>

            <form
              className="login-form"
              onSubmit={handlePatientRegistration}
            >
              <label htmlFor="patient-name">Full Name</label>
              <input
                id="patient-name"
                type="text"
                value={patientName}
                onChange={(event) =>
                  setPatientName(event.target.value)
                }
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />

              <label htmlFor="patient-email">Email Address</label>
              <input
                id="patient-email"
                type="email"
                value={patientEmail}
                onChange={(event) =>
                  setPatientEmail(event.target.value)
                }
                placeholder="Enter your email"
                autoComplete="email"
                required
              />
              <label htmlFor="patient-phone">Phone Number</label>
                <input
                  id="patient-phone"
                  type="tel"
                  value={patientPhone}
                  onChange={(event) => setPatientPhone(event.target.value)}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  required
                />

              <label htmlFor="patient-password">Password</label>
              <input
                id="patient-password"
                type="password"
                value={patientPassword}
                onChange={(event) =>
                  setPatientPassword(event.target.value)
                }
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />

              <label htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Re-enter your password"
                autoComplete="new-password"
                minLength={8}
                required
              />

              {registerMessage && (
                <p
                  className={`login-message ${
                    registerMessageType === "error"
                      ? "login-error"
                      : "login-success"
                  }`}
                  role="status"
                >
                  {registerMessage}
                </p>
              )}

              <button
                className="login-submit"
                type="submit"
                disabled={registerLoading}
              >
                {registerLoading
                  ? "Creating Account..."
                  : "Create Patient Account"}
              </button>
            </form>

            <button
              type="button"
              className="login-back"
              onClick={() => {
                setRegisterMessage("");
                setScreen("login");
                setRole("PATIENT");
              }}
            >
              ← Back to Patient Sign In
            </button>
          </>
        )}

        <p className="login-footer">
          Secure Healthcare Appointment System
        </p>
      </section>
    </main>
  );
}

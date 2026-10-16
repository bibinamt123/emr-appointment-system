
import { useEffect, useState } from "react";
import "./UserProfile.css";

export default function PatientProfile({
  user,
  onSave,
  saving = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
  }, [user]);

  function cancelEditing() {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setMessage("");
    setMessageType("");
    setIsEditing(false);
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setMessage("Please fill in all fields.");
      setMessageType("error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      return;
    }

    if (typeof onSave !== "function") {
      setMessage("Profile saving is not connected yet.");
      setMessageType("error");
      return;
    }

    try {
      await onSave({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });

      setMessage("Profile updated successfully.");
      setMessageType("success");
      setIsEditing(false);
    } catch (error) {
      setMessage(error.message || "Failed to update profile.");
      setMessageType("error");
    }
  }

  return (
    <section className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {name?.charAt(0)?.toUpperCase() || "P"}
        </div>

        <div>
          <p className="profile-label">PATIENT PROFILE</p>
          <h2>{name || "Patient"}</h2>
          <p>Manage your personal account information.</p>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave}>
          <div className="profile-details">
            <div className="profile-field">
              <label htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-email">Email Address</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="profile-field">
              <label htmlFor="profile-phone">Phone Number</label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
            </div>

            <div className="profile-field">
              <label>Account Role</label>
              <p>Patient</p>
            </div>
          </div>

          {message && (
            <p
              className={
                messageType === "error"
                  ? "profile-message profile-error"
                  : "profile-message profile-success"
              }
              role="status"
            >
              {message}
            </p>
          )}

          <div className="profile-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              className="profile-cancel"
              onClick={cancelEditing}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="profile-details">
            <div className="profile-field">
              <label>Full Name</label>
              <p>{user?.name || "Not available"}</p>
            </div>

            <div className="profile-field">
              <label>Email Address</label>
              <p>{user?.email || "Not available"}</p>
            </div>

            <div className="profile-field">
              <label>Phone Number</label>
              <p>{user?.phone || "Not provided"}</p>
            </div>

            <div className="profile-field">
              <label>Account Role</label>
              <p>Patient</p>
            </div>
          </div>

          {message && (
            <p
              className={
                messageType === "error"
                  ? "profile-message profile-error"
                  : "profile-message profile-success"
              }
              role="status"
            >
              {message}
            </p>
          )}

          <div className="profile-actions">
            <button
              type="button"
              onClick={() => {
                setMessage("");
                setIsEditing(true);
              }}
            >
              Edit Profile
            </button>
          </div>
        </>
      )}
    </section>
  );
}

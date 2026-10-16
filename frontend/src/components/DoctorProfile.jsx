
import "./UserProfile.css";

export default function DoctorProfile({ user }) {
  return (
    <section className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || "D"}
        </div>

        <div>
          <p className="profile-label">DOCTOR PROFILE</p>
          <h2>{user?.name || "Doctor"}</h2>
          <p>Manage your professional account information.</p>
        </div>
      </div>

      <div className="profile-details">
        <div className="profile-field">
          <label>Doctor Name</label>
          <p>{user?.name || "Not available"}</p>
        </div>

        <div className="profile-field">
          <label>Email Address</label>
          <p>{user?.email || "Not available"}</p>
        </div>

        <div className="profile-field">
          <label>Account Role</label>
          <p>Doctor</p>
        </div>
      </div>
    </section>
  );
}


function AppointmentList({
  appointments,
  loading,
  isPatient,
  isDoctor,
  isReceptionist,
  pageTitle,
  loadAppointments,
  updateStatus,
  formatDate,
  startEditing,
  editingAppointment,
  doctors,
  editDoctorId,
  setEditDoctorId,
  editDate,
  setEditDate,
  editReason,
  setEditReason,
  saveAppointmentEdit,
  cancelEditing,
}) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>{pageTitle}</h2>
          <p className="panel-description">
            {appointments.length} appointment(s)
          </p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={loadAppointments}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {appointments.length === 0 ? (
        <p className="empty-state">No appointments found.</p>
      ) : (
        <div className="appointment-list">
          {appointments.map((appointment) => (
            <article className="appointment-card" key={appointment._id}>
              <div className="appointment-top">
                <span className="appointment-reason">
                  {appointment.reason || "Appointment"}
                </span>

                <span
                  className={`status status-${(
                    appointment.status || "pending"
                  ).toLowerCase()}`}
                >
                  {appointment.status || "UNKNOWN"}
                </span>
              </div>

              {(!isPatient || isReceptionist) && (
                <p>
                  <strong>Patient:</strong>{" "}
                  {appointment.patient?.name ||
                    appointment.patient?.email ||
                    "Patient details unavailable"}
                </p>
              )}

              {isReceptionist && appointment.patient?.email && (
                <p>
                  <strong>Patient email:</strong>{" "}
                  {appointment.patient.email}
                </p>
              )}

              {(!isDoctor || isReceptionist) && (
                <p>
                  <strong>Doctor:</strong>{" "}
                  {appointment.doctor?.name ||
                    appointment.doctor?.email ||
                    "Doctor details unavailable"}
                </p>
              )}

              {isReceptionist && appointment.doctor?.email && (
                <p>
                  <strong>Doctor email:</strong>{" "}
                  {appointment.doctor.email}
                </p>
              )}

              <p>
                <strong>Date:</strong>{" "}
                {formatDate(appointment.appointmentDate)}
              </p>

              <p>
                <strong>Reason:</strong> {appointment.reason || "—"}
              </p>

              <div className="appointment-actions">
                {isPatient &&
                  ["PENDING", "CONFIRMED"].includes(
                    appointment.status
                  ) && (
                    <button
                      type="button"
                      className="cancel-button"
                      disabled={loading}
                      onClick={() =>
                        updateStatus(appointment._id, "CANCELLED")
                      }
                    >
                      Cancel Appointment
                    </button>
                  )}

                {isReceptionist &&
                  appointment.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => startEditing(appointment)}
                    >
                      Edit Appointment
                    </button>
                  )}

                {isDoctor && appointment.status === "PENDING" && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      updateStatus(appointment._id, "CONFIRMED")
                    }
                  >
                    Confirm Appointment
                  </button>
                )}

                {isDoctor && appointment.status === "CONFIRMED" && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      updateStatus(appointment._id, "COMPLETED")
                    }
                  >
                    Mark Completed
                  </button>
                )}

                {isReceptionist &&
                  appointment.status === "CONFIRMED" && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        updateStatus(appointment._id, "ARRIVED")
                      }
                    >
                      {loading ? "Updating..." : "Mark Arrived"}
                    </button>
                  )}

                {isReceptionist &&
                  appointment.status === "ARRIVED" && (
                    <span className="panel-description">
                      Patient has arrived
                    </span>
                  )}
              </div>

              {isReceptionist &&
                editingAppointment?._id === appointment._id && (
                  <form
                    onSubmit={saveAppointmentEdit}
                    className="booking-form"
                  >
                    <h3>Edit Appointment</h3>

                    <label htmlFor={`edit-doctor-${appointment._id}`}>
                      Doctor
                    </label>

                    <select
                      id={`edit-doctor-${appointment._id}`}
                      value={editDoctorId}
                      onChange={(event) =>
                        setEditDoctorId(event.target.value)
                      }
                      required
                    >
                      <option value="">Choose a doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor._id} value={doctor._id}>
                          {doctor.name || doctor.email}
                        </option>
                      ))}
                    </select>

                    <label htmlFor={`edit-date-${appointment._id}`}>
                      Appointment date and time
                    </label>

                    <input
                      id={`edit-date-${appointment._id}`}
                      type="datetime-local"
                      value={editDate}
                      min={new Date(
                        Date.now() -
                          new Date().getTimezoneOffset() * 60000
                      )
                        .toISOString()
                        .slice(0, 16)}
                      onChange={(event) =>
                        setEditDate(event.target.value)
                      }
                      required
                    />

                    <label htmlFor={`edit-reason-${appointment._id}`}>
                      Reason
                    </label>

                    <input
                      id={`edit-reason-${appointment._id}`}
                      value={editReason}
                      onChange={(event) =>
                        setEditReason(event.target.value)
                      }
                      required
                    />

                    <button type="submit" disabled={loading}>
                      {loading ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      className="cancel-button"
                      disabled={loading}
                      onClick={cancelEditing}
                    >
                      Cancel Edit
                    </button>
                  </form>
                )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AppointmentList;

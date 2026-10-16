
function ReceptionOverview({
  pendingCount = 0,
  confirmedCount = 0,
  arrivedCount = 0,
  onSearchPatients,
  onBookAppointment,
  onUpdateAppointments,
  onViewArrivals,
}) {
  const actions = [
    {
      title: "Search Patients",
      description: "Find patients by name, email, or phone.",
      button: "Search Patients",
      onClick: onSearchPatients,
    },
    {
      title: "Book Appointments",
      description: "Schedule a patient with an available doctor.",
      button: "Book Appointment",
      onClick: onBookAppointment,
    },
    {
      title: "Update Appointments",
      description: "Review and manage existing appointments.",
      button: "Manage Appointments",
      onClick: onUpdateAppointments,
    },
    {
      title: "Patient Arrivals",
      description: "Review appointments and mark patients as arrived.",
      button: "View Arrivals",
      onClick: onViewArrivals,
    },
  ];

  return (
    <section className="panel">
      <h2>Receptionist Dashboard</h2>

      <p className="panel-description">
        Manage patient records, appointments, and clinic arrivals.
      </p>

      {/* Appointment statistics */}
      <div className="slot-grid">
        <div className="appointment-card">
          <p>Pending</p>
          <h3>{pendingCount}</h3>
        </div>

        <div className="appointment-card">
          <p>Confirmed</p>
          <h3>{confirmedCount}</h3>
        </div>

        <div className="appointment-card">
          <p>Arrived</p>
          <h3>{arrivedCount}</h3>
        </div>
      </div>

      {/* Receptionist actions */}
      <div className="slot-grid">
        {actions.map((action) => (
          <article className="appointment-card" key={action.title}>
            <h3>{action.title}</h3>

            <p>{action.description}</p>

            <button
              type="button"
              onClick={action.onClick}
              disabled={!action.onClick}
            >
              {action.button}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ReceptionOverview;

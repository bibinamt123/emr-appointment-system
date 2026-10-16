import { useState } from "react";

function PatientSearch({ onSelectPatient, request }) {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function handleSearch(event) {
    event.preventDefault();

    const searchText = query.trim();

    if (searchText.length < 2) {
      setError("Enter at least 2 characters.");
      setPatients([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const data = await request(
        `/appointments/patients/search?q=${encodeURIComponent(searchText)}`
      );

      setPatients(
        Array.isArray(data.patients) ? data.patients : []
      );

      if (!data.patients?.length) {
        setError("No matching patients found.");
      }
    } catch (err) {
      setPatients([]);
      setError(err.message || "Could not search patients.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>Search Patients</h2>

      <p className="panel-description">
        Search registered patients by name or email.
      </p>

      <form onSubmit={handleSearch} className="booking-form">
        <label htmlFor="patientSearch">
          Patient name or email
        </label>

        <input
          id="patientSearch"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Enter patient name or email"
          minLength={2}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search Patients"}
        </button>
      </form>

      {error && (
        <p className="panel-description" role="status">
          {error}
        </p>
      )}

      {searched && patients.length > 0 && (
        <div className="appointment-list">
          {patients.map((patient) => (
            <article className="appointment-card" key={patient._id}>
              <h3>{patient.name}</h3>

              <p>
                <strong>Email:</strong> {patient.email}
              </p>

              <button
                type="button"
                onClick={() => onSelectPatient(patient)}
              >
                Select Patient
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default PatientSearch;

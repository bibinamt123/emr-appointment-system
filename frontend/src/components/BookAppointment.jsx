
import { useEffect, useState } from "react";

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function BookAppointment({
  selectedPatient,
  request,
  onBooked,
  showMessage,
}) {
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [reason, setReason] = useState("General consultation");

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      setLoadingDoctors(true);

      try {
        const data = await request("/appointments/doctors");
        const list = Array.isArray(data.doctors) ? data.doctors : [];

        if (!cancelled) {
          setDoctors(list);
          setDoctorId((currentId) =>
            list.some((doctor) => doctor._id === currentId)
              ? currentId
              : list[0]?._id || ""
          );
        }
      } catch (error) {
        if (!cancelled) {
          showMessage(
            error.message || "Failed to load doctors.",
            "error"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingDoctors(false);
        }
      }
    }

    loadDoctors();

    return () => {
      cancelled = true;
    };
  }, [request, showMessage]);

  function handleDoctorChange(event) {
    setDoctorId(event.target.value);
    setSlots([]);
    setSelectedSlot("");
  }

  function handleDateChange(event) {
    setAppointmentDate(event.target.value);
    setSlots([]);
    setSelectedSlot("");
  }

  async function findSlots(event) {
    event.preventDefault();

    if (!doctorId || !appointmentDate) {
      showMessage(
        "Please select a doctor and appointment date.",
        "error"
      );
      return;
    }

    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlot("");

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
        showMessage(
          "No available slots for this doctor on the selected date.",
          "error"
        );
      } else {
        showMessage(
          `${availableSlots.length} available slot(s) found.`
        );
      }
    } catch (error) {
      showMessage(
        error.message || "Failed to load available slots.",
        "error"
      );
    } finally {
      setLoadingSlots(false);
    }
  }

  function formatSlotTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selectedPatient?._id) {
      showMessage("Please search for and select a patient.", "error");
      return;
    }

    if (!doctorId || !selectedSlot || !reason.trim()) {
      showMessage(
        "Please select a doctor, an available slot, and enter a reason.",
        "error"
      );
      return;
    }

    setBooking(true);

    try {
      const data = await request("/appointments/receptionist", {
        method: "POST",
        body: JSON.stringify({
          patientId: selectedPatient._id,
          doctorId,
          appointmentDate: selectedSlot,
          reason: reason.trim(),
        }),
      });

      showMessage(data.message || "Appointment booked successfully.");

      setAppointmentDate("");
      setReason("General consultation");
      setSlots([]);
      setSelectedSlot("");

      if (onBooked) {
        await onBooked();
      }
    } catch (error) {
      showMessage(
        error.message || "Failed to book appointment.",
        "error"
      );
    } finally {
      setBooking(false);
    }
  }

  return (
    <section className="panel">
      <h2>Book Appointment</h2>

      {!selectedPatient ? (
        <p>Please search for and select a patient first.</p>
      ) : (
        <>
          <p>
            <strong>Patient:</strong> {selectedPatient.name}
          </p>

          <p>
            <strong>Email:</strong> {selectedPatient.email || "—"}
          </p>

          <form className="booking-form" onSubmit={findSlots}>
            <label htmlFor="receptionDoctor">Select Doctor</label>

            <select
              id="receptionDoctor"
              value={doctorId}
              onChange={handleDoctorChange}
              required
              disabled={loadingDoctors || doctors.length === 0}
            >
              <option value="">
                {loadingDoctors ? "Loading doctors..." : "Choose a doctor"}
              </option>

              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name || "Doctor"}
                  {doctor.email ? ` (${doctor.email})` : ""}
                </option>
              ))}
            </select>

            {!loadingDoctors && doctors.length === 0 && (
              <p className="panel-description">
                No doctors found. Check that active doctors exist.
              </p>
            )}

            <label htmlFor="receptionDate">Appointment date</label>

            <input
              id="receptionDate"
              type="date"
              value={appointmentDate}
              min={getLocalDate()}
              onChange={handleDateChange}
              required
            />

            <button
              type="submit"
              disabled={
                loadingDoctors ||
                loadingSlots ||
                !doctorId ||
                !appointmentDate
              }
            >
              {loadingSlots ? "Finding slots..." : "Find Available Slots"}
            </button>
          </form>

          {slots.length > 0 && (
            <form className="booking-form" onSubmit={handleSubmit}>
              <h3>Available appointment times</h3>

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
                    {formatSlotTime(slot.startTime)}
                  </button>
                ))}
              </div>

              <label htmlFor="receptionReason">
                Reason for appointment
              </label>

              <textarea
                id="receptionReason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Enter reason for appointment"
                rows={3}
                required
              />

              {selectedSlot && (
                <p className="panel-description">
                  Selected time: {formatSlotTime(selectedSlot)}
                </p>
              )}

              <button
                type="submit"
                disabled={booking || !selectedSlot || !reason.trim()}
              >
                {booking ? "Booking..." : "Confirm Appointment"}
              </button>
            </form>
          )}
        </>
      )}
    </section>
  );
}

export default BookAppointment;

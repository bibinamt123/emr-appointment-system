const express = require("express");
const router = express.Router();

const {
  createAppointment,
  createReceptionistAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  getReceptionistAppointments,
  getAdminAppointments,
  searchPatients,
  updateAppointmentStatus,
  updateAppointmentDetails,
  getDoctors,
} = require("../controllers/appointmentController");

const {
  authenticate,
  authorize,
} = require("../middlewares/authMiddleware");

// Patients and receptionists can view active doctors.
router.get(
  "/doctors",
  authenticate,
  authorize("PATIENT", "RECEPTIONIST"),
  getDoctors
);

// Receptionist views all appointments.
router.get(
  "/receptionist",
  authenticate,
  authorize("RECEPTIONIST"),
  getReceptionistAppointments
);

// Receptionist searches registered patients.
router.get(
  "/patients/search",
  authenticate,
  authorize("RECEPTIONIST"),
  searchPatients
);

// Receptionist books an appointment for a selected patient.
router.post(
  "/receptionist",
  authenticate,
  authorize("RECEPTIONIST"),
  createReceptionistAppointment
);

// Only Super Admin can view all appointments.
router.get(
  "/admin",
  authenticate,
  authorize("SUPER_ADMIN"),
  getAdminAppointments
);

// Patient books an appointment.
router.post(
  "/",
  authenticate,
  authorize("PATIENT"),
  createAppointment
);

// Patient views their own appointments.
router.get(
  "/patient",
  authenticate,
  authorize("PATIENT"),
  getPatientAppointments
);

// Doctor views their assigned appointments.
router.get(
  "/doctor",
  authenticate,
  authorize("DOCTOR"),
  getDoctorAppointments
);

// Update appointment status.
router.patch(
  "/:appointmentId/status",
  authenticate,
  updateAppointmentStatus
);

// Receptionist updates appointment details.
router.patch(
  "/:appointmentId",
  authenticate,
  authorize("RECEPTIONIST"),
  updateAppointmentDetails
);

module.exports = router;

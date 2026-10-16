
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Schedule = require("../models/Schedule");

// Convert HH:mm to minutes after midnight.
function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Book an appointment as the logged-in patient.
exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, appointmentDate, reason } = req.body;

    if (
      !doctorId ||
      !mongoose.isValidObjectId(doctorId) ||
      !appointmentDate ||
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid doctor ID, appointment date, and reason are required",
      });
    }

    const date = new Date(appointmentDate);

    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid future appointment date",
      });
    }

    // Verify the doctor is active.
    const doctor = await User.findOne({
      _id: doctorId,
      role: "DOCTOR",
      isActive: true,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Active doctor not found",
      });
    }

    // Patients book for themselves.
// Receptionists book for a selected patient.
const patientId =
  req.user.role === "RECEPTIONIST"
    ? req.body.patientId
    : req.user.userId;

if (!mongoose.isValidObjectId(patientId)) {
  return res.status(400).json({
    success: false,
    message: "A valid patient ID is required",
  });
}

const patient = await User.findOne({
  _id: patientId,
  role: "PATIENT",
  isActive: true,
});

    if (!patient) {
      return res.status(403).json({
        success: false,
        message: "Only active patients can book appointments",
      });
    }

    // Get the requested calendar day in the server's local timezone.
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const dayStart = new Date(year, month, day);
    const dayEnd = new Date(year, month, day + 1);

    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const weekday = weekdays[dayStart.getDay()];

    // Find the doctor's active schedule for this weekday.
    const schedule = await Schedule.findOne({
      doctor: doctor._id,
      isActive: true,
      workingDays: weekday,
    });

    if (!schedule) {
      return res.status(400).json({
        success: false,
        message: "Doctor is not scheduled to work on this date",
      });
    }

    const requestedTime = date.getTime();
    const durationMs = schedule.slotDuration * 60 * 1000;

    // Check that the requested time matches a generated slot.
    let validSlot = false;

    for (const session of schedule.sessions) {
      const start = timeToMinutes(session.startTime);
      const end = timeToMinutes(session.endTime);

      const breakStart = session.breakStart
        ? timeToMinutes(session.breakStart)
        : null;

      const breakEnd = session.breakEnd
        ? timeToMinutes(session.breakEnd)
        : null;

      for (
        let minutes = start;
        minutes + schedule.slotDuration <= end;
        minutes += schedule.slotDuration
      ) {
        const slotEndMinutes = minutes + schedule.slotDuration;

        const overlapsBreak =
          breakStart !== null &&
          breakEnd !== null &&
          minutes < breakEnd &&
          slotEndMinutes > breakStart;

        if (overlapsBreak) {
          continue;
        }

        const slotDate = new Date(
          year,
          month,
          day,
          Math.floor(minutes / 60),
          minutes % 60,
          0,
          0
        );

        if (slotDate.getTime() === requestedTime) {
          validSlot = true;
          break;
        }
      }

      if (validSlot) {
        break;
      }
    }

    if (!validSlot) {
      return res.status(400).json({
        success: false,
        message:
          "Selected time is not a valid slot in the doctor's schedule",
      });
    }

    const requestedEnd = requestedTime + durationMs;

    // Look for overlapping appointments that occupy the slot.
    const existingAppointments = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: {
        $gte: dayStart,
        $lt: dayEnd,
      },
      status: {
        $in: ["PENDING", "CONFIRMED", "ARRIVED"],
      },
    }).select("appointmentDate");

    const hasConflict = existingAppointments.some((existing) => {
      const existingStart = new Date(
        existing.appointmentDate
      ).getTime();

      const existingEnd = existingStart + durationMs;

      return (
        requestedTime < existingEnd &&
        requestedEnd > existingStart
      );
    });

    if (hasConflict) {
      return res.status(409).json({
        success: false,
        message: "This appointment slot is already booked",
      });
    }

    // Create the appointment.
    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      appointmentDate: date,
      reason: reason.trim(),
    });

    // Notify connected clients about the new appointment.
    const io = req.app.get("io");

    if (io) {
      io.emit("appointmentCreated", {
        appointmentId: appointment._id,
        doctorId: doctor._id,
        appointmentDate: appointment.appointmentDate,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment data",
      });
    }

    console.error("Create appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to book appointment",
    });
  }
};

// View appointments belonging to the logged-in patient.
exports.getPatientAppointments = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({
        success: false,
        message: "Only patients can access this resource",
      });
    }

    const appointments = await Appointment.find({
      patient: req.user.userId,
    })
      .populate("doctor", "name email")
      .sort({ appointmentDate: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Get patient appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve appointments",
    });
  }
};

// View appointments assigned to the logged-in doctor.
exports.getDoctorAppointments = async (req, res) => {
  try {
    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access this resource",
      });
    }

    const appointments = await Appointment.find({
      doctor: req.user.userId,
    })
      .populate("patient", "name email")
      .sort({ appointmentDate: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Get doctor appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve appointments",
    });
  }
};

// Update appointment status according to the logged-in user's role.
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Doctor: confirm or complete their own appointments.
    if (req.user.role === "DOCTOR") {
      if (appointment.doctor.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own appointments",
        });
      }

      if (!["CONFIRMED", "COMPLETED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Doctors can set status to CONFIRMED or COMPLETED",
        });
      }

      if (
        (status === "CONFIRMED" &&
          appointment.status !== "PENDING") ||
        (status === "COMPLETED" &&
          appointment.status !== "CONFIRMED" &&
          appointment.status !== "ARRIVED")
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment status transition",
        });
      }
    }

    // Receptionist: mark confirmed appointments as arrived.
    else if (req.user.role === "RECEPTIONIST") {
      if (status !== "ARRIVED") {
        return res.status(400).json({
          success: false,
          message:
            "Receptionists can only mark appointments as ARRIVED",
        });
      }

      if (appointment.status !== "CONFIRMED") {
        return res.status(400).json({
          success: false,
          message:
            "Only confirmed appointments can be marked as ARRIVED",
        });
      }
    }

    // Patient: cancel their own pending or confirmed appointments.
    else if (req.user.role === "PATIENT") {
      if (appointment.patient.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message:
            "You can only cancel your own appointments",
        });
      }

      if (status !== "CANCELLED") {
        return res.status(400).json({
          success: false,
          message: "Patients can only cancel appointments",
        });
      }

      if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
        return res.status(400).json({
          success: false,
          message:
            "This appointment can no longer be cancelled",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "You cannot update appointment status",
      });
    }

    appointment.status = status;
    await appointment.save();

    // Notify connected clients about the status change.
    const io = req.app.get("io");

    if (io) {
      io.emit("appointmentStatusUpdated", {
        appointmentId: appointment._id,
        doctorId: appointment.doctor,
        patientId: appointment.patient,
        status: appointment.status,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
    });
  }
};

// Get active doctors for the patient booking form.
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({
      role: "DOCTOR",
      isActive: true,
    })
      .select("_id name email")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error("Get doctors error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve doctors",
    });
  }
};

// View all appointments for the receptionist dashboard.
exports.getReceptionistAppointments = async (req, res) => {
  try {
    if (req.user.role !== "RECEPTIONIST") {
      return res.status(403).json({
        success: false,
        message: "Only receptionists can access this resource",
      });
    }

    const appointments = await Appointment.find({})
      .populate("patient", "name email")
      .populate("doctor", "name email")
      .sort({ appointmentDate: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error(
      "Get receptionist appointments error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve appointments",
    });
  }
};


// Search registered patients for the receptionist.
exports.searchPatients = async (req, res) => {
  try {
    const query =
      typeof req.query.q === "string"
        ? req.query.q.trim()
        : "";

    if (query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Enter at least 2 characters to search",
      });
    }

    // Escape regex special characters so the search is safe.
    const escapedQuery = query.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const patients = await User.find({
      role: "PATIENT",
      isActive: true,
      $or: [
        { name: { $regex: escapedQuery, $options: "i" } },
        { email: { $regex: escapedQuery, $options: "i" } },
      ],
    })
      .select("_id name email")
      .sort({ name: 1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    console.error("Search patients error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search patients",
    });
  }
};

// Receptionist books for a selected patient using shared validation.
exports.createReceptionistAppointment = (req, res) => {
  return exports.createAppointment(req, res);
};

// Receptionist updates appointment details.
exports.updateAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { doctorId, appointmentDate, reason } = req.body;

    if (!mongoose.isValidObjectId(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Only pending appointments can be edited.
    if (appointment.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending appointments can be updated",
      });
    }

    if (doctorId) {
      if (!mongoose.isValidObjectId(doctorId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor ID",
        });
      }

      const doctor = await User.findOne({
        _id: doctorId,
        role: "DOCTOR",
        isActive: true,
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Active doctor not found",
        });
      }

      appointment.doctor = doctor._id;
    }

    if (appointmentDate !== undefined) {
      const newDate = new Date(appointmentDate);

      if (
        !appointmentDate ||
        Number.isNaN(newDate.getTime()) ||
        newDate <= new Date()
      ) {
        return res.status(400).json({
          success: false,
          message: "Choose a valid future appointment date and time",
        });
      }

      appointment.appointmentDate = newDate;
    }

    if (reason !== undefined) {
      if (typeof reason !== "string" || !reason.trim()) {
        return res.status(400).json({
          success: false,
          message: "Appointment reason is required",
        });
      }

      appointment.reason = reason.trim();
    }

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate("patient", "name email")
      .populate("doctor", "name email");

    return res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Update appointment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update appointment",
    });
  }
};


/* View all appointments for the Super Admin dashboard. */
exports.getAdminAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({})
      .populate("patient", "name email")
      .populate("doctor", "name email")
      .sort({ appointmentDate: 1 });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Get admin appointments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve appointments",
    });
  }
};

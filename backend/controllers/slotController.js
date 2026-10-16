const mongoose = require("mongoose");
const Schedule = require("../models/Schedule");
const Appointment = require("../models/Appointment");

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Provide a date in YYYY-MM-DD format",
      });
    }

    const [year, month, day] = date.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, day);

    if (
      selectedDate.getFullYear() !== year ||
      selectedDate.getMonth() !== month - 1 ||
      selectedDate.getDate() !== day
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid calendar date",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Past dates are not allowed",
      });
    }

    const User = require("../models/User");

    const doctor = await User.findOne({
      _id: doctorId,
      role: "DOCTOR",
      isActive: true,
    }).select("_id");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Active doctor not found",
      });
    }

    const weekdays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const weekday = weekdays[selectedDate.getDay()];

    const schedule = await Schedule.findOne({
      doctor: doctorId,
      isActive: true,
      workingDays: weekday,
    });

    if (!schedule) {
      return res.status(200).json({
        success: true,
        date,
        doctorId,
        slots: [],
        message: "Doctor is not scheduled to work on this date",
      });
    }

    if (
      !Number.isFinite(schedule.slotDuration) ||
      schedule.slotDuration <= 0 ||
      !Array.isArray(schedule.sessions)
    ) {
      return res.status(500).json({
        success: false,
        message: "Doctor schedule configuration is invalid",
      });
    }

    const dayStart = new Date(year, month - 1, day);
    const dayEnd = new Date(year, month - 1, day + 1);

    // Include arrived appointments so occupied slots stay unavailable.
    const appointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: dayStart, $lt: dayEnd },
      status: {
        $in: ["PENDING", "CONFIRMED", "ARRIVED"],
      },
    }).select("appointmentDate");

    const now = new Date();
    const slots = [];

    for (const session of schedule.sessions) {
      if (!session.startTime || !session.endTime) {
        continue;
      }

      const start = timeToMinutes(session.startTime);
      const end = timeToMinutes(session.endTime);

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start < 0 ||
        end > 1440 ||
        start >= end
      ) {
        continue;
      }

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

        const slotStart = new Date(
          year,
          month - 1,
          day,
          Math.floor(minutes / 60),
          minutes % 60,
          0,
          0
        );

        const slotEnd = new Date(
          year,
          month - 1,
          day,
          Math.floor(slotEndMinutes / 60),
          slotEndMinutes % 60,
          0,
          0
        );

        if (slotStart <= now) {
          continue;
        }

        // Check interval overlap, not just identical start times.
        const isBooked = appointments.some((appointment) => {
          const bookedStart = new Date(appointment.appointmentDate);
          const bookedEnd = new Date(
            bookedStart.getTime() +
              schedule.slotDuration * 60 * 1000
          );

          return slotStart < bookedEnd && slotEnd > bookedStart;
        });

        slots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          available: !isBooked,
        });
      }
    }

    // Avoid duplicate slots if schedule sessions overlap.
    const uniqueSlots = [
      ...new Map(
        slots.map((slot) => [slot.startTime, slot])
      ).values(),
    ].sort(
      (a, b) =>
        new Date(a.startTime).getTime() -
        new Date(b.startTime).getTime()
    );

    return res.status(200).json({
      success: true,
      date,
      doctorId,
      slotDuration: schedule.slotDuration,
      slots: uniqueSlots,
    });
  } catch (error) {
    console.error("Get available slots error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve available slots",
    });
  }
};

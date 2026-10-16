
const mongoose = require("mongoose");
const Schedule = require("../models/Schedule");
const User = require("../models/User");

// Create or update a doctor's schedule
async function saveSchedule(req, res) {
  try {
    const {
      doctorId,
      department,
      workingDays,
      sessions,
      slotDuration,
    } = req.body;

    if (
      !doctorId ||
      !mongoose.isValidObjectId(doctorId) ||
      !Array.isArray(workingDays) ||
      workingDays.length === 0 ||
      !Array.isArray(sessions) ||
      sessions.length === 0 ||
      !slotDuration
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a doctor, working days, sessions, and slot duration",
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

    // Only allow valid, ordered session times and breaks.
    const toMinutes = (time) => {
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time || "")) {
        return NaN;
      }

      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    for (const session of sessions) {
      const start = toMinutes(session.startTime);
      const end = toMinutes(session.endTime);

      if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
        return res.status(400).json({
          success: false,
          message: "Each session must have a valid start time before its end time",
        });
      }

      const hasBreak = session.breakStart || session.breakEnd;

      if (hasBreak) {
        const breakStart = toMinutes(session.breakStart);
        const breakEnd = toMinutes(session.breakEnd);

        if (
          !Number.isFinite(breakStart) ||
          !Number.isFinite(breakEnd) ||
          breakStart >= breakEnd ||
          breakStart < start ||
          breakEnd > end
        ) {
          return res.status(400).json({
            success: false,
            message: "Break times must be valid and within the session",
          });
        }
      }
    }

    const sortedSessions = [...sessions].sort(
      (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
    );

    for (let i = 1; i < sortedSessions.length; i++) {
      if (
        toMinutes(sortedSessions[i].startTime) <
        toMinutes(sortedSessions[i - 1].endTime)
      ) {
        return res.status(400).json({
          success: false,
          message: "Working sessions must not overlap",
        });
      }
    }

    const schedule = await Schedule.findOneAndUpdate(
      { doctor: doctorId },
      {
        doctor: doctorId,
        department: department || "",
        workingDays,
        sessions,
        slotDuration,
        isActive: true,
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Doctor schedule saved successfully",
      schedule,
    });
  } catch (error) {
    console.error("Save schedule error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save schedule",
    });
  }
}

// Get a doctor's schedule
async function getDoctorSchedule(req, res) {
  try {
    const { doctorId } = req.params;

    if (!mongoose.isValidObjectId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    const schedule = await Schedule.findOne({
      doctor: doctorId,
      isActive: true,
    }).populate("doctor", "name email");

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "No active schedule found for this doctor",
      });
    }

    return res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error("Get schedule error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve schedule",
    });
  }
}

module.exports = {
  saveSchedule,
  getDoctorSchedule,
};

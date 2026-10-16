const mongoose = require("mongoose");
const User = require("../models/User");
const DoctorSchedule = require("../models/DoctorSchedule");

const VALID_DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function isValidObjectId(id) {
  return mongoose.isValidObjectId(id);
}

// GET: List schedules for all doctors.
exports.getSchedules = async (req, res) => {
  try {
    const schedules = await DoctorSchedule.find()
      .populate("doctor", "name email phone specialisation")
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      schedules,
    });
  } catch (error) {
    console.error("Get schedules error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve doctor schedules.",
    });
  }
};

// POST: Create a schedule for a doctor.
exports.createSchedule = async (req, res) => {
  try {
    const {
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      slotDuration = 30,
    } = req.body;

    if (
      !doctorId ||
      !dayOfWeek ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Doctor, day, start time, and end time are required.",
      });
    }

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID.",
      });
    }

    const normalizedDay = String(dayOfWeek).toUpperCase();
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!VALID_DAYS.includes(normalizedDay)) {
      return res.status(400).json({
        success: false,
        message: "Invalid day of the week.",
      });
    }

    if (
      !timePattern.test(startTime) ||
      !timePattern.test(endTime) ||
      endTime <= startTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter valid times and ensure the end time is later.",
      });
    }

    if (
      !Number.isInteger(slotDuration) ||
      slotDuration < 5 ||
      slotDuration > 240
    ) {
      return res.status(400).json({
        success: false,
        message: "Slot duration must be an integer from 5 to 240 minutes.",
      });
    }

    const doctor = await User.findOne({
      _id: doctorId,
      role: "DOCTOR",
    }).select("_id");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    // Prevent overlapping active schedules for the same doctor/day.
    const overlapping = await DoctorSchedule.findOne({
      doctor: doctorId,
      dayOfWeek: normalizedDay,
      isActive: true,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (overlapping) {
      return res.status(409).json({
        success: false,
        message: "This schedule overlaps an existing active schedule.",
      });
    }

    const schedule = await DoctorSchedule.create({
      doctor: doctorId,
      dayOfWeek: normalizedDay,
      startTime,
      endTime,
      slotDuration,
    });

    const populatedSchedule = await DoctorSchedule.findById(
      schedule._id
    ).populate("doctor", "name email phone specialisation");

    return res.status(201).json({
      success: true,
      message: "Doctor schedule created successfully.",
      schedule: populatedSchedule,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This exact schedule already exists.",
      });
    }

    console.error("Create schedule error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create doctor schedule.",
    });
  }
};

// PATCH: Update a schedule's time, day, duration, or active status.
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid schedule ID.",
      });
    }

    const allowedFields = [
      "dayOfWeek",
      "startTime",
      "endTime",
      "slotDuration",
      "isActive",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one schedule field to update.",
      });
    }

    if (
      updates.dayOfWeek !== undefined &&
      !VALID_DAYS.includes(String(updates.dayOfWeek).toUpperCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid day of the week.",
      });
    }

    if (updates.dayOfWeek !== undefined) {
      updates.dayOfWeek = String(updates.dayOfWeek).toUpperCase();
    }

    if (
      updates.startTime !== undefined &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(updates.startTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid start time. Use HH:mm format.",
      });
    }

    if (
      updates.endTime !== undefined &&
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(updates.endTime)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid end time. Use HH:mm format.",
      });
    }

    if (
      updates.slotDuration !== undefined &&
      (!Number.isInteger(updates.slotDuration) ||
        updates.slotDuration < 5 ||
        updates.slotDuration > 240)
    ) {
      return res.status(400).json({
        success: false,
        message: "Slot duration must be an integer from 5 to 240 minutes.",
      });
    }

    if (
      updates.isActive !== undefined &&
      typeof updates.isActive !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const current = await DoctorSchedule.findById(id);

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found.",
      });
    }

    const nextDay = updates.dayOfWeek ?? current.dayOfWeek;
    const nextStart = updates.startTime ?? current.startTime;
    const nextEnd = updates.endTime ?? current.endTime;
    const nextActive = updates.isActive ?? current.isActive;

    if (nextEnd <= nextStart) {
      return res.status(400).json({
        success: false,
        message: "End time must be later than start time.",
      });
    }

    if (nextActive) {
      const overlapping = await DoctorSchedule.findOne({
        _id: { $ne: current._id },
        doctor: current.doctor,
        dayOfWeek: nextDay,
        isActive: true,
        startTime: { $lt: nextEnd },
        endTime: { $gt: nextStart },
      });

      if (overlapping) {
        return res.status(409).json({
          success: false,
          message: "This update overlaps another active schedule.",
        });
      }
    }

    Object.assign(current, updates);
    await current.save();

    const updatedSchedule = await DoctorSchedule.findById(
      current._id
    ).populate("doctor", "name email phone specialisation");

    return res.status(200).json({
      success: true,
      message: "Doctor schedule updated successfully.",
      schedule: updatedSchedule,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This exact schedule already exists.",
      });
    }

    console.error("Update schedule error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update doctor schedule.",
    });
  }
};
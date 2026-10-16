const mongoose = require("mongoose");

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    dayOfWeek: {
      type: String,
      enum: [
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
        "SUNDAY",
      ],
      required: true,
    },

    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },

    slotDuration: {
      type: Number,
      default: 30,
      min: 5,
      max: 240,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate identical schedules for the same doctor.
doctorScheduleSchema.index(
  {
    doctor: 1,
    dayOfWeek: 1,
    startTime: 1,
    endTime: 1,
  },
  {
    unique: true,
  }
);

// Ensure the end time is later than the start time.
doctorScheduleSchema.pre("validate", function () {
  if (this.startTime && this.endTime &&
      this.endTime <= this.startTime) {
    this.invalidate(
      "endTime",
      "End time must be later than start time."
    );
  }
});

module.exports = mongoose.model(
  "DoctorSchedule",
  doctorScheduleSchema
);
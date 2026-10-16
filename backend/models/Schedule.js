
const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },
    breakStart: {
      type: String,
      default: "",
    },
    breakEnd: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const scheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    department: {
      type: String,
      trim: true,
      default: "",
    },

    workingDays: {
      type: [String],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },

    sessions: {
      type: [sessionSchema],
      required: true,
      validate: {
        validator: (sessions) => sessions.length > 0,
        message: "At least one working session is required",
      },
    },

    slotDuration: {
      type: Number,
      required: true,
      min: 5,
      max: 120,
      default: 30,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

scheduleSchema.index({ doctor: 1, isActive: 1 });

module.exports =
  mongoose.models.Schedule ||
  mongoose.model("Schedule", scheduleSchema);
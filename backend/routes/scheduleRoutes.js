
const express = require("express");
const router = express.Router();

const {
  saveSchedule,
  getDoctorSchedule,
} = require("../controllers/scheduleController");

const {
  authenticate,
  authorize,
} = require("../middlewares/authMiddleware");

// Only Super Admin can create or update schedules
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  saveSchedule
);

// Authenticated users can view a doctor's schedule
router.get(
  "/:doctorId",
  authenticate,
  getDoctorSchedule
);

module.exports = router;

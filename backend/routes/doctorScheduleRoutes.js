const express = require("express");
const router = express.Router();

const {
  getSchedules,
  createSchedule,
  updateSchedule,
} = require("../controllers/doctorScheduleController");

const {
  authenticate,
  authorize,
} = require("../middlewares/authMiddleware");

// Only Super Admin can manage schedules.
router.get(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  getSchedules
);

router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  createSchedule
);

router.patch(
  "/:id",
  authenticate,
  authorize("SUPER_ADMIN"),
  updateSchedule
);

module.exports = router;
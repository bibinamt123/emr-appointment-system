
const express = require("express");
const router = express.Router();

const { getAvailableSlots } = require("../controllers/slotController");
const { authenticate } = require("../middlewares/authMiddleware");

router.get("/:doctorId", authenticate, getAvailableSlots);

module.exports = router;

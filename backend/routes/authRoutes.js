const express = require("express");
const router = express.Router();

const {
  register,
  registerPatient,
  login,
  refresh,
  logout,
  createStaff,
  getStaff,
  updateMyProfile,
} = require("../controllers/authController");

const {
  authenticate,
  authorize,
} = require("../middlewares/authMiddleware");

// Public registration and login routes
router.post("/register-patient", registerPatient);
router.post("/login", login);

// Update the authenticated user's profile
router.patch(
  "/me/profile",
  authenticate,
  updateMyProfile
);

// Only Super Admin can create doctor and receptionist accounts
router.post(
  "/create-staff",
  authenticate,
  authorize("SUPER_ADMIN"),
  createStaff
);

// Only Super Admin can view doctors and receptionists
router.get(
  "/staff",
  authenticate,
  authorize("SUPER_ADMIN"),
  getStaff
);

// Refresh access token using a valid refresh token
router.post("/refresh", refresh);

// Revoke refresh token during logout
router.post("/logout", logout);

// Any authenticated user can access their own details
router.get("/me", authenticate, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// Only doctors can access this endpoint
router.get(
  "/doctor-dashboard",
  authenticate,
  authorize("DOCTOR"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome to the doctor dashboard",
      user: req.user,
    });
  }
);

module.exports = router;
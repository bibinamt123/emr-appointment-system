
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");

// Generate a SHA-256 hash of a refresh token.
function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Validate JWT configuration.
function jwtSecretsConfigured() {
  return Boolean(
    process.env.JWT_ACCESS_SECRET &&
    process.env.JWT_REFRESH_SECRET
  );
}

// Create an access token.
function createAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
}

// Create a refresh token.
function createRefreshToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      tokenType: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

// Store a hashed refresh token in MongoDB.
async function storeRefreshToken(userId, token) {
  return RefreshToken.create({
    user: userId,
    tokenHash: hashRefreshToken(token),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
}

// Common email validation.
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Register a doctor account.
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    if (!isValidEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "DOCTOR",
    });

    return res.status(201).json({
      success: true,
      message: "Doctor registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        specialisation: user.specialisation || "",
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    console.error("Doctor registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
};

// Register a patient account.
exports.registerPatient = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof phone !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password ||
      !phone.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and phone are required.",
      });
    }

    if (!isValidEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const patient = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "PATIENT",
    });

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully.",
      user: {
        id: patient._id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone || "",
        role: patient.role,
        specialisation: patient.specialisation || "",
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    console.error("Patient registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Patient registration failed.",
    });
  }
};

// Log in and issue access and refresh tokens.
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid email and password are required.",
      });
    }

    if (!jwtSecretsConfigured()) {
      console.error("JWT secrets are not configured.");

      return res.status(500).json({
        success: false,
        message: "Authentication service is not configured.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    await storeRefreshToken(user._id, refreshToken);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        specialisation: user.specialisation || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
};

// Refresh access and refresh tokens.
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (
      typeof refreshToken !== "string" ||
      !refreshToken
    ) {
      return res.status(401).json({
        success: false,
        message: "A valid refresh token is required.",
      });
    }

    if (!jwtSecretsConfigured()) {
      return res.status(500).json({
        success: false,
        message: "Authentication service is not configured.",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET
      );
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    if (
      decoded.tokenType !== "refresh" ||
      !decoded.userId
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    // Consume the old refresh token.
    const storedToken = await RefreshToken.findOneAndDelete({
      tokenHash: hashRefreshToken(refreshToken),
      user: decoded.userId,
      expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has been revoked or expired.",
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is unavailable.",
      });
    }

    const accessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);

    await storeRefreshToken(user._id, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Token refresh failed.",
    });
  }
};

// Log out and revoke the supplied refresh token.
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (
      typeof refreshToken !== "string" ||
      !refreshToken
    ) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    await RefreshToken.deleteOne({
      tokenHash: hashRefreshToken(refreshToken),
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
};

// Create doctor or receptionist accounts for Super Admin.
exports.createStaff = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      specialisation,
    } = req.body;

    // Validate required fields.
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, and password are required.",
      });
    }

    // Only allow doctor and receptionist accounts.
    if (!["DOCTOR", "RECEPTIONIST"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be DOCTOR or RECEPTIONIST.",
      });
    }

    // Doctor accounts require a specialisation.
    if (
      role === "DOCTOR" &&
      (
        typeof specialisation !== "string" ||
        !specialisation.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Specialisation is required for doctor accounts.",
      });
    }

    if (!isValidEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role,
    };

    // Save specialisation only for doctors.
    if (role === "DOCTOR") {
      userData.specialisation = specialisation.trim();
    }

    const user = await User.create(userData);

    return res.status(201).json({
      success: true,
      message: `${role} account created successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        specialisation: user.specialisation || "",
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    console.error("Staff creation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Staff account creation failed.",
    });
  }
};


exports.getStaff = async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ["DOCTOR", "RECEPTIONIST"] },
    })
      .select("name email phone role specialisation isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error("Get staff error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve staff details.",
    });
  }
};


// Update the currently authenticated user's profile.
exports.updateMyProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !phone.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and phone are required.",
      });
    }

    if (!isValidEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user.userId },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email address is already in use.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email phone role isActive specialisation");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone || "",
        role: updatedUser.role,
        specialisation: updatedUser.specialisation || "",
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email address is already in use.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};

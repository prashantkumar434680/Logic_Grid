const User = require("../Models/User");
const cloudinary = require("cloudinary").v2;

const CLOUDINARY_CLOUD_NAME = String(
  process.env.CLOUDINARY_CLOUD_NAME || process.env.cloudinary_cloud_name || ""
)
  .trim()
  .toLowerCase();
const CLOUDINARY_API_KEY = String(
  process.env.CLOUDINARY_API_KEY || process.env.cloudinary_api_key || ""
).trim();
const CLOUDINARY_API_SECRET = String(
  process.env.CLOUDINARY_API_SECRET || process.env.cloudinary_api_secret || ""
).trim();

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const sanitizeString = (value = "") => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const buildProfileResponse = (user) => ({
  _id: user._id,
  firstName: user.firstName,
  lastName: user.lastName || "",
  emailId: user.emailId,
  avatar: user.avatar || null,
  avatarPublicId: user.avatarPublicId || null,
  bio: user.bio || "",
  age: user.age ?? null,
  role: user.role,
  isAccountVerified: user.isAccountVerified,
});

const generateProfileImageUploadSignature = async (req, res) => {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return res.status(500).json({
        message: "Cloudinary configuration is missing on server",
      });
    }

    const userId = req.result._id;
    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `${userId}_${timestamp}`;

    const uploadParams = {
      timestamp,
      public_id: publicId,
      folder: "logicgrid-profiles",
    };

    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      signature,
      timestamp,
      public_id: publicId,
      folder: "logicgrid-profiles",
      api_key: CLOUDINARY_API_KEY,
      cloud_name: CLOUDINARY_CLOUD_NAME,
      upload_url: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to generate profile image upload credentials",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.result._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: buildProfileResponse(user),
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.result._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const firstName = sanitizeString(req.body.firstName);
    const lastName = sanitizeString(req.body.lastName);
    const bio = sanitizeString(req.body.bio);
    const avatar = sanitizeString(req.body.avatar);
    const avatarPublicId = sanitizeString(req.body.avatarPublicId);
    const removeAvatar = req.body.removeAvatar === true;

    if (!firstName || firstName.length < 3 || firstName.length > 20) {
      return res.status(400).json({
        message: "First name must be between 3 and 20 characters",
      });
    }

    if (lastName && (lastName.length < 3 || lastName.length > 20)) {
      return res.status(400).json({
        message: "Last name must be between 3 and 20 characters",
      });
    }

    if (bio.length > 200) {
      return res.status(400).json({
        message: "Bio must be 200 characters or less",
      });
    }

    let parsedAge;
    if (req.body.age !== undefined && req.body.age !== null && req.body.age !== "") {
      parsedAge = Number(req.body.age);

      if (!Number.isInteger(parsedAge) || parsedAge < 6 || parsedAge > 80) {
        return res.status(400).json({
          message: "Age must be a whole number between 6 and 80",
        });
      }
    }

    if (avatar || avatarPublicId) {
      if (!avatar || !avatarPublicId) {
        return res.status(400).json({
          message: "Both avatar URL and Cloudinary public id are required",
        });
      }

      const cloudinaryResource = await cloudinary.api.resource(avatarPublicId, {
        resource_type: "image",
      });

      if (!cloudinaryResource || cloudinaryResource.secure_url !== avatar) {
        return res.status(400).json({
          message: "Profile image verification failed",
        });
      }

      if (user.avatarPublicId && user.avatarPublicId !== avatarPublicId) {
        await cloudinary.uploader.destroy(user.avatarPublicId, {
          resource_type: "image",
          invalidate: true,
        });
      }

      user.avatar = avatar;
      user.avatarPublicId = avatarPublicId;
    }

    if (removeAvatar && user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId, {
        resource_type: "image",
        invalidate: true,
      });
      user.avatar = null;
      user.avatarPublicId = null;
    }

    user.firstName = firstName;
    user.lastName = lastName || undefined;
    user.bio = bio || undefined;
    user.age = parsedAge ?? undefined;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: buildProfileResponse(user),
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to update profile",
    });
  }
};

module.exports = {
  generateProfileImageUploadSignature,
  getProfile,
  updateProfile,
};

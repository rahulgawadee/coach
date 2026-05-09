import mongoose from 'mongoose';

const coachProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    // Account Information
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    // Company Information
    companyName: {
      type: String,
      required: true,
    },
    companyRegistrationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    governmentAgencyId: {
      type: String,
      required: true,
      unique: true,
    },
    // Professional Information
    bio: {
      type: String,
      default: '',
    },
    expertiseAreas: {
      type: [String],
      enum: ['IT', 'Healthcare', 'Construction', 'Finance', 'Education'],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
    },
    certifications: {
      type: String,
      default: '',
    },
    // Contact Information
    phoneNumber: {
      type: String,
      required: true,
    },
    contactPersonName: {
      type: String,
      default: '',
    },
    // Capacity
    maxCandidates: {
      type: Number,
      default: 15,
      min: 5,
      max: 50,
    },
    preferredWorkingHours: {
      type: Object,
      default: {
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'Europe/Stockholm',
      },
    },
    currentAssignmentCount: {
      type: Number,
      default: 0,
    },
    // Profile Media
    profilePictureUrl: {
      type: String,
      default: '',
    },
    videoIntroductionUrl: {
      type: String,
      default: '',
    },
    // Agreements
    agreeToTermsOfService: {
      type: Boolean,
      default: false,
    },
    confirmedRegisteredSupplier: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 4.9,
    },
    reviewCount: {
      type: Number,
      default: 12,
    },
    // Status
    status: {
      type: String,
      enum: ['pending', 'verified', 'active', 'inactive'],
      default: 'pending',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const CoachProfile =
  mongoose.models.CoachProfile || mongoose.model('CoachProfile', coachProfileSchema);

export default CoachProfile;

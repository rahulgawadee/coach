import mongoose from 'mongoose';

const candidateProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    currentOccupation: { type: String, default: '' },
    educationLevel: { type: String, default: '' },
    yearsExperience: { type: Number, default: 0 },
    industryPreferences: { type: [String], default: [] },
    desiredJobType: { type: String, default: '' },
    availableToStart: { type: Date, default: null },
    weeklyHoursAvailable: { type: Number, default: 0 },
    preferredMeetingTimes: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    topStrengths: { type: [String], default: [] },
    aboutYourself: { type: String, default: '' },
    supportNeeded: { type: [String], default: [] },
    hasPersonnummer: { type: String, default: 'No' },
    hasDriverLicense: { type: String, default: 'No' },
    languagesSpoken: { type: [String], default: [] },
    location: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    eligibilityStatus: { type: String, default: 'eligible' },
    profileStatus: {
      type: String,
      enum: ['incomplete', 'profile_complete', 'coach_selected'],
      default: 'incomplete',
    },
    selectedCoachId: { type: mongoose.Schema.Types.ObjectId, ref: 'CoachProfile', default: null },
    selectedCoachName: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    resumeName: { type: String, default: '' },
    employmentStatus: { type: String, default: 'Unemployed' },
    marketingConsent: { type: Boolean, default: false },
    dataConsent: { type: Boolean, default: false },
    programStartDate: { type: Date, default: null },
    programFinishDate: { type: Date, default: null },
    aiSuggestions: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const CandidateProfile =
  mongoose.models.CandidateProfile || mongoose.model('CandidateProfile', candidateProfileSchema);

export default CandidateProfile;
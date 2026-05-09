import mongoose from 'mongoose';

const candidateEligibilitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    // Form data from step 1
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    yearOfBirth: {
      type: Number,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    placeOfResidence: {
      type: String,
      required: true,
    },
    registeredWithSEA: {
      type: String,
      enum: ['Yes', 'No'],
      required: true,
    },
    eligibleForRustaOchMatcha: {
      type: String,
      enum: ['Yes', 'No', 'Dont know'],
      required: true,
    },
    lookingForJobOrTraining: {
      type: String,
      enum: ['Yes', 'No'],
      required: true,
    },
    wouldYouLikeUsToCall: {
      type: String,
      enum: ['Yes', 'No'],
      required: true,
    },
    whereDidYouHearAboutUs: {
      type: String,
      enum: ['TikTok', 'Instagram', 'Facebook', 'Google', 'Friend', 'Other'],
      required: true,
    },
    // Eligibility Result
    eligibilityStatus: {
      type: String,
      enum: ['pending', 'eligible', 'not-eligible'],
      default: 'pending',
    },
    eligibilityReason: {
      type: String,
      default: '',
    },
    eligibilityCheckedAt: {
      type: Date,
      default: null,
    },
    // Swedish Employment Agency Response
    seaCheckResult: {
      type: Object,
      default: null,
    },
    // Consent
    consentHelloLilly: {
      type: Boolean,
      required: true,
    },
    consentPrivacy: {
      type: Boolean,
      required: true,
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

const CandidateEligibility =
  mongoose.models.CandidateEligibility ||
  mongoose.model('CandidateEligibility', candidateEligibilitySchema);

export default CandidateEligibility;

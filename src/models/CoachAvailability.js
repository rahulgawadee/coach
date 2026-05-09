import mongoose from 'mongoose';

const coachAvailabilitySchema = new mongoose.Schema(
  {
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoachProfile',
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true }, // HH:mm
    reason: { type: String, default: '' },
    blocked: { type: Boolean, default: true },
    recurring: {
      type: String,
      enum: ['none', 'weekly', 'monthly'],
      default: 'none',
    },
  },
  { timestamps: true }
);

const CoachAvailability =
  mongoose.models.CoachAvailability || mongoose.model('CoachAvailability', coachAvailabilitySchema);

export default CoachAvailability;

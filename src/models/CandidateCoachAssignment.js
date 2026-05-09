import mongoose from 'mongoose';

const candidateCoachAssignmentSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoachProfile',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending_acceptance', 'accepted', 'rejected', 'cancelled'],
      default: 'pending_acceptance',
    },
    rank: { type: Number, default: 1 },
    matchScore: { type: Number, default: 0 },
    reason: { type: String, default: '' },
    assignedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const CandidateCoachAssignment =
  mongoose.models.CandidateCoachAssignment ||
  mongoose.model('CandidateCoachAssignment', candidateCoachAssignmentSchema);

export default CandidateCoachAssignment;
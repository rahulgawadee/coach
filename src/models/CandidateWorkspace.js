import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: String, enum: ['announcements', 'coach'], required: true },
    sender: { type: String, default: 'coach' },
    text: { type: String, required: true },
    attachments: [
      {
        id: String,
        fileName: String,
        fileType: String,
      },
    ],
    seen: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    folder: {
      type: String,
      enum: ['coach-shared', 'my-uploads', 'message-documents', 'signed-agreements'],
      required: true,
    },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, default: 0 },
    fileData: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    type: { type: String, enum: ['session', 'deadline'], default: 'session' },
    coachName: { type: String, default: '' },
    topic: { type: String, default: '' },
    message: { type: String, default: '' },
    status: { type: String, enum: ['confirmed', 'requested', 'updated'], default: 'confirmed' },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['message', 'calendar', 'document', 'reminder'], required: true },
    href: { type: String, default: '/candidate/dashboard' },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const candidateWorkspaceSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    firstName: { type: String, default: 'Candidate' },
    lastName: { type: String, default: '' },
    coach: {
      name: { type: String, default: 'Emma Wilson' },
      company: { type: String, default: 'Coach Mentorship AB' },
      rating: { type: Number, default: 4.8 },
      ratingCount: { type: Number, default: 127 },
      experienceYears: { type: Number, default: 9 },
      bio: {
        type: String,
        default: 'Experienced career coach helping candidates with CV, interviews, and growth plans.',
      },
      specialties: { type: [String], default: ['Career Transition', 'Interview Prep', 'CV Optimization'] },
    },
    agreement: {
      signed: { type: Boolean, default: false },
      signedAt: { type: Date, default: null },
    },
    profile: {
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      personnummer: { type: String, default: '' },
      startDate: { type: String, default: '' },
      finishDate: { type: String, default: '' },
      videoUrl: { type: String, default: '' },
      industrialFields: { type: [String], default: [] },
      skills: { type: [String], default: [] },
      employmentStatus: { type: String, default: 'Unemployed' },
      registeredWithEmploymentAgency: { type: String, default: 'Yes' },
      eligibleRustaMatcha: { type: String, default: 'Yes' },
      marketingConsent: { type: Boolean, default: false },
      dataProcessingConsent: { type: Boolean, default: false },
      bio: { type: String, default: '' },
    },
    announcements: {
      type: [
        {
          id: String,
          title: String,
          content: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [
        {
          id: 'a1',
          title: 'Welcome to Coach Program',
          content: 'Your onboarding is in progress. Please complete profile and book your first session.',
        },
      ],
    },
    events: { type: [eventSchema], default: [] },
    messages: { type: [messageSchema], default: [] },
    documents: { type: [documentSchema], default: [] },
    notifications: { type: [notificationSchema], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const CandidateWorkspace =
  mongoose.models.CandidateWorkspace || mongoose.model('CandidateWorkspace', candidateWorkspaceSchema);

export default CandidateWorkspace;

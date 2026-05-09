import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    rating: { type: Number, default: 4.8 },
    successRate: { type: Number, default: 95 },
    industry: { type: String, default: '' },
    testimonial: { type: String, default: '' },
    specialties: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

export default Company;

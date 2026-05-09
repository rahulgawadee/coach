import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Company from '@/models/Company';

const COMPANY_SEED = [
  {
    name: 'TechStart Mentorship',
    rating: 4.9,
    successRate: 98,
    industry: 'IT & Technology',
    testimonial: 'Excellent mentorship program with proven results in career advancement.',
    specialties: ['Leadership', 'Career Growth', 'Tech Skills'],
  },
  {
    name: 'Healthcare Careers',
    rating: 4.8,
    successRate: 96,
    industry: 'Healthcare',
    testimonial: 'Supporting healthcare professionals to reach their full potential.',
    specialties: ['Clinical Skills', 'Management', 'Specialization'],
  },
  {
    name: 'Financial Excellence',
    rating: 4.7,
    successRate: 94,
    industry: 'Finance',
    testimonial: 'Leading mentorship for financial professionals and aspiring analysts.',
    specialties: ['Investment', 'Trading', 'Analysis'],
  },
  {
    name: 'Creative Industries Hub',
    rating: 4.6,
    successRate: 92,
    industry: 'Creative',
    testimonial: 'Empowering creative talents to build successful careers.',
    specialties: ['Portfolio Building', 'Networking', 'Innovation'],
  },
  {
    name: 'Education Leaders',
    rating: 4.8,
    successRate: 95,
    industry: 'Education',
    testimonial: 'Transforming educational careers through expert guidance.',
    specialties: ['Teaching', 'Administration', 'Curriculum Design'],
  },
  {
    name: 'Construction & Engineering',
    rating: 4.7,
    successRate: 93,
    industry: 'Construction',
    testimonial: 'Building careers in construction and engineering fields.',
    specialties: ['Project Management', 'Technical Skills', 'Leadership'],
  },
];

export async function GET() {
  try {
    await dbConnect();

    const existingCount = await Company.countDocuments();
    if (existingCount === 0) {
      await Company.insertMany(COMPANY_SEED);
    }

    const companies = await Company.find({ active: true }).sort({ successRate: -1, rating: -1 });

    return NextResponse.json({
      success: true,
      companies: companies.map((company) => ({
        id: company._id.toString(),
        name: company.name,
        rating: company.rating,
        successRate: company.successRate,
        industry: company.industry,
        testimonial: company.testimonial,
        specialties: company.specialties,
      })),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load companies' }, { status: 500 });
  }
}

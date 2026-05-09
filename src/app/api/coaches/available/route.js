import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CoachProfile from '@/models/CoachProfile';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';

const coachTestimonials = {
  IT: 'Anna helped me land my first developer role!',
  Healthcare: 'Great support through the whole process.',
  Finance: 'Very structured and insightful guidance.',
  Construction: 'Practical advice that matched my goals.',
  Education: 'Excellent support and encouragement.',
};

export async function GET() {
  try {
    await dbConnect();

    const coaches = await CoachProfile.find({ status: { $in: ['active', 'verified', 'pending'] } }).sort({ createdAt: -1 });

    const assignedCounts = await CandidateCoachAssignment.aggregate([
      { $match: { status: { $in: ['pending_acceptance', 'accepted'] } } },
      { $group: { _id: '$coachId', count: { $sum: 1 } } },
    ]);

    const countMap = Object.fromEntries(
      assignedCounts.map((item) => [item._id.toString(), item.count])
    );

    const data = coaches.map((coach) => ({
      coachId: coach._id,
      name: coach.fullName,
      bio: coach.bio,
      companyName: coach.companyName,
      companyCity: coach.preferredWorkingHours?.timezone?.includes('Stockholm') ? 'Stockholm' : 'Stockholm',
      expertiseAreas: coach.expertiseAreas,
      rating: 4.8,
      reviewsCount: 124,
      successRate: 92,
      currentCandidates: countMap[coach._id.toString()] || coach.currentAssignmentCount || 0,
      maxCapacity: coach.maxCandidates,
      languages: ['Swedish', 'English'],
      certifications: coach.certifications,
      videoIntroductionUrl: coach.videoIntroductionUrl,
      profilePictureUrl: coach.profilePictureUrl,
      testimonials: [coachTestimonials[coach.expertiseAreas?.[0]] || 'A reliable and supportive coach.'],
      availabilitySlots: [
        { day: 'Monday', time: '09:00-12:00' },
        { day: 'Wednesday', time: '13:00-16:00' },
        { day: 'Friday', time: '10:00-14:00' },
      ],
    }));

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to load coaches' }, { status: 500 });
  }
}
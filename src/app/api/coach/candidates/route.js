import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CoachProfile from '@/models/CoachProfile';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';
import CandidateWorkspace from '@/models/CandidateWorkspace';
import CandidateProfile from '@/models/CandidateProfile';

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const result = verifyToken(token);
    if (!result.valid) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    await dbConnect();

    const user = await User.findById(result.userId);
    if (!user || (user.role !== 'Coach' && user.role !== 'coach')) {
      return NextResponse.json({ success: false, error: 'Forbidden: Coach access only' }, { status: 403 });
    }

    const coachProfile = await CoachProfile.findOne({ userId: result.userId });
    if (!coachProfile) return NextResponse.json({ success: false, error: 'Coach profile not found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // IMPORTANT: coachId in assignment refers to the CoachProfile ID, not User ID
    let query = { coachId: coachProfile._id };
    if (status !== 'all') query.status = status;

    const assignments = await CandidateCoachAssignment.find(query)
      .populate('candidateId', 'firstName lastName email phone name')
      .lean();

    const candidates = await Promise.all(
      assignments.map(async (a) => {
        const workspace = await CandidateWorkspace.findOne({ userId: a.candidateId._id }).lean();
        const profile = await CandidateProfile.findOne({ userId: a.candidateId._id }).lean();
        
        const lastSession = workspace?.events?.sort((b, x) => new Date(x.date) - new Date(b.date))[0];
        const nextSession = workspace?.events?.find(e => new Date(e.date) > new Date() && e.status === 'confirmed');

        const fName = profile?.firstName || a.candidateId.firstName || a.candidateId.name?.split(' ')[0] || 'Candidate';
        const lName = profile?.lastName || a.candidateId.lastName || a.candidateId.name?.split(' ').slice(1).join(' ') || '';

        return {
          id: a._id,
          candidateId: a.candidateId._id,
          name: `${fName} ${lName}`.trim(),
          email: a.candidateId.email,
          phone: a.candidateId.phone || profile?.phone || '',
          startDate: a.startDate || a.assignedAt,
          progress: calculateProgress(workspace, profile),
          lastSessionDate: lastSession?.date || null,
          nextSessionDate: nextSession?.date || null,
          status: a.status,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: candidates
    });
  } catch (error) {
    console.error('Get coach candidates error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function calculateProgress(workspace, profile) {
  if (!workspace && !profile) return 0;
  
  let score = 10;
  if (profile?.skills?.length > 0) score += 15;
  if (workspace?.agreement?.signed) score += 10;
  
  const completedSessions = workspace?.events?.filter(e => e.status === 'confirmed' && new Date(e.date) < new Date()).length || 0;
  score += Math.min(completedSessions * 10, 40);
  
  const docs = workspace?.documents?.length || 0;
  score += Math.min(docs * 5, 25);
  
  return Math.min(score, 100);
}

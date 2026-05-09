import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';
import CandidateWorkspace from '@/models/CandidateWorkspace';

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user || user.role?.toLowerCase() !== 'coach') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const skip = (page - 1) * limit;

    let query = { coachId: user._id };

    // Filter by status
    if (status !== 'all') {
      query.status = status;
    }

    // Search filter
    if (search) {
      // This would require populated candidate data; simplified here
      query.$or = [
        { candidateName: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await CandidateCoachAssignment.countDocuments(query);
    const assignments = await CandidateCoachAssignment.find(query)
      .skip(skip)
      .limit(limit)
      .populate('candidateId', 'firstName lastName email phone')
      .lean();

    const candidates = await Promise.all(
      assignments.map(async (a) => {
        const workspace = await CandidateWorkspace.findOne({ userId: a.candidateId._id }).lean();
        const profile = await CandidateProfile.findOne({ userId: a.candidateId._id }).lean();
        
        const lastSession = workspace?.events?.sort((b, a) => new Date(a.date) - new Date(b.date))[0];
        const nextSession = workspace?.events?.find(e => new Date(e.date) > new Date() && e.status === 'confirmed');

        const fName = profile?.firstName || a.candidateId.name?.split(' ')[0] || 'Candidate';
        const lName = profile?.lastName || a.candidateId.name?.split(' ').slice(1).join(' ') || '';

        return {
          id: a._id,
          candidateId: a.candidateId._id,
          name: `${fName} ${lName}`.trim(),
          email: a.candidateId.email,
          phone: a.candidateId.phone || profile?.phone || '',
          startDate: a.startDate,
          progress: calculateProgress(workspace),
          lastSessionDate: lastSession?.date || null,
          nextSessionDate: nextSession?.date || null,
          status: a.status,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: candidates,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get coach candidates error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function calculateProgress(workspace) {
  if (!workspace) return 0;
  const completedEvents = workspace.events?.filter(e => e.status === 'completed').length || 0;
  const totalEvents = workspace.events?.length || 1;
  return Math.round((completedEvents / totalEvents) * 100);
}

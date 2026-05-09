import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CandidateWorkspace from '@/models/CandidateWorkspace';

export async function GET(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const { id } = params;

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'Coach') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const workspace = await CandidateWorkspace.findOne({ userId: id }).lean();
    if (!workspace) return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });

    const candidateUser = await User.findById(id).lean();
    if (!candidateUser) return NextResponse.json({ success: false, error: 'Candidate user not found' }, { status: 404 });

    const sessionsAttended = workspace.events?.filter(e => e.status === 'completed').length || 0;
    const documentsSubmitted = workspace.documents?.length || 0;
    const recentActivity = getRecentActivity(workspace);

    const candidateData = {
      id: candidateUser._id,
      name: `${candidateUser.firstName} ${candidateUser.lastName}`,
      email: candidateUser.email,
      phone: candidateUser.phone,
      address: candidateUser.address,
      personnummer: candidateUser.personnummer,

      startDate: workspace.coach?.startDate,
      expectedFinishDate: workspace.coach?.endDate,
      progress: calculateProgress(workspace),

      sessionsAttended,
      documentsSubmitted,
      assignmentsCompleted: workspace.assignments?.filter(a => a.completed).length || 0,

      recentActivity,
      events: workspace.events || [],
      documents: workspace.documents || [],
      notes: workspace.coachNotes || [],
      sessions: workspace.sessions || [],
    };

    return NextResponse.json({ success: true, data: candidateData });
  } catch (error) {
    console.error('Get candidate detail error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function calculateProgress(workspace) {
  if (!workspace) return 0;
  const events = workspace.events?.filter(e => e.status === 'completed').length || 0;
  const total = workspace.events?.length || 1;
  return Math.round((events / total) * 100);
}

function getRecentActivity(workspace) {
  const activity = [];

  if (workspace.documents?.length > 0) {
    workspace.documents.slice(0, 3).forEach(doc => {
      activity.push({ type: 'document', message: `Uploaded ${doc.fileName}`, date: doc.uploadedAt });
    });
  }

  if (workspace.events?.length > 0) {
    workspace.events.filter(e => e.status === 'completed').slice(0, 3).forEach(event => {
      activity.push({ type: 'session', message: `Attended ${event.type || 'session'} on ${event.date}`, date: event.date });
    });
  }

  return activity.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
}

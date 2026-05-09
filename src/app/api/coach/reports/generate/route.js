import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';
import CandidateWorkspace from '@/models/CandidateWorkspace';

export async function POST(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { candidateId, dateStart, dateEnd, reportType } = body;

    if (!candidateId) return NextResponse.json({ success: false, error: 'Missing candidateId' }, { status: 400 });

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'Coach') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const workspace = await CandidateWorkspace.findOne({ userId: candidateId }).lean();
    if (!workspace) return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });

    const candidateUser = await User.findById(candidateId).lean();

    // Filter events by date range if provided
    let events = workspace.events || [];
    if (dateStart || dateEnd) {
      events = events.filter(e => {
        const eventDate = new Date(e.date);
        if (dateStart && eventDate < new Date(dateStart)) return false;
        if (dateEnd && eventDate > new Date(dateEnd)) return false;
        return true;
      });
    }

    const sessionsAttended = events.filter(e => e.status === 'completed').length;
    const sessionRequests = events.filter(e => e.status === 'requested').length;
    const documentsSubmitted = workspace.documents?.length || 0;

    const report = {
      candidateSummary: {
        name: `${candidateUser.firstName} ${candidateUser.lastName}`,
        email: candidateUser.email,
        coachName: `${user.firstName} ${user.lastName}`,
        startDate: workspace.coach?.startDate,
        status: 'active',
        overallProgress: calculateProgress(workspace),
        daysActive: Math.floor((new Date() - new Date(workspace.coach?.startDate)) / (1000 * 60 * 60 * 24)),
        sessionsCompleted: sessionsAttended,
        documentsSubmitted,
      },
      progressMetrics: {
        sessions: { completed: sessionsAttended, total: events.length },
        documents: { submitted: documentsSubmitted, required: 5 },
        engagement: calculateEngagement(events),
      },
      sessionHistory: events
        .filter(e => e.status === 'completed')
        .map(e => ({
          date: e.date,
          type: e.type || 'Coaching',
          duration: e.duration || 'N/A',
          attendance: 'Present',
          notes: e.notes || '',
        })),
      documentActivity: {
        uploaded: workspace.documents || [],
        shared: [],
        pending: [],
      },
      timeline: generateTimeline(workspace),
    };

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function calculateProgress(workspace) {
  if (!workspace) return 0;
  const completed = workspace.events?.filter(e => e.status === 'completed').length || 0;
  const total = workspace.events?.length || 1;
  return Math.round((completed / total) * 100);
}

function calculateEngagement(events) {
  if (!events || events.length === 0) return 0;
  const completed = events.filter(e => e.status === 'completed').length;
  return Math.round((completed / events.length) * 100);
}

function generateTimeline(workspace) {
  const timeline = [];

  if (workspace.events) {
    workspace.events.slice(0, 10).forEach(e => {
      timeline.push({ type: 'session', message: `${e.type || 'Session'} on ${e.date}`, date: e.date });
    });
  }

  if (workspace.documents) {
    workspace.documents.slice(0, 10).forEach(d => {
      timeline.push({ type: 'document', message: `${d.fileName} uploaded`, date: d.uploadedAt });
    });
  }

  return timeline.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
}

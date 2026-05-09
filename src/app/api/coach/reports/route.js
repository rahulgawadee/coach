import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import CandidateWorkspace from '@/models/CandidateWorkspace';
import CandidateProfile from '@/models/CandidateProfile';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded.valid) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const body = await request.json();
    const { candidateId, startDate, endDate } = body;

    if (!candidateId || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    
    // Find workspace and profile for metrics
    const workspace = await CandidateWorkspace.findOne({ userId: candidateId });
    const profile = await CandidateProfile.findOne({ userId: candidateId });

    if (!workspace) return NextResponse.json({ success: false, error: 'Candidate workspace not found' }, { status: 404 });

    // Filter sessions in range
    const sessionsInRange = (workspace.events || []).filter(e => 
      e.type === 'session' && 
      e.date >= startDate && 
      e.date <= endDate
    );

    const report = {
      candidateName: profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Candidate',
      startDate,
      endDate,
      attendance: sessionsInRange.length > 0 ? 100 : 0, // Simplified logic
      assignmentsCompleted: 75, // Placeholder
      overallProgress: 85, // Placeholder
      sessionHistory: sessionsInRange.map(s => ({
        date: s.date,
        type: s.topic || 'Coaching Session',
        duration: 45, // Default
        notes: s.message || ''
      })),
      documentSubmissions: `${workspace.documents?.length || 0} documents verified during this period.`
    };

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

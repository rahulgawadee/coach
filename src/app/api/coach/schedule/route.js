import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CoachProfile from '@/models/CoachProfile';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';
import CandidateWorkspace from '@/models/CandidateWorkspace';
import CandidateProfile from '@/models/CandidateProfile';
import CoachAvailability from '@/models/CoachAvailability';

export async function GET(request) {
  try {
    await dbConnect();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded.valid) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const coachUserId = decoded.userId;
    const coachUser = await User.findById(coachUserId);
    if (!coachUser || (coachUser.role !== 'Coach' && coachUser.role !== 'coach')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const coachProfile = await CoachProfile.findOne({ userId: coachUserId });
    if (!coachProfile) return NextResponse.json({ success: false, error: 'Coach profile not found' }, { status: 404 });

    const assignments = await CandidateCoachAssignment.find({ coachId: coachProfile._id, status: 'accepted' })
      .populate('candidateId', 'name email');

    const confirmedSessions = [];
    const pendingRequests = [];

    for (const assignment of assignments) {
      const candidateUserId = assignment.candidateId._id.toString();
      const workspace = await CandidateWorkspace.findOne({ userId: candidateUserId });
      const profile = await CandidateProfile.findOne({ userId: candidateUserId });
      
      if (!workspace) continue;

      const fName = profile?.firstName || assignment.candidateId.name?.split(' ')[0] || 'Candidate';
      const lName = profile?.lastName || assignment.candidateId.name?.split(' ').slice(1).join(' ') || '';
      const fullName = `${fName} ${lName}`.trim();

      for (const ev of workspace.events || []) {
        const enriched = {
          ...ev._doc || ev,
          candidateId: candidateUserId,
          candidateName: fullName,
        };

        if (ev.status === 'confirmed') confirmedSessions.push(enriched);
        else if (ev.status === 'requested') pendingRequests.push(enriched);
      }
    }

    const blockedSlots = await CoachAvailability.find({ coachId: coachProfile._id, blocked: true });

    return NextResponse.json({ success: true, schedule: { confirmedSessions, pendingRequests, blockedSlots } });
  } catch (error) {
    console.error('Coach schedule error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded.valid) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const coachUserId = decoded.userId;
    const coachUser = await User.findById(coachUserId);
    
    const body = await request.json();
    const { candidateUserIds, date, startTime, endTime, sessionType, meetingLink, notes } = body;
    
    // Support both single ID (backward compatibility) and multiple IDs
    const targetIds = Array.isArray(candidateUserIds) ? candidateUserIds : (body.candidateUserId ? [body.candidateUserId] : []);

    if (targetIds.length === 0 || !date || !startTime) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const sessionsCreated = [];

    for (const cId of targetIds) {
      const workspace = await CandidateWorkspace.findOne({ userId: cId });
      if (!workspace) continue;

      const event = {
        id: `evt_${Math.random().toString(36).slice(2, 9)}`,
        title: `${sessionType} with ${coachUser.name || 'Coach'}`,
        date,
        time: startTime,
        type: 'session',
        coachName: coachUser.name || '',
        topic: sessionType,
        message: notes || '',
        status: 'confirmed',
      };

      workspace.events.push(event);
      workspace.notifications.push({
        id: `notif_${Math.random().toString(36).slice(2, 9)}`,
        title: 'New Session Scheduled',
        message: `A session was scheduled for ${date} at ${startTime} with your coach.`,
        type: 'calendar',
        href: '/candidate/calendar',
        read: false,
      });

      await workspace.save();
      sessionsCreated.push(event);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sessions created for ${sessionsCreated.length} candidates`,
      sessions: sessionsCreated 
    });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

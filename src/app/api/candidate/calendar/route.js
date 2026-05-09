import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { createId, getWorkspaceByEmail } from '@/lib/candidateWorkspace';
import CandidateProfile from '@/models/CandidateProfile';
import CoachAvailability from '@/models/CoachAvailability';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    await dbConnect();
    const { workspace } = await getWorkspaceByEmail(email);
    
    // Get real-time coach availability
    let coachAvailability = [];
    let coachName = workspace.coach?.name || 'Your Coach';

    // Find the candidate's profile to get the real coach ID
    const profile = await CandidateProfile.findOne({ 
      userId: workspace.userId 
    });

    if (profile?.selectedCoachId) {
      // Fetch availability from the CoachAvailability model for this specific coach
      coachAvailability = await CoachAvailability.find({
        coachId: profile.selectedCoachId,
        blocked: true
      }).lean();
      
      if (profile.selectedCoachName) {
        coachName = profile.selectedCoachName;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        events: workspace.events || [],
        coachAvailability: coachAvailability.map(a => ({
          date: a.date,
          startTime: a.startTime,
          endTime: a.endTime,
          blocked: a.blocked
        })),
        coachName
      },
    });
  } catch (error) {
    console.error('Calendar GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, preferredDate, preferredTime, topic, message } = body;

    if (!email || !preferredDate || !preferredTime || !topic) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const { workspace } = await getWorkspaceByEmail(email);

    const eventId = createId('evt');
    workspace.events.push({
      id: eventId,
      title: `Session: ${topic}`,
      date: preferredDate,
      time: preferredTime,
      type: 'session',
      coachName: workspace.coach.name,
      topic,
      message: message || '',
      status: 'requested',
    });

    workspace.notifications.push({
      id: createId('notif'),
      title: 'Session Request Sent',
      message: `Your session request for ${preferredDate} at ${preferredTime} has been sent to your coach.`,
      type: 'calendar',
      href: '/candidate/calendar',
      read: false,
    });

    await workspace.save();

    return NextResponse.json({ success: true, message: 'Session request submitted', eventId });
  } catch (error) {
    console.error('Calendar POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

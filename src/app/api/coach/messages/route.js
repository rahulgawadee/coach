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
    await dbConnect();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let coachUserId;
    try {
      const decoded = verifyToken(token);
      coachUserId = decoded.userId;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const coachUser = await User.findById(coachUserId);
    if (!coachUser || (coachUser.role !== 'Coach' && coachUser.role !== 'coach')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const coachProfile = await CoachProfile.findOne({ userId: coachUserId });
    if (!coachProfile) return NextResponse.json({ success: false, error: 'Coach profile not found' }, { status: 404 });

    const assignments = await CandidateCoachAssignment.find({ coachId: coachProfile._id, status: 'accepted' })
      .populate('candidateId', 'name email');

    const conversations = [];
    for (const a of assignments) {
      const candidateUserId = a.candidateId._id.toString();
      const workspace = await CandidateWorkspace.findOne({ userId: candidateUserId });
      const profile = await CandidateProfile.findOne({ userId: candidateUserId });
      
      const allMessages = workspace?.messages?.filter((m) => m.conversation === 'coach') || [];
      const lastMessage = allMessages.at(-1) || null;
      const unreadCount = allMessages.filter((m) => m.sender === 'candidate' && !m.seen).length;

      const firstName = profile?.firstName || a.candidateId.name?.split(' ')[0] || 'Candidate';
      const lastName = profile?.lastName || a.candidateId.name?.split(' ').slice(1).join(' ') || '';

      conversations.push({ 
        id: candidateUserId, 
        candidateName: `${firstName} ${lastName}`.trim(), 
        lastMessage: lastMessage?.text || '', 
        unreadCount,
        avatar: profile?.profileImage || null
      });
    }

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('Coach messages GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let coachUserId;
    try {
      const decoded = verifyToken(token);
      coachUserId = decoded.userId;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, message } = body;
    if (!conversationId || !message) return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 });

    const workspace = await CandidateWorkspace.findOne({ userId: conversationId });
    if (!workspace) return NextResponse.json({ success: false, error: 'Candidate workspace not found' }, { status: 404 });

    const msg = { 
      id: `msg_${Date.now()}`, 
      conversation: 'coach', 
      sender: 'coach', 
      text: message, 
      createdAt: new Date().toISOString() 
    };
    
    workspace.messages = workspace.messages || [];
    workspace.messages.push(msg);

    workspace.notifications = workspace.notifications || [];
    workspace.notifications.push({ 
      id: `notif_${Date.now()}`, 
      title: 'New Message', 
      message: message.slice(0, 200), 
      type: 'message', 
      href: '/candidate/messages', 
      read: false 
    });

    await workspace.save();

    return NextResponse.json({ success: true, message: 'Sent', msg });
  } catch (error) {
    console.error('Coach messages POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

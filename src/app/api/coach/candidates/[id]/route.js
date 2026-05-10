import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import User from '@/models/User';
import CandidateWorkspace from '@/models/CandidateWorkspace';
import CandidateProfile from '@/models/CandidateProfile';

export async function GET(request, { params }) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'Coach') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const workspace = await CandidateWorkspace.findOne({ userId: id }).lean();
    if (!workspace) return NextResponse.json({ success: false, error: 'Candidate workspace not found' }, { status: 404 });

    const candidateUser = await User.findById(id).lean();
    if (!candidateUser) return NextResponse.json({ success: false, error: 'Candidate user not found' }, { status: 404 });

    const profile = await CandidateProfile.findOne({ userId: id }).lean();

    const sessionsAttended = workspace.events?.filter(e => e.status === 'confirmed' && new Date(e.date) < new Date()).length || 0;
    const documentsSubmitted = workspace.documents?.length || 0;
    const recentActivity = getRecentActivity(workspace);

    const candidateData = {
      id: candidateUser._id,
      name: `${candidateUser.firstName || ''} ${candidateUser.lastName || ''}`.trim() || candidateUser.name || 'Candidate',
      email: candidateUser.email,
      phone: profile?.phone || candidateUser.phone,
      address: profile?.address || candidateUser.address,
      personnummer: profile?.personnummer || candidateUser.personnummer,
      avatarUrl: profile?.avatarUrl || '',
      
      // Professional Profile
      profile: profile ? {
        occupation: profile.currentOccupation,
        education: profile.educationLevel,
        experience: profile.yearsExperience,
        industryPreferences: profile.industryPreferences,
        desiredJobType: profile.desiredJobType,
        skills: profile.skills,
        about: profile.aboutYourself,
        strengths: profile.topStrengths,
        languages: profile.languagesSpoken,
        location: profile.location,
        hasDriverLicense: profile.hasDriverLicense,
        videoUrl: profile.videoUrl,
      } : null,

      startDate: workspace.createdAt,
      progress: calculateProgress(workspace, profile),

      sessionsAttended,
      documentsSubmitted,
      assignmentsCompleted: 0,

      recentActivity,
      events: workspace.events || [],
      documents: workspace.documents || [],
      notifications: workspace.notifications || [],
    };

    return NextResponse.json({ success: true, data: candidateData });
  } catch (error) {
    console.error('Get candidate detail error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

function calculateProgress(workspace, profile) {
  let score = 10;
  if (profile?.skills?.length > 0) score += 15;
  if (workspace?.agreement?.signed) score += 10;
  
  const completedSessions = workspace?.events?.filter(e => e.status === 'confirmed' && new Date(e.date) < new Date()).length || 0;
  score += Math.min(completedSessions * 10, 40);
  
  const docs = workspace?.documents?.length || 0;
  score += Math.min(docs * 5, 25);
  
  return Math.min(score, 100);
}

function getRecentActivity(workspace) {
  const activity = [];

  if (workspace.documents?.length > 0) {
    workspace.documents.slice(-3).forEach(doc => {
      activity.push({ type: 'document', message: `Uploaded ${doc.fileName}`, date: doc.uploadedAt });
    });
  }

  if (workspace.events?.length > 0) {
    workspace.events.filter(e => e.status === 'confirmed').slice(-3).forEach(event => {
      activity.push({ type: 'session', message: `Session: ${event.title}`, date: event.date });
    });
  }

  return activity.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
}

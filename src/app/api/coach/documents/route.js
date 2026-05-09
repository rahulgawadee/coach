import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import CoachProfile from '@/models/CoachProfile';
import CandidateWorkspace from '@/models/CandidateWorkspace';
import CandidateCoachAssignment from '@/models/CandidateCoachAssignment';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1] || request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded.valid) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

    await dbConnect();
    const coachUserId = decoded.userId;
    const coachProfile = await CoachProfile.findOne({ userId: coachUserId });
    
    if (!coachProfile) return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });

    // Aggregate documents from assigned candidates
    const assignments = await CandidateCoachAssignment.find({ 
      coachId: coachProfile._id,
      status: 'accepted'
    }).populate('candidateId');

    const candidateDocuments = [];
    for (const assignment of assignments) {
      const workspace = await CandidateWorkspace.findOne({ userId: assignment.candidateId._id });
      if (workspace && workspace.documents) {
        workspace.documents.forEach(doc => {
          candidateDocuments.push({
            id: doc.id,
            name: doc.fileName,
            size: `${(doc.fileSize / 1024).toFixed(1)} KB`,
            candidateName: assignment.candidateId.name || 'Candidate',
            uploadedAt: doc.uploadedAt
          });
        });
      }
    }

    // Mock other folders for now
    const folders = {
      sharedWithAll: [
        { id: 'sa1', name: 'Mentorship Program Guide.pdf', size: '1.2 MB' },
        { id: 'sa2', name: 'Code of Conduct.pdf', size: '450 KB' }
      ],
      candidateDocuments: candidateDocuments,
      messageDocuments: []
    };

    return NextResponse.json({ success: true, folders });
  } catch (error) {
    console.error('Coach documents error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  // In a real app, we'd save to S3/Cloudinary and update a database
  return NextResponse.json({ 
    success: true, 
    message: 'Upload simulated',
    folders: { sharedWithAll: [], candidateDocuments: [], messageDocuments: [] } 
  });
}

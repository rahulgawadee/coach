import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import CandidateWorkspace from '@/models/CandidateWorkspace';

function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nextSessionSeed(coachName) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  return [
    {
      id: id('evt'),
      title: 'Coaching Session',
      date: `${y}-${m}-${d}`,
      time: '15:00',
      type: 'session',
      coachName,
      topic: 'Career advice',
      status: 'confirmed',
    },
  ];
}

export async function getWorkspaceByEmail(email) {
  await dbConnect();
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error('User not found');
  }

  let workspace = await CandidateWorkspace.findOne({ userId: user._id.toString() });

  if (!workspace) {
    const firstName = user.name ? user.name.split(' ')[0] : 'Candidate';
    workspace = await CandidateWorkspace.create({
      userId: user._id.toString(),
      firstName,
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      events: nextSessionSeed('Emma Wilson'),
      messages: [
        {
          conversation: 'announcements',
          sender: 'company',
          text: 'Welcome! Your program starts now. Please upload your CV in Documents.',
          seen: false,
        },
      ],
      notifications: [
        {
          id: id('notif'),
          title: 'New Announcement',
          message: 'Welcome! Please complete your profile.',
          type: 'reminder',
          href: '/candidate/dashboard',
          read: false,
        },
      ],
    });
  }

  return { workspace, user };
}

export function createId(prefix) {
  return id(prefix);
}

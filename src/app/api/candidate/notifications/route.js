import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import CandidateWorkspace from '@/models/CandidateWorkspace';
import { getWorkspaceByEmail } from '@/lib/candidateWorkspace';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const filter = searchParams.get('filter') || 'all';

    let workspace;

    if (email) {
      // Legacy email-based access
      const result = await getWorkspaceByEmail(email);
      workspace = result.workspace;
    } else {
      // Token-based access
      const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
      if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

      const decoded = verifyToken(token);
      if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

      await dbConnect();
      workspace = await CandidateWorkspace.findOne({ userId: decoded.userId }).lean();
      if (!workspace) return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0 } });
    }

    let notifications = workspace.notifications || [];

    // Apply filter
    if (filter !== 'all') {
      if (filter === 'unread') notifications = notifications.filter(n => !n.read);
      else notifications = notifications.filter(n => n.type === filter);
    }

    // Sort by date descending
    notifications = notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const total = notifications.length;
    const skip = (page - 1) * limit;
    const paginatedNotifications = notifications.slice(skip, skip + limit);

    return NextResponse.json({
      success: true,
      data: paginatedNotifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { email, notificationId, markAsRead } = body;

    let workspace;

    if (email) {
      // Legacy email-based access
      const result = await getWorkspaceByEmail(email);
      workspace = result.workspace;
    } else {
      // Token-based access
      const token = request.headers.get('Authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
      if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

      const decoded = verifyToken(token);
      if (!decoded) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });

      await dbConnect();
      workspace = await CandidateWorkspace.findOne({ userId: decoded.userId });
      if (!workspace) return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    if (notificationId) {
      // Mark specific notification
      workspace.notifications = workspace.notifications.map(n =>
        n.id === notificationId ? { ...n, read: markAsRead !== false } : n
      );
    } else {
      // Mark all as read
      workspace.notifications = workspace.notifications.map(n => ({ ...n, read: true }));
    }

    await workspace.save();

    return NextResponse.json({ success: true, message: 'Notifications updated' });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

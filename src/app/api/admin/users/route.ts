import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { getAllUsers, updateUserProfile, deactivateUser } from '@/lib/database';
import { AdminUserListResponse } from '@/types';

// GET - List all users (admin only)
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const users = await getAllUsers();
    
    const response: AdminUserListResponse = {
      success: true,
      users,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list users' },
      { status: 500 }
    );
  }
});

// PUT - Update user (admin only)
export const PUT = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    const { userId, updates } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent admins from demoting themselves
    if (userId === adminUser.uid && updates.role === 'user') {
      return NextResponse.json(
        { success: false, error: 'Cannot demote yourself from admin role' },
        { status: 400 }
      );
    }

    await updateUserProfile(userId, updates);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
});

// DELETE - Deactivate user (admin only)
export const DELETE = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent admins from deactivating themselves
    if (userId === adminUser.uid) {
      return NextResponse.json(
        { success: false, error: 'Cannot deactivate yourself' },
        { status: 400 }
      );
    }

    await deactivateUser(userId, adminUser.uid);

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate user' },
      { status: 500 }
    );
  }
});
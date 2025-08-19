import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { 
  grantBucketPermission, 
  setBucketPermissions,
  revokeBucketPermission, 
  getAllUserPermissions,
  getUserProfile 
} from '@/lib/database';
import { AdminPermissionRequest, AdminPermissionResponse } from '@/types';

// POST - Grant bucket permission to user (admin only)
export const POST = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    const permissionData: AdminPermissionRequest = await request.json();
    const { userId, bucketName, permissions } = permissionData;
    
    if (!userId || !bucketName || !permissions || permissions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User ID, bucket name, and permissions are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    await grantBucketPermission(userId, bucketName, permissions, adminUser.uid);

    const response: AdminPermissionResponse = {
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error granting permission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to grant permission' },
      { status: 500 }
    );
  }
});

// DELETE - Revoke bucket permission from user (admin only)
export const DELETE = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const bucketName = searchParams.get('bucketName');
    
    if (!userId || !bucketName) {
      return NextResponse.json(
        { success: false, error: 'User ID and bucket name are required' },
        { status: 400 }
      );
    }

    await revokeBucketPermission(userId, bucketName, adminUser.uid);

    const response: AdminPermissionResponse = {
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error revoking permission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke permission' },
      { status: 500 }
    );
  }
});

// PUT - Update bucket permission for user (admin only)
export const PUT = withAdminAuth(async (request: NextRequest, adminUser) => {
  try {
    const permissionData: AdminPermissionRequest = await request.json();
    const { userId, bucketName, permissions } = permissionData;
    
    if (!userId || !bucketName || !permissions) {
      return NextResponse.json(
        { success: false, error: 'User ID, bucket name, and permissions are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update permissions (this will replace existing permissions for this bucket)
    await setBucketPermissions(userId, bucketName, permissions, adminUser.uid);

    const response: AdminPermissionResponse = {
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating permission:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update permission' },
      { status: 500 }
    );
  }
});

// GET - Get user permissions (admin only)
export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const permissions = await getAllUserPermissions(userId);

    return NextResponse.json({
      success: true,
      permissions,
    });
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user permissions' },
      { status: 500 }
    );
  }
});
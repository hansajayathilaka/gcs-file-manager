import { NextRequest } from 'next/server';
import { getFirebaseAdminAuth } from './firebase-admin';
import { getUserProfile, hasUserBucketAccess, isUserAdmin, getAllUserPermissions } from './database';
import { UserProfile, UserRole } from '@/types';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  profile: UserProfile;
}

export class AuthenticationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public statusCode: number = 403) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function verifyAuth(request: NextRequest): Promise<AuthenticatedUser> {
  // Try to get token from Authorization header first
  let token = request.headers.get('authorization');
  if (token && token.startsWith('Bearer ')) {
    token = token.substring(7);
  } else {
    // Fallback to query parameter for streaming endpoints
    const url = new URL(request.url);
    token = url.searchParams.get('token');
  }

  if (!token) {
    throw new AuthenticationError('No authorization token provided');
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
    
    // Get user profile from database
    const profile = await getUserProfile(decodedToken.uid);
    
    if (!profile) {
      throw new AuthenticationError('User profile not found');
    }

    if (!profile.isActive) {
      throw new AuthenticationError('User account is deactivated');
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || profile.email,
      profile,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Invalid authorization token');
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  return await verifyAuth(request);
}

export async function requireRole(
  request: NextRequest,
  requiredRole: UserRole
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);
  
  if (user.profile.role !== requiredRole) {
    throw new AuthorizationError(`Access denied. ${requiredRole} role required.`);
  }
  
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<AuthenticatedUser> {
  return await requireRole(request, 'admin');
}

export async function requireBucketAccess(
  request: NextRequest,
  bucketName: string
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);
  
  // Admins have access to all buckets
  if (user.profile.role === 'admin') {
    return user;
  }
  
  // Check if user has explicit access to this bucket
  const hasAccess = await hasUserBucketAccess(user.uid, bucketName);
  if (!hasAccess) {
    throw new AuthorizationError(`Access denied to bucket: ${bucketName}`);
  }
  
  return user;
}

export async function requireBucketPermission(
  request: NextRequest,
  bucketName: string,
  permission: 'read' | 'write' | 'delete'
): Promise<AuthenticatedUser> {
  const user = await requireBucketAccess(request, bucketName);
  
  // Admins have all permissions
  if (user.profile.role === 'admin') {
    return user;
  }
  
  // Check if user has specific permission for this bucket
  const userPermissions = await getAllUserPermissions(user.uid);
  const bucketPermission = userPermissions.find(p => p.bucketName === bucketName);
  
  if (!bucketPermission || !bucketPermission.permissions.includes(permission)) {
    throw new AuthorizationError(`Access denied. ${permission} permission required for bucket ${bucketName}.`);
  }
  
  return user;
}

// Convenient wrapper functions for specific permissions
export function withBucketReadAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, bucketName: string) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const { searchParams } = new URL(request.url);
      const bucketName = searchParams.get('bucket');
      
      if (!bucketName) {
        return new Response(
          JSON.stringify({ success: false, error: 'Bucket name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const user = await requireBucketPermission(request, bucketName, 'read');
      return await handler(request, user, bucketName);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }
  };
}

export function withBucketWriteAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, bucketName: string) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const { searchParams } = new URL(request.url);
      const bucketName = searchParams.get('bucket');
      
      if (!bucketName) {
        return new Response(
          JSON.stringify({ success: false, error: 'Bucket name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const user = await requireBucketPermission(request, bucketName, 'write');
      return await handler(request, user, bucketName);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }
  };
}

export function withBucketDeleteAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, bucketName: string) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const { searchParams } = new URL(request.url);
      const bucketName = searchParams.get('bucket');
      
      if (!bucketName) {
        return new Response(
          JSON.stringify({ success: false, error: 'Bucket name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const user = await requireBucketPermission(request, bucketName, 'delete');
      return await handler(request, user, bucketName);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }
  };
}

// Helper function to check user permissions without throwing errors
export async function checkUserPermissions(
  uid: string,
  bucketName?: string
): Promise<{
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasBucketAccess: boolean;
  profile: UserProfile | null;
}> {
  try {
    const profile = await getUserProfile(uid);
    if (!profile || !profile.isActive) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        hasBucketAccess: false,
        profile: null,
      };
    }

    const isAdmin = profile.role === 'admin';
    let hasBucketAccess = isAdmin; // Admins have access to all buckets

    if (!isAdmin && bucketName) {
      hasBucketAccess = await hasUserBucketAccess(uid, bucketName);
    }

    return {
      isAuthenticated: true,
      isAdmin,
      hasBucketAccess,
      profile,
    };
  } catch (error) {
    console.error('Error checking user permissions:', error);
    return {
      isAuthenticated: false,
      isAdmin: false,
      hasBucketAccess: false,
      profile: null,
    };
  }
}

// Middleware wrapper for API routes
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const user = await requireAuth(request);
      return await handler(request, user);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: error.statusCode,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      console.error('Unexpected error in auth middleware:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

export function withAdminAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const user = await requireAdmin(request);
      return await handler(request, user);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: error.statusCode,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      console.error('Unexpected error in admin auth middleware:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

export function withBucketAuth(
  bucketName: string,
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const user = await requireBucketAccess(request, bucketName);
      return await handler(request, user);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          {
            status: error.statusCode,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      
      console.error('Unexpected error in bucket auth middleware:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Internal server error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}
import { getAdminFirestore, COLLECTIONS } from './firestore-admin';
import { UserProfile, UserRole, ManagedBucket, BucketPermission, AuditLog, ShareableLink } from '@/types';
import { randomBytes } from 'crypto';

// User Management
export async function createUserProfile(userData: {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: UserRole;
}): Promise<UserProfile> {
  const now = new Date().toISOString();
  const userProfile: UserProfile = {
    uid: userData.uid,
    email: userData.email,
    displayName: userData.displayName || null,
    photoURL: userData.photoURL || null,
    role: userData.role || 'user',
    bucketPermissions: [],
    createdAt: now,
    updatedAt: now,
    isActive: true,
  };

  await getAdminFirestore().collection(COLLECTIONS.USERS).doc(userData.uid).set(userProfile);
  
  // Log the user creation
  await logAuditEvent({
    userId: userData.uid,
    action: 'user_created',
    resourceType: 'user',
    resourceId: userData.uid,
    details: { email: userData.email, role: userProfile.role },
  });

  return userProfile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const doc = await getAdminFirestore().collection(COLLECTIONS.USERS).doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as UserProfile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  await getAdminFirestore().collection(COLLECTIONS.USERS).doc(uid).update(updateData);
  
  // Log the update
  await logAuditEvent({
    userId: uid,
    action: 'user_updated',
    resourceType: 'user',
    resourceId: uid,
    details: updates,
  });
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snapshot = await getAdminFirestore().collection(COLLECTIONS.USERS).get();
    const users = snapshot.docs.map(doc => doc.data() as UserProfile);
    
    // Fetch detailed permissions for each user
    const usersWithPermissions = await Promise.all(
      users.map(async (user) => {
        const permissions = await getAllUserPermissions(user.uid);
        return {
          ...user,
          permissions
        };
      })
    );
    
    return usersWithPermissions;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

export async function deactivateUser(uid: string, deactivatedBy: string): Promise<void> {
  await updateUserProfile(uid, { isActive: false });
  
  // Log the deactivation
  await logAuditEvent({
    userId: deactivatedBy,
    action: 'user_deactivated',
    resourceType: 'user',
    resourceId: uid,
    details: { deactivatedBy },
  });
}

// Bucket Management
export async function createManagedBucket(bucketData: {
  name: string;
  displayName: string;
  location: string;
  storageClass: string;
  createdBy: string;
  description?: string;
  imported?: boolean;
  importedAt?: Date;
}): Promise<ManagedBucket> {
  const now = new Date().toISOString();
  const bucket: ManagedBucket = {
    ...bucketData,
    createdAt: now,
    isActive: true,
    allowedUsers: [],
  };

  await getAdminFirestore().collection(COLLECTIONS.BUCKETS).doc(bucketData.name).set(bucket);
  
  // Log the bucket creation
  await logAuditEvent({
    userId: bucketData.createdBy,
    action: 'bucket_created',
    resourceType: 'bucket',
    resourceId: bucketData.name,
    details: bucketData,
  });

  return bucket;
}

export async function getManagedBucket(name: string): Promise<ManagedBucket | null> {
  try {
    const doc = await getAdminFirestore().collection(COLLECTIONS.BUCKETS).doc(name).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as ManagedBucket;
  } catch (error) {
    console.error('Error getting bucket:', error);
    return null;
  }
}

export async function getAllManagedBuckets(): Promise<ManagedBucket[]> {
  try {
    const snapshot = await getAdminFirestore().collection(COLLECTIONS.BUCKETS).where('isActive', '==', true).get();
    return snapshot.docs.map(doc => doc.data() as ManagedBucket);
  } catch (error) {
    console.error('Error getting all buckets:', error);
    return [];
  }
}

export async function getUserBuckets(uid: string): Promise<string[]> {
  try {
    const userProfile = await getUserProfile(uid);
    return userProfile?.bucketPermissions || [];
  } catch (error) {
    console.error('Error getting user buckets:', error);
    return [];
  }
}

// Permission Management
export async function grantBucketPermission(
  userId: string,
  bucketName: string,
  permissions: ('read' | 'write' | 'delete')[],
  grantedBy: string
): Promise<void> {
  const now = new Date().toISOString();
  
  // Get existing permissions for this user and bucket
  const permissionId = `${userId}_${bucketName}`;
  const existingDoc = await getAdminFirestore().collection(COLLECTIONS.PERMISSIONS).doc(permissionId).get();
  const existingPermissions = existingDoc.exists ? (existingDoc.data() as BucketPermission).permissions : [];
  
  // Merge new permissions with existing ones (avoid duplicates)
  const mergedPermissions = [...new Set([...existingPermissions, ...permissions])];
  
  const permission: BucketPermission = {
    userId,
    bucketName,
    permissions: mergedPermissions,
    grantedBy,
    grantedAt: now,
  };

  // Create or update the permission document
  await getAdminFirestore().collection(COLLECTIONS.PERMISSIONS).doc(permissionId).set(permission);

  // Update user's bucket permissions array
  const userProfile = await getUserProfile(userId);
  if (userProfile) {
    const bucketPermissions = [...userProfile.bucketPermissions];
    if (!bucketPermissions.includes(bucketName)) {
      bucketPermissions.push(bucketName);
      await updateUserProfile(userId, { bucketPermissions });
    }
  }

  // Update bucket's allowed users
  const bucket = await getManagedBucket(bucketName);
  if (bucket) {
    const allowedUsers = [...bucket.allowedUsers];
    if (!allowedUsers.includes(userId)) {
      allowedUsers.push(userId);
      await getAdminFirestore().collection(COLLECTIONS.BUCKETS).doc(bucketName).update({ allowedUsers });
    }
  }

  // Log the permission grant
  await logAuditEvent({
    userId: grantedBy,
    action: 'permission_granted',
    resourceType: 'permission',
    resourceId: permissionId,
    details: { userId, bucketName, permissions: mergedPermissions },
  });
}

export async function setBucketPermissions(
  userId: string,
  bucketName: string,
  permissions: ('read' | 'write' | 'delete')[],
  grantedBy: string
): Promise<void> {
  const now = new Date().toISOString();
  const permission: BucketPermission = {
    userId,
    bucketName,
    permissions,
    grantedBy,
    grantedAt: now,
  };

  // Replace the permission document completely
  const permissionId = `${userId}_${bucketName}`;
  await getAdminFirestore().collection(COLLECTIONS.PERMISSIONS).doc(permissionId).set(permission);

  // Update user's bucket permissions array
  const userProfile = await getUserProfile(userId);
  if (userProfile) {
    const bucketPermissions = [...userProfile.bucketPermissions];
    if (!bucketPermissions.includes(bucketName)) {
      bucketPermissions.push(bucketName);
      await updateUserProfile(userId, { bucketPermissions });
    }
  }

  // Update bucket's allowed users
  const bucket = await getManagedBucket(bucketName);
  if (bucket) {
    const allowedUsers = [...bucket.allowedUsers];
    if (!allowedUsers.includes(userId)) {
      allowedUsers.push(userId);
      await getAdminFirestore().collection(COLLECTIONS.BUCKETS).doc(bucketName).update({ allowedUsers });
    }
  }

  await logAuditEvent({
    userId: grantedBy,
    action: 'permission_set',
    resourceType: 'permission',
    resourceId: permissionId,
    details: { userId, bucketName, permissions },
  });
}

export async function revokeBucketPermission(
  userId: string,
  bucketName: string,
  revokedBy: string
): Promise<void> {
  const permissionId = `${userId}_${bucketName}`;
  
  // Delete the permission document
  await getAdminFirestore().collection(COLLECTIONS.PERMISSIONS).doc(permissionId).delete();

  // Update user's bucket permissions array
  const userProfile = await getUserProfile(userId);
  if (userProfile) {
    const bucketPermissions = userProfile.bucketPermissions.filter(bucket => bucket !== bucketName);
    await updateUserProfile(userId, { bucketPermissions });
  }

  // Update bucket's allowed users
  const bucket = await getManagedBucket(bucketName);
  if (bucket) {
    const allowedUsers = bucket.allowedUsers.filter(user => user !== userId);
    await getAdminFirestore().collection(COLLECTIONS.BUCKETS).doc(bucketName).update({ allowedUsers });
  }

  // Log the permission revocation
  await logAuditEvent({
    userId: revokedBy,
    action: 'permission_revoked',
    resourceType: 'permission',
    resourceId: permissionId,
    details: { userId, bucketName },
  });
}

export async function getUserPermissions(userId: string, bucketName: string): Promise<BucketPermission | null> {
  try {
    const permissionId = `${userId}_${bucketName}`;
    const doc = await getAdminFirestore().collection(COLLECTIONS.PERMISSIONS).doc(permissionId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as BucketPermission;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return null;
  }
}

export async function getAllUserPermissions(userId: string): Promise<BucketPermission[]> {
  try {
    const snapshot = await getAdminFirestore().collection(COLLECTIONS.PERMISSIONS)
      .where('userId', '==', userId)
      .get();
    return snapshot.docs.map(doc => doc.data() as BucketPermission);
  } catch (error) {
    console.error('Error getting all user permissions:', error);
    return [];
  }
}

// Audit Logging
export async function logAuditEvent(eventData: {
  userId: string;
  action: string;
  resourceType: 'bucket' | 'user' | 'permission' | 'shared_link';
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
}): Promise<void> {
  try {
    const auditLog: AuditLog = {
      id: '',
      ...eventData,
      timestamp: new Date().toISOString(),
    };

    const docRef = await getAdminFirestore().collection(COLLECTIONS.AUDIT_LOGS).add(auditLog);
    await docRef.update({ id: docRef.id });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

export async function getAuditLogs(
  filters?: {
    userId?: string;
    resourceType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  },
  limit: number = 100
): Promise<AuditLog[]> {
  try {
    let query = getAdminFirestore().collection(COLLECTIONS.AUDIT_LOGS).orderBy('timestamp', 'desc');

    if (filters?.userId) {
      query = query.where('userId', '==', filters.userId);
    }
    if (filters?.resourceType) {
      query = query.where('resourceType', '==', filters.resourceType);
    }
    if (filters?.action) {
      query = query.where('action', '==', filters.action);
    }
    if (filters?.startDate) {
      query = query.where('timestamp', '>=', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.where('timestamp', '<=', filters.endDate);
    }

    const snapshot = await query.limit(limit).get();
    return snapshot.docs.map(doc => doc.data() as AuditLog);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return [];
  }
}

// Helper function to check if user has admin role
export async function isUserAdmin(uid: string): Promise<boolean> {
  const userProfile = await getUserProfile(uid);
  return userProfile?.role === 'admin' || false;
}

// Helper function to check if user has access to bucket
export async function hasUserBucketAccess(uid: string, bucketName: string): Promise<boolean> {
  const userProfile = await getUserProfile(uid);
  return userProfile?.bucketPermissions.includes(bucketName) || false;
}

// Shareable Links Management
export async function createShareableLink(linkData: {
  bucketName: string;
  filePath: string;
  fileName: string;
  createdBy: string;
  expiresInHours: number;
  maxAccess?: number;
  description?: string;
}): Promise<ShareableLink> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (linkData.expiresInHours * 60 * 60 * 1000));
  
  // Generate a cryptographically secure random token
  const token = randomBytes(32).toString('hex');
  
  const shareableLink: any = {
    id: '',
    token,
    bucketName: linkData.bucketName,
    filePath: linkData.filePath,
    fileName: linkData.fileName,
    createdBy: linkData.createdBy,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isRevoked: false,
    accessCount: 0,
  };

  // Only add optional fields if they have values
  if (linkData.maxAccess !== undefined) {
    shareableLink.maxAccess = linkData.maxAccess;
  }
  if (linkData.description !== undefined && linkData.description.trim() !== '') {
    shareableLink.description = linkData.description;
  }

  const docRef = await getAdminFirestore().collection(COLLECTIONS.SHAREABLE_LINKS).add(shareableLink);
  // Update the document with its ID
  await docRef.update({ id: docRef.id });
  
  const finalLink: ShareableLink = {
    ...shareableLink,
    id: docRef.id,
    // Ensure all required fields are present
    maxAccess: shareableLink.maxAccess || undefined,
    description: shareableLink.description || undefined,
    revokedAt: undefined,
    revokedBy: undefined,
    lastAccessedAt: undefined,
  };

  // Log the link creation
  const auditDetails: any = {
    bucketName: linkData.bucketName,
    filePath: linkData.filePath,
    fileName: linkData.fileName,
    expiresAt: expiresAt.toISOString(),
  };
  
  if (linkData.maxAccess !== undefined) {
    auditDetails.maxAccess = linkData.maxAccess;
  }

  await logAuditEvent({
    userId: linkData.createdBy,
    action: 'shared_link_created',
    resourceType: 'shared_link',
    resourceId: docRef.id,
    details: auditDetails,
  });

  return finalLink;
}

export async function getShareableLink(token: string): Promise<ShareableLink | null> {
  try {
    const snapshot = await getAdminFirestore().collection(COLLECTIONS.SHAREABLE_LINKS)
      .where('token', '==', token)
      .where('isRevoked', '==', false)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      ...data,
      id: doc.id, // Ensure the document ID is included
    } as ShareableLink;
  } catch (error) {
    console.error('Error getting shareable link:', error);
    return null;
  }
}

export async function getShareableLinkById(id: string): Promise<ShareableLink | null> {
  try {
    const doc = await getAdminFirestore().collection(COLLECTIONS.SHAREABLE_LINKS).doc(id).get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data();
    return {
      ...data,
      id: doc.id, // Ensure the document ID is included
    } as ShareableLink;
  } catch (error) {
    console.error('Error getting shareable link by ID:', error);
    return null;
  }
}

export async function getUserShareableLinks(userId: string): Promise<ShareableLink[]> {
  try {
    const snapshot = await getAdminFirestore().collection(COLLECTIONS.SHAREABLE_LINKS)
      .where('createdBy', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id, // Ensure the document ID is included
      } as ShareableLink;
    });
  } catch (error) {
    console.error('Error getting user shareable links:', error);
    return [];
  }
}

export async function incrementLinkAccess(token: string): Promise<boolean> {
  try {
    const snapshot = await getAdminFirestore().collection(COLLECTIONS.SHAREABLE_LINKS)
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return false;
    }
    
    const doc = snapshot.docs[0];
    const link = doc.data() as ShareableLink;
    
    // Check if link is still valid
    const now = new Date();
    const expiresAt = new Date(link.expiresAt);
    
    if (now > expiresAt || link.isRevoked) {
      return false;
    }
    
    // Check max access limit
    if (link.maxAccess && link.accessCount >= link.maxAccess) {
      return false;
    }
    
    // Increment access count
    await doc.ref.update({
      accessCount: link.accessCount + 1,
      lastAccessedAt: now.toISOString(),
    });
    
    return true;
  } catch (error) {
    console.error('Error incrementing link access:', error);
    return false;
  }
}

export async function revokeShareableLink(linkId: string, revokedBy: string): Promise<void> {
  const now = new Date().toISOString();
  
  await getAdminFirestore().collection(COLLECTIONS.SHAREABLE_LINKS).doc(linkId).update({
    isRevoked: true,
    revokedAt: now,
    revokedBy,
  });

  // Log the link revocation
  await logAuditEvent({
    userId: revokedBy,
    action: 'shared_link_revoked',
    resourceType: 'shared_link',
    resourceId: linkId,
    details: { revokedBy },
  });
}

export async function cleanupExpiredLinks(): Promise<number> {
  try {
    const now = new Date().toISOString();
    const snapshot = await getAdminFirestore().collection(COLLECTIONS.SHAREABLE_LINKS)
      .where('expiresAt', '<', now)
      .where('isRevoked', '==', false)
      .get();
    
    const batch = getAdminFirestore().batch();
    let count = 0;
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRevoked: true });
      count++;
    });
    
    if (count > 0) {
      await batch.commit();
    }
    
    return count;
  } catch (error) {
    console.error('Error cleaning up expired links:', error);
    return 0;
  }
}
import { supabase } from './supabase';

// Bucket configuration
export const BUCKET_CONFIG = {
  'chat-images': {
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10 MB
  },
  'chat-videos': {
    allowedTypes: ['video/mp4', 'video/webm'],
    maxSize: 50 * 1024 * 1024, // 50 MB
  },
  'chat-audio': {
    allowedTypes: ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg'],
    maxSize: 5 * 1024 * 1024, // 5 MB
  },
} as const;

export type BucketName = keyof typeof BUCKET_CONFIG;

/**
 * Validate a file before upload
 */
export function validateFile(
  file: File,
  bucket: BucketName
): { valid: boolean; error?: string } {
  const config = BUCKET_CONFIG[bucket];

  if (!(config.allowedTypes as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed: ${config.allowedTypes.join(', ')}`,
    };
  }

  if (file.size > config.maxSize) {
    const maxMB = config.maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum: ${maxMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Get the appropriate bucket for a file type
 */
export function getBucketForFile(file: File): BucketName | null {
  if (file.type.startsWith('image/')) return 'chat-images';
  if (file.type.startsWith('video/')) return 'chat-videos';
  if (file.type.startsWith('audio/')) return 'chat-audio';
  return null;
}

/**
 * Upload a file to the appropriate bucket
 * Files are stored under the user's UUID folder for isolation
 */
export async function uploadFile(
  bucket: BucketName,
  file: File,
  userId: string
): Promise<{ path: string; error: string | null }> {
  // Validate
  const validation = validateFile(file, bucket);
  if (!validation.valid) {
    return { path: '', error: validation.error! };
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const filePath = `${userId}/${timestamp}_${random}.${ext}`;

  // Upload
  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { path: '', error: error.message };
  }

  return { path: filePath, error: null };
}

interface CacheEntry {
  url: string;
  expiresAt: number;
}
const signedUrlCache = new Map<string, CacheEntry>();

/**
 * Get a short-lived signed URL for a file (5 minutes default)
 */
export async function getSignedUrl(
  bucket: BucketName,
  path: string,
  expiresIn: number = 300 // 5 minutes
): Promise<string | null> {
  const cacheKey = `${bucket}:${path}`;
  const now = Date.now();
  const cached = signedUrlCache.get(cacheKey);

  // Return cached URL if it exists and has at least 30 seconds of life remaining
  if (cached && cached.expiresAt > now + 30000) {
    return cached.url;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }

  if (data?.signedUrl) {
    signedUrlCache.set(cacheKey, {
      url: data.signedUrl,
      expiresAt: now + (expiresIn * 1000)
    });
    return data.signedUrl;
  }

  return null;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: BucketName,
  path: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  return { error: error?.message ?? null };
}

/**
 * Strip EXIF metadata from an image by re-encoding through canvas
 */
export function stripImageMetadata(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      // Maintain aspect ratio while constraining dimensions
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }));
          } else {
            resolve(file);
          }
        },
        file.type,
        0.80 // reduced quality for optimal load times
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

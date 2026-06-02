import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile, getBucketForFile, validateFile, stripImageMetadata } from '../lib/storage';
import type { BucketName } from '../lib/storage';

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface UploadResult {
  path: string;
  bucket: BucketName;
  fileType: string;
  fileSize: number;
}

export function useFileUpload() {
  const { user } = useAuth();
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    if (!user) {
      setUploadState({ isUploading: false, progress: 0, error: 'Not authenticated' });
      return null;
    }

    // Determine bucket
    const bucket = getBucketForFile(file);
    if (!bucket) {
      setUploadState({ isUploading: false, progress: 0, error: 'Unsupported file type' });
      return null;
    }

    // Validate
    const validation = validateFile(file, bucket);
    if (!validation.valid) {
      setUploadState({ isUploading: false, progress: 0, error: validation.error! });
      return null;
    }

    setUploadState({ isUploading: true, progress: 10, error: null });

    try {
      // Strip metadata from images
      let processedFile = file;
      if (file.type.startsWith('image/')) {
        setUploadState(prev => ({ ...prev, progress: 20 }));
        processedFile = await stripImageMetadata(file);
      }

      setUploadState(prev => ({ ...prev, progress: 40 }));

      // Upload to Supabase Storage
      const { path, error } = await uploadFile(bucket, processedFile, user.id);

      if (error) {
        setUploadState({ isUploading: false, progress: 0, error });
        return null;
      }

      setUploadState({ isUploading: false, progress: 100, error: null });

      return {
        path,
        bucket,
        fileType: processedFile.type,
        fileSize: processedFile.size,
      };
    } catch (err) {
      setUploadState({ isUploading: false, progress: 0, error: 'Upload failed' });
      return null;
    }
  }, [user]);

  const resetUpload = useCallback(() => {
    setUploadState({ isUploading: false, progress: 0, error: null });
  }, []);

  return { ...uploadState, upload, resetUpload };
}

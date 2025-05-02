
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { uploadAvatar } from '@/services/api';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  username: string;
  onAvatarUpdated: (url: string) => void;
}

export const AvatarUpload = ({ userId, currentAvatarUrl, username, onAvatarUpdated }: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image size should not exceed 2MB',
        variant: 'destructive',
      });
      return;
    }
    
    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    
    // Clean up the preview URL when component unmounts
    return () => URL.revokeObjectURL(objectUrl);
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      
      const result = await uploadAvatar(userId, selectedFile);
      
      toast({
        title: 'Avatar updated',
        description: 'Your profile photo has been updated successfully',
      });
      
      onAvatarUpdated(result.url);
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload the profile photo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-24 h-24">
          <AvatarImage 
            src={previewUrl || currentAvatarUrl || ''} 
            alt={username} 
          />
          <AvatarFallback className="text-3xl">
            {username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Upload a profile photo. Images should be square and less than 2MB.
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              type="button" 
              onClick={() => document.getElementById('avatar-upload')?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {previewUrl ? 'Change' : 'Upload'}
            </Button>
            
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>
      </div>
      
      {previewUrl && (
        <div className="flex gap-2">
          <Button 
            onClick={handleUpload} 
            disabled={isUploading}
          >
            {isUploading && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Save Profile Photo
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleCancel} 
            disabled={isUploading}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

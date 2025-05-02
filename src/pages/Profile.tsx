
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  fetchProfile,
  updateProfile,
  getFollowersCount,
  getFollowingCount,
} from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Profile as ProfileType } from '@/types/models';
import { AvatarUpload } from '@/components/AvatarUpload';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await fetchProfile(user.id);
        
        if (profileData) {
          setProfile(profileData);
          setUsername(profileData.username);
          
          // Fetch followers and following count
          const followers = await getFollowersCount(user.id);
          const following = await getFollowingCount(user.id);
          
          setFollowersCount(followers);
          setFollowingCount(following);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !profile) return;
    
    if (!username.trim()) {
      toast({
        title: 'Invalid username',
        description: 'Username cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const updatedProfile = await updateProfile(user.id, {
        username,
      });
      
      setProfile(updatedProfile);
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpdated = (url: string) => {
    if (profile) {
      setProfile({
        ...profile,
        avatar_url: url
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-40" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-28" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {user && profile && (
            <AvatarUpload 
              userId={user.id}
              currentAvatarUrl={profile.avatar_url}
              username={profile.username}
              onAvatarUpdated={handleAvatarUpdated}
            />
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Update Profile'}
            </Button>
          </form>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="font-medium">User Stats</h3>
            <div className="flex flex-wrap gap-4">
              <div>
                <span className="text-muted-foreground">Points: </span>
                <span className="font-medium">{profile.points}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Level: </span>
                <Badge variant="outline">{profile.level}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Followers: </span>
                <span className="font-medium">{followersCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Following: </span>
                <span className="font-medium">{followingCount}</span>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="font-medium">Account Information</h3>
            <div>
              <span className="text-muted-foreground">Member Since: </span>
              <span className="font-medium">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;

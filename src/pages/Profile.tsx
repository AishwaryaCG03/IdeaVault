
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Camera } from 'lucide-react';
import { 
  fetchProfile, 
  updateProfile, 
  fetchIdeas,
  followUser,
  unfollowUser,
  checkIfFollowing,
  getFollowersCount,
  getFollowingCount,
  uploadAvatar
} from '@/services/api';
import { Profile, Idea } from '@/types/models';
import { User } from 'lucide-react';

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [userIdeas, setUserIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const profileId = queryParams.get('id') || (user?.id || '');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsOwnProfile(profileId === user.id);
    
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await fetchProfile(profileId);
        
        if (profileData) {
          setProfile(profileData);
          setUsername(profileData.username);
        }
        
        const ideasData = await fetchIdeas();
        const userIdeasData = ideasData.filter(idea => idea.user_id === profileId);
        setUserIdeas(userIdeasData);
        
        if (profileId !== user.id) {
          const following = await checkIfFollowing(user.id, profileId);
          setIsFollowing(following);
        }
        
        const followers = await getFollowersCount(profileId);
        setFollowersCount(followers);
        
        const following = await getFollowingCount(profileId);
        setFollowingCount(following);
        
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile information',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate, profileId]);

  const handleUpdateProfile = async () => {
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
      setIsUpdating(true);
      const updatedProfile = await updateProfile(user.id, { username });
      
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
      setIsUpdating(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!user || !profile) return;
    
    try {
      if (isFollowing) {
        await unfollowUser(user.id, profileId);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast({
          title: 'Unfollowed',
          description: `You are no longer following ${profile.username}`,
        });
      } else {
        await followUser(user.id, profileId);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast({
          title: 'Following',
          description: `You are now following ${profile.username}`,
        });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    }
  };

  // New function to handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a JPG, PNG, GIF, or WebP image',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 2MB',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsUploading(true);
      const { url } = await uploadAvatar(user.id, file);
      
      // Update the profile in state
      if (profile) {
        setProfile({...profile, avatar_url: url});
      }
      
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload profile picture',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Calculate progress to next level
  const getProgressToNextLevel = (points: number, level: string) => {
    let nextLevelThreshold = 100;
    let currentLevelThreshold = 0;
    
    switch (level) {
      case 'Beginner':
        nextLevelThreshold = 100;
        currentLevelThreshold = 0;
        break;
      case 'Intermediate':
        nextLevelThreshold = 200;
        currentLevelThreshold = 100;
        break;
      case 'Advanced':
        nextLevelThreshold = 500;
        currentLevelThreshold = 200;
        break;
      case 'Expert':
        nextLevelThreshold = 1000;
        currentLevelThreshold = 500;
        break;
      case 'Master':
        return 100; // Already at max level
    }
    
    const pointsForLevel = points - currentLevelThreshold;
    const totalPointsNeeded = nextLevelThreshold - currentLevelThreshold;
    const progress = Math.min(100, Math.round((pointsForLevel / totalPointsNeeded) * 100));
    
    return progress;
  };

  // Hidden file input for avatar upload
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 pt-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pt-6">
      <h1 className="text-3xl font-bold">
        {isOwnProfile ? 'Your Profile' : `${profile.username}'s Profile`}
      </h1>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>Profile Information</CardTitle>
            {!isOwnProfile && (
              <Button 
                onClick={handleToggleFollow}
                variant={isFollowing ? "outline" : "default"}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>
          {isOwnProfile && <CardDescription>Update your profile information</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="text-2xl">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {isOwnProfile && (
                  <>
                    <Button 
                      size="icon" 
                      variant="outline"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background"
                      onClick={triggerFileInput}
                      disabled={isUploading}
                    >
                      <Camera size={16} />
                    </Button>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                    />
                  </>
                )}
              </div>
              <div className="mt-2 text-center">
                <Badge variant="outline" className="mt-2">
                  {profile.level}
                </Badge>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{userIdeas.length}</p>
                  <p className="text-sm text-muted-foreground">Ideas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{followersCount}</p>
                  <p className="text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{followingCount}</p>
                  <p className="text-sm text-muted-foreground">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{profile.points}</p>
                  <p className="text-sm text-muted-foreground">Points</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <p className="text-sm">Progress to next level</p>
                  <p className="text-sm font-medium">
                    {profile.level === 'Master' ? 'Max Level' : 'Next level: ' + 
                      (profile.level === 'Beginner' ? 'Intermediate' :
                       profile.level === 'Intermediate' ? 'Advanced' :
                       profile.level === 'Advanced' ? 'Expert' : 'Master'
                      )
                    }
                  </p>
                </div>
                <Progress value={getProgressToNextLevel(profile.points, profile.level)} className="h-2" />
              </div>
            </div>
          </div>
          
          {isOwnProfile && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ''} disabled />
                <p className="text-xs text-muted-foreground">
                  Your email address cannot be changed
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="Your username"
                />
              </div>
              
              <Button 
                onClick={handleUpdateProfile} 
                disabled={isUpdating || username === profile.username}
              >
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {isOwnProfile ? 'Your Ideas' : `${profile.username}'s Ideas`}
        </h2>
        
        {userIdeas.length > 0 ? (
          <div className="space-y-4">
            {userIdeas.map((idea) => (
              <Card 
                key={idea.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/idea/${idea.id}`)}
              >
                <CardHeader>
                  <CardTitle>{idea.title}</CardTitle>
                  {idea.category && (
                    <CardDescription>{idea.category.name}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm">{idea.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              {isOwnProfile ? (
                <>
                  <p className="text-muted-foreground mb-4">You haven't shared any ideas yet</p>
                  <Button onClick={() => navigate('/idea/new')}>Share Your First Idea</Button>
                </>
              ) : (
                <p className="text-muted-foreground">This user hasn't shared any ideas yet</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

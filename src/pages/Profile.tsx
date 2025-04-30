
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { fetchProfile, updateProfile, fetchIdeas } from '@/services/api';
import { Profile, Idea } from '@/types/models';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [userIdeas, setUserIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

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
        }
        
        const ideasData = await fetchIdeas();
        const userIdeasData = ideasData.filter(idea => idea.user_id === user.id);
        setUserIdeas(userIdeasData);
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
  }, [user, navigate]);

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
      <h1 className="text-3xl font-bold">Your Profile</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url || ''} />
              <AvatarFallback className="text-lg">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-sm text-muted-foreground">
                Avatar functionality will be added in a future update
              </p>
            </div>
          </div>
          
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
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Ideas</h2>
        
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
              <p className="text-muted-foreground mb-4">You haven't shared any ideas yet</p>
              <Button onClick={() => navigate('/idea/new')}>Share Your First Idea</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;

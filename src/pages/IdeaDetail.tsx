
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/AuthContext';
import { fetchIdeaById, fetchComments, createComment, deleteIdea, toggleLike, checkIfUserLiked } from '@/services/api';
import { Idea, Comment } from '@/types/models';
import { Heart, MessageSquare, Calendar, Trash2, Edit, Share2 } from 'lucide-react';
import { format } from 'date-fns';

const IdeaDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const ideaData = await fetchIdeaById(id);
        
        if (!ideaData) {
          navigate('/not-found');
          return;
        }
        
        setIdea(ideaData);
        
        const commentsData = await fetchComments(id);
        setComments(commentsData);
        
        if (user) {
          const hasLiked = await checkIfUserLiked(id, user.id);
          setUserHasLiked(hasLiked);
        }
        
      } catch (error) {
        console.error('Error loading idea:', error);
        toast({
          title: 'Error',
          description: 'Failed to load idea details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, user, navigate]);

  const handleLike = async () => {
    if (!user || !idea) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to like ideas',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    try {
      const isLiked = await toggleLike(idea.id, user.id);
      setUserHasLiked(isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      
      toast({
        title: isLiked ? 'Idea liked' : 'Like removed',
        description: isLiked ? 'You liked this idea' : 'You removed your like from this idea',
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!user || !idea) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to comment',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Empty comment',
        description: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const comment = await createComment({
        content: newComment,
        idea_id: idea.id,
        user_id: user.id,
      });
      
      // Add profile info to the new comment
      const commentWithProfile = {
        ...comment,
        profile: {
          username: user.user_metadata.username || 'Anonymous',
          avatar_url: user.user_metadata.avatar_url || null,
        }
      };
      
      setComments([...comments, commentWithProfile as unknown as Comment]);
      setNewComment('');
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been added successfully',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIdea = async () => {
    if (!idea || !user) return;
    
    try {
      setIsDeleting(true);
      await deleteIdea(idea.id);
      toast({
        title: 'Idea deleted',
        description: 'Your idea has been deleted successfully',
      });
      navigate('/');
    } catch (error) {
      console.error('Error deleting idea:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete idea',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copied',
      description: 'Idea link copied to clipboard',
    });
  };
  
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-20" />
        </div>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!idea) return null;

  const isOwner = user?.id === idea.user_id;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Idea Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold">{idea.title}</h1>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            
            {isOwner && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate(`/idea/edit/${idea.id}`)}
                >
                  <Edit className="h-5 w-5" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your idea and all associated comments. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteIdea}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={idea.profile?.avatar_url || ''} />
            <AvatarFallback>
              {idea.profile?.username.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{idea.profile?.username || 'Anonymous'}</p>
            <p className="text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 inline mr-1" />
              {format(new Date(idea.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        
        {idea.category && (
          <Badge variant="outline" className="px-3 py-1">
            {idea.category.name}
          </Badge>
        )}
      </div>

      {/* Idea Content */}
      <div className="prose max-w-none dark:prose-invert">
        <p className="whitespace-pre-wrap">{idea.description}</p>
      </div>

      {/* Idea Actions */}
      <div className="flex gap-4 items-center pt-4 pb-6">
        <Button 
          variant={userHasLiked ? "default" : "outline"} 
          size="sm"
          className="flex items-center gap-2"
          onClick={handleLike}
        >
          <Heart className={`h-4 w-4 ${userHasLiked ? 'fill-current' : ''}`} />
          <span>{likesCount}</span>
        </Button>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>{comments.length} Comments</span>
        </div>
      </div>

      <Separator />

      {/* Comments Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Comments</h2>
        
        {user ? (
          <div className="space-y-2">
            <Textarea 
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmitComment} disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="mb-2">Sign in to join the conversation</p>
              <Button onClick={() => navigate('/auth')}>Sign In</Button>
            </CardContent>
          </Card>
        )}
        
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profile?.avatar_url || ''} />
                    <AvatarFallback>
                      {comment.profile?.username.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{comment.profile?.username || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaDetail;

import { supabase } from '@/integrations/supabase/client';
import { Idea, Comment, Category, Profile, Follow, Tag, IdeaTag, Notification, Milestone } from '@/types/models';

// Categories API
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as Category[];
};

// Tags API
export const fetchTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as Tag[];
};

export const fetchIdeaTags = async (ideaId: string): Promise<IdeaTag[]> => {
  const { data, error } = await supabase
    .from('idea_tags')
    .select(`
      *,
      tag:tags(*)
    `)
    .eq('idea_id', ideaId);
  
  if (error) throw error;
  return data as unknown as IdeaTag[];
};

export const addTagToIdea = async (ideaId: string, tagId: string): Promise<IdeaTag> => {
  const { data, error } = await supabase
    .from('idea_tags')
    .insert({ idea_id: ideaId, tag_id: tagId })
    .select()
    .single();
  
  if (error) throw error;
  return data as IdeaTag;
};

export const removeTagFromIdea = async (ideaTagId: string): Promise<void> => {
  const { error } = await supabase
    .from('idea_tags')
    .delete()
    .eq('id', ideaTagId);
  
  if (error) throw error;
};

// Search API
export const searchIdeas = async (query: string): Promise<Idea[]> => {
  const { data, error } = await supabase
    .from('ideas')
    .select(`
      *,
      profile:profiles(username, avatar_url),
      category:categories(name, description)
    `)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as unknown as Idea[];
};

// Ideas API
export const fetchIdeas = async (categoryId?: string, tagId?: string): Promise<Idea[]> => {
  let query = supabase
    .from('ideas')
    .select(`
      *,
      profile:profiles(username, avatar_url, level),
      category:categories(name, description)
    `)
    .order('created_at', { ascending: false });
  
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (tagId) {
    const ideaIds = await supabase
      .from('idea_tags')
      .select('idea_id')
      .eq('tag_id', tagId);
      
    if (ideaIds.error) throw ideaIds.error;
    
    const ids = (ideaIds.data || []).map(item => item.idea_id);
    if (ids.length > 0) {
      query = query.in('id', ids);
    } else {
      return []; // No ideas with this tag
    }
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data as unknown as Idea[];
};

export const fetchIdeaById = async (id: string): Promise<Idea | null> => {
  const { data, error } = await supabase
    .from('ideas')
    .select(`
      *,
      profile:profiles(username, avatar_url, level),
      category:categories(name, description)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }
  
  return data as unknown as Idea;
};

export const createIdea = async (idea: Omit<Idea, 'id' | 'created_at' | 'updated_at' | 'share_count'>, tags?: string[]): Promise<Idea> => {
  const { data, error } = await supabase
    .from('ideas')
    .insert(idea)
    .select()
    .single();
  
  if (error) throw error;

  // Add tags if provided
  if (tags && tags.length > 0 && data) {
    const tagInserts = tags.map(tagId => ({
      idea_id: data.id,
      tag_id: tagId
    }));

    const { error: tagError } = await supabase
      .from('idea_tags')
      .insert(tagInserts);
    
    if (tagError) throw tagError;
  }
  
  return data as Idea;
};

export const updateIdea = async (id: string, idea: Partial<Idea>): Promise<Idea> => {
  const { data, error } = await supabase
    .from('ideas')
    .update(idea)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Idea;
};

export const incrementShareCount = async (id: string): Promise<Idea> => {
  const { data, error } = await supabase
    .from('ideas')
    .update({ share_count: supabase.rpc('increment_counter', { row_id: id }) })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Idea;
};

export const deleteIdea = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Comments API
export const fetchComments = async (ideaId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profile:profiles(username, avatar_url, level)
    `)
    .eq('idea_id', ideaId)
    .order('created_at');
  
  if (error) throw error;
  return data as unknown as Comment[];
};

export const createComment = async (comment: Omit<Comment, 'id' | 'created_at'>): Promise<Comment> => {
  const { data, error } = await supabase
    .from('comments')
    .insert(comment)
    .select()
    .single();
  
  if (error) throw error;

  // Award points to the commenter
  if (data) {
    await awardPoints(data.user_id, 5);
    
    // Create notification for the idea owner
    const { data: idea } = await supabase
      .from('ideas')
      .select('user_id, title')
      .eq('id', comment.idea_id)
      .single();
    
    if (idea && idea.user_id !== comment.user_id) {
      await createNotification({
        user_id: idea.user_id,
        sender_id: comment.user_id,
        idea_id: comment.idea_id,
        comment_id: data.id,
        type: 'comment',
        message: `Someone commented on your idea: "${idea.title}"`
      });
    }
  }
  
  return data as Comment;
};

export const deleteComment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Likes API
export const toggleLike = async (ideaId: string, userId: string): Promise<boolean> => {
  // Check if like exists
  const { data: existingLike, error: checkError } = await supabase
    .from('likes')
    .select()
    .eq('idea_id', ideaId)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (checkError) throw checkError;
  
  // If like exists, remove it
  if (existingLike) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id);
    
    if (error) throw error;
    return false; // Like removed
  }
  
  // If like doesn't exist, add it
  const { error, data } = await supabase
    .from('likes')
    .insert({ idea_id: ideaId, user_id: userId })
    .select()
    .single();
  
  if (error) throw error;

  // Award points to the idea owner
  const { data: idea } = await supabase
    .from('ideas')
    .select('user_id, title')
    .eq('id', ideaId)
    .single();
  
  if (idea && idea.user_id !== userId) {
    await awardPoints(idea.user_id, 2);
    
    // Create notification for the idea owner
    await createNotification({
      user_id: idea.user_id,
      sender_id: userId,
      idea_id: ideaId,
      comment_id: null,
      type: 'like',
      message: `Someone liked your idea: "${idea.title}"`
    });
  }
  
  return true; // Like added
};

export const checkIfUserLiked = async (ideaId: string, userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('likes')
    .select()
    .eq('idea_id', ideaId)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data !== null;
};

export const countLikes = async (ideaId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('idea_id', ideaId);
  
  if (error) throw error;
  return count || 0;
};

// Profile API
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Record not found
    throw error;
  }
  
  return data as Profile;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Profile;
};

// Follows API
export const followUser = async (followerId: string, followingId: string): Promise<Follow> => {
  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .select()
    .single();
  
  if (error) throw error;

  // Award points to the followed user
  await awardPoints(followingId, 10);
  
  // Create notification for the followed user
  await createNotification({
    user_id: followingId,
    sender_id: followerId,
    idea_id: null,
    comment_id: null,
    type: 'follow',
    message: 'Someone started following you'
  });
  
  return data as Follow;
};

export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  
  if (error) throw error;
};

export const checkIfFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('follows')
    .select()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  
  if (error) throw error;
  return data !== null;
};

export const getFollowersCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);
  
  if (error) throw error;
  return count || 0;
};

export const getFollowingCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);
  
  if (error) throw error;
  return count || 0;
};

export const getFollowers = async (userId: string): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_follower_id_fkey(*)')
    .eq('following_id', userId);
  
  if (error) throw error;
  return data.map(item => item.profiles) as unknown as Profile[];
};

export const getFollowing = async (userId: string): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_following_id_fkey(*)')
    .eq('follower_id', userId);
  
  if (error) throw error;
  return data.map(item => item.profiles) as unknown as Profile[];
};

// Notifications API
export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      sender:profiles(username, avatar_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as unknown as Notification[];
};

export const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .insert({ ...notification, is_read: false })
    .select()
    .single();
  
  if (error) throw error;
  return data as Notification;
};

export const markNotificationAsRead = async (id: string): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Notification;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) throw error;
};

export const deleteNotification = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) throw error;
  return count || 0;
};

// Gamification API
export const awardPoints = async (userId: string, points: number): Promise<Profile> => {
  // Get current points
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('points, level')
    .eq('id', userId)
    .single();
  
  if (fetchError) throw fetchError;
  
  const newPoints = (profile?.points || 0) + points;
  let newLevel = profile?.level || 'Beginner';
  
  // Update level based on points
  if (newPoints >= 1000) {
    newLevel = 'Master';
  } else if (newPoints >= 500) {
    newLevel = 'Expert';
  } else if (newPoints >= 200) {
    newLevel = 'Advanced';
  } else if (newPoints >= 100) {
    newLevel = 'Intermediate';
  }
  
  // Update profile with new points and potentially new level
  const { data, error } = await supabase
    .from('profiles')
    .update({ points: newPoints, level: newLevel })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Profile;
};

// Social Sharing
export const shareIdea = async (ideaId: string): Promise<Idea> => {
  // Call the share_idea function to increment the share count
  const { data, error } = await supabase
    .rpc('share_idea', { idea_uuid: ideaId })
    .single();
  
  if (error) throw error;
  
  // Award points to the idea owner
  if (data) {
    await awardPoints(data.user_id, 3);
  }
  
  return data as Idea;
};

// Milestones API
export const fetchMilestones = async (ideaId: string): Promise<Milestone[]> => {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('idea_id', ideaId)
    .order('due_date', { ascending: true, nullsLast: true });
  
  if (error) throw error;
  return data as Milestone[];
};

export const createMilestone = async (milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>): Promise<Milestone> => {
  const { data, error } = await supabase
    .from('milestones')
    .insert(milestone)
    .select()
    .single();
  
  if (error) throw error;
  return data as Milestone;
};

export const updateMilestone = async (id: string, updates: Partial<Milestone>): Promise<Milestone> => {
  const { data, error } = await supabase
    .from('milestones')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Milestone;
};

export const deleteMilestone = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('milestones')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const updateMilestoneStatus = async (id: string, status: Milestone['status'], completed: boolean): Promise<Milestone> => {
  const updates: Partial<Milestone> = { 
    status, 
    updated_at: new Date().toISOString() 
  };
  
  if (completed) {
    updates.completed_at = new Date().toISOString();
  } else if (status !== 'completed') {
    updates.completed_at = null;
  }
  
  const { data, error } = await supabase
    .from('milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Milestone;
};

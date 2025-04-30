
import { supabase } from '@/integrations/supabase/client';
import { Idea, Comment, Category, Profile } from '@/types/models';

// Categories API
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as Category[];
};

// Ideas API
export const fetchIdeas = async (categoryId?: string): Promise<Idea[]> => {
  let query = supabase
    .from('ideas')
    .select(`
      *,
      profile:profiles(username, avatar_url),
      category:categories(name, description)
    `)
    .order('created_at', { ascending: false });
  
  if (categoryId) {
    query = query.eq('category_id', categoryId);
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
      profile:profiles(username, avatar_url),
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

export const createIdea = async (idea: Omit<Idea, 'id' | 'created_at' | 'updated_at'>): Promise<Idea> => {
  const { data, error } = await supabase
    .from('ideas')
    .insert(idea)
    .select()
    .single();
  
  if (error) throw error;
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
      profile:profiles(username, avatar_url)
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
  const { error } = await supabase
    .from('likes')
    .insert({ idea_id: ideaId, user_id: userId });
  
  if (error) throw error;
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

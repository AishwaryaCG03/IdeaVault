
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  points: number;
  level: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  user_id: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  share_count: number;
  // These are for joined data
  profile?: Profile;
  category?: Category;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
  tags?: Tag[];
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  idea_id: string;
  title: string;
  description: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'blocked';
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  content: string;
  idea_id: string;
  user_id: string;
  created_at: string;
  // Joined data
  profile?: Profile;
}

export interface Like {
  id: string;
  idea_id: string;
  user_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface IdeaTag {
  id: string;
  idea_id: string;
  tag_id: string;
  created_at: string;
  tag?: Tag;
}

export interface Notification {
  id: string;
  user_id: string;
  sender_id: string | null;
  idea_id: string | null;
  comment_id: string | null;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  // Joined data
  sender?: Profile;
}

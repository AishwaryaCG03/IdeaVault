
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
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
  // These are for joined data
  profile?: Profile;
  category?: Category;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
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

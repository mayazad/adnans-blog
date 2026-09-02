export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'editor' | 'reader'
export type PostStatus = 'draft' | 'pending_review' | 'published' | 'archived'
export type PostSource = 'manual' | 'ai'
export type ReactionType = 'like' | 'insightful' | 'love'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          username: string | null
          avatar_url: string | null
          role: UserRole
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          role?: UserRole
          created_at?: string
        }
        Update: {
          full_name?: string | null
          username?: string | null
          avatar_url?: string | null
          role?: UserRole
        }
      }
      posts: {
        Row: {
          id: string
          slug: string
          title: string
          excerpt: string | null
          content: string | null
          cover_image: string | null
          author_id: string | null
          source: PostSource
          status: PostStatus
          category: string | null
          tags: string[]
          scheduled_at: string | null
          published_at: string | null
          view_count: number
          reading_time_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          excerpt?: string | null
          content?: string | null
          cover_image?: string | null
          author_id?: string | null
          source?: PostSource
          status?: PostStatus
          category?: string | null
          tags?: string[]
          scheduled_at?: string | null
          published_at?: string | null
          view_count?: number
          reading_time_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          slug?: string
          title?: string
          excerpt?: string | null
          content?: string | null
          cover_image?: string | null
          author_id?: string | null
          source?: PostSource
          status?: PostStatus
          category?: string | null
          tags?: string[]
          scheduled_at?: string | null
          published_at?: string | null
          view_count?: number
          reading_time_minutes?: number | null
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          parent_comment_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          parent_comment_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
      }
      reactions: {
        Row: {
          id: string
          post_id: string
          user_id: string
          type: ReactionType
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          type: ReactionType
          created_at?: string
        }
        Update: never
      }
      settings: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
      }
      comment_votes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          vote_value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          vote_value: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          vote_value?: number
        }
      }
      reports: {
        Row: {
          id: string
          comment_id: string
          reporter_id: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          reporter_id: string
          reason: string
          created_at?: string
        }
        Update: {
          reason?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      post_status: PostStatus
      post_source: PostSource
      reaction_type: ReactionType
    }
  }
}

// Convenience types for component usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Reaction = Database['public']['Tables']['reactions']['Row']
export type Setting = Database['public']['Tables']['settings']['Row']
export type CommentVote = Database['public']['Tables']['comment_votes']['Row']
export type Report = Database['public']['Tables']['reports']['Row']

// Post with author profile joined
export type PostWithAuthor = Post & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url'> | null
}

// Comment with user profile joined and votes
export type CommentWithUser = Comment & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url'>
  comment_votes?: Pick<CommentVote, 'vote_value' | 'user_id'>[]
}

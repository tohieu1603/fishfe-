/**
 * Comment/Chat types for Order discussions
 */

export interface CommentUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Comment {
  id: number;
  order_id: number;
  user: CommentUser | null;
  user_name: string;
  message: string | null;
  image: string | null;
  has_image: boolean;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_system_message: boolean;
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
  order_id: number;
}

export interface CreateCommentRequest {
  orderId: number;
  message?: string;
  image?: File;
}

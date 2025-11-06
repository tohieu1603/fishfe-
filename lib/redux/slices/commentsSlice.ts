/**
 * Redux slice for Order Comments/Chat
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '@/lib/api';
import type { Comment, CommentListResponse, CreateCommentRequest } from '@/types/comment';

// ==================== Async Thunks ====================

export const fetchComments = createAsyncThunk(
  'comments/fetch',
  async (orderId: number) => {
    const response = await apiClient.get<CommentListResponse>(
      `/orders/${orderId}/comments`
    );
    return response.data;
  }
);

export const createComment = createAsyncThunk(
  'comments/create',
  async ({ orderId, message, image }: CreateCommentRequest) => {
    const formData = new FormData();
    if (message) formData.append('message', message);
    if (image) formData.append('image', image);

    const response = await apiClient.post<Comment>(
      `/orders/${orderId}/comments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
);

export const updateComment = createAsyncThunk(
  'comments/update',
  async ({ commentId, message }: { commentId: number; message: string }) => {
    const response = await apiClient.put<Comment>(
      `/orders/comments/${commentId}`,
      { message }
    );
    return response.data;
  }
);

export const deleteComment = createAsyncThunk(
  'comments/delete',
  async (commentId: number) => {
    await apiClient.delete(`/orders/comments/${commentId}`);
    return commentId;
  }
);

// ==================== Slice ====================

interface CommentsState {
  byOrderId: Record<number, Comment[]>;
  loading: boolean;
  error: string | null;
  sending: boolean;
}

const initialState: CommentsState = {
  byOrderId: {},
  loading: false,
  error: null,
  sending: false,
};

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    // WebSocket handlers
    commentCreatedWS(state, action: PayloadAction<{ orderId: number; comment: Comment }>) {
      const { orderId, comment } = action.payload;
      if (!state.byOrderId[orderId]) {
        state.byOrderId[orderId] = [];
      }

      // Check if comment already exists (avoid duplicates)
      const exists = state.byOrderId[orderId].some(c => c.id === comment.id);
      if (!exists) {
        state.byOrderId[orderId].push(comment);
      }
    },

    commentUpdatedWS(state, action: PayloadAction<{ orderId: number; comment: Comment }>) {
      const { orderId, comment } = action.payload;
      const comments = state.byOrderId[orderId];
      if (comments) {
        const index = comments.findIndex(c => c.id === comment.id);
        if (index !== -1) {
          comments[index] = comment;
        }
      }
    },

    commentDeletedWS(state, action: PayloadAction<{ orderId: number; commentId: number }>) {
      const { orderId, commentId } = action.payload;
      const comments = state.byOrderId[orderId];
      if (comments) {
        state.byOrderId[orderId] = comments.filter(c => c.id !== commentId);
      }
    },

    clearComments(state, action: PayloadAction<number>) {
      const orderId = action.payload;
      delete state.byOrderId[orderId];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch comments
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { order_id, comments } = action.payload;
        state.byOrderId[order_id] = comments;
        state.loading = false;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch comments';
      })

      // Create comment - DON'T update state, let WebSocket handle it
      .addCase(createComment.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state) => {
        state.sending = false;
        // WebSocket will add the comment
      })
      .addCase(createComment.rejected, (state, action) => {
        state.sending = false;
        state.error = action.error.message || 'Failed to create comment';
      })

      // Update comment - DON'T update state, let WebSocket handle it
      .addCase(updateComment.fulfilled, (state) => {
        // WebSocket will update the comment
      })

      // Delete comment - DON'T update state, let WebSocket handle it
      .addCase(deleteComment.fulfilled, (state) => {
        // WebSocket will remove the comment
      });
  },
});

export const {
  commentCreatedWS,
  commentUpdatedWS,
  commentDeletedWS,
  clearComments,
} = commentsSlice.actions;

export default commentsSlice.reducer;

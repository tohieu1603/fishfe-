/**
 * Order Chat/Discussion Component
 * Realtime chat for order discussions with text and image support
 */
'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchComments, createComment } from '@/lib/redux/slices/commentsSlice';
import type { Comment } from '@/types/comment';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface OrderChatProps {
  orderId: number;
}

export function OrderChat({ orderId }: OrderChatProps) {
  const dispatch = useAppDispatch();
  const comments = useAppSelector(state => state.comments.byOrderId[orderId] || []);
  const loading = useAppSelector(state => state.comments.loading);
  const sending = useAppSelector(state => state.comments.sending);

  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load comments on mount
  useEffect(() => {
    dispatch(fetchComments(orderId));
  }, [orderId, dispatch]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ảnh quá lớn! Tối đa 10MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Chỉ chấp nhận file ảnh');
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image selection
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim() && !selectedImage) {
      toast.error('Vui lòng nhập tin nhắn hoặc chọn ảnh');
      return;
    }

    try {
      await dispatch(createComment({
        orderId,
        message: message.trim() || undefined,
        image: selectedImage || undefined,
      })).unwrap();

      // Clear form
      setMessage('');
      clearImage();
    } catch (error) {
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
      console.error('Failed to send comment:', error);
    }
  };

  // Render comment item
  const renderComment = (comment: Comment) => {
    const isSystem = comment.is_system_message;
    const isCurrentUser = false; // TODO: Check if current user

    return (
      <div
        key={comment.id}
        className={`flex gap-3 ${isSystem ? 'justify-center' : ''}`}
      >
        {/* System message */}
        {isSystem ? (
          <div className="text-center py-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              🤖 {comment.message}
            </span>
          </div>
        ) : (
          <>
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                {comment.user_name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Message content */}
            <div className="flex-1 max-w-[70%]">
              {/* Header */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-semibold text-sm">{comment.user_name}</span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </span>
                {comment.is_edited && (
                  <span className="text-xs text-gray-400">(đã chỉnh sửa)</span>
                )}
              </div>

              {/* Text message */}
              {comment.message && (
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {comment.message}
                  </p>
                </div>
              )}

              {/* Image */}
              {comment.has_image && comment.image && (
                <div className="mt-2 relative group">
                  <img
                    src={comment.image}
                    alt="Attachment"
                    className="max-w-full max-h-96 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity object-contain"
                    onClick={() => window.open(comment.image!, '_blank')}
                  />
                  {/* Zoom icon overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-lg flex items-center justify-center pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                      <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamp tooltip */}
              <div className="text-xs text-gray-400 mt-1">
                {format(new Date(comment.created_at), 'HH:mm dd/MM/yyyy')}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          💬 Thảo luận
          <span className="text-sm text-gray-500 font-normal">
            ({comments.length} tin nhắn)
          </span>
        </h3>
      </div>

      {/* Messages list */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-white">
        {loading && comments.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">💬</p>
              <p>Chưa có tin nhắn nào</p>
              <p className="text-sm">Hãy bắt đầu thảo luận về đơn hàng này</p>
            </div>
          </div>
        ) : (
          <>
            {comments.map(renderComment)}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="border-t bg-gray-50 p-4">
        {/* Image preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-32 rounded border"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input row */}
        <div className="flex gap-2">
          {/* Text input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />

          {/* Image upload button */}
          <label
            className={`cursor-pointer px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center ${
              sending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className="text-xl">📷</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
              disabled={sending}
            />
          </label>

          {/* Send button */}
          <button
            type="submit"
            disabled={sending || (!message.trim() && !selectedImage)}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {sending ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>

        {/* Helper text */}
        <p className="text-xs text-gray-500 mt-2">
          Hỗ trợ: Text, ảnh (max 10MB). Tin nhắn sẽ được cập nhật realtime cho tất cả thành viên.
        </p>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Spinner } from "@heroui/react";
import { toast } from "react-toastify";
import type { FeedSectionProps, FeedPostData } from "@/lib/type";
import FeedCard from "./FeedCard";
import {
  getFeedPosts,
  toggleLikePost,
  createComment,
  sharePost,
  getCommentsByPost,
  toggleLikeComment,
} from "@/lib/actions/actionFeed";

export default function FeedSection({
  projectId,
  organizationId,
  currentUserId,
}: FeedSectionProps) {
  const [posts, setPosts] = useState<FeedPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const loadFeed = useCallback(
    async (cursor?: number) => {
      const isInitial = !cursor;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      try {
        const res = await getFeedPosts(projectId, organizationId, cursor);
        if (res.success) {
          const newPosts = res.data as FeedPostData[];
          setPosts((prev) => (isInitial ? newPosts : [...prev, ...newPosts]));
          setHasMore(res.hasMore);
          setNextCursor(res.nextCursor);
        }
      } catch {
        toast.error("ไม่สามารถโหลดฟีดได้");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [projectId, organizationId],
  );

  useEffect(() => {
    if (projectId && organizationId) {
      loadFeed();
    }
  }, [projectId, organizationId, loadFeed]);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          loadFeed(nextCursor);
        }
      },
      { threshold: 0.1 },
    );

    const target = observerTarget.current;
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, loadingMore, nextCursor, loadFeed]);

  const handleLikeToggle = async (postId: number) => {
    const res = await toggleLikePost(postId);
    if (!res.success) toast.error(res.message || "ไลค์ไม่สำเร็จ");
  };

  const insertReply = (
    comments: FeedPostData["previewComments"],
    parentId: number,
    newReply: any,
  ): FeedPostData["previewComments"] => {
    return comments.map((c) => {
      if (c.id === parentId) {
        return { ...c, replies: [...(c.replies || []), newReply] };
      }
      if (c.replies?.length) {
        return { ...c, replies: insertReply(c.replies, parentId, newReply) };
      }
      return c;
    });
  };

  const handleComment = async (postId: number, content: string, parentId?: number, imageUrl?: string) => {
    const res = await createComment(postId, content, parentId, imageUrl);
    if (res.success && res.data) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;

          const updatedComments = parentId
            ? insertReply(p.previewComments, parentId, res.data)
            : [...p.previewComments, res.data];

          return {
            ...p,
            _count: { ...p._count, comments: p._count.comments + 1 },
            previewComments: updatedComments,
          };
        }),
      );
    } else {
      toast.error(res.message || "แสดงความคิดเห็นไม่สำเร็จ");
    }
  };

  const handleShare = async (postId: number) => {
    const res = await sharePost(postId);
    if (res.success) {
      toast.success("แชร์เรียบร้อย");
    } else {
      toast.error(res.message || "แชร์ไม่สำเร็จ");
    }
  };

  const toggleCommentLike = (
    comments: FeedPostData["previewComments"],
    commentId: number,
  ): FeedPostData["previewComments"] => {
    return comments.map((c) => {
      if (c.id === commentId) {
        return {
          ...c,
          isLiked: !c.isLiked,
          _count: { likes: c.isLiked ? c._count.likes - 1 : c._count.likes + 1 },
        };
      }
      if (c.replies?.length) {
        return { ...c, replies: toggleCommentLike(c.replies, commentId) };
      }
      return c;
    });
  };

  const handleLikeComment = async (postId: number, commentId: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, previewComments: toggleCommentLike(p.previewComments, commentId) }
          : p,
      ),
    );

    const res = await toggleLikeComment(commentId);
    if (!res.success) toast.error(res.message || "ไลค์ไม่สำเร็จ");
  };

  const handleLoadComments = async (postId: number) => {
    const res = await getCommentsByPost(postId);
    if (res.success) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, previewComments: res.data as FeedPostData["previewComments"] }
            : p,
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-default-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-default-200">
        <p className="text-default-400 font-bold text-lg">ยังไม่มีกิจกรรม</p>
        <p className="text-default-300 text-sm mt-1">
          เมื่อมีการสร้าง Task หรืออัปเดต Subtask จะแสดงที่นี่
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {posts.map((post) => (
        <FeedCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onLikeToggle={handleLikeToggle}
          onComment={handleComment}
          onShare={handleShare}
          onLoadComments={handleLoadComments}
          onLikeComment={handleLikeComment}
        />
      ))}
      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-6">
          {loadingMore && <Spinner color="primary" />}
        </div>
      )}
    </div>
  );
}

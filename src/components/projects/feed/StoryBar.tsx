"use client";

import { useRef } from "react";
import { Avatar } from "@heroui/react";
import { Plus } from "lucide-react";
import type { StoryGroup, StoryBarProps } from "@/lib/type";

export default function StoryBar({
  projectId,
  organizationId,
  currentUserId,
  currentUserAvatar,
  currentUserName,
  onCreateStory,
  onOpenViewer,
  storyGroups,
  loading,
}: StoryBarProps & {
  onOpenViewer: (groupIndex: number) => void;
  storyGroups: StoryGroup[];
  loading: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-1"
      >
        {/* Create Story Button */}
        <button
          onClick={onCreateStory}
          className="flex flex-col items-center gap-1.5 shrink-0 w-[76px]"
        >
          <div className="relative">
            <Avatar
              src={currentUserAvatar || undefined}
              name={currentUserName?.[0] || "?"}
              size="lg"
              className="w-[60px] h-[60px] border-2 border-default-200"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-white dark:border-zinc-900">
              <Plus size={14} className="text-white" />
            </div>
          </div>
          <span className="text-[11px] text-default-500 font-medium truncate w-full text-center">
            สร้างสตอรี่
          </span>
        </button>

        {/* Story Items */}
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 w-[76px] animate-pulse">
                <div className="w-[60px] h-[60px] rounded-full bg-default-200" />
                <div className="w-10 h-2 rounded bg-default-200" />
              </div>
            ))}
          </>
        ) : (
          storyGroups.map((group, idx) => (
            <button
              key={group.user.id}
              onClick={() => onOpenViewer(idx)}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[76px]"
            >
              <div
                className={`rounded-full p-[3px] ${
                  group.hasUnviewed
                    ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600"
                    : "bg-default-300 dark:bg-zinc-600"
                }`}
              >
                <div className="rounded-full p-[2px] bg-white dark:bg-zinc-900">
                  <Avatar
                    src={group.user.avatarUrl || undefined}
                    name={group.user.displayName?.[0] || "?"}
                    className="w-[52px] h-[52px]"
                  />
                </div>
              </div>
              <span className="text-[11px] text-default-600 font-medium truncate w-full text-center">
                {group.user.id === currentUserId
                  ? "สตอรี่ของคุณ"
                  : group.user.displayName || "ผู้ใช้"}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

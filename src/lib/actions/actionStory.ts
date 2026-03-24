"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ActionState } from "@/lib/type";
import { sendbase64toS3DataVdo } from "@/lib/actions/actionIndex";
import { transcribeVideoAudio } from "@/lib/ai/geminiAI";

/* ====================================================== */
/* CREATE STORY                                            */
/* ====================================================== */

export async function createStory(
  formData: FormData,
  projectId: number,
  organizationId: number,
  caption?: string,
): Promise<ActionState> {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : 0;
    if (!userId) return { success: false, error: true, message: "ไม่พบผู้ใช้" };

    // 1. Validate file
    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: true, message: "ไม่พบไฟล์วิดีโอ" };

    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
    if (file.size > MAX_SIZE) {
      return { success: false, error: true, message: "ไฟล์วิดีโอต้องไม่เกิน 100 MB" };
    }
    if (!file.type.startsWith("video/")) {
      return { success: false, error: true, message: "อนุญาตเฉพาะไฟล์วิดีโอเท่านั้น" };
    }

    // 2. Upload video to S3
    const uploadResult = await sendbase64toS3DataVdo(formData, "stories");
    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: true, message: "อัปโหลดวิดีโอไม่สำเร็จ" };
    }

    // 2. Create story record (optimistic — show immediately)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24hr

    const story = await prisma.story.create({
      data: {
        videoUrl: uploadResult.url,
        caption: caption || null,
        isProcessing: true,
        expiresAt,
        organizationId,
        projectId,
        userId,
      },
    });

    // 3. Trigger AI transcript in background (non-blocking)
    processTranscriptInBackground(story.id, uploadResult.url);

    return {
      success: true,
      error: false,
      message: "สร้างสตอรี่สำเร็จ",
      data: {
        id: story.id,
        videoUrl: story.videoUrl,
        thumbnailUrl: story.thumbnailUrl,
        caption: story.caption,
        transcript: story.transcript,
        duration: story.duration,
        isProcessing: story.isProcessing,
        expiresAt: story.expiresAt.toISOString(),
        createdAt: story.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Create Story Error:", error);
    return { success: false, error: true, message: "สร้างสตอรี่ไม่สำเร็จ" };
  }
}

/* ====================================================== */
/* BACKGROUND: AI TRANSCRIPT PROCESSING                    */
/* ====================================================== */

async function processTranscriptInBackground(storyId: number, videoUrl: string) {
  try {
    const result = await transcribeVideoAudio(videoUrl);

    if (result) {
      // Only auto-fill caption if user didn't provide one
      const existing = await prisma.story.findUnique({
        where: { id: storyId },
        select: { caption: true },
      });

      await prisma.story.update({
        where: { id: storyId },
        data: {
          transcript: result.transcript,
          caption: existing?.caption ? undefined : (result.summary || undefined),
          isProcessing: false,
        },
      });
      console.log(`✅ Story #${storyId} transcript completed`);
    } else {
      await prisma.story.update({
        where: { id: storyId },
        data: { isProcessing: false },
      });
      console.warn(`⚠️ Story #${storyId} transcript returned null`);
    }
  } catch (error) {
    console.error(`❌ Story #${storyId} transcript error:`, error);
    await prisma.story.update({
      where: { id: storyId },
      data: { isProcessing: false },
    }).catch(() => {});
  }
}

/* ====================================================== */
/* GET ACTIVE STORIES (not expired, grouped by user)       */
/* ====================================================== */

export async function getActiveStories(
  projectId: number,
  organizationId: number,
) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id ? parseInt(session.user.id) : 0;

    const now = new Date();

    // Cleanup: delete stories expired more than 48hrs ago (non-blocking)
    const cleanupThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    prisma.story.deleteMany({
      where: { organizationId, expiresAt: { lt: cleanupThreshold } },
    }).catch(() => {});

    const stories = await prisma.story.findMany({
      where: {
        projectId,
        organizationId,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        views: {
          where: { userId: currentUserId },
          select: { id: true },
        },
      },
    });

    // Format and group by user
    const userMap = new Map<number, {
      user: { id: number; displayName: string | null; avatarUrl: string | null };
      stories: any[];
      hasUnviewed: boolean;
    }>();

    for (const story of stories) {
      const isViewed = story.views.length > 0;
      const formatted = {
        id: story.id,
        videoUrl: story.videoUrl,
        thumbnailUrl: story.thumbnailUrl,
        caption: story.caption,
        transcript: story.transcript,
        duration: story.duration,
        isProcessing: story.isProcessing,
        expiresAt: story.expiresAt.toISOString(),
        createdAt: story.createdAt.toISOString(),
        user: story.user,
        isViewed,
      };

      if (!userMap.has(story.userId)) {
        userMap.set(story.userId, {
          user: story.user,
          stories: [],
          hasUnviewed: false,
        });
      }

      const group = userMap.get(story.userId)!;
      group.stories.push(formatted);
      if (!isViewed) group.hasUnviewed = true;
    }

    // Current user's stories first, then others
    const groups = Array.from(userMap.values());
    groups.sort((a, b) => {
      if (a.user.id === currentUserId) return -1;
      if (b.user.id === currentUserId) return 1;
      // Unviewed first
      if (a.hasUnviewed && !b.hasUnviewed) return -1;
      if (!a.hasUnviewed && b.hasUnviewed) return 1;
      return 0;
    });

    return { success: true, data: groups };
  } catch (error) {
    console.error("Get Active Stories Error:", error);
    return { success: false, data: [] };
  }
}

/* ====================================================== */
/* MARK STORY AS VIEWED                                    */
/* ====================================================== */

export async function markStoryViewed(storyId: number): Promise<ActionState> {
  try {
    const session = await auth();
    const userId = session?.user?.id ? parseInt(session.user.id) : 0;
    if (!userId) return { success: false, error: true, message: "ไม่พบผู้ใช้" };

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { organizationId: true },
    });
    if (!story) return { success: false, error: true, message: "ไม่พบสตอรี่" };

    await prisma.story_view.upsert({
      where: { storyId_userId: { storyId, userId } },
      create: {
        storyId,
        userId,
        organizationId: story.organizationId,
      },
      update: { viewedAt: new Date() },
    });

    return { success: true, error: false };
  } catch (error) {
    console.error("Mark Story Viewed Error:", error);
    return { success: false, error: true, message: "บันทึกการดูไม่สำเร็จ" };
  }
}

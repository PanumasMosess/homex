import prisma from "@/lib/prisma";
import MainPageProject from "@/components/projects/MainPageProject";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
};

const Project = async () => {
  const organizationId = 1;
  const currentUserId = 1;

  return (
    <MainPageProject
      organizationId={organizationId}
      currentUserId={currentUserId}
    ></MainPageProject>
  );
};

export default Project;

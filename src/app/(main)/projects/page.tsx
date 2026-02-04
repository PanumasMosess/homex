import prisma from "@/lib/prisma";
import MainPageProject from "@/components/projects/MainPageProject";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
};

const Project = async () => {
  return <MainPageProject></MainPageProject>;
};

export default Project;

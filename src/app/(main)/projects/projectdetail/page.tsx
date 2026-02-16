import { auth } from "@/auth";
import ProjectDetail from "@/components/projects/ProjectDetail";

const Page = async () => {
  const session = await auth();

  const currentUserId = session?.user?.id ? parseInt(session.user.id) : 0;
  const organizationId = session?.user.organizationId ?? 0;


  return (
    <ProjectDetail
      organizationId={organizationId}
      currentUserId={currentUserId}
    />
  );
};

export default Page;

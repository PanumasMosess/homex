import { auth } from "@/auth";
import MainPageUser from "@/components/user/MainPageUser";
import { prisma } from "@/lib/prisma";

const Page = async () => {

  const session = await auth();

  const organizationId = session?.user.organizationId ?? 0;
  const currentUserId = Number(session?.user.id);

  const users = await prisma.user.findMany({
    where: { organizationId },
    include: { position: true }
  })

  const positions = await prisma.position.findMany({
    where: { organizationId }
  })

  return (
    <MainPageUser
      users={users}
      positions={positions}
    />
  )
}

export default Page

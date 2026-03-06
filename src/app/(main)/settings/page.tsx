import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import MainPageSetting from "@/components/settings/MainPageSetting";

export const dynamic = "force-dynamic";

const Page = async () => {

  const session = await auth();
  const organizationId = Number(session?.user.organizationId);

  const positions = await prisma.position.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  const permissions = await prisma.permission.findMany({
    where: { organizationId },
    include: { positions: true },
    orderBy: { createdAt: "desc" },
  });

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <MainPageSetting
      positions={positions}
      permissions={permissions}
      suppliers={suppliers}
    />
  );
};

export default Page;
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Divider,
  Progress,
} from "@heroui/react";
import { ArrowRight, Calendar, MapPin, MoreVertical } from "lucide-react";
import Link from "next/link";
import React from "react";

const getStatusProjectColor = (status: string) => {
  switch (status) {
    case "Completed": return "success";
    case "In Progress": return "primary";
    case "Planning": return "warning";
    default: return "default";
  }
};

const ProjectCard = ({ project }: { project: any }) => {
  return (
    <Card 
      className="w-full h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group border border-transparent dark:border-white/10" 
      radius="lg" 
      shadow="sm"
    >
      {/* 1. Image: Mobile h-40 / Desktop h-48 */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        <img
          alt={project.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          src={project.image}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"/>
        
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <Chip
            color={getStatusProjectColor(project.status) as any}
            variant="shadow" size="sm"
            classNames={{ base: "border border-white/20 h-6 text-xs" }}
          >
            {project.status}
          </Chip>
        </div>
      </div>

      {/* 2. Content: Mobile p-3 / Desktop p-5 */}
      <CardBody className="p-3 sm:p-5 flex flex-col gap-3">
        <div>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                {project.name}
              </h3>
              <p className="text-xs sm:text-sm text-default-400 flex items-center gap-1 mt-0.5">
                <MapPin size={12} className="sm:w-[14px] sm:h-[14px]" /> 
                <span className="truncate">{project.address}</span>
              </p>
            </div>
            <Button isIconOnly size="sm" variant="light" radius="full" className="-mr-2 text-default-400 shrink-0">
                <MoreVertical size={18} />
            </Button>
          </div>
        </div>

        {/* Client Info */}
        <div className="flex items-center gap-2 sm:gap-3 bg-default-50 dark:bg-default-100/50 p-2 sm:p-3 rounded-xl border border-default-100 dark:border-default-100/10">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md shrink-0">
            {project.client.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-default-400 uppercase tracking-wider font-semibold">Client</p>
            <p className="text-xs sm:text-sm font-medium truncate">{project.client}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5 mt-auto">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-default-500">Progress</span>
            <span className="text-primary">{project.progress}%</span>
          </div>
          <Progress 
            value={project.progress} 
            color={getStatusProjectColor(project.status) as any} 
            size="sm" 
            radius="full" 
            classNames={{ track: "h-1.5 sm:h-2", indicator: "h-1.5 sm:h-2" }} 
          />
        </div>
      </CardBody>

      <Divider className="opacity-50" />

      {/* 3. Footer */}
      <CardFooter className="px-3 py-3 sm:px-5 sm:py-4 flex justify-between items-center bg-default-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-default-500">
          <Calendar size={12} className="sm:w-[14px] sm:h-[14px] text-default-400"/>
          <span>{project.dueDate}</span>
        </div>
        
        <Link href={`/projects/${project.id}`} className="group/link flex items-center gap-1 text-xs sm:text-sm font-bold text-primary hover:text-primary-600 transition-colors">
          View Details <ArrowRight size={14} className="sm:w-4 sm:h-4 group-hover/link:translate-x-1 transition-transform"/>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
import React from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';
import { getProjectLogo } from '../utils/getProjectLogo';

interface Project {
  id: string;
  displayName: string;
}

interface ProjectCarouselProps {
  projects: Project[];
  selectedProject: string;
  onProjectSelect: (projectId: string) => void;
}

const ProjectCarousel: React.FC<ProjectCarouselProps> = ({
  projects,
  selectedProject,
  onProjectSelect,
}) => {
  const responsive = {
    superLargeDesktop: { breakpoint: { max: 4000, min: 3000 }, items: 5 },
    desktop: { breakpoint: { max: 3000, min: 1024 }, items: 3 },
    tablet: { breakpoint: { max: 1024, min: 464 }, items: 2 },
    mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
  };

  return (
    <Carousel responsive={responsive}>
  {projects.map((proj) => (
    <div
      key={proj.id}
      onClick={() => onProjectSelect(proj.id)}
      className={`cursor-pointer flex flex-col items-center space-y-4 p-6 
        rounded-2xl shadow-md transition 
        ${selectedProject === proj.id 
          ? 'bg-yellow-400 bg-opacity-70 border-2 border-yellow-500' 
          : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
        }`}
    >
      <img
        src={getProjectLogo(proj.id)}
        alt={`${proj.displayName} logo`}
        className="h-24 w-auto"
      />
      <h2 className="text-xl font-semibold text-white">
        {proj.displayName}
      </h2>
    </div>
  ))}
</Carousel>

  );
};

export default ProjectCarousel;

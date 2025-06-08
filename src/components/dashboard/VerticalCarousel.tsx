import React, { useState } from 'react';
import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

interface Project {
  id: string;
  displayName: string;
  logo?: string;
}

interface VerticalCarouselProps {
  projects: Project[];
  selectedProject: string;
  onProjectSelect: (projectId: string) => void;
}

const VerticalCarousel: React.FC<VerticalCarouselProps> = ({
  projects,
  selectedProject,
  onProjectSelect,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleProjectSelect = (projectId: string, index: number) => {
    setActiveIndex(index);
    onProjectSelect(projectId);
  };

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 3000 },
      items: 1,
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 1,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 1,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  };

  return (
    <div className="relative">
      <Carousel
        responsive={responsive}
        arrows={true}
        customLeftArrow={<CustomArrow direction="left" />}
        customRightArrow={<CustomArrow direction="right" />}
        afterChange={(previousSlide, { currentSlide }) => setActiveIndex(currentSlide)}
      >
        {projects.map((proj, index) => (
          <div
            key={proj.id}
            onClick={() => handleProjectSelect(proj.id, index)}
            className={`cursor-pointer flex flex-col items-center space-y-4 p-6 bg-white/20 backdrop-blur-sm rounded-2xl shadow-md hover:bg-white/30 transition ${
              selectedProject === proj.id ? 'border-2 border-blue-500' : ''
            }`}
          >
            <img
              src={proj.logo}
              alt={`${proj.displayName} logo`}
              className="h-24 w-auto"
            />
            <h2 className="text-xl font-semibold text-white">
              {proj.displayName}
            </h2>
          </div>
        ))}
      </Carousel>
    </div>
  );
};

// Custom Arrow Component
const CustomArrow: React.FC<{ direction: 'left' | 'right' }> = ({ direction }) => {
  return (
    <button
      className={`absolute top-1/2 transform -translate-y-1/2 ${
        direction === 'left' ? 'left-0' : 'right-0'
      } bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition`}
      aria-label={direction === 'left' ? 'Previous' : 'Next'}
    >
      {direction === 'left' ? '←' : '→'}
    </button>
  );
};

export default VerticalCarousel;

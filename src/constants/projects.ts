// src/constants/projects.ts (for example)

import audiLogo from '../assets/images/logos/Audi.png';
import bmwLogo from '../assets/images/logos/BMW.png';
import Chevrolet from '../assets/images/logos/Chevrolet.png';
import otherLogo from '../assets/images/logos/other.png';
import fordLogo from '../assets/images/logos/Ford.png';
import gmcLogo from '../assets/images/logos/gmc.png';
import jaguarLogo from '../assets/images/logos/Jaguar.png';
import lamborghiniLogo from '../assets/images/logos/Lamborghini.png';
import landroverLogo from '../assets/images/logos/landrover.png';
import lucidLogo from '../assets/images/logos/lucid.png';
import mercedesBenzLogo from '../assets/images/logos/Mercedes-Benz.png';
import miniLogo from '../assets/images/logos/Mini.png';
import porscheLogo from '../assets/images/logos/Porsche.png';
import rivianLogo from '../assets/images/logos/rivian.png';
import teslaLogo from '../assets/images/logos/Tesla.png';
import volkswagenLogo from '../assets/images/logos/Volkswagen.png';

export const AVAILABLE_PROJECTS = [
  {
    id: 'audi',
    displayName: 'Audi',
    logo: audiLogo,
  },
   {
    id: 'bmw',
    displayName: 'BMW',
    logo: bmwLogo,
  },
   {
    id: 'chevrolet',
    displayName: 'Chevrolet',
    logo: Chevrolet,
  },
  {
    id: 'ford',
    displayName: 'Ford',
    logo: fordLogo,
  },
  {
    id: 'gmc',
    displayName: 'GMC',
    logo: gmcLogo,
  },
  {
    id: 'jaguar',
    displayName: 'Jaguar',
    logo: jaguarLogo,
  },
  {
    id: 'lamborghini',
    displayName: 'Lamborghini',
    logo: lamborghiniLogo,
  },
  {
    id: 'landrover',
    displayName: 'Land Rover',
    logo: landroverLogo,
  },
  {
    id: 'lucid',
    displayName: 'Lucid',
    logo: lucidLogo,
  },
  {
    id: 'mercedes-benz',
    displayName: 'Mercedes-Benz',
    logo: mercedesBenzLogo,
  },
  {
    id: 'mini',
    displayName: 'Mini',
    logo: miniLogo,
  },
  {
    id: 'porsche',
    displayName: 'Porsche',
    logo: porscheLogo,
  },
  {
    id: 'rivian',
    displayName: 'Rivian',
    logo: rivianLogo,
  },
  {
    id: 'tesla',
    displayName: 'Tesla',
    logo: teslaLogo,
  },
  {
    id: 'volkswagen',
    displayName: 'Volkswagen',
    logo: volkswagenLogo,
  },
   {
    id: 'other',
    displayName: 'Other',
    logo: otherLogo,
  },
];
export const PROJECT_LOGO_MAP: Record<string, string> = {
  audi: audiLogo,
  bmw: bmwLogo,
  chevrolet: Chevrolet,
  ford: fordLogo,
  gmc: gmcLogo,
  jaguar: jaguarLogo,
  lamborghini: lamborghiniLogo,
  landrover: landroverLogo,
  lucid: lucidLogo,
  "mercedes-benz": mercedesBenzLogo,
  mini: miniLogo,
  porsche: porscheLogo,
  rivian: rivianLogo,
  tesla: teslaLogo,
  volkswagen: volkswagenLogo,
  other: otherLogo,
};


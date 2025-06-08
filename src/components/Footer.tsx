// components/Footer.tsx
// File: src/components/Footer.tsx
import React from "react";
import "../components/footer.css";
import audi from "../assets/images/logos/Audi.png"; 
import bmw from "../assets/images/logos/BMW.png"; 
import Chevrolet from "../assets/images/logos/Chevrolet.png"; 
import Ford  from "../assets/images/logos/Ford.png"; 
import Jaguar from "../assets/images/logos/Jaguar.png"; 
import Lamborghini from "../assets/images/logos/Lamborghini.png"; 
import Mercedes from "../assets/images/logos/Mercedes-Benz.png"; 
import mini  from "../assets/images/logos/Mini.png"; 
import Porsche from "../assets/images/logos/Porsche.png"; 
import tesla from "../assets/images/logos/Tesla.png"; 
import Volkswagen from "../assets/images/logos/Volkswagen.png"; 
import gmc  from "../assets/images/logos/gmc.png"; 
import landrover from "../assets/images/logos/landrover.png"; 
import lucid from "../assets/images/logos/lucid.png"; 
import rivian from "../assets/images/logos/rivian.png"; 
import draxlmaeir from "../assets/images/draxlmaier-group.png"
import pnavlogo from "../assets/images/cableinsidecar.png" 

const brandLogos = [bmw,Lamborghini,Mercedes,draxlmaeir,bmw,Lamborghini,Mercedes,draxlmaeir,bmw,Lamborghini,Mercedes,draxlmaeir];

export default function Footer() {
  return (
    <footer className="logos bg-white overflow-hidden py-4">
      <div className="logos-slide">
        {brandLogos.map((src, i) => (
          <img key={i} src={src} className="h-10 mx-6 inline-block" alt="" />
        ))}
      </div>
      <div className="logos-slide">
        {brandLogos.map((src, i) => (
          <img key={i} src={src} className="h-10 mx-6 inline-block" alt="" />
        ))}
      </div>
    </footer>
  );
}
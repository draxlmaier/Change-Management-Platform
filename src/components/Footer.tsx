// components/Footer.tsx
// File: src/components/Footer.tsx
import React from "react";
import "../components/footer.css";
import bmw from "../assets/images/logos/BMW.png"; 

import Lamborghini from "../assets/images/logos/Lamborghini.png"; 
import Mercedes from "../assets/images/logos/Mercedes-Benz.png"; 

import draxlmaeir from "../assets/images/draxlmaier-group.png"

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
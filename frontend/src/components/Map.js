import React from 'react';
import { ReactSVG } from 'react-svg';
import './Map.css';

// Répartition tricolore basée sur les codes INSEE
const departmentColors = {};
for (let i = 1; i <= 96; i++) {
  const deptId = i < 10 ? `0${i}` : `${i}`; // "01", "02", ..., "95"
  if (i <= 32) departmentColors[deptId] = '#0000FF'; // Bleu
  else if (i <= 64) departmentColors[deptId] = '#FFFFFF'; // Blanc
  else departmentColors[deptId] = '#FF0000'; // Rouge
}

const Map = () => {
  return (
    <div className="map-container">
      <ReactSVG
        src="/france-departements.svg"
        beforeInjection={(svg) => {
          console.log('SVG chargé, éléments trouvés :', svg.querySelectorAll('path').length); // Debug
          // Supprimer tous les fill existants
          const paths = svg.querySelectorAll('path');
          paths.forEach((path) => {
            path.removeAttribute('fill'); // Supprime le fill noir
          });
          // Appliquer les nouvelles couleurs
          Object.keys(departmentColors).forEach((deptId) => {
            const path = svg.getElementById(deptId);
            if (path) {
              path.setAttribute('fill', departmentColors[deptId]);
              path.setAttribute('stroke', '#000000');
              path.setAttribute('stroke-width', '1');
              console.log(`Colorisé ${deptId} en ${departmentColors[deptId]}`);
            } else {
              console.log(`Élément ${deptId} non trouvé`);
            }
          });
        }}
        afterInjection={(svg) => {
          // Forcer la taille et ajuster le viewBox si nécessaire
          svg.setAttribute('width', '600');
          svg.setAttribute('height', '600');
          svg.setAttribute('viewBox', '0 0 960 600'); // Correspond au viewBox original
        }}
      />
    </div>
  );
};

export default Map;
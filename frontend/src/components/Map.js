import React, { useState, useRef, useEffect } from 'react';
import { ReactSVG } from 'react-svg';
import './Map.css';

const Map = ({ onDepartmentSelect }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [gridVisible, setGridVisible] = useState(true);
  const [gridSize, setGridSize] = useState(10); // Taille de la grille en pixels
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentInfo, setDepartmentInfo] = useState({});
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const clickTimeoutRef = useRef(null);

  // Gestionnaire de zoom
  const handleZoom = (event) => {
    event.preventDefault();
    const zoomSpeed = 0.1;
    const newScale = event.deltaY < 0 
      ? Math.min(scale + zoomSpeed, 5) // Limite supérieure du zoom
      : Math.max(scale - zoomSpeed, 0.5); // Limite inférieure du zoom
    setScale(newScale);
  };

  // Gestionnaires de drag pour la navigation
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Clic gauche uniquement
      setIsDragging(false); // On commence par supposer que ce n'est pas un drag
      
      // On définit un délai court pour déterminer s'il s'agit d'un clic ou d'un drag
      clickTimeoutRef.current = setTimeout(() => {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
      }, 100); // Délai de 100ms
    }
  };

  const handleMouseMove = (e) => {
    // Si on commence à bouger avant le délai, on annule le timeout
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPosition({
        x: position.x + dx / scale,
        y: position.y + dy / scale
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = (e) => {
    // Si le timeout existe encore, c'était un clic et non un drag
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      // Ici on pourrait gérer les clics sur la carte
    }
    
    setIsDragging(false);
  };

  // Gérer le clic sur un département
  const handleDepartmentClick = (deptId, deptName) => {
    if (!isDragging) {
      setSelectedDepartment(deptId);
      setDepartmentInfo({
        id: deptId,
        name: deptName
      });
      
      if (onDepartmentSelect) {
        onDepartmentSelect(deptId, deptName);
      }
    }
  };

  // Gérer le zoom avec les boutons
  const zoomIn = () => {
    setScale(Math.min(scale + 0.1, 5));
  };

  const zoomOut = () => {
    setScale(Math.max(scale - 0.1, 0.5));
  };

  // Toggle la visibilité de la grille
  const toggleGrid = () => {
    setGridVisible(!gridVisible);
  };

  // Changer la taille de la grille
  const handleGridSizeChange = (e) => {
    setGridSize(Number(e.target.value));
  };

  useEffect(() => {
    // Ajouter les écouteurs d'événements
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleZoom);
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      // Nettoyer les écouteurs d'événements
      if (container) {
        container.removeEventListener('wheel', handleZoom);
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mouseleave', handleMouseUp);
      }
      
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
    };
  }, [isDragging, dragStart, position, scale]);

  useEffect(() => {
    // Appliquer les transformations au SVG
    if (svgRef.current) {
      const svgElement = svgRef.current;
      svgElement.style.transform = `scale(${scale})`;
      svgElement.style.transformOrigin = 'center';
      
      // Créer ou mettre à jour la grille
      updateGrid();
    }
  }, [scale, position, gridVisible, gridSize]);

  // Mettre à jour la grille
  const updateGrid = () => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    let gridGroup = svg.querySelector('.grid-overlay');
    
    // Créer le groupe de grille s'il n'existe pas
    if (!gridGroup) {
      gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gridGroup.classList.add('grid-overlay');
      svg.appendChild(gridGroup);
    }
    
    // Vider la grille existante
    while (gridGroup.firstChild) {
      gridGroup.removeChild(gridGroup.firstChild);
    }
    
    // Si la grille n'est pas visible, on s'arrête là
    if (!gridVisible) return;
    
    // Dimensions du SVG
    const width = 800;
    const height = 600;
    
    // Créer les lignes horizontales
    for (let i = 0; i <= height; i += gridSize) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', i.toString());
      line.setAttribute('x2', width.toString());
      line.setAttribute('y2', i.toString());
      line.setAttribute('stroke', '#aaaaaa');
      line.setAttribute('stroke-width', '0.5');
      line.setAttribute('opacity', '0.3');
      gridGroup.appendChild(line);
    }
    
    // Créer les lignes verticales
    for (let i = 0; i <= width; i += gridSize) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', i.toString());
      line.setAttribute('y1', '0');
      line.setAttribute('x2', i.toString());
      line.setAttribute('y2', height.toString());
      line.setAttribute('stroke', '#aaaaaa');
      line.setAttribute('stroke-width', '0.5');
      line.setAttribute('opacity', '0.3');
      gridGroup.appendChild(line);
    }
  };

  return (
    <div className="map-container">
      <div className="map-controls">
        <button onClick={zoomIn}>+</button>
        <button onClick={zoomOut}>-</button>
        <button onClick={toggleGrid}>
          {gridVisible ? 'Masquer la grille' : 'Afficher la grille'}
        </button>
        <select 
          value={gridSize} 
          onChange={handleGridSizeChange}
        >
          <option value="5">Grille 5px</option>
          <option value="10">Grille 10px</option>
          <option value="20">Grille 20px</option>
        </select>
      </div>
      
      <div 
        className="map-svg-container" 
        ref={containerRef}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <ReactSVG
          src="/france-departements.svg"
          beforeInjection={(svg) => {
            // Stocker la référence au SVG
            svgRef.current = svg;
            
            // Assurer que le viewBox est correctement défini
            svg.setAttribute('width', '800');
            svg.setAttribute('height', '600');
            svg.setAttribute('viewBox', '0 0 800 600');
            
            // Appliquer un style pour la transformation
            svg.style.transition = 'transform 0.1s ease-out';
            
            // Important: Créer un groupe unique pour tout le contenu du SVG
            const allContent = Array.from(svg.childNodes);
            const mainGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            mainGroup.classList.add('map-content');
            
            // Déplacer tout le contenu dans ce groupe
            allContent.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                mainGroup.appendChild(node.cloneNode(true));
              }
            });
            
            // Vider le SVG et ajouter le groupe principal
            while (svg.firstChild) {
              svg.removeChild(svg.firstChild);
            }
            svg.appendChild(mainGroup);
            
            // Ajouter des gestionnaires d'événements pour les départements
            const paths = svg.querySelectorAll('path[data-numerodepartement]');
            paths.forEach((path) => {
              const deptId = path.getAttribute('data-numerodepartement');
              const deptName = path.getAttribute('data-nom');
              
              // Couleur par défaut
              path.setAttribute('fill', '#AAFFAA'); // Vert clair
              path.setAttribute('stroke', '#000000');
              path.setAttribute('stroke-width', '1');
              
              // Mettre en évidence le département sélectionné
              if (deptId === selectedDepartment) {
                path.setAttribute('fill', '#FF9999'); // Rouge clair pour le département sélectionné
                path.setAttribute('stroke-width', '2');
              }
              
              // Gestionnaire d'événement pour cliquer sur un département
              path.addEventListener('click', (e) => {
                e.stopPropagation(); // Éviter la propagation au conteneur
                handleDepartmentClick(deptId, deptName);
              });
              
              // Ajouter une classe pour le hover
              path.classList.add('departement');
            });
          }}
          afterInjection={(svg) => {
            // Appliquer la transformation pour le déplacement
            const mainGroup = svg.querySelector('.map-content');
            if (mainGroup) {
              mainGroup.style.transform = `translate(${position.x}px, ${position.y}px)`;
            }
            
            // Mettre à jour la grille
            updateGrid();
          }}
          wrapper="span"
          className="map-svg"
        />
      </div>
      
      {/* Afficher des informations sur le département sélectionné */}
      {selectedDepartment && (
        <div className="department-info">
          <h3>Département sélectionné</h3>
          <p>
            <strong>Nom :</strong> {departmentInfo.name || 'Non disponible'}
          </p>
          <p>
            <strong>Code :</strong> {departmentInfo.id || 'Non disponible'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Map;
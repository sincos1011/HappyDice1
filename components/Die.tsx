import React, { useRef, useEffect, useState } from 'react';
import { DieValue } from '../types';

export interface DieProps {
  value: DieValue;
  rolling: boolean;
  delay?: number;
  duration?: number;
}

const Die: React.FC<DieProps> = ({ value, rolling, delay = 0, duration = 800 }) => {
  // Size config
  const size = 112; 
  const halfSize = size / 2;

  // We use refs to track the ACTUAL current rotation in degrees.
  // This prevents the die from "rewinding" when we set a new target.
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: `rotateX(0deg) rotateY(0deg) rotateZ(0deg)`,
  });

  // Helper to find the next rotation value that matches target (mod 360) 
  // but is definitely larger than current (to ensure forward spin).
  const getNextRotation = (current: number, targetMod: number, minSpins: number = 1) => {
    // Current rotation modulo 360 (can be negative, normalize to 0-360)
    let currentMod = current % 360;
    if (currentMod < 0) currentMod += 360;

    // Calculate how far we are from the target face angle
    let diff = targetMod - currentMod;
    
    // We want to move forward (positive), so if diff is <= 0, add 360 to find next slot
    if (diff <= 0) diff += 360;

    // Add extra full spins for chaos/effect
    const extraSpins = 360 * minSpins;

    return current + diff + extraSpins;
  };

  useEffect(() => {
    if (rolling) {
      // START ROLLING: Spin wildly forward
      rotationRef.current.x += 720 + Math.random() * 360;
      rotationRef.current.y += 720 + Math.random() * 360;
      rotationRef.current.z += 360 + Math.random() * 360; 

      setStyle({
        transform: `rotateX(${rotationRef.current.x}deg) rotateY(${rotationRef.current.y}deg) rotateZ(${rotationRef.current.z}deg)`,
        transition: `transform ${duration}ms ease-in`,
      });

    } else {
      // STOP ROLLING: Land on specific face
      // Corrected Mapping Logic:
      // To show a face, we must rotate the CONTAINER so that face moves to the front (0,0,Z).
      // CSS Axis Rule:
      // rotateY(90) moves Left Face -> Front.
      // rotateY(-90) moves Right Face -> Front.
      // rotateX(90) moves Bottom Face -> Front.
      // rotateX(-90) moves Top Face -> Front.

      let targetX = 0;
      let targetY = 0;

      switch (value) {
        case 1: // Front
          targetX = 0; 
          targetY = 0; 
          break;
        case 6: // Back
          targetX = 0; 
          targetY = 180; 
          break;
        case 3: // Right (Located at Y=90) -> Needs Y=-90 to be front
          targetX = 0; 
          targetY = -90; 
          break;
        case 4: // Left (Located at Y=-90) -> Needs Y=90 to be front
          targetX = 0; 
          targetY = 90; 
          break;
        case 5: // Top (Located at X=90) -> Needs X=-90 to be front
          targetX = -90; 
          targetY = 0; 
          break;
        case 2: // Bottom (Located at X=-90) -> Needs X=90 to be front
          targetX = 90; 
          targetY = 0; 
          break;
      }

      // Calculate smooth landing target
      const nextX = getNextRotation(rotationRef.current.x, targetX, 0); 
      const nextY = getNextRotation(rotationRef.current.y, targetY, 0);
      
      // For Z, just find nearest 0 to land flat
      const currentZ = rotationRef.current.z;
      const remainderZ = currentZ % 360;
      const nextZ = currentZ - remainderZ + (remainderZ > 180 ? 360 : 0);

      // Update Ref
      rotationRef.current = { x: nextX, y: nextY, z: nextZ };

      setStyle({
        transform: `rotateX(${nextX}deg) rotateY(${nextY}deg) rotateZ(${nextZ}deg)`,
        transition: `transform 800ms cubic-bezier(0.34, 1.56, 0.64, 1)`, // Bouncy landing
      });
    }
  }, [rolling, value, duration]);


  // Dot Component
  const Dot = ({ pos }: { pos: string }) => (
    <div className={`absolute w-5 h-5 rounded-full bg-gradient-to-br from-pop-pink to-pop-pinkDark shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)] ${pos}`} />
  );

  const faces: Record<DieValue, React.ReactNode> = {
    1: <Dot pos="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-9 h-9" />,
    2: (
      <>
        <Dot pos="top-4 left-4" />
        <Dot pos="bottom-4 right-4" />
      </>
    ),
    3: (
      <>
        <Dot pos="top-4 left-4" />
        <Dot pos="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        <Dot pos="bottom-4 right-4" />
      </>
    ),
    4: (
      <>
        <Dot pos="top-4 left-4" />
        <Dot pos="top-4 right-4" />
        <Dot pos="bottom-4 left-4" />
        <Dot pos="bottom-4 right-4" />
      </>
    ),
    5: (
      <>
        <Dot pos="top-4 left-4" />
        <Dot pos="top-4 right-4" />
        <Dot pos="top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        <Dot pos="bottom-4 left-4" />
        <Dot pos="bottom-4 right-4" />
      </>
    ),
    6: (
      <>
        <Dot pos="top-4 left-4" />
        <Dot pos="top-4 right-4" />
        <Dot pos="top-1/2 left-4 transform -translate-y-1/2" />
        <Dot pos="top-1/2 right-4 transform -translate-y-1/2" />
        <Dot pos="bottom-4 left-4" />
        <Dot pos="bottom-4 right-4" />
      </>
    ),
  };

  const faceCommonClass = "absolute w-full h-full bg-white rounded-3xl border-[4px] border-white flex items-center justify-center backface-visibility-visible shadow-[inset_0_0_20px_rgba(209,213,219,0.3)]";

  return (
    <div className={`w-28 h-28 [perspective:1000px] m-4 cursor-pointer transition-transform duration-500 ease-out ${rolling ? 'scale-125 -translate-y-6' : 'hover:scale-105'}`}>
      <div 
        className="w-full h-full relative preserve-3d"
        style={style}
      >
        {/* Front - 1 */}
        <div className={faceCommonClass} style={{ transform: `rotateY(0deg) translateZ(${halfSize}px)` }}>
          {faces[1]}
        </div>
        
        {/* Back - 6 */}
        <div className={faceCommonClass} style={{ transform: `rotateY(180deg) translateZ(${halfSize}px)` }}>
          {faces[6]}
        </div>

        {/* Right - 3 */}
        <div className={faceCommonClass} style={{ transform: `rotateY(90deg) translateZ(${halfSize}px)` }}>
          {faces[3]}
        </div>

        {/* Left - 4 */}
        <div className={faceCommonClass} style={{ transform: `rotateY(-90deg) translateZ(${halfSize}px)` }}>
          {faces[4]}
        </div>

        {/* Top - 5 */}
        <div className={faceCommonClass} style={{ transform: `rotateX(90deg) translateZ(${halfSize}px)` }}>
          {faces[5]}
        </div>

        {/* Bottom - 2 */}
        <div className={faceCommonClass} style={{ transform: `rotateX(-90deg) translateZ(${halfSize}px)` }}>
          {faces[2]}
        </div>
      </div>
      
      {/* Shadow */}
      <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-4 bg-black/10 rounded-[100%] blur-md transition-all duration-500 ${rolling ? 'scale-75 opacity-50' : 'scale-100 opacity-100'}`}></div>
    </div>
  );
};

export default Die;
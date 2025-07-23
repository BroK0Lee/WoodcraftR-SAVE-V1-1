import { useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Navigation } from '@o3dv/viewer/navigation.js';
import { Camera, NavigationMode } from '@o3dv/viewer/camera.js';
import { Coord3D } from '@o3dv/geometry/coord3d.js';
import * as THREE from 'three';

interface NavigationControllerProps {
  target?: [number, number, number];
  initialPosition?: [number, number, number];
  boundingRadius?: number;
  onCameraChange?: () => void;
}

export function NavigationController({ 
  target = [0, 0, 0], 
  initialPosition = [5, 5, 5],
  boundingRadius,
  onCameraChange
}: NavigationControllerProps) {
  const { gl, camera } = useThree();
  const navRef = useRef<Navigation | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialisation du système de navigation
  useEffect(() => {
    if (isInitialized) return;

    console.log('🚀 Initialisation NavigationController:', { target, initialPosition, boundingRadius });

    // Créer la caméra o3dv
    const ovCam = new Camera(
      new Coord3D(initialPosition[0], initialPosition[1], initialPosition[2]),
      new Coord3D(target[0], target[1], target[2]),
      new Coord3D(0, 1, 0),
      (camera as any).fov || 45
    );

    // Créer le système de navigation
    const nav = new Navigation(gl.domElement, ovCam, {
      onUpdate: () => {
        const c = nav.GetCamera();
        camera.position.set(c.eye.x, c.eye.y, c.eye.z);
        camera.up.set(c.up.x, c.up.y, c.up.z);
        camera.lookAt(c.center.x, c.center.y, c.center.z);
        
        // Ajuster les plans de clipping pour éviter les disparitions
        const distance = camera.position.distanceTo(new THREE.Vector3(c.center.x, c.center.y, c.center.z));
        camera.near = Math.max(0.1, distance * 0.01);
        camera.far = distance * 50;
        camera.updateProjectionMatrix();
        
        if (onCameraChange) {
          onCameraChange();
        }
      }
    });

    nav.SetNavigationMode(NavigationMode.FixedUpVector);
    navRef.current = nav;
    setIsInitialized(true);

    return () => {
      navRef.current = null;
    };
  }, [gl, camera, initialPosition, target, onCameraChange]);

  // Cadrage automatique
  useEffect(() => {
    if (navRef.current && boundingRadius && boundingRadius > 0 && isInitialized) {
      console.log('🎯 Tentative de cadrage:', { boundingRadius, target });
      
      const center = new Coord3D(target[0], target[1], target[2]);
      const fitCamera = navRef.current.GetFitToSphereCamera(center, boundingRadius * 1.5);
      
      if (fitCamera) {
        console.log('📷 Cadrage réussi:', {
          eye: [fitCamera.eye.x.toFixed(1), fitCamera.eye.y.toFixed(1), fitCamera.eye.z.toFixed(1)],
          center: [fitCamera.center.x.toFixed(1), fitCamera.center.y.toFixed(1), fitCamera.center.z.toFixed(1)]
        });
        navRef.current.MoveCamera(fitCamera, 0);
      } else {
        console.log('❌ Échec du cadrage');
      }
    }
  }, [boundingRadius, target, isInitialized]);

  return null;
}

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
      new Coord3D(0, 0, 0), // FIXE : centre toujours à l'origine
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
        
        // Ajuster les plans de clipping
        const distanceToCenter = camera.position.distanceTo(new THREE.Vector3(c.center.x, c.center.y, c.center.z));
        camera.near = Math.max(0.1, distanceToCenter * 0.01);
        camera.far = distanceToCenter * 50;
        camera.updateProjectionMatrix();
        
        if (onCameraChange) {
          onCameraChange();
        }
      }
    });

    nav.SetNavigationMode(NavigationMode.FreeOrbit);
    console.log('🎮 Test avec FreeOrbit mode');
    navRef.current = nav;
    setIsInitialized(true);

    return () => {
      navRef.current = null;
    };
  }, [gl, camera, initialPosition, target, onCameraChange]);

  // Cadrage automatique
  useEffect(() => {
    if (navRef.current && boundingRadius && boundingRadius > 0 && isInitialized) {
      console.log('🎯 Tentative de cadrage:', { boundingRadius, target: [0, 0, 0] });
      
      // FIXE : toujours utiliser l'origine comme centre de rotation
      const center = new Coord3D(0, 0, 0);
      const fitCamera = navRef.current.GetFitToSphereCamera(center, boundingRadius * 1.3);
      
      if (fitCamera) {
        // IMPORTANT : forcer le centre à rester à l'origine
        fitCamera.center = new Coord3D(0, 0, 0);
        
        console.log('📷 Cadrage réussi (centre forcé à origine):', {
          eye: [fitCamera.eye.x.toFixed(1), fitCamera.eye.y.toFixed(1), fitCamera.eye.z.toFixed(1)],
          center: [fitCamera.center.x.toFixed(1), fitCamera.center.y.toFixed(1), fitCamera.center.z.toFixed(1)],
          distance: Math.sqrt(
            fitCamera.eye.x ** 2 + fitCamera.eye.y ** 2 + fitCamera.eye.z ** 2
          ).toFixed(1)
        });
        navRef.current.MoveCamera(fitCamera, 0);
      } else {
        console.log('❌ Échec du cadrage');
      }
    }
  }, [boundingRadius, isInitialized]); // Retiré 'target' des dépendances

  return null;
}

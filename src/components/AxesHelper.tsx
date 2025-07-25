import { useEffect, useRef, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Group, Vector3, Material, BufferGeometry, LineBasicMaterial, Line, Float32BufferAttribute } from 'three'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { usePanelStore } from '@/store/panelStore'

interface AxesHelperProps {
  scale?: [number, number, number]
}

export default function AxesHelper({ scale }: AxesHelperProps) {
  const { scene, camera, gl } = useThree()
  
  // Récupérer les dimensions du panneau depuis le store
  const dimensions = usePanelStore((state) => state.dimensions)
  
  // Calculer les longueurs d'axes adaptatives avec useMemo pour éviter les re-calculs
  const axesLengths = useMemo(() => {
    const lengths = {
      x: dimensions.length + (0.25 * dimensions.length), // Longueur + 25%
      y: dimensions.width + (0.33 * dimensions.width),   // Largeur + 33%
      z: 0.33 * dimensions.width                       // 33% Largeur
    }
    
    console.log('📏 [AxesHelper] Dimensions panneau:', dimensions)
    console.log('📐 [AxesHelper] Longueurs axes calculées:', lengths)
    
    return lengths
  }, [dimensions.length, dimensions.width, dimensions.thickness])
  
  const groupRef = useRef<Group>(new Group())
  const rendererRef = useRef<CSS2DRenderer>()

  useEffect(() => {
    const group = groupRef.current
    group.clear()
    
    // Créer des axes personnalisés avec des longueurs différentes
    const createCustomAxis = (start: Vector3, end: Vector3, color: number) => {
      const geometry = new BufferGeometry().setFromPoints([start, end])
      const material = new LineBasicMaterial({ color })
      const line = new Line(geometry, material)
      return line
    }
    
    // Créer les trois axes avec leurs longueurs spécifiques
    const axisX = createCustomAxis(new Vector3(0, 0, 0), new Vector3(axesLengths.x, 0, 0), 0xff0000) // Rouge
    const axisY = createCustomAxis(new Vector3(0, 0, 0), new Vector3(0, axesLengths.y, 0), 0x00ff00) // Vert  
    const axisZ = createCustomAxis(new Vector3(0, 0, 0), new Vector3(0, 0, axesLengths.z), 0x0000ff) // Bleu
    
    group.add(axisX)
    group.add(axisY)
    group.add(axisZ)

    if (scale) {
      group.scale.set(scale[0], scale[1], scale[2])
    } else {
      group.scale.set(1, 1, 1)
    }

    // Style moderne pour les labels
    const labelClass = 'px-1 py-0.5 rounded shadow text-xs font-bold bg-neutral-900/90 text-white border border-white/10 pointer-events-none select-none'

    const createLabel = (label: string, position: Vector3) => {
      const div = document.createElement('div')
      div.className = labelClass
      div.textContent = label
      const obj = new CSS2DObject(div)
      obj.position.copy(position)
      group.add(obj)
    }

    // Labels X, Y, Z avec leurs longueurs spécifiques
    createLabel('X', new Vector3(axesLengths.x, 0, 0))
    createLabel('Y', new Vector3(0, axesLengths.y, 0))
    createLabel('Z', new Vector3(0, 0, axesLengths.z))

    // Label O (origine) décalé proportionnellement à la plus petite dimension
    const originOffset = Math.min(axesLengths.x, axesLengths.y, axesLengths.z) * 0.05
    createLabel('O', new Vector3(-originOffset, -originOffset, 0))

    scene.add(group)
    return () => {
      scene.remove(group)
      group.clear()
      
      // Nettoyer les géométries et matériaux personnalisés
      axisX.geometry.dispose()
      axisY.geometry.dispose() 
      axisZ.geometry.dispose()
      ;(axisX.material as Material).dispose()
      ;(axisY.material as Material).dispose()
      ;(axisZ.material as Material).dispose()
    }
  }, [scene, axesLengths.x, axesLengths.y, axesLengths.z, scale])

  useEffect(() => {
    const labelRenderer = new CSS2DRenderer()
    labelRenderer.domElement.style.position = 'absolute'
    labelRenderer.domElement.style.top = '0'
    labelRenderer.domElement.style.pointerEvents = 'none'

    const parent = gl.domElement.parentElement
    if (parent) {
      parent.appendChild(labelRenderer.domElement)
      rendererRef.current = labelRenderer
      const handleResize = () => {
        labelRenderer.setSize(parent.clientWidth, parent.clientHeight)
      }
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => {
        parent.removeChild(labelRenderer.domElement)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [gl])

  useFrame(() => {
    rendererRef.current?.render(scene, camera)
  })

  return null
}

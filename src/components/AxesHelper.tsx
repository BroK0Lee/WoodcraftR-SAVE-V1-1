import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { AxesHelper as ThreeAxesHelper, Group, Vector3, Material } from 'three'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

interface AxesHelperProps {
  size?: number
  scale?: [number, number, number]
}

export default function AxesHelper({ size = 1, scale }: AxesHelperProps) {
  const { scene, camera, gl } = useThree()
  const groupRef = useRef<Group>(new Group())
  const rendererRef = useRef<CSS2DRenderer>()

  useEffect(() => {
    const group = groupRef.current
    group.clear()
    const axes = new ThreeAxesHelper(size)
    group.add(axes)

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

    // Labels X, Y, Z sur chaque axe (à l'extrémité)
    createLabel('X', new Vector3(size, 0, 0))
    createLabel('Y', new Vector3(0, size, 0))
    createLabel('Z', new Vector3(0, 0, size))

    // Label O (origine) légèrement décalé pour la lisibilité
    createLabel('O', new Vector3(-size * 0.05, -size * 0.05, 0))

    scene.add(group)
    return () => {
      scene.remove(group)
      group.clear()
      axes.geometry.dispose()
      if (Array.isArray(axes.material)) {
        axes.material.forEach((m: Material) => m.dispose())
      } else {
        axes.material.dispose()
      }
    }
  }, [scene, size, scale])

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

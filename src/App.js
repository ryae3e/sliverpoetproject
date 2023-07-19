import * as THREE from 'three'
import { useRef, useState, Suspense } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { Image, ScrollControls, Scroll, useScroll } from '@react-three/drei'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { proxy, useSnapshot } from 'valtio'
import { Html } from '@react-three/drei'

const damp = THREE.MathUtils.damp
const material = new THREE.LineBasicMaterial({ color: 'white' })
const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, 0.5, 0)])
const state = proxy({
  clicked: null,
  isMenuBarVisible: false,
  urls: ['/1.jpg', '/2.jpg', '/3.jpg', '/4.jpg', '/5.jpg']
})

function Model() {
  const gltf = useLoader(GLTFLoader, '/model.glb') // Adjust the path if necessary
  return <primitive object={gltf.scene} position={[-3, 0, 0]} scale={[0.1, 0.1, 0.1]} />
}

function Minimap() {
  const ref = useRef()
  const scroll = useScroll()
  const { urls } = useSnapshot(state)
  const { height } = useThree((state) => state.viewport)
  useFrame((state, delta) => {
    ref.current.children.forEach((child, index) => {
      const y = scroll.curve(index / urls.length - 1.5 / urls.length, 4 / urls.length)
      child.scale.y = damp(child.scale.y, 0.1 + y / 6, 8, 8, delta)
    })
  })
  return (
    <group ref={ref}>
      {urls.map((_, i) => (
        <line key={i} geometry={geometry} material={material} position={[i * 0.06 - urls.length * 0.03, -height / 2 + 0.6, 0]} />
      ))}
    </group>
  )
}

function MenuBar({ isVisible }) {
  if (!isVisible) {
    return null
  }

  return (
    <Html position={[0, -3, 0]}>
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-around',
          fontFamily: 'Inter var, sans-serif',
          color: '#a0a0a0',
          fontSize: '12px'
        }}>
        <a href="https://wwwgoogle.com" style={{ textDecoration: 'none', color: '#a0a0a0' }}>
          Link 1
        </a>
        <a href="https://link2.com" style={{ textDecoration: 'none', color: '#fff000' }}>
          Link 2
        </a>
      </div>
    </Html>
  )
}

function Item({ index, position, scale, c = new THREE.Color(), ...props }) {
  const ref = useRef()
  const scroll = useScroll()
  const { clicked, isMenuBarVisible, urls } = useSnapshot(state)
  const [hovered, hover] = useState(false)
  const click = () => {
    state.clicked = index === clicked ? null : index
    state.isMenuBarVisible = index === 0 && state.clicked !== null
  }
  const over = () => hover(true)
  const out = () => hover(false)
  useFrame((state, delta) => {
    const y = scroll.curve(index / urls.length - 1.5 / urls.length, 4 / urls.length)
    ref.current.material.scale[1] = ref.current.scale.y = damp(ref.current.scale.y, clicked === index ? 5 : 4, 8, delta)
    ref.current.material.scale[0] = ref.current.scale.x = damp(ref.current.scale.x, clicked === index ? 4.7 : scale[0], 6, delta)
    if (clicked !== null && index < clicked) ref.current.position.x = damp(ref.current.position.x, position[0] - 2, 6, delta)
    if (clicked !== null && index > clicked) ref.current.position.x = damp(ref.current.position.x, position[0] + 2, 6, delta)
    if (clicked === null || clicked === index) ref.current.position.x = damp(ref.current.position.x, position[0], 6, delta)
    ref.current.material.grayscale = damp(ref.current.material.grayscale, hovered || clicked === index ? 0 : Math.max(0, 1 - y), 6, delta)
    ref.current.material.color.lerp(c.set(hovered || clicked === index ? 'white' : '#aaa'), hovered ? 0.3 : 0.1)
  })
  return (
    <>
      <Image ref={ref} {...props} position={position} scale={scale} onClick={click} onPointerOver={over} onPointerOut={out} />
      {index === 0 && <MenuBar isVisible={isMenuBarVisible} />}
    </>
  )
}

function Items({ w = 0.7, gap = 0.15 }) {
  const { urls } = useSnapshot(state)
  const { width } = useThree((state) => state.viewport)
  const xW = w + gap
  return (
    <ScrollControls horizontal damping={0.1} pages={(width - xW + urls.length * xW) / width}>
      {/* <Minimap /> */}

      <Scroll>
        {urls.map((url, i) => <Item key={i} index={i} position={[i * xW, 0, 0]} scale={[w, 4, 1]} url={url} />) /* prettier-ignore */}
      </Scroll>
    </ScrollControls>
  )
}

export const App = () => (
  <Canvas gl={{ antialias: false }} dpr={[1, 1.5]} onPointerMissed={() => (state.clicked = null)}>
    <Suspense fallback={null}>
      <Model />
      <Items />
    </Suspense>
  </Canvas>
)

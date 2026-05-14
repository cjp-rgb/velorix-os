'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useMemo, useState, useEffect } from 'react'
import * as THREE from 'three'
import type { VelorixTier } from '@/types/velorix'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { KernelSize } from 'postprocessing'

type NetDepositSphereProps = {
  treeNetDeposits: number
  treeVolumeLots: number
  tier: VelorixTier | null
  memberCount: number
  activeMemberCount: number
}

const TIER_BASE_COLOR: Record<VelorixTier | 'null', THREE.Color> = {
  entry: new THREE.Color('#5878A8'),
  growth: new THREE.Color('#00C2FF'),
  scale: new THREE.Color('#00C2FF'),
  null: new THREE.Color('#5878A8'),
}

const SCALE_ACCENT_COLOR = new THREE.Color('#D4AF37')
const HALO_COLOR = new THREE.Color('#00C2FF')

function calculateSphereRadius(treeNetDeposits: number): number {
  const minRadius = 1.8
  const maxRadius = 2.4
  const minDeposits = 100
  const maxDeposits = 500_000

  if (treeNetDeposits <= minDeposits) return minRadius
  if (treeNetDeposits >= maxDeposits) return maxRadius

  const logScale =
    (Math.log(treeNetDeposits) - Math.log(minDeposits)) /
    (Math.log(maxDeposits) - Math.log(minDeposits))

  return minRadius + (maxRadius - minRadius) * logScale
}

function calculateInnerParticleCount(treeVolumeLots: number): number {
  const minParticles = 2500
  const maxParticles = 4500
  const maxVolume = 1000

  if (treeVolumeLots <= 0) return minParticles
  if (treeVolumeLots >= maxVolume) return maxParticles

  const t = treeVolumeLots / maxVolume
  return Math.floor(minParticles + (maxParticles - minParticles) * t)
}

function calculateHaloParticleCount(activeMemberCount: number): number {
  const minParticles = 250
  const maxParticles = 1000
  const maxMembers = 100

  if (activeMemberCount <= 0) return minParticles
  if (activeMemberCount >= maxMembers) return maxParticles

  const t = activeMemberCount / maxMembers
  return Math.floor(minParticles + (maxParticles - minParticles) * t)
}

function InnerSphere({
  particleCount,
  baseRadius,
  tier,
}: {
  particleCount: number
  baseRadius: number
  tier: VelorixTier | null
}) {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5))

    const baseColor = TIER_BASE_COLOR[tier ?? 'null']

    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2
      const radiusAtY = Math.sqrt(1 - y * y)
      const theta = goldenAngle * i

      const x = Math.cos(theta) * radiusAtY
      const z = Math.sin(theta) * radiusAtY

      positions[i * 3] = x * baseRadius
      positions[i * 3 + 1] = y * baseRadius
      positions[i * 3 + 2] = z * baseRadius

      const color = new THREE.Color()
      color.copy(baseColor)

      if (tier === 'scale') {
        const goldBlend = Math.max(0, z) * 0.6
        color.lerp(SCALE_ACCENT_COLOR, goldBlend)
      } else {
        const depthFactor = (z + 1) / 2
        const brightnessRange = 0.7 + depthFactor * 0.3
        color.multiplyScalar(brightnessRange)
      }

      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return { positions, colors }
  }, [particleCount, baseRadius, tier])

  useFrame((state, delta) => {
    if (!pointsRef.current) return

    pointsRef.current.rotation.y += delta * 0.08

    const breathPhase = state.clock.elapsedTime * (Math.PI * 2 / 4)
    const breathScale = 1 + Math.sin(breathPhase) * 0.015
    pointsRef.current.scale.setScalar(breathScale)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        sizeAttenuation
        transparent
        opacity={1.0}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function OuterHalo({
  particleCount,
  baseRadius,
}: {
  particleCount: number
  baseRadius: number
}) {
  const pointsRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(particleCount * 3)
    const haloRadius = baseRadius * 1.4
    const haloThickness = baseRadius * 0.15

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1)
      const theta = 2 * Math.PI * Math.random()
      const r = haloRadius + (Math.random() - 0.5) * haloThickness

      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi)
    }

    return arr
  }, [particleCount, baseRadius])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y -= delta * 0.03
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={HALO_COLOR}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export function NetDepositSphere({
  treeNetDeposits,
  treeVolumeLots,
  tier,
  memberCount: _memberCount,
  activeMemberCount,
}: NetDepositSphereProps) {
  const sphereRadius = calculateSphereRadius(treeNetDeposits)
  const innerParticleCount = calculateInnerParticleCount(treeVolumeLots)
  const haloParticleCount = calculateHaloParticleCount(activeMemberCount)

  // Viewport-aware camera distance.
  // Desktop: camera close (z=6) for prominent sphere.
  // Mobile: camera back (z=8) to leave growth headroom for large-tree operators.
  const [cameraZ, setCameraZ] = useState(6)

  useEffect(() => {
    const updateCamera = () => {
      setCameraZ(window.innerWidth < 768 ? 8 : 6)
    }
    updateCamera()
    window.addEventListener('resize', updateCamera)
    return () => window.removeEventListener('resize', updateCamera)
  }, [])

  return (
    <div className="aspect-square max-w-md mx-auto relative">
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <InnerSphere
          particleCount={innerParticleCount}
          baseRadius={sphereRadius}
          tier={tier}
        />
        <OuterHalo
          particleCount={haloParticleCount}
          baseRadius={sphereRadius}
        />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          dampingFactor={0.1}
        />
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.15}
            luminanceSmoothing={0.9}
            kernelSize={KernelSize.LARGE}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

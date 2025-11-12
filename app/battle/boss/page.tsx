import { BossBattle } from '@/components/boss-battle'

export default function BossBattlePage() {
  const sceneUrl = process.env.NEXT_PUBLIC_ROBOT_SCENE || 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode'
  return <BossBattle sceneUrl={sceneUrl} />
}

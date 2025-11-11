import { BossBattle } from '@/components/boss-battle'

export default function BossBattlePage() {
  const sceneUrl = process.env.NEXT_PUBLIC_ROBOT_SCENE || ''
  return <BossBattle sceneUrl={sceneUrl} />
}

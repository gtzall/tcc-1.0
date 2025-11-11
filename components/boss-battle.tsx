'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SplineScene } from '@/components/spline-scene'
import { Swords, Crown, Timer, Zap, Shield, Sparkles, Skull, Trophy, Clock, Sword } from 'lucide-react'

interface BossQuestion {
  enunciado: string
  alternativas: string[]
  respostaCorreta: number
  tema?: string
  explicacao?: string
  subject?: string
}

type BossMode = 'normal' | 'time-attack' | 'endless'

export function BossBattle({ sceneUrl = '' }: { sceneUrl?: string }) {
  const [mode, setMode] = useState<BossMode>('normal')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<BossQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [playerHP, setPlayerHP] = useState(100)
  const [bossHP, setBossHP] = useState(100)
  const [timeLeft, setTimeLeft] = useState(30)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)

  const questionCount = mode === 'endless' ? 9999 : 30
  const perQuestionTime = mode === 'normal' ? 30 : mode === 'time-attack' ? 10 : 20

  useEffect(() => {
    if (!started || finished) return
    if (mode === 'time-attack') {
      setTimeLeft(perQuestionTime)
    }
  }, [started, finished, perQuestionTime, mode])

  useEffect(() => {
    if (!started || finished || mode !== 'time-attack') return
    const t = setInterval(() => {
      setTimeLeft((t: number) => {
        if (t <= 1) {
          handleAnswer(-1) // time out
          return perQuestionTime
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [started, finished, mode, perQuestionTime])

  const loadQuestions = async () => {
    setLoading(true)
    try {
      // Hard boss = dificil
      const res = await fetch(`/api/questions?difficulty=dificil`)
      const data = await res.json()
      const pool: BossQuestion[] = Array.isArray(data.dificil) ? data.dificil : []
      // shuffle and take at least 30
      const shuffled = [...pool].sort(() => 0.5 - Math.random())
      const picked = (mode === 'endless' ? shuffled : shuffled.slice(0, questionCount))
      setQuestions(picked)
      setIndex(0)
      setSelected(null)
      setPlayerHP(100)
      setBossHP(100)
      setScore(0)
      setFinished(false)
      setStarted(true)
    } catch (e) {
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const current = questions[index]
  const progress = questions.length ? Math.min(100, (index / Math.max(1, Math.min(questionCount, questions.length))) * 100) : 0

  const handleAnswer = (answerIndex: number) => {
    if (!current || finished) return
    setSelected(answerIndex)

    const correct = answerIndex === current.respostaCorreta
    const damage = correct ? 10 : 12

    if (correct) {
      setBossHP((hp: number) => Math.max(0, hp - damage))
      setScore((s: number) => s + 150 + (mode === 'time-attack' ? 50 : 0))
    } else {
      setPlayerHP((hp: number) => Math.max(0, hp - damage))
    }

    setTimeout(() => {
      if (mode !== 'endless') {
        if (index + 1 >= Math.min(questionCount, questions.length) || bossHP - damage <= 0 || playerHP - (correct ? 0 : damage) <= 0) {
          setFinished(true)
          return
        }
      } else {
        if (bossHP - damage <= 0 || playerHP - (correct ? 0 : damage) <= 0) {
          setFinished(true)
          return
        }
      }
      setIndex((i: number) => i + 1)
      setSelected(null)
      if (mode === 'time-attack') setTimeLeft(perQuestionTime)
    }, 700)
  }

  const reset = () => {
    setStarted(false)
    setFinished(false)
    setQuestions([])
    setIndex(0)
    setSelected(null)
    setPlayerHP(100)
    setBossHP(100)
    setScore(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Arena */}
          <div className="flex-1">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Crown className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Boss Battle</h1>
                  <p className="text-gray-300">Enfrente o Mestre do Conhecimento</p>
                </div>
              </div>
            </motion.div>

            {!started && !finished && (
              <Card className="bg-gray-800/50 backdrop-blur-xl border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Selecione o modo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Button onClick={() => setMode('normal')} className={`justify-start h-24 ${mode==='normal'?'bg-purple-600':'bg-gray-700 hover:bg-gray-600'}`}>
                      <Swords className="w-5 h-5 mr-2" /> Normal
                    </Button>
                    <Button onClick={() => setMode('time-attack')} className={`justify-start h-24 ${mode==='time-attack'?'bg-purple-600':'bg-gray-700 hover:bg-gray-600'}`}>
                      <Timer className="w-5 h-5 mr-2" /> Time-Attack
                    </Button>
                    <Button onClick={() => setMode('endless')} className={`justify-start h-24 ${mode==='endless'?'bg-purple-600':'bg-gray-700 hover:bg-gray-600'}`}>
                      <Skull className="w-5 h-5 mr-2" /> Endless
                    </Button>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Dificuldade: Extrema</Badge>
                    <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30">30+ questões</Badge>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">Recompensas Épicas</Badge>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button onClick={loadQuestions} disabled={loading} className="bg-gradient-to-r from-purple-600 to-indigo-600">
                      <Sword className="w-4 h-4 mr-2" />
                      {loading ? 'Carregando...' : 'Enfrentar o Boss'}
                    </Button>
                    <Button variant="outline" onClick={reset} className="border-gray-600 text-gray-300 hover:bg-gray-700">Cancelar</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {started && !finished && current && (
              <div className="space-y-4">
                {/* Status */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-gray-800/50 border-gray-700/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2"><span>Você</span><span className="text-sm text-gray-400">HP {playerHP}</span></div>
                      <Progress value={playerHP} />
                    </CardContent>
                  </Card>
                  <Card className="bg-gray-800/50 border-gray-700/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2"><span>Boss</span><span className="text-sm text-gray-400">HP {bossHP}</span></div>
                      <Progress value={bossHP} />
                    </CardContent>
                  </Card>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Tempo: {mode==='time-attack'? timeLeft+'s' : perQuestionTime+'s'}</div>
                  <div className="flex items-center gap-2"><Trophy className="w-4 h-4" /> Pontos: {score}</div>
                  <div>{index+1} / {mode==='endless' ? '∞' : Math.min(questionCount, questions.length)}</div>
                </div>

                {/* Pergunta */}
                <Card className="bg-gray-800/50 border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{current.tema || current.subject || 'Questão'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-100 mb-4 text-base">{current.enunciado}</p>
                    <div className="grid grid-cols-1 gap-3">
                      {current.alternativas.map((opt: string, i: number) => {
                        let cls = 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'
                        if (selected !== null) {
                          if (i === current.respostaCorreta) cls = 'bg-green-600 border-green-500 text-white'
                          else if (i === selected) cls = 'bg-red-600 border-red-500 text-white'
                          else cls = 'bg-gray-700/50 border-gray-600/50'
                        } else if (i === selected) {
                          cls = 'bg-blue-600 border-blue-500 text-white'
                        }
                        return (
                          <Button key={i} disabled={selected !== null} onClick={() => handleAnswer(i)} className={`justify-start h-12 ${cls}`}>
                            {opt}
                          </Button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {finished && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                <div className={`w-28 h-28 mx-auto mb-6 rounded-full ${bossHP<=0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-gray-600 to-gray-700'} flex items-center justify-center`}>
                  {bossHP<=0 ? <Trophy className="w-12 h-12" /> : <Skull className="w-12 h-12" />}
                </div>
                <h2 className="text-3xl font-bold mb-2">{bossHP<=0 ? 'Vitória!' : 'Derrota'}</h2>
                <p className="text-gray-300 mb-6">Pontuação: {score}</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={loadQuestions} className="bg-purple-600 hover:bg-purple-700">Tentar Novamente</Button>
                  <Button variant="outline" onClick={reset} className="border-gray-600 text-gray-300 hover:bg-gray-700">Voltar</Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: Boss (Spline) */}
          <div className="lg:w-[38%] w-full h-[360px] lg:h-[680px] bg-gray-800/30 border border-gray-700/50 rounded-2xl overflow-hidden">
            {sceneUrl ? (
              <SplineScene scene={sceneUrl} className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>Adicione NEXT_PUBLIC_ROBOT_SCENE para ver o robô animado</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

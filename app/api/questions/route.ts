import { NextResponse } from "next/server"
import { promises as fs } from 'fs'
import path from 'path'
import {
  allQuestions as compiledQuestions,
  QuizQuestion
} from '@/lib/quiz-data'
import { subjectQuestions } from '@/lib/subject-questions'

const questionsFilePath = path.join(process.cwd(), 'lib', 'questions.json')

async function readQuestionsFile() {
  try {
    const fileContents = await fs.readFile(questionsFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    console.error('Error reading questions file:', error)
    return { facil: [], medio: [], dificil: [] }
  }
}

async function writeQuestionsFile(data: any) {
  try {
    await fs.writeFile(questionsFilePath, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Error writing questions file:', error)
    return false
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const filterSubject = url.searchParams.get('subject') || undefined
  const filterTopic = url.searchParams.get('topic') || undefined
  const filterDiff = url.searchParams.get('difficulty') as ('facil' | 'medio' | 'dificil' | null)
  const data = await readQuestionsFile()

  const ensureArray = (x: any) => Array.isArray(x) ? x : []
  let facil = ensureArray(data.facil)
  let medio = ensureArray(data.medio)
  let dificil = ensureArray(data.dificil)

  const areas = new Set(['Provas','Cursos','Programas','Escola','Universidades','Estatísticas'])

  const mapCompiled = (q: QuizQuestion) => ({
    enunciado: q.question,
    alternativas: q.options,
    respostaCorreta: q.correctAnswer,
    tema: q.topic,
    explicacao: q.explanation,
    subject: q.subject,
    area: areas.has(q.topic) ? q.topic : undefined,
  })

  const fromSubjects = Object.values(subjectQuestions).flat().map((q) => ({
    enunciado: q.question,
    alternativas: q.options,
    respostaCorreta: q.correctAnswer,
    tema: q.topic,
    explicacao: q.explanation,
    subject: q.subject,
    area: areas.has(q.topic) ? q.topic : undefined,
    dificuldade: q.difficulty,
  }))

  const compiledByDiff = {
    facil: compiledQuestions.filter(q => q.difficulty === 'facil').map(mapCompiled),
    medio: compiledQuestions.filter(q => q.difficulty === 'medio').map(mapCompiled),
    dificil: compiledQuestions.filter(q => q.difficulty === 'dificil').map(mapCompiled),
  }

  const fillToMin = (arr: any[], min: number) => {
    if (arr.length >= min) return arr
    const out = [...arr]
    let i = 0
    while (out.length < min && arr.length > 0) {
      out.push(arr[i % arr.length])
      i++
    }
    return out
  }

  if (facil.length < 30) {
    const extra = [
      ...compiledByDiff.facil,
      ...fromSubjects.filter(q => q.dificuldade === 'facil')
    ]
    facil = fillToMin([...facil, ...extra], 30)
  }
  if (medio.length < 30) {
    const extra = [
      ...compiledByDiff.medio,
      ...fromSubjects.filter(q => q.dificuldade === 'medio')
    ]
    medio = fillToMin([...medio, ...extra], 30)
  }
  if (dificil.length < 30) {
    const extra = [
      ...compiledByDiff.dificil,
      ...fromSubjects.filter(q => q.dificuldade === 'dificil')
    ]
    dificil = fillToMin([...dificil, ...extra], 30)
  }

  // Map area for existing items
  const mapArea = (q: any) => ({
    ...q,
    area: q.area ?? (areas.has(q.tema) ? q.tema : undefined)
  })

  const payload = {
    facil: facil.map(mapArea),
    medio: medio.map(mapArea),
    dificil: dificil.map(mapArea)
  }

  if (!filterSubject && !filterTopic && !filterDiff) {
    return NextResponse.json(payload)
  }

  const applyFilters = (arr: any[]) => arr.filter((q) => {
    if (filterSubject && q.subject !== filterSubject) return false
    if (filterTopic && q.tema !== filterTopic) return false
    return true
  })

  const filtered = {
    facil: filterDiff && filterDiff !== 'facil' ? [] : applyFilters(payload.facil),
    medio: filterDiff && filterDiff !== 'medio' ? [] : applyFilters(payload.medio),
    dificil: filterDiff && filterDiff !== 'dificil' ? [] : applyFilters(payload.dificil)
  }

  // Ensure minimum again after filters
  return NextResponse.json({
    facil: fillToMin(filtered.facil, 30),
    medio: fillToMin(filtered.medio, 30),
    dificil: fillToMin(filtered.dificil, 30)
  })
}

export async function POST(request: Request) {
  try {
    const newQuestion = await request.json()
    const questionsData = await readQuestionsFile()
    
    // Adicionar nova questão na categoria de dificuldade apropriada
    if (!questionsData[newQuestion.dificuldade]) {
      questionsData[newQuestion.dificuldade] = []
    }
    
    questionsData[newQuestion.dificuldade].push({
      enunciado: newQuestion.enunciado,
      alternativas: newQuestion.alternativas,
      respostaCorreta: newQuestion.respostaCorreta,
      tema: newQuestion.tema,
      explicacao: newQuestion.explicacao
    })
    
    const success = await writeQuestionsFile(questionsData)
    
    if (success) {
      return NextResponse.json({ message: 'Questão criada com sucesso' }, { status: 201 })
    } else {
      return NextResponse.json({ error: 'Erro ao salvar questão' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}



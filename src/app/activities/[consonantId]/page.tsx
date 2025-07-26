"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { WordEngine } from "@/lib/rules/engine";

interface Word {
  id: string;
  text: string;
  syllables: number;
  difficulty: number;
}

interface ActivityProgress {
  wordsCompleted: number;
  totalWords: number;
  startTime: Date;
  currentScore: number;
}

export default function ConsonantActivityPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const consonantId = params.consonantId as string;
  
  const [words, setWords] = useState<Word[]>([]);
  const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<ActivityProgress>({
    wordsCompleted: 0,
    totalWords: 0,
    startTime: new Date(),
    currentScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => 
    typeof window !== 'undefined' ? 
    (localStorage.getItem('sessionId') || crypto.randomUUID()) : 
    crypto.randomUUID()
  );

  // Guardar sessionId en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionId', sessionId);
    }
  }, [sessionId]);

  // Cargar palabras y progreso existente
  useEffect(() => {
    const loadActivityData = async () => {
      try {
        // Cargar palabras
        const wordsResponse = await fetch(`/api/words?consonantId=${consonantId}&maxWords=15`);
        let wordsData: Word[] = [];
        if (wordsResponse.ok) {
          wordsData = await wordsResponse.json();
          setWords(wordsData);
          setProgress(prev => ({ ...prev, totalWords: wordsData.length }));
        }

        // Cargar progreso existente
        if ((session?.user || sessionId) && wordsData.length > 0) {
          const existingProgress = await WordEngine.getUserProgress({
            userId: session?.user?.id || undefined,
            sessionId,
            consonantId
          });
          
          if (existingProgress) {
            setProgress(prev => ({
              ...prev,
              wordsCompleted: existingProgress.wordsCompleted
            }));
            // Simular palabras completadas (en una implementación real, guardarías qué palabras específicas)
            const completed = new Set<string>();
            for (let i = 0; i < existingProgress.wordsCompleted && i < wordsData.length; i++) {
              completed.add(wordsData[i].text || `word-${i}`);
            }
            setCompletedWords(completed);
          }
        }
      } catch (error) {
        console.error('Error loading activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!isPending) {
      loadActivityData();
    }
  }, [consonantId, session?.user, sessionId, isPending]);

  // Manejar completar palabra
  const handleWordComplete = async (wordId: string) => {
    if (completedWords.has(wordId)) return;

    const newCompletedWords = new Set(completedWords);
    newCompletedWords.add(wordId);
    setCompletedWords(newCompletedWords);

    const newProgress = {
      ...progress,
      wordsCompleted: newCompletedWords.size,
      currentScore: progress.currentScore + 10 // 10 puntos por palabra
    };
    setProgress(newProgress);

    // Guardar progreso
    try {
      await WordEngine.saveUserProgress({
        userId: session?.user?.id || undefined,
        sessionId,
        consonantId,
        wordsCompleted: newProgress.wordsCompleted,
        totalWords: newProgress.totalWords
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Calcular estadísticas
  const completionPercentage = progress.totalWords > 0 ? 
    Math.round((progress.wordsCompleted / progress.totalWords) * 100) : 0;
  
  const timeSpent = Math.floor((Date.now() - progress.startTime.getTime()) / 1000 / 60); // minutos

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando actividad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header con progreso */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Tiempo: {timeSpent} min</p>
              <p className="text-sm text-gray-600">Puntos: {progress.currentScore}</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Practicando Consonante: {consonantId.toUpperCase()}
          </h1>
          
          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso</span>
              <span>{progress.wordsCompleted} / {progress.totalWords} palabras</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-center text-lg font-semibold text-green-600 mt-2">
              {completionPercentage}% Completado
            </p>
          </div>

          {/* Mensaje de felicitación si está completo */}
          {completionPercentage === 100 && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">¡Felicitaciones! Has completado todas las palabras.</span>
              </div>
            </div>
          )}
        </div>

        {/* Grid de palabras */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {words.map((word, index) => {
            const wordId = word.text || `word-${index}`;
            const isCompleted = completedWords.has(wordId);
            return (
              <div
                key={wordId}
                onClick={() => handleWordComplete(wordId)}
                className={`
                  p-6 rounded-lg shadow-md cursor-pointer transition-all duration-300 transform hover:scale-105
                  ${
                    isCompleted
                      ? 'bg-green-100 border-2 border-green-400 text-green-800'
                      : 'bg-white border-2 border-gray-200 hover:border-indigo-300 text-gray-800'
                  }
                `}
              >
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{word.text}</h3>
                  <div className="flex justify-center items-center space-x-4 text-sm">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {word.syllables} sílaba{word.syllables !== 1 ? 's' : ''}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Nivel {word.difficulty}
                    </span>
                  </div>
                  
                  {isCompleted && (
                    <div className="mt-3 flex justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón para continuar o volver */}
        <div className="mt-8 text-center">
          {completionPercentage === 100 ? (
            <button
              onClick={() => router.push('/activities/progress')}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Ver Mi Progreso
            </button>
          ) : (
            <p className="text-gray-600">
              Haz clic en las palabras para marcarlas como completadas
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
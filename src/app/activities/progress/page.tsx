"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { WordEngine } from "@/lib/rules/engine";

interface ProgressData {
  id: string;
  consonantId: string;
  wordsCompleted: number;
  totalWords: number;
  updatedAt: string;
}

interface ConsonantData {
  id: string;
  letter: string;
  name: string;
}

export default function ProgressPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [consonants, setConsonants] = useState<ConsonantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => 
    typeof window !== 'undefined' ? 
    (localStorage.getItem('sessionId') || crypto.randomUUID()) : 
    crypto.randomUUID()
  );

  useEffect(() => {
    const loadProgressData = async () => {
      try {
        // Cargar consonantes disponibles
        const consonantsResponse = await fetch('/api/consonants');
        if (consonantsResponse.ok) {
          const consonantsData = await consonantsResponse.json();
          setConsonants(consonantsData);
        }

        // Cargar progreso del usuario
        if (session?.user || sessionId) {
          const userProgress = await WordEngine.getAllUserProgress({
            userId: session?.user?.id || undefined,
            sessionId
          });
          const formattedProgress = (userProgress || []).map(item => ({
            ...item,
            updatedAt: item.updatedAt.toISOString(),
            createdAt: item.createdAt.toISOString()
          }));
          setProgressData(formattedProgress);
        }
      } catch (error) {
        console.error('Error loading progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!isPending) {
      loadProgressData();
    }
  }, [session?.user, sessionId, isPending]);

  // Calcular estadísticas generales
  const totalWordsCompleted = progressData.reduce((sum, p) => sum + p.wordsCompleted, 0);
  const totalWords = progressData.reduce((sum, p) => sum + p.totalWords, 0);
  const overallProgress = totalWords > 0 ? Math.round((totalWordsCompleted / totalWords) * 100) : 0;
  const consonantsStarted = progressData.length;
  const consonantsCompleted = progressData.filter(p => p.wordsCompleted === p.totalWords && p.totalWords > 0).length;

  // Crear mapa de progreso por consonante
  const progressMap = new Map(progressData.map(p => [p.consonantId, p]));

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando progreso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Inicio
            </button>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {session?.user ? `Hola, ${session.user.name || session.user.email}` : 'Usuario Anónimo'}
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-6">Mi Progreso de Aprendizaje</h1>
          
          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{totalWordsCompleted}</div>
              <div className="text-sm text-blue-800">Palabras Completadas</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{overallProgress}%</div>
              <div className="text-sm text-green-800">Progreso General</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">{consonantsStarted}</div>
              <div className="text-sm text-purple-800">Consonantes Iniciadas</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">{consonantsCompleted}</div>
              <div className="text-sm text-yellow-800">Consonantes Completadas</div>
            </div>
          </div>

          {/* Barra de progreso general */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progreso General</span>
              <span>{totalWordsCompleted} / {totalWords} palabras</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Grid de consonantes con progreso */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Progreso por Consonante</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {consonants.map((consonant) => {
              const progress = progressMap.get(consonant.id);
              const completionPercentage = progress && progress.totalWords > 0 ? 
                Math.round((progress.wordsCompleted / progress.totalWords) * 100) : 0;
              const isStarted = !!progress;
              const isCompleted = completionPercentage === 100;
              
              return (
                <div
                  key={consonant.id}
                  onClick={() => router.push(`/activities/${consonant.id}`)}
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 transform hover:scale-105
                    ${
                      isCompleted
                        ? 'bg-green-100 border-green-400 text-green-800'
                        : isStarted
                        ? 'bg-blue-100 border-blue-400 text-blue-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-indigo-300'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{consonant.letter.toUpperCase()}</div>
                    <div className="text-xs mb-2">{consonant.name}</div>
                    
                    {isStarted && (
                      <>
                        <div className="text-xs mb-1">
                          {progress.wordsCompleted} / {progress.totalWords}
                        </div>
                        <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              isCompleted ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs mt-1 font-semibold">
                          {completionPercentage}%
                        </div>
                      </>
                    )}
                    
                    {!isStarted && (
                      <div className="text-xs text-gray-500">Sin iniciar</div>
                    )}
                  </div>
                  
                  {/* Icono de estado */}
                  <div className="absolute top-1 right-1">
                    {isCompleted && (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {isStarted && !isCompleted && (
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mensaje motivacional */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6 text-center">
          {overallProgress === 100 ? (
            <div className="text-green-600">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-2xl font-bold mb-2">¡Felicitaciones!</h3>
              <p className="text-gray-600">Has completado todas las consonantes disponibles. ¡Eres un maestro de la lectura!</p>
            </div>
          ) : overallProgress > 50 ? (
            <div className="text-blue-600">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3 className="text-2xl font-bold mb-2">¡Excelente progreso!</h3>
              <p className="text-gray-600">Estás haciendo un gran trabajo. ¡Sigue así para completar todas las consonantes!</p>
            </div>
          ) : overallProgress > 0 ? (
            <div className="text-purple-600">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
              </svg>
              <h3 className="text-2xl font-bold mb-2">¡Buen comienzo!</h3>
              <p className="text-gray-600">Has comenzado tu viaje de aprendizaje. ¡Continúa practicando para mejorar!</p>
            </div>
          ) : (
            <div className="text-gray-600">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="text-2xl font-bold mb-2">¡Comienza tu aventura!</h3>
              <p className="text-gray-600">Haz clic en cualquier consonante para comenzar a practicar y aprender nuevas palabras.</p>
            </div>
          )}
        </div>

        {/* Botón para volver al inicio */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AuthSession } from '@/types/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación (opcional para usuarios anónimos)
    const session = await auth.api.getSession({
      headers: request.headers
    });

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = session?.user ? (session as AuthSession).user.id : null;

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'Se requiere autenticación o sessionId' },
        { status: 400 }
      );
    }

    // Obtener progreso de UserProgress (sistema legacy)
    const userProgress = await prisma.userProgress.findMany({
      where: {
        ...(userId ? { userId } : { sessionId: sessionId || '', userId: null })
      },
      include: {
        user: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Obtener sesiones de actividades completadas
    const completedSessions = await prisma.activitySession.findMany({
      where: {
        ...(userId ? { userId } : { sessionId: sessionId || '', userId: null }),
        completedAt: { not: null }
      },
      include: {
        activity: {
          include: {
            consonant: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    });

    // Obtener sesiones activas (no completadas)
    const activeSessions = await prisma.activitySession.findMany({
      where: {
        ...(userId ? { userId } : { sessionId: sessionId || '', userId: null }),
        completedAt: null
      },
      include: {
        activity: {
          include: {
            consonant: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    // Obtener todas las consonantes para calcular progreso completo
    const allConsonants = await prisma.consonant.findMany({
      orderBy: {
        letter: 'asc'
      }
    });

    // Calcular estadísticas generales
    const totalWordsCompleted = userProgress.reduce((sum, p) => sum + p.wordsCompleted, 0);
    const totalWords = userProgress.reduce((sum, p) => sum + p.totalWords, 0);
    const overallProgress = totalWords > 0 ? Math.round((totalWordsCompleted / totalWords) * 100) : 0;
    
    const consonantsStarted = userProgress.length;
    const consonantsCompleted = userProgress.filter(p => 
      p.wordsCompleted === p.totalWords && p.totalWords > 0
    ).length;
    
    // Estadísticas de actividades
    const totalActivitiesCompleted = completedSessions.length;
    const totalTimeSpent = completedSessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
    const totalScore = completedSessions.reduce((sum, s) => sum + (s.score || 0), 0);
    const averageAccuracy = completedSessions.length > 0 ? 
      Math.round(
        completedSessions.reduce((sum, s) => {
          const accuracy = s.wordsTotal > 0 ? (s.wordsCorrect / s.wordsTotal) * 100 : 0;
          return sum + accuracy;
        }, 0) / completedSessions.length
      ) : 0;

    // Progreso por consonante
    const consonantProgress = allConsonants.map(consonant => {
      const progress = userProgress.find(p => p.consonantId === consonant.id);
      const sessions = completedSessions.filter(s => s.activity?.consonantId === consonant.id);
      
      return {
        consonant: {
          id: consonant.id,
          letter: consonant.letter,
          name: consonant.name
        },
        progress: {
          wordsCompleted: progress?.wordsCompleted || 0,
          totalWords: progress?.totalWords || 0,
          completionPercentage: progress && progress.totalWords > 0 ? 
            Math.round((progress.wordsCompleted / progress.totalWords) * 100) : 0,
          lastUpdated: progress?.updatedAt || null
        },
        activities: {
          completed: sessions.length,
          totalScore: sessions.reduce((sum, s) => sum + (s.score || 0), 0),
          totalTimeSpent: sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0),
          averageAccuracy: sessions.length > 0 ? 
            Math.round(
              sessions.reduce((sum, s) => {
                const accuracy = s.wordsTotal > 0 ? (s.wordsCorrect / s.wordsTotal) * 100 : 0;
                return sum + accuracy;
              }, 0) / sessions.length
            ) : 0
        }
      };
    });

    // Actividades recientes
    const recentActivities = completedSessions.slice(0, 10).map(activitySession => {
      const session = activitySession;
      return {
        id: session.id,
        activityType: session.activity?.type || 'UNKNOWN',
        consonant: session.activity?.consonant ? {
          letter: session.activity.consonant.letter || '',
          name: session.activity.consonant.name || ''
        } : null,
        completedAt: session.completedAt,
        score: session.score || 0,
        accuracy: session.wordsTotal > 0 ? 
          Math.round((session.wordsCorrect / session.wordsTotal) * 100) : 0,
        timeSpent: session.timeSpent || 0,
        wordsCorrect: session.wordsCorrect,
        wordsTotal: session.wordsTotal
      };
    });

    // Racha de días consecutivos (simplificado)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const hasActivityToday = completedSessions.some(s => {
      const completedDate = new Date(s.completedAt!);
      return completedDate.toDateString() === today.toDateString();
    });
    
    const hasActivityYesterday = completedSessions.some(s => {
      const completedDate = new Date(s.completedAt!);
      return completedDate.toDateString() === yesterday.toDateString();
    });

    // Calcular racha simple (se puede mejorar con lógica más compleja)
    let currentStreak = 0;
    if (hasActivityToday) {
      currentStreak = 1;
      if (hasActivityYesterday) {
        currentStreak = 2; // Simplificado, en realidad necesitaríamos revisar más días
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        user: {
          id: userId,
          name: session?.user?.name || null,
          email: session?.user?.email || null,
          isAuthenticated: !!userId
        },
        stats: {
          totalWordsCompleted,
          totalWords,
          overallProgress,
          consonantsStarted,
          consonantsCompleted,
          totalActivitiesCompleted,
          totalTimeSpent,
          totalTimeSpentMinutes: Math.round(totalTimeSpent / 60),
          totalScore,
          averageAccuracy,
          currentStreak
        },
        consonantProgress,
        recentActivities,
        activeSessions: activeSessions.map(activitySession => {
          const session = activitySession;
          return {
            id: session.id,
            activityType: session.activity?.type || 'UNKNOWN',
            consonant: session.activity?.consonant ? {
              letter: session.activity.consonant.letter || '',
              name: session.activity.consonant.name || ''
            } : null,
            startedAt: session.startedAt,
            wordsCorrect: session.wordsCorrect,
            wordsTotal: session.wordsTotal,
            currentScore: session.score || 0
          };
        })
      }
    });

  } catch (error) {
    console.error('Error getting progress summary:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
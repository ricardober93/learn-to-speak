import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AuthSession } from '@/types/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CompleteActivitySchema = z.object({
  finalScore: z.number().min(0),
  timeSpent: z.number().min(0), // en segundos
  wordsCorrect: z.number().min(0),
  wordsTotal: z.number().min(0),
  metadata: z.record(z.string(), z.any()).optional()
});

interface RouteParams {
  params: {
    sessionId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = params;
    
    // Verificar autenticación (opcional para usuarios anónimos)
    const session = await auth.api.getSession({
      headers: request.headers
    });

    const body = await request.json();
    const validatedData = CompleteActivitySchema.parse(body);

    // Buscar la sesión de actividad
    const activitySession = await prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        activity: {
          include: {
            consonant: true
          }
        },
        user: true
      }
    });

    if (!activitySession) {
      return NextResponse.json(
        { error: 'Sesión de actividad no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la sesión no esté ya completada
    if (activitySession.completedAt) {
      return NextResponse.json(
        { error: 'Esta sesión ya está completada' },
        { status: 400 }
      );
    }

    // Verificar permisos
    const userId = session?.user ? (session as AuthSession).user.id : null;
    if (activitySession.userId && activitySession.userId !== userId) {
      return NextResponse.json(
        { error: 'No autorizado para completar esta sesión' },
        { status: 403 }
      );
    }

    // Completar la sesión de actividad
    const completedSession = await prisma.activitySession.update({
      where: { id: sessionId },
      data: {
        completedAt: new Date(),
        score: validatedData.finalScore,
        timeSpent: validatedData.timeSpent,
        wordsCorrect: validatedData.wordsCorrect,
        wordsTotal: validatedData.wordsTotal,
        metadata: JSON.parse(JSON.stringify({
          ...(typeof activitySession.metadata === 'object' && activitySession.metadata !== null ? activitySession.metadata : {}),
          ...(validatedData.metadata || {}),
          completedAt: new Date().toISOString()
        })),
        updatedAt: new Date()
      },
      include: {
        activity: {
          include: {
            consonant: true
          }
        }
      }
    });

    // Actualizar el progreso en UserProgress para compatibilidad
    if (activitySession.activity?.consonantId) {
      await prisma.userProgress.upsert({
        where: {
          id: `${userId || activitySession.sessionId}-${activitySession.activity.consonantId}`
        },
        create: {
          userId: userId,
          sessionId: activitySession.sessionId,
          consonantId: activitySession.activity.consonantId,
          wordsCompleted: validatedData.wordsCorrect,
          totalWords: validatedData.wordsTotal
        },
        update: {
          wordsCompleted: validatedData.wordsCorrect,
          totalWords: validatedData.wordsTotal,
          updatedAt: new Date()
        }
      }).catch(() => {
        // Si falla el upsert, intentar crear con un ID único
        return prisma.userProgress.create({
          data: {
            userId: userId,
            sessionId: activitySession.sessionId,
            consonantId: activitySession.activity.consonantId || '',
            wordsCompleted: validatedData.wordsCorrect,
            totalWords: validatedData.wordsTotal
          }
        });
      });
    }

    // Calcular estadísticas finales
    const completionPercentage = validatedData.wordsTotal > 0 ? 
      Math.round((validatedData.wordsCorrect / validatedData.wordsTotal) * 100) : 0;
    
    const accuracy = validatedData.wordsTotal > 0 ? 
      Math.round((validatedData.wordsCorrect / validatedData.wordsTotal) * 100) : 0;
    
    const timeSpentMinutes = Math.round(validatedData.timeSpent / 60);
    
    // Determinar logros potenciales
    const achievements = [];
    
    // Logro por completar primera actividad
    if (userId) {
      const userSessionsCount = await prisma.activitySession.count({
        where: {
          userId: userId,
          completedAt: { not: null }
        }
      });
      
      if (userSessionsCount === 1) {
        achievements.push({
          type: 'FIRST_ACTIVITY',
          name: 'Primera Actividad',
          description: '¡Has completado tu primera actividad!',
          points: 50
        });
      }
    }
    
    // Logro por precisión perfecta
    if (accuracy === 100 && validatedData.wordsTotal >= 5) {
      achievements.push({
        type: 'PERFECT_SCORE',
        name: 'Puntuación Perfecta',
        description: '¡100% de precisión en una actividad!',
        points: 100
      });
    }
    
    // Logro por velocidad (menos de 30 segundos por palabra)
    const averageTimePerWord = validatedData.wordsTotal > 0 ? 
      validatedData.timeSpent / validatedData.wordsTotal : 0;
    
    if (averageTimePerWord < 30 && validatedData.wordsTotal >= 10) {
      achievements.push({
        type: 'SPEED_READER',
        name: 'Lector Rápido',
        description: '¡Menos de 30 segundos por palabra!',
        points: 75
      });
    }

    // Respuesta con estadísticas completas
    return NextResponse.json({
      success: true,
      session: completedSession,
      stats: {
        completionPercentage,
        accuracy,
        wordsCorrect: validatedData.wordsCorrect,
        wordsTotal: validatedData.wordsTotal,
        finalScore: validatedData.finalScore,
        timeSpent: validatedData.timeSpent,
        timeSpentMinutes,
        averageTimePerWord: Math.round(averageTimePerWord)
      },
      achievements,
      message: 'Actividad completada exitosamente'
    });

  } catch (error) {
    console.error('Error completing activity:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
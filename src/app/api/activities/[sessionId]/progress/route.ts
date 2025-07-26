import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AuthSession } from '@/types/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateProgressSchema = z.object({
  wordsCorrect: z.number().min(0),
  wordsTotal: z.number().min(0),
  score: z.number().min(0).optional(),
  timeSpent: z.number().min(0).optional(), // en segundos
  metadata: z.record(z.string(), z.any()).optional()
});

interface RouteParams {
  params: {
    sessionId: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = params;
    
    // Verificar autenticación (opcional para usuarios anónimos)
    const session = await auth.api.getSession({
      headers: request.headers
    });

    const body = await request.json();
    const validatedData = UpdateProgressSchema.parse(body);

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

    // Verificar permisos: el usuario debe ser el propietario de la sesión
    const userId = session?.user ? (session as AuthSession).user.id : null;
    if (activitySession.userId && activitySession.userId !== userId) {
      return NextResponse.json(
        { error: 'No autorizado para actualizar esta sesión' },
        { status: 403 }
      );
    }

    // Si es una sesión anónima, verificar que el sessionId coincida
    if (!activitySession.userId && !session?.user) {
      // Para sesiones anónimas, necesitamos verificar de alguna manera
      // Por ahora, permitimos la actualización si no hay usuario autenticado
    }

    // Actualizar la sesión de actividad
    const updatedSession = await prisma.activitySession.update({
      where: { id: sessionId },
      data: {
        wordsCorrect: validatedData.wordsCorrect,
        wordsTotal: validatedData.wordsTotal,
        score: validatedData.score,
        timeSpent: validatedData.timeSpent,
        metadata: validatedData.metadata ? JSON.parse(JSON.stringify(validatedData.metadata)) : null,
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

    // También actualizar el progreso en el modelo UserProgress para compatibilidad
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

    // Calcular estadísticas
    const completionPercentage = validatedData.wordsTotal > 0 ? 
      Math.round((validatedData.wordsCorrect / validatedData.wordsTotal) * 100) : 0;
    
    const isCompleted = completionPercentage === 100;

    return NextResponse.json({
      success: true,
      session: updatedSession,
      stats: {
        completionPercentage,
        isCompleted,
        wordsCorrect: validatedData.wordsCorrect,
        wordsTotal: validatedData.wordsTotal,
        score: validatedData.score || 0,
        timeSpent: validatedData.timeSpent || 0
      },
      message: 'Progreso actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error updating activity progress:', error);
    
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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = params;
    
    // Verificar autenticación (opcional para usuarios anónimos)
    const session = await auth.api.getSession({
      headers: request.headers
    });

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

    // Verificar permisos
    const userId = session?.user ? (session as AuthSession).user.id : null;
    if (activitySession.userId && activitySession.userId !== userId) {
      return NextResponse.json(
        { error: 'No autorizado para ver esta sesión' },
        { status: 403 }
      );
    }

    // Calcular estadísticas
    const completionPercentage = activitySession.wordsTotal > 0 ? 
      Math.round((activitySession.wordsCorrect / activitySession.wordsTotal) * 100) : 0;
    
    const timeSpentMinutes = activitySession.timeSpent ? 
      Math.round(activitySession.timeSpent / 60) : 0;

    return NextResponse.json({
      success: true,
      session: activitySession,
      stats: {
        completionPercentage,
        isCompleted: completionPercentage === 100,
        wordsCorrect: activitySession.wordsCorrect,
        wordsTotal: activitySession.wordsTotal,
        score: activitySession.score || 0,
        timeSpent: activitySession.timeSpent || 0,
        timeSpentMinutes
      }
    });

  } catch (error) {
    console.error('Error getting activity progress:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
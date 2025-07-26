import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AuthSession } from '@/types/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const StartActivitySchema = z.object({
  consonantId: z.string(),
  sessionId: z.string(),
  activityType: z.enum(['CONSONANT_PRACTICE', 'SYLLABLE_GAME', 'WORD_RECOGNITION']).default('CONSONANT_PRACTICE'),
  difficulty: z.number().min(1).max(5).default(1)
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación (opcional para usuarios anónimos)
    const session = await auth.api.getSession({
      headers: request.headers
    });

    const body = await request.json();
    const validatedData = StartActivitySchema.parse(body);

    const { consonantId, sessionId, activityType, difficulty } = validatedData;

    // Verificar que la consonante existe
    const consonant = await prisma.consonant.findUnique({
      where: { id: consonantId }
    });

    if (!consonant) {
      return NextResponse.json(
        { error: 'Consonante no encontrada' },
        { status: 404 }
      );
    }

    // Crear o encontrar actividad
    let activity = await prisma.activity.findFirst({
      where: {
        type: activityType,
        consonantId,
        difficulty
      }
    });

    if (!activity) {
      activity = await prisma.activity.create({
        data: {
          type: activityType,
          consonantId,
          difficulty,
          metadata: {
            consonantLetter: consonant.letter,
            consonantName: consonant.name
          }
        }
      });
    }

    // Verificar si ya existe una sesión activa
    const existingSession = await prisma.activitySession.findFirst({
      where: {
        ...(session?.user ? { userId: (session as AuthSession).user.id } : { sessionId, userId: null }),
        activityId: activity.id,
        completedAt: null
      }
    });

    if (existingSession) {
      return NextResponse.json({
        success: true,
        sessionId: existingSession.id,
        activityId: activity.id,
        message: 'Sesión existente encontrada',
        startedAt: existingSession.startedAt
      });
    }

    // Crear nueva sesión de actividad
    const activitySession = await prisma.activitySession.create({
      data: {
        userId: session?.user ? (session as AuthSession).user.id : null,
        sessionId,
        activityId: activity.id,
        startedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      sessionId: activitySession.id,
      activityId: activity.id,
      message: 'Sesión de actividad iniciada',
      startedAt: activitySession.startedAt
    });

  } catch (error) {
    console.error('Error starting activity:', error);
    
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
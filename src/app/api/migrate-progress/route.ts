import { NextRequest, NextResponse } from 'next/server';
import { WordEngine } from '@/lib/rules/engine';
import { auth } from '@/lib/auth';
import { AuthSession } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { sessionId, userId } = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'sessionId y userId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el userId coincida con el usuario autenticado
    if ((session as AuthSession)?.user?.id !== userId) {
      return NextResponse.json(
        { error: 'No autorizado para migrar este progreso' },
        { status: 403 }
      );
    }

    // Migrar el progreso
    await WordEngine.migrateAnonymousProgress({
      sessionId,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'Progreso migrado exitosamente'
    });

  } catch (error) {
    console.error('Error migrating progress:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
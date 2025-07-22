import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { WordEngine } from '../../../lib/rules/engine';

export async function GET() {
  try {
    // Inicializar consonantes si no existen
    await WordEngine.initializeConsonants();
    
    const consonants = await prisma.consonant.findMany({
      orderBy: { letter: 'asc' }
    });
    
    return NextResponse.json(consonants);
  } catch (error) {
    console.error('Error fetching consonants:', error);
    return NextResponse.json(
      { error: 'Error al obtener las consonantes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { letter, name } = await request.json();
    
    const consonant = await prisma.consonant.create({
      data: { letter, name }
    });
    
    return NextResponse.json(consonant, { status: 201 });
  } catch (error) {
    console.error('Error creating consonant:', error);
    return NextResponse.json(
      { error: 'Error al crear la consonante' },
      { status: 500 }
    );
  }
}
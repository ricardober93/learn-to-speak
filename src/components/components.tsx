'use client';

import { useState } from 'react';
import { Consonant, Word } from '../lib/rules/types';

interface ConsonantCardProps {
  consonant: Consonant;
  onClick: () => void;
}

export function ConsonantCard({ consonant, onClick }: ConsonantCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg p-8 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-xl border-2 border-blue-100 hover:border-blue-300"
    >
      <div className="text-center">
        <div className="text-6xl font-bold text-blue-600 mb-4">
          {consonant.letter}
        </div>
        <div className="text-xl text-gray-700 font-medium">
          {consonant.name}
        </div>
      </div>
    </div>
  );
}

interface ConsonantSelectorProps {
  consonants: Consonant[];
  onSelect: (consonant: Consonant) => void;
}

export function ConsonantSelector({ consonants, onSelect }: ConsonantSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            ¡Aprende a Leer!
          </h1>
          <p className="text-xl text-gray-600">
            Selecciona una consonante para practicar palabras
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {consonants.map((consonant) => (
            <ConsonantCard
              key={consonant.id}
              consonant={consonant}
              onClick={() => onSelect(consonant)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface WordCardProps {
  word: Word;
  onComplete?: () => void;
}

export function WordCard({ word, onComplete }: WordCardProps) {
  const [isCompleted, setIsCompleted] = useState(false);
  
  const handleClick = () => {
    if (!isCompleted) {
      setIsCompleted(true);
      onComplete?.();
    }
  };
  
  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-100 border-green-300 text-green-800';
      case 2: return 'bg-blue-100 border-blue-300 text-blue-800';
      case 3: return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 4: return 'bg-orange-100 border-orange-300 text-orange-800';
      case 5: return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };
  
  return (
    <div 
      onClick={handleClick}
      className={`
        rounded-xl shadow-lg p-6 cursor-pointer transform transition-all duration-200 
        hover:scale-105 hover:shadow-xl border-2
        ${
          isCompleted 
            ? 'bg-green-50 border-green-300 scale-95' 
            : `bg-white ${getDifficultyColor(word.difficulty)}`
        }
      `}
    >
      <div className="text-center">
        <div className="text-4xl font-bold mb-3">
          {word.text}
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="bg-gray-200 px-2 py-1 rounded">
            {word.syllables} sílaba{word.syllables > 1 ? 's' : ''}
          </span>
          <span className="bg-gray-200 px-2 py-1 rounded">
            Nivel {word.difficulty}
          </span>
        </div>
        {isCompleted && (
          <div className="mt-3 text-green-600 font-semibold">
            ¡Completado! ✓
          </div>
        )}
      </div>
    </div>
  );
}

interface WordListProps {
  words: Word[];
  consonant: Consonant;
  onBack: () => void;
}

export function WordList({ words, consonant, onBack }: WordListProps) {
  const [completedWords, setCompletedWords] = useState<Set<string>>(new Set());
  
  const handleWordComplete = (wordId: string) => {
    setCompletedWords(prev => new Set([...prev, wordId]));
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            ← Volver
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Palabras con "{consonant.letter}"
            </h1>
            <p className="text-lg text-gray-600">
              Progreso: {completedWords.size} de {words.length} palabras
            </p>
          </div>
          
          <div className="w-24"> {/* Spacer for centering */}</div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {words.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              onComplete={() => handleWordComplete(word.id)}
            />
          ))}
        </div>
        
        {words.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">
              No hay palabras disponibles para esta consonante.
            </p>
          </div>
        )}
        
        {completedWords.size === words.length && words.length > 0 && (
          <div className="text-center mt-12 p-8 bg-green-100 rounded-xl border-2 border-green-300">
            <h2 className="text-3xl font-bold text-green-800 mb-4">
              ¡Felicitaciones! 🎉
            </h2>
            <p className="text-xl text-green-700">
              Has completado todas las palabras con la consonante "{consonant.letter}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SyllableFilterProps {
  selectedSyllables: number | null;
  onSyllableChange: (syllables: number | null) => void;
}

export function SyllableFilter({ selectedSyllables, onSyllableChange }: SyllableFilterProps) {
  const syllableOptions = [1, 2, 3];
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        Filtrar por número de sílabas:
      </h3>
      <div className="flex gap-3">
        <button
          onClick={() => onSyllableChange(null)}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${
              selectedSyllables === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
        >
          Todas
        </button>
        {syllableOptions.map((syllables) => (
          <button
            key={syllables}
            onClick={() => onSyllableChange(syllables)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-colors
              ${
                selectedSyllables === syllables
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            {syllables} sílaba{syllables > 1 ? 's' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
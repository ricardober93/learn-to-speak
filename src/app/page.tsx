'use client';

import { useState, useEffect } from 'react';
import { ConsonantSelector, WordList, SyllableFilter } from '../components/components';
import { Consonant, Word } from '../lib/rules/types';

export default function Home() {
  const [consonants, setConsonants] = useState<Consonant[]>([]);
  const [selectedConsonant, setSelectedConsonant] = useState<Consonant | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [selectedSyllables, setSelectedSyllables] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingWords, setLoadingWords] = useState(false);

  // Cargar consonantes al iniciar
  useEffect(() => {
    fetchConsonants();
  }, []);

  const fetchConsonants = async () => {
    try {
      const response = await fetch('/api/consonants');
      if (response.ok) {
        const data = await response.json();
        setConsonants(data);
      }
    } catch (error) {
      console.error('Error fetching consonants:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWords = async (consonant: Consonant, syllables?: number) => {
    setLoadingWords(true);
    try {
      const params = new URLSearchParams({
        consonantId: consonant.id,
        maxWords: '15'
      });
      
      if (syllables) {
        params.append('syllableCount', syllables.toString());
      }
      
      const response = await fetch(`/api/words?${params}`);
      if (response.ok) {
        const data = await response.json();
        setWords(data);
      }
    } catch (error) {
      console.error('Error fetching words:', error);
    } finally {
      setLoadingWords(false);
    }
  };

  const handleConsonantSelect = (consonant: Consonant) => {
    setSelectedConsonant(consonant);
    setSelectedSyllables(null);
    fetchWords(consonant);
  };

  const handleSyllableChange = (syllables: number | null) => {
    setSelectedSyllables(syllables);
    if (selectedConsonant) {
      fetchWords(selectedConsonant, syllables || undefined);
    }
  };

  const handleBack = () => {
    setSelectedConsonant(null);
    setWords([]);
    setSelectedSyllables(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-600">
          Cargando...
        </div>
      </div>
    );
  }

  if (selectedConsonant) {
    return (
      <div>
        <div className="p-4">
          <SyllableFilter
            selectedSyllables={selectedSyllables}
            onSyllableChange={handleSyllableChange}
          />
        </div>
        
        {loadingWords ? (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
            <div className="text-2xl font-semibold text-gray-600">
              Generando palabras...
            </div>
          </div>
        ) : (
          <WordList
            words={words}
            consonant={selectedConsonant}
            onBack={handleBack}
          />
        )}
      </div>
    );
  }

  return (
    <ConsonantSelector
      consonants={consonants}
      onSelect={handleConsonantSelect}
    />
  );
}

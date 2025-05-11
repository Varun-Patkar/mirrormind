import Link from 'next/link';
import { Brain, PlusCircle, MessageCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <div className="container mx-auto px-4 py-12 md:py-24">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="mb-6 p-4 rounded-full bg-primary/10 animate-pulse">
            <Brain className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
            Welcome to MirrorMind
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mb-8">
            Create mirror copies of people that run directly in your browser. Everything is stored locally
            and powered by your device's GPU using WebLLM technology.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <Link href="/create-persona" 
              className="flex flex-col items-center p-8 rounded-xl bg-gradient-to-br from-blue-500/90 to-purple-600/90 dark:from-blue-600/90 dark:to-purple-700/90 text-white shadow-lg hover:shadow-xl transform transition hover:-translate-y-1 hover:scale-105">
              <PlusCircle className="h-12 w-12 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Create a Persona</h2>
              <p className="text-sm opacity-90">Build a new AI persona by answering a questionnaire</p>
            </Link>
            
            <Link href="/my-personas"
              className="flex flex-col items-center p-8 rounded-xl bg-gradient-to-br from-pink-500/90 to-orange-500/90 dark:from-pink-600/90 dark:to-orange-600/90 text-white shadow-lg hover:shadow-xl transform transition hover:-translate-y-1 hover:scale-105">
              <MessageCircle className="h-12 w-12 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Talk to My Personas</h2>
              <p className="text-sm opacity-90">Chat with your created personas</p>
            </Link>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Personas</h3>
              <p className="text-muted-foreground">Fill out a questionnaire to create a unique AI persona that mirrors real personality traits.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Chat Anytime</h3>
              <p className="text-muted-foreground">Engage in conversations with your created personas whenever you want.</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow-md hover:shadow-lg transition-all">
              <div className="rounded-full bg-pink-100 dark:bg-pink-900/30 w-12 h-12 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-pink-600 dark:text-pink-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-muted-foreground">All data stays on your device. Your conversations and personas are never sent to any server.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
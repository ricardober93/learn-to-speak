"use client";

import { useState } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { LoginForm, RegisterForm } from "./auth-forms";

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  if (isPending) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setAuthMode("login");
              setShowAuthModal(true);
            }}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => {
              setAuthMode("register");
              setShowAuthModal(true);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Registrarse
          </button>
        </div>

        {/* Modal de Autenticación */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {authMode === "login" ? "Iniciar Sesión" : "Registrarse"}
                </h2>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {authMode === "login" ? (
                <LoginForm onSuccess={handleAuthSuccess} />
              ) : (
                <RegisterForm onSuccess={handleAuthSuccess} />
              )}
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {authMode === "login" 
                    ? "¿No tienes cuenta? Regístrate" 
                    : "¿Ya tienes cuenta? Inicia sesión"
                  }
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          {session.user.name?.charAt(0).toUpperCase() || session.user.email?.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-gray-700">
          {session.user.name || session.user.email}
        </span>
      </button>

      {showUserMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-500 border-b">
              {session.user.email}
            </div>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
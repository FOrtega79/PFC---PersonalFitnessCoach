// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] w-full bg-[#0F172A] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans p-6">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/40 rounded-full blur-[140px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-fuchsia-900/30 rounded-full blur-[140px]"></div>
          </div>
          
          <div className="relative z-10 bg-black/30 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-md w-full text-center flex flex-col items-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            
            <h2 className="text-2xl font-light tracking-wide text-white/90 mb-3">Something went wrong</h2>
            
            <p className="text-white/50 mb-8 font-light text-sm">
              We encountered an unexpected error loading this screen. Please try again or check your connection.
            </p>
            
            {this.state.error?.message && (
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl mb-8 w-full text-left overflow-hidden">
                <p className="text-xs font-mono text-red-400 break-words line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="flex items-center justify-center gap-2 w-full py-4 bg-white text-black rounded-2xl font-medium tracking-wide hover:bg-gray-100 transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

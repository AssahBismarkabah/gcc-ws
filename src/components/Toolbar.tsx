import React from 'react';

interface Document {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  updatedAt: number;
}

interface ToolbarProps {
  currentDoc: Document | null;
  wordCount: number;
  charCount: number;
  lineCount: number;
  darkMode: boolean;
  toggleTheme: () => void;
  onExportClick: (e: React.MouseEvent) => void;
}

export default function Toolbar({
  currentDoc,
  wordCount,
  charCount,
  lineCount,
  darkMode,
  toggleTheme,
  onExportClick
}: ToolbarProps) {
  return (
    <div className="flex items-center space-x-4">
      {currentDoc && (
        <div className="flex space-x-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{wordCount} words</span>
          <span>{charCount} chars</span>
          <span>{lineCount} lines</span>
        </div>
      )}
      <div className="flex items-center space-x-2">
        {currentDoc && (
          <span className="text-xs text-zinc-400">Auto-saved</span>
        )}
        <button
          onClick={toggleTheme}
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
        <a
          href="https://github.com/DCT-Berinyuy/gcc-ws"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          title="View on GitHub"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 dark:text-zinc-400">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
            <path d="M9 18c-4.51 2-5-2-7-2"/>
          </svg>
        </a>
        <button
          onClick={onExportClick}
          className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Export
        </button>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

const DEFAULT_CONTENT = `# Welcome to this fun markdown editor
`;

const STORAGE_KEY = "markdown-editor-documents";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getDocuments(): Document[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveDocuments(docs: Document[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

function getDocumentTitle(content: string): string {
  const firstLine = content.split("\n")[0];
  const match = firstLine.match(/^#\s+(.+)/);
  return match ? match[1].slice(0, 30) : "Untitled";
}

export default function MarkdownEditor() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [markdown, setMarkdown] = useState(DEFAULT_CONTENT);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isInitialized = useRef(false);

  // Load documents from localStorage on mount (valid use case for setState in effect)
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const docs = getDocuments();
    if (docs.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDocuments(docs);
      setCurrentDoc(docs[0]);
      setMarkdown(docs[0].content);
    }
  }, []);

  // Auto-save current document
  useEffect(() => {
    if (!currentDoc || !isInitialized.current) return;

    const currentDocId = currentDoc.id;
    const timer = setTimeout(() => {
      const newTitle = getDocumentTitle(markdown);

      setDocuments((prevDocs) => {
        const updatedDocs = prevDocs.map((d) =>
          d.id === currentDocId
            ? { ...d, content: markdown, title: newTitle, updatedAt: Date.now() }
            : d
        );
        saveDocuments(updatedDocs);
        return updatedDocs;
      });

      setCurrentDoc((prev) =>
        prev ? { ...prev, content: markdown, title: newTitle, updatedAt: Date.now() } : prev
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [markdown, currentDoc]);

  const createNewDocument = () => {
    const newDoc: Document = {
      id: generateId(),
      title: "Untitled",
      content: DEFAULT_CONTENT,
      updatedAt: Date.now(),
    };
    setDocuments((prev) => {
      const updatedDocs = [newDoc, ...prev];
      saveDocuments(updatedDocs);
      return updatedDocs;
    });
    setCurrentDoc(newDoc);
    setMarkdown(newDoc.content);
  };

  const openDocument = (doc: Document) => {
    setCurrentDoc(doc);
    setMarkdown(doc.content);
  };

  const deleteDocument = (id: string) => {
    setDocuments((prevDocs) => {
      const updatedDocs = prevDocs.filter((d) => d.id !== id);
      saveDocuments(updatedDocs);

      if (currentDoc?.id === id) {
        if (updatedDocs.length > 0) {
          setCurrentDoc(updatedDocs[0]);
          setMarkdown(updatedDocs[0].content);
        } else {
          setCurrentDoc(null);
          setMarkdown(DEFAULT_CONTENT);
        }
      }

      return updatedDocs;
    });
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } flex flex-col bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-200 overflow-hidden`}
      >
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={createNewDocument}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-zinc-800 dark:bg-zinc-700 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
          >
            + New Document
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          {documents.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
              No documents yet
            </p>
          ) : (
            <ul className="py-2">
              {documents.map((doc) => (
                <li key={doc.id} className="group relative">
                  <button
                    onClick={() => openDocument(doc)}
                    className={`w-full px-4 py-2 pr-8 text-left text-sm truncate hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                      currentDoc?.id === doc.id
                        ? "bg-zinc-200 dark:bg-zinc-800 font-medium"
                        : ""
                    }`}
                  >
                    {doc.title}
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity"
                    title="Delete"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-zinc-200 dark:bg-zinc-700 px-1 py-4 rounded-r-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
        style={{ left: sidebarOpen ? "256px" : "0" }}
      >
        {sidebarOpen ? "‹" : "›"}
      </button>

      {/* Editor Panel */}
      <div className="flex-1 flex">
        <div className="w-1/2 flex flex-col border-r border-zinc-200 dark:border-zinc-800">
          <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
              Editor
            </h2>
            {currentDoc && (
              <span className="text-xs text-zinc-400">Auto-saved</span>
            )}
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 p-4 resize-none bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-mono text-sm leading-relaxed focus:outline-none"
            placeholder="Write your markdown here..."
            spellCheck={false}
          />
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
              Preview
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-6 bg-white dark:bg-zinc-950">
            <article className="prose prose-zinc dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}

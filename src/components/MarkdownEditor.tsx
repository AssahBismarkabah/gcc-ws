"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Document {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  updatedAt: number;
}

interface Folder {
  id: string;
  name: string;
  isOpen: boolean;
}

const DEFAULT_CONTENT = `# Welcome to this fun markdown editor
`;

const STORAGE_KEY = "markdown-editor-documents";
const FOLDERS_KEY = "markdown-editor-folders";

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

function getFolders(): Folder[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(FOLDERS_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveFolders(folders: Folder[]): void {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

function getDocumentTitle(content: string): string {
  const firstLine = content.split("\n")[0];
  const match = firstLine.match(/^#\s+(.+)/);
  return match ? match[1].slice(0, 30) : "Untitled";
}

export default function MarkdownEditor() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [markdown, setMarkdown] = useState(DEFAULT_CONTENT);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    docId: string;
  } | null>(null);
  const isInitialized = useRef(false);

  // Load documents and folders from localStorage on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const docs = getDocuments();
    const flds = getFolders();
    if (docs.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDocuments(docs);
      setCurrentDoc(docs[0]);
      setMarkdown(docs[0].content);
    }
    if (flds.length > 0) {
      setFolders(flds);
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

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const createNewDocument = (folderId: string | null = null) => {
    const newDoc: Document = {
      id: generateId(),
      title: "Untitled",
      content: DEFAULT_CONTENT,
      folderId,
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

  const createNewFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: Folder = {
      id: generateId(),
      name: newFolderName.trim(),
      isOpen: true,
    };
    setFolders((prev) => {
      const updated = [...prev, newFolder];
      saveFolders(updated);
      return updated;
    });
    setNewFolderName("");
    setIsCreatingFolder(false);
  };

  const toggleFolder = (folderId: string) => {
    setFolders((prev) => {
      const updated = prev.map((f) =>
        f.id === folderId ? { ...f, isOpen: !f.isOpen } : f
      );
      saveFolders(updated);
      return updated;
    });
  };

  const deleteFolder = (folderId: string) => {
    // Move documents in folder to root
    setDocuments((prev) => {
      const updated = prev.map((d) =>
        d.folderId === folderId ? { ...d, folderId: null } : d
      );
      saveDocuments(updated);
      return updated;
    });
    setFolders((prev) => {
      const updated = prev.filter((f) => f.id !== folderId);
      saveFolders(updated);
      return updated;
    });
  };

  const moveDocumentToFolder = (docId: string, folderId: string | null) => {
    setDocuments((prev) => {
      const updated = prev.map((d) =>
        d.id === docId ? { ...d, folderId } : d
      );
      saveDocuments(updated);
      return updated;
    });
    setContextMenu(null);
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

  const handleContextMenu = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, docId });
  };

  const rootDocuments = documents.filter((d) => d.folderId === null);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } flex flex-col bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-200 overflow-hidden`}
      >
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
          <button
            onClick={() => createNewDocument(null)}
            className="w-full px-3 py-2 text-sm font-medium text-white bg-zinc-800 dark:bg-zinc-700 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
          >
            + New Document
          </button>
          {isCreatingFolder ? (
            <div className="flex gap-1">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createNewFolder();
                  if (e.key === "Escape") setIsCreatingFolder(false);
                }}
                placeholder="Folder name"
                className="flex-1 px-2 py-1 text-sm border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                autoFocus
              />
              <button
                onClick={createNewFolder}
                className="px-2 py-1 text-sm bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="w-full px-3 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              + New Folder
            </button>
          )}
        </div>
        <div className="flex-1 overflow-auto py-2">
          {/* Folders */}
          {folders.map((folder) => {
            const folderDocs = documents.filter((d) => d.folderId === folder.id);
            return (
              <div key={folder.id} className="mb-1">
                <div className="group relative flex items-center">
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex-1 flex items-center gap-1 px-3 py-1.5 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <span className="text-zinc-400">{folder.isOpen ? "▼" : "▶"}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">📁</span>
                    <span className="truncate font-medium">{folder.name}</span>
                    <span className="text-xs text-zinc-400 ml-1">({folderDocs.length})</span>
                  </button>
                  <button
                    onClick={() => deleteFolder(folder.id)}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-opacity"
                    title="Delete folder"
                  >
                    ×
                  </button>
                </div>
                {folder.isOpen && (
                  <ul className="ml-4 border-l border-zinc-200 dark:border-zinc-700">
                    {folderDocs.map((doc) => (
                      <li key={doc.id} className="group relative">
                        <button
                          onClick={() => openDocument(doc)}
                          onContextMenu={(e) => handleContextMenu(e, doc.id)}
                          className={`w-full px-3 py-1.5 pr-8 text-left text-sm truncate hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
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
                    <li>
                      <button
                        onClick={() => createNewDocument(folder.id)}
                        className="w-full px-3 py-1 text-left text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        + Add document
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            );
          })}

          {/* Root documents */}
          {rootDocuments.length === 0 && folders.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
              No documents yet
            </p>
          ) : (
            <ul>
              {rootDocuments.map((doc) => (
                <li key={doc.id} className="group relative">
                  <button
                    onClick={() => openDocument(doc)}
                    onContextMenu={(e) => handleContextMenu(e, doc.id)}
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

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 z-50 min-w-[150px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Move to...
          </div>
          <button
            onClick={() => moveDocumentToFolder(contextMenu.docId, null)}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            📄 Root
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => moveDocumentToFolder(contextMenu.docId, folder.id)}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
            >
              📁 {folder.name}
            </button>
          ))}
        </div>
      )}

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

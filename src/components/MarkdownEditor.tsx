"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeEditor from "@uiw/react-textarea-code-editor";

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
  const [exportMenu, setExportMenu] = useState<{x: number; y: number} | null>(null);

  // Close export menu on click outside
  useEffect(() => {
    const handleClick = () => setExportMenu(null);
    if (exportMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [exportMenu]);

  // Position export menu to stay within viewport
  useEffect(() => {
    if (!exportMenu) return;

    const adjustPosition = () => {
      // The positioning will be handled by the ref when the element is rendered
    };

    adjustPosition();
    window.addEventListener('resize', adjustPosition);
    return () => window.removeEventListener('resize', adjustPosition);
  }, [exportMenu]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(0);
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save/export
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setExportMenu({ x: window.innerWidth - 200, y: 60 }); // Position near top-right
      }
      // Cmd/Ctrl + N for new document
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        createNewDocument();
      }
      // Cmd/Ctrl + O for import
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        document.getElementById('file-import')?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Calculate document statistics
  useEffect(() => {
    const words = markdown.trim() ? markdown.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
    const chars = markdown.length;
    const lines = markdown ? markdown.split('\n').length : 0;

    setWordCount(words);
    setCharCount(chars);
    setLineCount(lines);
  }, [markdown]);

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

  const exportAsMarkdown = () => {
    if (!currentDoc) return;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDoc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportMenu(null);
  };

  const exportAsHtml = () => {
    if (!currentDoc) return;

    // Create HTML content with basic styling
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${currentDoc.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    /* Add basic styling to match the preview */
    pre { background-color: #f4f4f4; padding: 10px; overflow-x: auto; }
    code { background-color: #f4f4f4; padding: 2px 4px; }
    blockquote { border-left: 3px solid #ddd; padding-left: 10px; margin-left: 0; }
  </style>
</head>
<body>
  <article class="prose prose-zinc">${markdown}</article>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDoc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportMenu(null);
  };

  const exportAsPdf = async () => {
    if (!currentDoc) return;

    // Dynamically import jsPDF to avoid bundling it unnecessarily
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;

    // Create a hidden element to convert to PDF
    const element = document.createElement('div');
    element.innerHTML = `<div class="prose prose-zinc">${markdown}</div>`;
    element.style.width = '210mm'; // A4 width
    element.style.padding = '20mm';
    element.style.background = 'white';
    element.style.color = 'black';
    document.body.appendChild(element);

    const canvas = await html2canvas(element);
    document.body.removeChild(element);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210 - 20; // A4 width minus margins
    const pageHeight = 295; // A4 height
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${currentDoc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
    setExportMenu(null);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const title = file.name.replace('.md', '').replace('.markdown', '');

      const newDoc: Document = {
        id: generateId(),
        title: title || "Imported Document",
        content: content || DEFAULT_CONTENT,
        folderId: null,
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
    reader.readAsText(file);

    // Reset the input so the same file can be imported again if needed
    e.target.value = '';
  };

  const rootDocuments = documents.filter((d) => d.folderId === null);

  return (
    <div className="flex h-screen">
      {/* Hidden file input for importing */}
      <input
        id="file-import"
        type="file"
        accept=".md,.markdown"
        onChange={handleFileImport}
        className="hidden"
      />

      {/* Export Menu */}
      {exportMenu && (
        <div
          className="fixed bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 z-50 min-w-[180px]"
          style={{
            left: 0,
            top: 0,
            transform: `translate(${Math.min(exportMenu.x, typeof window !== 'undefined' ? window.innerWidth - 200 : exportMenu.x)}px, ${Math.min(exportMenu.y, typeof window !== 'undefined' ? window.innerHeight - 150 : exportMenu.y)}px)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Export as...
          </div>
          <button
            onClick={exportAsMarkdown}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center"
          >
            <span className="mr-2">📄</span> Markdown (.md)
          </button>
          <button
            onClick={exportAsHtml}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center"
          >
            <span className="mr-2">🌐</span> HTML (.html)
          </button>
          <button
            onClick={exportAsPdf}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center"
          >
            <span className="mr-2">📄</span> PDF (.pdf)
          </button>
        </div>
      )}

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
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setExportMenu({ x: rect.left, y: rect.bottom + 5 });
                  }}
                  className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-white dark:bg-zinc-950">
            <CodeEditor
              value={markdown}
              language="markdown"
              onChange={(e) => setMarkdown(e.target.value)}
              className="w-full"
              placeholder="Write your markdown here..."
              style={{
                fontSize: 14,
                backgroundColor: "var(--color-background)",
                color: "var(--color-foreground)",
                fontFamily: 'var(--font-mono), monospace',
                minHeight: 'calc(100vh - 200px)',
                height: 'auto',
              }}
            />
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">
              Preview
            </h2>
            <div className="flex items-center space-x-4">
              {currentDoc && (
                <div className="flex space-x-4 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{wordCount} words</span>
                  <span>{charCount} chars</span>
                  <span>{lineCount} lines</span>
                </div>
              )}
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
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setExportMenu({ x: rect.left, y: rect.bottom + 5 });
                }}
                className="text-xs px-2 py-1 bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                Export
              </button>
            </div>
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

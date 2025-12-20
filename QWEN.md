# Markdown Editor - Project Documentation

## Project Overview

This is a **Next.js-based Markdown Editor** application that provides a real-time editing experience with live preview. The application features a split-screen interface with an editor panel on the left and a preview panel on the right, allowing users to write markdown content and instantly see the rendered output.

### Key Features

- **Real-time Preview**: Live markdown rendering as you type
- **Document Management**: Create, edit, and delete multiple markdown documents
- **Folder Organization**: Organize documents into folders with collapsible navigation
- **Local Storage**: All documents and folders are saved to browser's localStorage
- **Responsive Design**: Clean, modern UI with dark/light mode support
- **Context Menus**: Right-click functionality to move documents between folders
- **Auto-saving**: Documents automatically save as you type with a 500ms debounce
- **Export Functionality**: Export documents as Markdown, HTML, or PDF
- **Import Functionality**: Import existing markdown files
- **Keyboard Shortcuts**: Ctrl+S (export), Ctrl+N (new document), Ctrl+O (import)
- **Syntax Highlighting**: Markdown syntax highlighting in the editor
- **Document Statistics**: Real-time word count, character count, and line count
- **GitHub Integration**: Direct link to the project repository from the editor

### Technology Stack

- **Framework**: Next.js 16.0.7
- **Language**: TypeScript
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS with @tailwindcss/typography plugin
- **Markdown Processing**: react-markdown with remark-gfm for GitHub Flavored Markdown
- **Code Editor**: @uiw/react-textarea-code-editor for syntax highlighting
- **PDF Generation**: jsPDF and html2canvas for PDF export
- **Fonts**: Google Fonts (Geist family)
- **Icons**: Unicode emoji icons for UI elements

## Project Structure

```
gcc-ws/
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── layout.tsx     # Root layout with metadata
│   │   ├── page.tsx       # Main page component
│   │   └── globals.css    # Global styles and Tailwind configuration
│   └── components/        # Reusable UI components
│       └── MarkdownEditor.tsx  # Main editor component with full functionality
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
└── README.md             # Basic project description
```

## Building and Running

### Prerequisites
- Node.js (recommended version compatible with the dependencies)

### Development Commands

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint for code linting
npm run lint
```

The development server will start at `http://localhost:3000` by default.

## Architecture and Components

### Core Component: MarkdownEditor.tsx

The main functionality resides in `src/components/MarkdownEditor.tsx`, which implements:

- **State Management**: Uses React hooks (useState, useEffect) for managing documents, folders, and UI state
- **Persistence**: LocalStorage-based persistence for documents and folders
- **Document Operations**: Create, read, update, delete operations for documents and folders
- **Folder System**: Hierarchical organization with collapsible folders
- **Context Menu**: Right-click functionality for document organization
- **Auto-save**: Debounced saving mechanism to prevent excessive storage writes

### Styling Approach

The application uses:
- Tailwind CSS v4 with the @tailwindcss/typography plugin for rich markdown styling
- CSS variables for theming (light/dark mode)
- Custom scrollbar styling
- Responsive design with flexbox layouts

### Data Model

- **Document Interface**: Contains id, title, content, folderId, and updatedAt
- **Folder Interface**: Contains id, name, and isOpen state
- **Storage Keys**: "markdown-editor-documents" and "markdown-editor-folders"

## Development Conventions

- **Type Safety**: Full TypeScript typing with interfaces for data structures
- **Client Components**: Uses "use client" directive where needed for interactivity
- **Accessibility**: Semantic HTML and keyboard navigable UI elements
- **Performance**: Debounced auto-saving to optimize storage operations
- **Code Quality**: ESLint integration for maintaining code standards

## Potential Enhancements

- Export functionality (PDF, HTML, etc.)
- Import existing markdown files
- Collaboration features
- Cloud sync options
- Syntax highlighting in the editor
- Print-friendly styles

## Known Limitations

- Data is stored only in browser's localStorage (not persistent across devices)
- No file upload/import functionality
- Simple text editor without advanced formatting shortcuts
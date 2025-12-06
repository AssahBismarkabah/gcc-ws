# Markdown Editor

A simple, live-preview markdown editor built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Real-time markdown preview as you type
- GitHub Flavored Markdown (GFM) support
- Support for tables, strikethrough, task lists
- Code syntax highlighting
- Dark mode support
- Clean, split-pane interface

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd markdown-editor
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
markdown-editor/
├── src/
│   ├── app/
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   └── components/
│       └── MarkdownEditor.tsx  # Main editor component
├── public/                  # Static assets
├── package.json
└── README.md
```

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [react-markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering
- [remark-gfm](https://github.com/remarkjs/remark-gfm) - GitHub Flavored Markdown

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT

import Markdown from 'react-markdown'

interface MarkdownContentProps {
  content: string
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="text-sm text-slate-300 leading-relaxed">
      <Markdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-white mt-3 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold text-white mt-3 mb-1.5">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-emerald-300 mt-2 mb-1">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-200">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-300">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-emerald-500/40 pl-3 my-2 text-slate-400 italic">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="border-white/[0.08] my-3" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2 rounded-lg border border-white/[0.06]">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/[0.04]">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="text-left py-1.5 px-2.5 text-emerald-300 font-medium border-b border-white/[0.08]">
              {children}
            </th>
          ),
          tbody: ({ children }) => (
            <tbody>{children}</tbody>
          ),
          td: ({ children }) => (
            <td className="py-1 px-2.5 border-b border-white/[0.04]">{children}</td>
          ),
          code: ({ children, className }) => {
            // Detect code blocks (have language className like "language-python")
            const isBlock = className?.startsWith('language-')
            if (isBlock) {
              return (
                <code className="block bg-black/30 rounded-lg p-3 text-xs font-mono text-emerald-300 overflow-x-auto my-2">
                  {children}
                </code>
              )
            }
            return (
              <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-emerald-300 text-xs font-mono">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="my-2">{children}</pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-emerald-400 underline hover:text-emerald-300 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  )
}

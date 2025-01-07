import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Linkify from 'linkify-react';
import { ReactNode } from 'react';

interface MessageContentProps {
  content: string;
}

interface ComponentProps {
  children?: ReactNode;
  [key: string]: any;
}

export function MessageContent({ content }: MessageContentProps) {
  // Check if the content contains any Markdown-like syntax
  const hasMarkdown = /[*#`\[\]]/.test(content);

  if (!hasMarkdown) {
    // If no Markdown, just linkify the text
    return (
      <Linkify
        options={{
          target: '_blank',
          className: 'text-blue-600 hover:underline',
          rel: 'noopener noreferrer'
        }}
      >
        {content}
      </Linkify>
    );
  }

  const components = {
    // Style code blocks
    code: ({ inline, className, children, ...props }: ComponentProps & { inline?: boolean }) => {
      if (inline) {
        return (
          <code className="bg-gray-100 text-sm px-1 py-0.5 rounded" {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className="block bg-gray-100 p-4 rounded-md overflow-x-auto text-sm" {...props}>
          {children}
        </code>
      );
    },
    // Style links
    a: ({ children, ...props }: ComponentProps) => (
      <a
        className="text-blue-600 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    // Style lists
    ul: ({ children, ...props }: ComponentProps) => (
      <ul className="list-disc list-inside my-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: ComponentProps) => (
      <ol className="list-decimal list-inside my-2" {...props}>
        {children}
      </ol>
    ),
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
} 
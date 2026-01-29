import React from 'react';

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {

  const renderLine = (line: string) => {
    // Escape HTML to prevent XSS before applying markdown
    const sanitized = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Apply markdown to sanitized string
    const formatted = sanitized
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
      
    return { __html: formatted };
  };

  const lines = text.split('\n');
  const elements: (React.ReactElement | string)[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith('```')) {
      const lang = line.substring(3);
      let code = '';
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        code += lines[i] + '\n';
        i++;
      }
      elements.push(
        <pre key={`pre-${i}`} className="bg-slate-900 text-white p-4 rounded-md my-4 overflow-x-auto text-sm">
          <code>{code.trim()}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) { elements.push(<h3 key={i} className="text-xl font-semibold my-2" dangerouslySetInnerHTML={renderLine(line.substring(4))} />); i++; continue; }
    if (line.startsWith('## ')) { elements.push(<h2 key={i} className="text-2xl font-bold my-3 border-b pb-1" dangerouslySetInnerHTML={renderLine(line.substring(3))} />); i++; continue; }
    if (line.startsWith('# ')) { elements.push(<h1 key={i} className="text-3xl font-bold my-4 border-b pb-2" dangerouslySetInnerHTML={renderLine(line.substring(2))} />); i++; continue; }

    // Unordered List
    if (line.startsWith('* ')) {
      const listItems: React.ReactElement[] = [];
      while (i < lines.length && lines[i].startsWith('* ')) {
        listItems.push(<li key={`li-${i}`} dangerouslySetInnerHTML={renderLine(lines[i].substring(2))} />);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} className="list-disc pl-6 space-y-1 my-2">{listItems}</ul>);
      continue;
    }
    
    // Ordered List
    if (/^\d+\. /.test(line)) {
      const listItems: React.ReactElement[] = [];
       while (i < lines.length && /^\d+\. /.test(lines[i])) {
        listItems.push(<li key={`li-${i}`} dangerouslySetInnerHTML={renderLine(lines[i].replace(/^\d+\. /, ''))} />);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} className="list-decimal pl-6 space-y-1 my-2">{listItems}</ol>);
      continue;
    }
    
    // Paragraph
    if (line.trim() !== '') {
      elements.push(<p key={i} className="my-2" dangerouslySetInnerHTML={renderLine(line)} />);
    }

    i++;
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
        {elements}
        <style>{`
            .prose code.inline-code {
                background-color: #e2e8f0;
                color: #c53030;
                border-radius: 4px;
                padding: 0.2em 0.4em;
                font-size: 85%;
                font-family: monospace;
            }
            .dark .prose code.inline-code {
                background-color: #475569;
                color: #fca5a5;
            }
        `}</style>
    </div>
  );
};

export default MarkdownRenderer;
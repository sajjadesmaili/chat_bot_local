import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-body text-[15px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { className, children } = props as {
              className?: string;
              children?: React.ReactNode;
            };
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = Boolean(match);
            if (!isBlock) {
              return <code className={className}>{children}</code>;
            }
            return (
              <CodeBlock
                language={match?.[1]}
                value={String(children).replace(/\n$/, "")}
              />
            );
          },
          a(props) {
            return (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

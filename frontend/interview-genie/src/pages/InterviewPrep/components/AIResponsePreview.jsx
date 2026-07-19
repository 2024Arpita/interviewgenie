import React, { useState } from "react";
import { LuCopy, LuCheck, LuCode } from "react-icons/lu";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

const AIResponsePreview = ({ content }) => {
  if (!content) return null;
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-[14px] prose prose-slate dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}

          components={{
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    const isInline = !className;

    return !isInline ? (
      <CodeBlock
        code={String(children).replace(/\n$/, "")}
        language={language}
      />
    ) : (
      <code
        className="px-1.5 py-0.5 rounded bg-gray-100 text-pink-600 text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  },

  p({ children }) {
    return (
      <p className="mb-5 leading-7 text-gray-700">
        {children}
      </p>
    );
  },

  strong({ children }) {
    return (
      <strong className="font-semibold text-gray-900">
        {children}
      </strong>
    );
  },

  em({ children }) {
    return (
      <em className="italic text-gray-700">
        {children}
      </em>
    );
  },

  ul({ children }) {
    return (
      <ul className="list-disc pl-6 my-5 space-y-2 text-gray-700">
        {children}
      </ul>
    );
  },

  ol({ children }) {
    return (
      <ol className="list-decimal pl-6 my-5 space-y-2 text-gray-700">
        {children}
      </ol>
    );
  },

  li({ children }) {
    return (
      <li className="leading-7">
        {children}
      </li>
    );
  },

  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50 rounded-r-md px-4 py-3 my-6 italic text-gray-700">
        {children}
      </blockquote>
    );
  },

  h1({ children }) {
    return (
      <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-5">
        {children}
      </h1>
    );
  },

  h2({ children }) {
    return (
      <h2 className="text-2xl font-bold text-gray-900 mt-7 mb-4">
        {children}
      </h2>
    );
  },

  h3({ children }) {
    return (
      <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
        {children}
      </h3>
    );
  },

  h4({ children }) {
    return (
      <h4 className="text-lg font-semibold text-gray-900 mt-5 mb-2">
        {children}
      </h4>
    );
  },

  a({ href, children }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-700 underline transition-colors"
      >
        {children}
      </a>
    );
  },

  table({ children }) {
    return (
      <div className="overflow-x-auto my-6 rounded-lg border border-gray-200">
        <table className="min-w-full border-collapse">
          {children}
        </table>
      </div>
    );
  },

  thead({ children }) {
    return (
      <thead className="bg-gray-100">
        {children}
      </thead>
    );
  },

  tbody({ children }) {
    return (
      <tbody className="divide-y divide-gray-200">
        {children}
      </tbody>
    );
  },

  tr({ children }) {
    return (
      <tr className="hover:bg-gray-50">
        {children}
      </tr>
    );
  },

  th({ children }) {
    return (
      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">
        {children}
      </th>
    );
  },

  td({ children }) {
    return (
      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">
        {children}
      </td>
    );
  },

  hr() {
    return (
      <hr className="my-8 border-gray-300" />
    );
  },
img({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      className="my-6 rounded-xl shadow-md max-w-full"
    />
  );
},
}}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};
function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-3">
        <div className="flex items-center space-x-2">
          <LuCode size={16} className="text-gray-500" />

          <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            {language || "Code"}
          </span>
        </div>

        <button
          onClick={copyCode}
          className="relative rounded p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 focus:outline-none"
          aria-label="Copy code"
        >
          {copied ? (
            <LuCheck size={16} className="text-green-600" />
          ) : (
            <LuCopy size={16} />
          )}

          {copied && (
            <span className="absolute -top-10 right-0 whitespace-nowrap rounded-md bg-black px-2 py-1 text-xs text-white opacity-90">
              Copied!
            </span>
          )}
        </button>
      </div>

      <SyntaxHighlighter
        language={language}
        style={oneLight}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "#fafafa",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
export default AIResponsePreview;

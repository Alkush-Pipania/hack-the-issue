"use client"

import { Card, CardContent } from "@/components/ui/card"
import StructuredResponse from "./StructuredResponse"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ExternalLink } from 'lucide-react'
import { ResponseType } from '@/lib/store/chat'
import React from 'react'


interface CodeProps {
  inline?: boolean;
  children?: React.ReactNode;
}

type MessageItemProps = {
  role: string
  content: string | ResponseType
  isStructured?: boolean
}

export default function MessageItem({ role, content, isStructured }: MessageItemProps) {


  return (
    <div className={`mb-6 ${role === "user" ? "pr-8 ml-auto max-w-[85%]" : "pl-8 max-w-[85%]"}`}>
      
      <Card
        className={`${
          role === "user"
            ? "bg-gradient-to-br from-[#003152] to-[#00273E] border-[#004366] shadow-md hover:shadow-lg"
            : "bg-[#004366] border border-[#005C80] shadow-sm"
        } backdrop-blur-sm transition-all duration-200 rounded-2xl overflow-hidden`}
      >
        <CardContent className="p-5 relative">
          {isStructured && typeof content !== "string" ? (
            <StructuredResponse content={content} />
          ) : (
            <div className="text-white markdown-content prose prose-white prose-headings:text-white prose-strong:text-white prose-a:no-underline prose-p:leading-relaxed max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Enhanced link rendering with icon and better spacing
                  a: (props) => (
                    <a 
                      {...props} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#FF9800] hover:text-[#FF5722] hover:underline transition-colors duration-200 font-medium break-all"
                    >
                      {props.children}
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                    </a>
                  ),
                  // Improved paragraph spacing and line wrapping
                  p: (props) => (
                    <p {...props} className="leading-7 text-white break-words font-normal" />
                  ),
                  // Adjusted list spacing for better separation
                  ul: (props) => (
                    <ul {...props} className="list-disc ml-6 mb-6 space-y-4" />
                  ),
                  ol: (props) => (
                    <ol {...props} className="list-decimal ml-6 mb-6 space-y-4" />
                  ),
                  // Enhanced list item styling for better readability
                  li: (props) => {
                    const hasNumberPrefix = props.children && 
                      Array.isArray(props.children) &&
                      typeof props.children[0] === 'string' && 
                      /^\d+\.\s/.test(props.children[0]);
                    
                    return (
                      <li 
                        {...props} 
                        className={`py-1 mb-2 ${hasNumberPrefix ? 'pl-1' : ''}`}
                      >
                        {props.children}
                      </li>
                    );
                  },
                  // Improved header spacing and styling
                  h1: (props) => (
                    <h1 {...props} className="text-xl font-bold mb-3 mt-6" />
                  ),
                  h2: (props) => (
                    <h2 {...props} className="text-lg font-bold mb-3 mt-5" />
                  ),
                  h3: (props) => (
                    <h3 {...props} className="text-md font-bold mb-2 mt-4" />
                  ),
                  // Improved code block styling
                  code: (props) => {
                    const {inline, children, ...rest} = props as CodeProps & {children: React.ReactNode};
                    return inline 
                      ? <code {...rest} className="bg-[#003152] px-1.5 py-0.5 rounded text-sm text-white font-mono">{children}</code>
                      : <code {...rest} className="block bg-[#003152] p-3 rounded-md text-sm my-4 overflow-x-auto text-white font-mono border border-[#004366]">{children}</code>
                  },
                  // Custom strong element for better title highlighting
                  strong: (props) => (
                    <strong {...props} className="font-bold text-white block mb-1">
                      {props.children}
                    </strong>
                  ),
                }}
              >
                {/* Process content to properly format numbered lists with links */}
                {typeof content === 'string' 
                  ? content
                      // Make sure numbers followed by dots have a space after them
                      .replace(/(\d+\.)\s*(\S)/g, '$1 $2')
                      // Add an extra line break before URLs to ensure they display on their own line
                      .replace(/(https?:\/\/\S+)/g, '\n$1\n')
                  : JSON.stringify(content)  // Convert non-string content to string
                }
              </ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
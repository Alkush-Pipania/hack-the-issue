"use client"

import { ExternalLink } from "lucide-react"
import { type ResponseType } from "@/lib/store/chat"

export default function StructuredResponse({ content }: { content: ResponseType }) {
  return (
    <div className="text-white space-y-4 sm:space-y-6 max-w-full">
      {/* Intro paragraph with subtle highlight */}
      <div className="bg-[#003152]/80 p-3 sm:p-4 rounded-lg border border-[#004366]">
        <p className="text-sm sm:text-base text-white leading-relaxed">{content.intro}</p>
      </div>

      {/* Content sections */}
      {content.contentSections.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {content.contentSections.map((section, index) => (
            <div 
              key={index} 
              className="bg-[#004366]/70 p-3 sm:p-4 rounded-lg space-y-2 sm:space-y-3 border border-[#005C80]"
            >
              <h3 className="text-base sm:text-lg font-medium text-white flex items-start sm:items-center gap-2">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#FF9800]/20 text-xs sm:text-sm text-[#FF9800]">
                  {index + 1}
                </span>
                <span className="flex-1">{section.title}</span>
              </h3>

              <p className="text-sm sm:text-base text-white/80 leading-relaxed pl-7 sm:pl-8">
                {section.content}
              </p>

              {section.links.length > 0 && (
                <div className="pl-7 sm:pl-8 space-y-1.5 sm:space-y-2 mt-2">
                  {section.links.map((link, linkIndex) => (
                    <a
                      key={linkIndex}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 sm:gap-2 text-[#FF9800] hover:text-[#FF5722] transition-colors group text-sm sm:text-base"
                    >
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70 group-hover:opacity-100 flex-shrink-0" />
                      <span className="underline underline-offset-2 break-all">
                        {link.title}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Outro with different styling */}
      <div className="bg-[#003152]/80 p-3 sm:p-4 rounded-lg border border-[#004366]">
        <p className="text-sm sm:text-base text-white leading-relaxed">{content.outro}</p>
      </div>
    </div>
  )
} 
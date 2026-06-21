import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function ChatBubble({ msg }) {
  return (
    <div className={`flex gap-3 max-w-[85%] animate-fade-in-up ${msg.type === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
      {msg.type === 'user' ? (
        <div className="w-8 h-8 rounded-full bg-mud flex items-center justify-center shrink-0 border-2 border-forest shadow-sm mt-auto">
          <iconify-icon icon="ph:user-fill" class="text-cream text-sm"></iconify-icon>
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-cream flex items-center justify-center shrink-0 border-2 border-forest shadow-sm mt-auto">
          <iconify-icon icon="ph:plant-fill" class="text-leaf text-sm"></iconify-icon>
        </div>
      )}
      <div className={`${msg.type === 'user' ? 'bg-forest text-cream border-2 border-forest dark:bg-[#2F6F50] dark:text-[#EDE8DA] dark:border-transparent rounded-[1.5rem_1.5rem_0_1.5rem]' : 'bg-white border-2 border-forest text-forest dark:bg-[#23261F] dark:text-[#EDE8DA] dark:border-white/10 rounded-[1.5rem_1.5rem_1.5rem_0]'} p-4 shadow-brutal-sm dark:shadow-none`}>
        <div className="font-medium text-sm leading-relaxed whitespace-pre-line [&>p]:mb-2 last:[&>p]:mb-0 [&>strong]:font-black [&>ul]:list-disc [&>ul]:ml-4">
          {msg.type === 'agent' ? (
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          ) : (
            <>
              {msg.text}
              {msg.image && (
                <img src={msg.image} alt={msg.altText || "User uploaded attachment"} className="w-full max-w-[240px] max-h-[200px] object-cover object-left-top mt-3 rounded-xl border-2 border-forest shadow-sm" />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

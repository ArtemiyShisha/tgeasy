'use client';

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Bold, Italic, Strikethrough, Code, FileCode, Quote, Link as LinkIcon, EyeOff, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
// emoji-mart imports (client side only)
// eslint-disable-next-line
// @ts-ignore – no types for emoji-mart/data
import emojiData from '@emoji-mart/data';

// eslint-disable-next-line
// @ts-ignore – no types for emoji-mart/react
const EmojiPicker = dynamic(() => import('@emoji-mart/react'), { ssr: false });

interface PostEditorProps {
  content: string;
  onChange: (content: string) => void;
  error?: string;
}

export function PostEditor({ 
  content, 
  onChange, 
  error 
}: PostEditorProps) {
  const [characterCount, setCharacterCount] = useState(content.length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyWrap = (before: string, after?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);
    const newText = value.slice(0, start) + before + selected + (after ?? before) + value.slice(end);
    onChange(newText);
    // move caret
    const cursor = start + before.length + selected.length + (after ?? before).length;
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = cursor;
    }, 0);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setCharacterCount(newContent.length);
    onChange(newContent);
  };

  return (
    <div className="space-y-4">
      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 mb-1">
        <Button variant="ghost" size="icon" onClick={() => applyWrap('**')} title="Bold (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => applyWrap('_')} title="Italic (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => applyWrap('~~')} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => applyWrap('`')} title="Inline code">
          <Code className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => applyWrap('```\n', '\n```')} title="Code block">
          <FileCode className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => {
          const url = prompt('Введите URL');
          if (!url) return;
          const sel = textareaRef.current?.value.substring(textareaRef.current.selectionStart, textareaRef.current.selectionEnd) || 'ссылка';
          const markup = `[${sel}](${url})`;
          applyWrap('', '');
          onChange(textareaRef.current!.value.replace(sel, markup));
        }} title="Link">
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => {
          const textarea = textareaRef.current;
          if (!textarea) return;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const value = textarea.value;
          const selected = value.slice(start, end) || 'quote';
          const lines = selected.split('\n').map(l => l ? `> ${l}` : l).join('\n');
          onChange(value.slice(0, start) + lines + value.slice(end));
        }} title="Quote">
          <Quote className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => applyWrap('||', '||')} title="Spoiler">
          <EyeOff className="w-4 h-4" />
        </Button>

        {/* Emoji picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" title="Emoji">
              <Smile className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent sideOffset={8} className="p-0 border-none bg-transparent shadow-none">
            {/* @ts-ignore next-line */}
            <EmojiPicker data={emojiData} theme="light" locale="ru" onEmojiSelect={(emoji: any) => {
              const native = (emoji as any).native || (emoji as any).unified ? String.fromCodePoint(...(emoji as any).unified.split('-').map((u: string) => parseInt(u, 16))) : '';
              if (!native) return;
              const textarea = textareaRef.current;
              if (!textarea) return;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              const value = textarea.value;
              const newText = value.slice(0, start) + native + value.slice(end);
              onChange(newText);
              // move caret after inserted emoji
              setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + native.length;
                textarea.focus();
              }, 0);
            }} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="creative_text">Текст размещения *</Label>
        <textarea
          id="creative_text"
          rows={8}
          placeholder="Введите текст рекламного размещения..."
          value={content}
          onChange={handleContentChange}
          ref={textareaRef}
          className={`
            w-full px-3 py-2 border rounded-md resize-none
            bg-white dark:bg-zinc-900
            border-zinc-200 dark:border-zinc-800
            text-zinc-900 dark:text-white
            placeholder-zinc-400 dark:placeholder-zinc-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${error ? 'border-red-500' : ''}
          `}
        />
        <div className="flex justify-between text-sm text-zinc-500">
          <span>
            {error && (
              <span className="text-red-600">{error}</span>
            )}
          </span>
          <span className={characterCount > 4096 ? 'text-red-600' : ''}>
            {characterCount}/4096
          </span>
        </div>
      </div>
    </div>
  );
} 
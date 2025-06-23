// eslint-disable-next-line
// @ts-ignore – twemoji has no types bundled
import twemoji from 'twemoji';

export function telegramMarkdownToHtml(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // code block ```
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // inline code `code`
  html = html.replace(/`([^`]+?)`/g, '<code>$1</code>');
  // bold **text**
  html = html.replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>');
  // italic _text_
  html = html.replace(/_([^_]+?)_/g, '<i>$1</i>');
  // strikethrough ~~text~~
  html = html.replace(/~~([^~]+?)~~/g, '<s>$1</s>');
  // links [text](url)
  html = html.replace(/\[([^\]]+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" class="text-blue-500 underline" target="_blank" rel="noopener noreferrer">$1</a>');
  // spoiler ||text||
  html = html.replace(/\|\|([^|]+?)\|\|/g, '<span class="spoiler">$1</span>');
  // quote lines starting with > or >>>
  html = html.replace(/(^|<br\/>)(?:&gt;\s?)([^<]*)/g, '$1<blockquote>$2</blockquote>');

  // preserve line breaks
  html = html.replace(/\n/g, '<br/>');

  // parse emojis to Twemoji images for consistent rendering
  html = twemoji.parse(html, {
    className: 'inline-block emoji h-5 align-[-0.1em]'
  });
  return html;
} 
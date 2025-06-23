import { LucideProps } from 'lucide-react';

export function RubleIcon(props: LucideProps) {
  return (
    <svg
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 4h7a4 4 0 0 1 0 8H6" />
      <path d="M6 12h7" />
      <path d="M6 16h7" />
      <path d="M6 2v20" />
    </svg>
  );
} 
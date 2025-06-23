"use client";

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  placeholder?: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  placeholder = 'Выберите...',
  value,
  onValueChange,
  disabled,
  className
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  }, [options, search]);

  const selectedLabel = options.find(o => o.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-left ring-offset-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          <span className={cn(!value && 'text-zinc-500')}>{selectedLabel || placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-w-80">
        <div className="p-2 border-b border-zinc-100 dark:border-zinc-800">
          <Input
            autoFocus
            placeholder="Поиск..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-72 overflow-y-auto px-1 py-2 space-y-1">
          {filtered.length ? (
            filtered.map(option => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'flex w-full items-start justify-start rounded-sm px-2 py-1.5 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800',
                  option.value === value && 'bg-zinc-100 dark:bg-zinc-800'
                )}
                onClick={() => {
                  onValueChange(option.value);
                  setOpen(false);
                  setSearch('');
                }}
              >
                <span className="mr-2 flex h-3.5 w-3.5 items-center justify-center">
                  {option.value === value && <Check className="h-4 w-4" />}
                </span>
                {option.label}
              </button>
            ))
          ) : (
            <p className="px-2 py-4 text-sm text-zinc-500">Ничего не найдено</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 
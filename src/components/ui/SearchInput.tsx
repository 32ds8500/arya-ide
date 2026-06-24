"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  debounceMs?: number;
  showShortcut?: boolean;
  shortcut?: string[];
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      onSearch,
      debounceMs = 300,
      showShortcut = false,
      shortcut = ["⌘", "K"],
      ...props
    },
    ref
  ) => {
    const [value, setValue] = React.useState(props.defaultValue ?? "");
    const [isFocused, setIsFocused] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          onSearch?.(newValue);
        }, debounceMs);
      },
      [onSearch, debounceMs]
    );

    const handleClear = React.useCallback(() => {
      setValue("");
      onSearch?.("");
    }, [onSearch]);

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    return (
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-20 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {value && (
            <button
              onClick={handleClear}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {showShortcut && !isFocused && (
            <div className="flex items-center gap-0.5">
              {shortcut.map((key, i) => (
                <kbd
                  key={i}
                  className="inline-flex h-5 items-center justify-center rounded border border-border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground"
                >
                  {key}
                </kbd>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput };

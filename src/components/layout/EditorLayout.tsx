"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/Separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip";

interface EditorLayoutProps {
  children: React.ReactNode;
  fileTree?: React.ReactNode;
  terminal?: React.ReactNode;
  className?: string;
}

export function EditorLayout({
  children,
  fileTree,
  terminal,
  className,
}: EditorLayoutProps) {
  const [fileTreeWidth, setFileTreeWidth] = React.useState(260);
  const [terminalHeight, setTerminalHeight] = React.useState(200);
  const [showFileTree, setShowFileTree] = React.useState(true);
  const [showTerminal, setShowTerminal] = React.useState(true);
  const isDraggingFileTree = React.useRef(false);
  const isDraggingTerminal = React.useRef(false);

  const handleFileTreeMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingFileTree.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingFileTree.current) {
        setFileTreeWidth(Math.max(180, Math.min(400, e.clientX)));
      }
    };

    const handleMouseUp = () => {
      isDraggingFileTree.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  const handleTerminalMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingTerminal.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingTerminal.current) {
        const windowHeight = window.innerHeight;
        setTerminalHeight(Math.max(100, Math.min(400, windowHeight - e.clientY)));
      }
    };

    const handleMouseUp = () => {
      isDraggingTerminal.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn("flex h-screen overflow-hidden bg-editor-bg", className)}>
        <div className="flex h-full">
          {showFileTree && (
            <div
              className="flex h-full flex-col border-r border-sidebar-border bg-sidebar-bg"
              style={{ width: fileTreeWidth }}
            >
              <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Dosyalar
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowFileTree(false)}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              <ScrollArea className="flex-1">
                {fileTree ?? (
                  <div className="p-4 text-sm text-muted-foreground">
                    Dosya ağacı burada görüntülenecek
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {!showFileTree && (
            <div className="flex h-full w-10 flex-col items-center border-r border-sidebar-border bg-sidebar-bg py-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowFileTree(true)}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                    </svg>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Dosya ağacını göster</TooltipContent>
              </Tooltip>
            </div>
          )}

          <div
            className={cn(
              "w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary/70 transition-colors",
              showFileTree && "border-r border-border"
            )}
            onMouseDown={handleFileTreeMouseDown}
          />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {children}
          </div>

          {showTerminal && (
            <>
              <div
                className="h-1 cursor-row-resize hover:bg-primary/50 active:bg-primary/70 transition-colors"
                onMouseDown={handleTerminalMouseDown}
              />
              <div
                className="border-t border-border bg-editor-bg"
                style={{ height: terminalHeight }}
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span className="text-xs font-medium text-muted-foreground">Terminal</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowTerminal(false)}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[calc(100%-32px)]">
                  {terminal ?? (
                    <div className="p-4 font-mono text-sm text-muted-foreground">
                      <div>$ _</div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </>
          )}

          {!showTerminal && (
            <div className="flex items-center justify-center border-t border-border bg-sidebar-bg py-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground"
                    onClick={() => setShowTerminal(true)}
                  >
                    <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                    Terminal
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Terminali göster</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

'use client';

import * as React from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
}

const ResizablePanelGroup = React.forwardRef<HTMLDivElement, ResizablePanelGroupProps>(
  ({ className, direction = 'horizontal', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full w-full',
        direction === 'vertical' && 'flex-col',
        className
      )}
      data-panel-group-direction={direction}
      {...props}
    >
      {children}
    </div>
  )
);
ResizablePanelGroup.displayName = 'ResizablePanelGroup';

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultSize?: number;
  minSize?: number;
}

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('overflow-auto', className)} {...props}>
      {children}
    </div>
  )
);
ResizablePanel.displayName = 'ResizablePanel';

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean;
}

const ResizableHandle = React.forwardRef<HTMLDivElement, ResizableHandleProps>(
  ({ className, withHandle, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative flex w-px items-center justify-center bg-border',
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  )
);
ResizableHandle.displayName = 'ResizableHandle';

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };

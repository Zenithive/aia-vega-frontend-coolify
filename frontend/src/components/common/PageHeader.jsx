'use client';

import PageContainer from '@/components/layout/PageContainer';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { cn } from '@/lib/utils';

export default function PageHeader({
  title,
  version,
  breadcrumbs = [],
  showBreadcrumbSeparator = false,
  left,
  right,
  titleRight,
  className,
  containerClassName,
  children,
}) {
  // Format version to avoid "vV0" duplicate prefixes
  const formattedVersion = version
    ? String(version).trim().replace(/^v+/i, '')
    : null;

  return (
    <div className={cn('bg-card', className)}>
      <PageContainer className={cn('pt-xl pb-md px-xl', containerClassName)}>
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4 min-w-0">
            {left ? <div className="shrink-0">{left}</div> : null}
            <Breadcrumbs items={breadcrumbs} showTrailingSeparator={showBreadcrumbSeparator} />
          </div>
          {right ? right : null}
        </div>

        {(title || titleRight) ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {title ? (
              <div className="flex items-center gap-2.5">
                <h1 className="text-h1 text-gray-dark">{title}</h1>
                {formattedVersion ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-md font-semibold bg-primary/10 text-primary border border-primary/20">
                    v{formattedVersion}
                  </span>
                ) : null}
              </div>
            ) : null}
            {titleRight ? <div className="shrink-0">{titleRight}</div> : null}
          </div>
        ) : null}

        {children ? <div className="mt-2">{children}</div> : null}
      </PageContainer>
    </div>
  );
}
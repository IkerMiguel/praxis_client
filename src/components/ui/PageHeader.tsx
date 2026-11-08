import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  badge?: ReactNode;
}

/** Encabezado de vista con migas de pan (KAN-137), título, descripción y acciones. */
export default function PageHeader({ title, description, crumbs = [], actions, badge }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 space-y-2">
        {crumbs.length > 0 && (
          <nav aria-label="Ruta de navegación">
            <ol className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500">
              <li>
                <Link href="/panel" className="inline-flex items-center gap-1 rounded hover:text-slate-900">
                  <Home className="h-3.5 w-3.5" aria-hidden="true" />
                  Inicio
                </Link>
              </li>
              {crumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
                  {crumb.href && index < crumbs.length - 1 ? (
                    <Link href={crumb.href} className="rounded hover:text-slate-900">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-semibold text-sky-800">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h1>
          {badge}
        </div>
        {description && <p className="max-w-3xl text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

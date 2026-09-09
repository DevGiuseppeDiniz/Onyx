import { Rail } from '@/components/shell/rail';
import { Topbar } from '@/components/shell/topbar';
import { getActiveContext } from '@/lib/context';

export default async function AppLayout({ children }: LayoutProps<'/app'>) {
  const context = await getActiveContext();

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      {/* Topbar atravessa a largura toda, inclusive por cima do rail --
          igual a referencia. */}
      <Topbar context={context} />
      <div className="flex-1 flex min-h-0">
        <Rail />
        {children}
      </div>
    </div>
  );
}

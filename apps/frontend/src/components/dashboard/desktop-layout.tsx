import { AppSidebar } from '@/components/dashboard/app-sidebar'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@repo/ui/components/ui/breadcrumb'
import { Separator } from '@repo/ui/components/ui/separator'
import { Outlet, useLocation } from '@tanstack/react-router'

export function DesktopLayout() {
    const location = useLocation()

    // Simple logic to get a readable name from the path
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const currentPage = pathSegments[pathSegments.length - 1]
        ?.replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()) || 'Dashboard'

    return (
        <div className="flex flex-row w-full flex-1 mx-auto border border-neutral-200 overflow-x-hidden h-screen">
            <div className="hidden md:block">
                <AppSidebar />
            </div>
            <div className="flex flex-1 flex-col p-4 pt-0 w-full h-full">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className='text-sm text-primary font-semibold'>{currentPage}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto subtle-scrollbar" style={{ viewTransitionName: 'page-content' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

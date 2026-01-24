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
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@repo/ui/components/ui/sidebar'
import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
    component: RouteComponent,
})

function RouteComponent() {
    const location = useLocation()

    // Simple logic to get a readable name from the path
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const currentPage = pathSegments[pathSegments.length - 1]
        ?.replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase()) || 'Dashboard'

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{currentPage}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <Outlet />
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

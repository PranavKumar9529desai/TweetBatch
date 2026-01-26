import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { AppBottomNavigation } from '@/components/dashboard/app-bottom-navigation'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@repo/ui/components/ui/breadcrumb'
import { Separator } from '@repo/ui/components/ui/separator'
import { createFileRoute, Outlet, useLocation, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
    beforeLoad: ({ context, location }) => {
        if (!context.auth.user) {
            throw redirect({
                href: `/auth/sign-in?redirect=${encodeURIComponent(location.href)}`,
            })
        }
    },
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
        <div className="flex flex-col md:flex-row w-full flex-1 mx-auto border border-neutral-200 overflow-hidden h-screen">
            <div className="hidden md:block">
                <AppSidebar />
            </div>
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0 overflow-y-auto w-full h-full pb-20 md:pb-4">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem className=''>
                                    <BreadcrumbPage className='text-sm text-primary font-semibold'>{currentPage}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="">
                    <Outlet />
                </div>
            </div>
            <AppBottomNavigation />
        </div>
    )
}

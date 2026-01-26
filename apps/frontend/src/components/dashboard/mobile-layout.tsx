import { AppBottomNavigation } from '@/components/dashboard/app-bottom-navigation'
import { AppTopbar } from '@/components/dashboard/app-topbar'
import { Outlet } from '@tanstack/react-router'

export function MobileLayout() {
    return (
        <div className="flex flex-col w-full flex-1 mx-auto h-screen">
            <div className="flex flex-1 flex-col gap-4 pt-0 overflow-y-auto w-full h-full pb-20">
                <AppTopbar />
                <div className="">
                    <Outlet />
                </div>
            </div>
            <AppBottomNavigation />
        </div>
    )
}

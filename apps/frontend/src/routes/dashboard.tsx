
import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { Button } from '@repo/ui/components/ui/button'
import {
    LayoutDashboard,
    Calendar,
    Settings,
    Upload
} from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
    component: DashboardLayout,
})

function DashboardLayout() {
    return (
        <div className="flex h-screen w-full bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-card/50 backdrop-blur-xl hidden md:flex flex-col">
                <div className="p-6 border-b border-border/50">
                    <h1 className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-600">
                        PostFlow
                    </h1>
                </div>

                <div className="flex-1 py-6 px-4 flex flex-col gap-2">
                    <NavButton to="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" />
                    <NavButton to="/dashboard/schedule" icon={<Calendar size={20} />} label="Schedule" />
                    <NavButton to="/dashboard/import" icon={<Upload size={20} />} label="Bulk Import" />

                    <div className="mt-auto">
                        <NavButton to="/dashboard/settings" icon={<Settings size={20} />} label="Settings" />
                    </div>
                </div>
            </aside>

            {/* Mobile Header (visible on small screens) */}
            <div className="md:hidden fixed top-0 w-full z-10 border-b bg-background/80 backdrop-blur-md p-4 flex items-center justify-between">
                <span className="font-bold text-lg">PostFlow</span>
                {/* Add mobile menu trigger here */}
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-8 pt-16 md:pt-8">
                <div className="max-w-6xl mx-auto space-y-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

function NavButton({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            to={to}
            className="w-full"
            activeProps={{ className: "text-primary bg-primary/10 font-medium" }}
            inactiveProps={{ className: "text-muted-foreground hover:bg-muted/50" }}
        >
            {({ isActive }) => (
                <Button variant="ghost" className={`w-full justify-start gap-3 ${isActive ? 'bg-primary/10 text-primary' : ''}`}>
                    {icon}
                    <span>{label}</span>
                </Button>
            )}
        </Link>
    )
}

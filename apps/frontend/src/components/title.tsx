export const Title = ({ title, subtitle }: { title: string; subtitle: string }) => {
    return (
        <div className="flex-1 flex flex-col gap-6 w-full">
            <div className="block">
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    )
}

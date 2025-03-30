import { Link, Outlet } from "react-router-dom";


export default function Layout() {
    return (
        <>
            <div className="flex flex-col min-h-screen w-full px-4">
                <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex h-14 max-w-screen-2xl items-center">
                        <Link to="/" className="mr-6 flex items-center space-x-2">
                            <span className="font-bold">PV GIS</span>
                        </Link>
                        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
                            <Link to="/grid-connected" className="transition-colors hover:text-primary">
                                Netzgekoppelt
                            </Link>
                            <Link to="/tracking-pv" className="transition-colors hover:text-primary">
                                Nachgeführte PV
                            </Link>
                            <Link to="/off-grid-pv" className="transition-colors hover:text-primary">
                                Netzunabhängig
                            </Link>
                            <Link to="/building-visualization" className="transition-colors hover:text-primary">
                                Building Visualization
                            </Link>
                        </nav>
                    </div>
                </header>
                <Outlet />
            </div>
        </>
    )
}
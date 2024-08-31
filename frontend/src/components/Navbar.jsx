import Link from "next/link"
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export default function Navbar() {
    return (
        <header className="flex items-center justify-between h-16 px-4 bg-background border-b md:px-6 fixed top-0 w-full">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold" prefetch={false}>
            <MegaphoneIcon className="w-6 h-6" />
            <span className="sr-only">WhisperSpace</span>
        </Link>
        <nav className="flex items-center gap-4">
            <Link
                href="/login"
                className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
                prefetch={false}
            >
                Login
            </Link>
            <Link
                href="/about"
                className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
                prefetch={false}
            >
                About Us
            </Link>
            <Link
                href="https://github.com/sbhuvan455/whisper-chat"
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                prefetch={false}
            >
                <GithubIcon className="w-5 h-5" />
                <span className="sr-only">
                    GitHub
                </span>
            </Link>
            <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                    <MenuIcon className="w-6 h-6" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="md:hidden">
                <div className="grid gap-4 p-4">
                <Link
                    href="/login"
                    className="flex items-center justify-between text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    prefetch={false}
                >
                    Login
                    <ChevronRightIcon className="w-4 h-4" />
                </Link>
                <Link
                    href="/about"
                    className="flex items-center justify-between text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    prefetch={false}
                >
                    About Us
                    <ChevronRightIcon className="w-4 h-4" />
                </Link>
                <Link
                    href="https://github.com/sbhuvan455/whisper-chat"
                    className="flex items-center justify-between text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    prefetch={false}
                >
                    GitHub
                    <ChevronRightIcon className="w-4 h-4" />
                </Link>
                </div>
            </SheetContent>
            </Sheet>
        </nav>
        </header>
    )
}

function ChevronRightIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
    }


    function GithubIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
    )
    }


    function MegaphoneIcon(props) {
    return (
        <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        >
            <path d="m3 11 18-5v12L3 14v-3z" />
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
    )
    }


    function MenuIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
    )
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, Brain } from "lucide-react";

export default function Navbar() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const toggleTheme = () => {
		setTheme(theme === "dark" ? "light" : "dark");
	};

	return (
		<nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex h-16 items-center justify-between px-4 md:px-6">
				{" "}
				{/* Removed 'container' class */}
				<Link href="/" className="flex items-center gap-2">
					<Brain className="h-6 w-6 text-primary" />
					<span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
						MirrorMind
					</span>
				</Link>
				<div className="flex items-center gap-4">
					<Link
						href="/my-personas"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						My Personas
					</Link>
					<Link
						href="/create-persona"
						className="text-sm font-medium hover:text-primary transition-colors"
					>
						Create Persona
					</Link>
					<button
						onClick={toggleTheme}
						className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
						aria-label="Toggle theme"
					>
						{mounted && theme === "dark" ? (
							<Sun className="h-5 w-5" />
						) : (
							<Moon className="h-5 w-5" />
						)}
					</button>
				</div>
			</div>
		</nav>
	);
}

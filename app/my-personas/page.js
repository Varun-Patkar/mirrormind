"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getPersonas, deletePersona } from "@/lib/local-storage";
import {
	ChevronLeft,
	MessageCircle,
	User,
	Plus,
	PenBox,
	Calendar,
	Search,
	Trash2,
} from "lucide-react";

export default function MyPersonas() {
	const [personas, setPersonas] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Load personas from localStorage
		const loadedPersonas = getPersonas();
		setPersonas(loadedPersonas);
		setIsLoading(false);
	}, []);

	// Filter personas based on search term
	const filteredPersonas = personas.filter((persona) =>
		persona.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	// Format date for display
	const formatDate = (dateString) => {
		const options = { year: "numeric", month: "short", day: "numeric" };
		return new Date(dateString).toLocaleDateString(undefined, options);
	};

	const getPronounColorClass = (pronouns) => {
		if (!pronouns) return "bg-muted text-muted-foreground"; // Default
		switch (pronouns.toLowerCase()) {
			case "he/him":
				return "bg-blue-500/10 text-blue-500";
			case "she/her":
				return "bg-pink-500/10 text-pink-500";
			default: // For "they/them", "ze/hir", "other", etc. - use a gradient for the container
				return "bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 text-purple-600";
		}
	};

	const handleDeletePersona = (personaId) => {
		const confirmDelete = window.confirm(
			"Are you sure you want to delete this persona? This will also delete all associated chat history. This action cannot be undone."
		);
		if (confirmDelete) {
			deletePersona(personaId);
			setPersonas((prevPersonas) =>
				prevPersonas.filter((p) => p.id !== personaId)
			);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-8xl">
			<Link
				href="/"
				className="inline-flex items-center text-primary hover:underline mb-6"
			>
				<ChevronLeft className="h-4 w-4 mr-1" />
				Back to Home
			</Link>

			<div className="bg-card rounded-xl shadow-lg p-6 md:p-8">
				<h1 className="text-3xl font-bold mb-6">My Personas</h1>

				{/* Search and create new */}
				<div className="flex flex-col md:flex-row gap-4 mb-8">
					<div className="relative flex-grow">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<input
							type="text"
							placeholder="Search personas..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
						/>
					</div>

					<Link
						href="/create-persona"
						className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
					>
						<Plus className="h-4 w-4 mr-2" />
						Create New
					</Link>
				</div>

				{/* Personas list */}
				{isLoading ? (
					<div className="py-12 text-center">
						<div className="animate-pulse inline-block h-8 w-32 bg-muted rounded"></div>
					</div>
				) : personas.length === 0 ? (
					<div className="bg-muted/50 rounded-lg p-8 text-center">
						<User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
						<h3 className="text-xl font-medium mb-2">No personas yet</h3>
						<p className="text-muted-foreground mb-6">
							Create your first persona to start chatting
						</p>
						<Link
							href="/create-persona"
							className="inline-flex items-center px-5 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
						>
							<Plus className="h-4 w-4 mr-2" />
							Create a Persona
						</Link>
					</div>
				) : filteredPersonas.length === 0 ? (
					<div className="bg-muted/50 rounded-lg p-8 text-center">
						<Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
						<h3 className="text-xl font-medium mb-2">No results found</h3>
						<p className="text-muted-foreground">Try a different search term</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{filteredPersonas.map((persona) => (
							<div
								key={persona.id}
								className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow"
							>
								<div className="flex items-center mb-4">
									<div
										className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getPronounColorClass(
											persona.multipleChoice?.pronouns
										)}`}
									>
										<User
											className={`h-5 w-5 ${
												persona.multipleChoice?.pronouns &&
												persona.multipleChoice.pronouns.toLowerCase() !==
													"he/him" &&
												persona.multipleChoice.pronouns.toLowerCase() !==
													"she/her"
													? "text-transparent bg-clip-text bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500"
													: ""
											}`}
										/>
									</div>
									<div>
										<h3 className="font-semibold text-lg">{persona.name}</h3>
										<div className="flex items-center text-xs text-muted-foreground">
											<Calendar className="h-3 w-3 mr-1" />
											<span>Created {formatDate(persona.createdAt)}</span>
										</div>
									</div>
								</div>

								<div className="mb-4">
									<div className="text-sm text-muted-foreground mb-1">
										Personality:
									</div>
									<p className="text-sm line-clamp-2">
										{persona.openEnded.personalityDescription ||
											"No description provided"}
									</p>
								</div>

								<div className="flex flex-wrap gap-2 mb-4">
									{persona.multipleChoice.tone && (
										<span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
											{persona.multipleChoice.tone}
										</span>
									)}
									{persona.multipleChoice.personalityVibe && (
										<span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
											{persona.multipleChoice.personalityVibe}
										</span>
									)}
								</div>

								<div className="flex justify-between mt-4">
									<Link
										href={`/chat/${persona.id}`}
										className="flex items-center px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary/90 transition-colors"
									>
										<MessageCircle className="h-4 w-4 mr-1.5" />
										Chat
									</Link>

									<div className="flex gap-2">
										<Link
											href={`/edit-persona/${persona.id}`}
											className="flex items-center px-3 py-1.5 bg-muted text-sm rounded-md hover:bg-muted/80 transition-colors"
										>
											<PenBox className="h-4 w-4 mr-1.5" />
											Edit
										</Link>
										<button
											onClick={() => handleDeletePersona(persona.id)}
											className="flex items-center px-3 py-1.5 bg-destructive text-destructive-foreground text-sm rounded-md hover:bg-destructive/90 transition-colors"
										>
											<Trash2 className="h-4 w-4 mr-1.5" />
											Delete
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

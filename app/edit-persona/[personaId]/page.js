"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getPersonaById, updatePersona } from "@/lib/local-storage";
// Import questions from the constants file
import {
	multipleChoiceQuestions,
	openEndedQuestions,
} from "@/lib/questionnaire-data";
import { ChevronLeft, Save } from "lucide-react";

export default function EditPersonaPage() {
	const router = useRouter();
	const { personaId } = useParams();
	const [formData, setFormData] = useState({
		multipleChoice: {},
		openEnded: {},
	});
	const [initialPersonaName, setInitialPersonaName] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState({});

	useEffect(() => {
		if (personaId) {
			const persona = getPersonaById(personaId);
			if (persona) {
				setFormData({
					multipleChoice: persona.multipleChoice || {},
					openEnded: persona.openEnded || {},
				});
				setInitialPersonaName(persona.name || "");
			} else {
				// Persona not found, redirect or show error
				router.push("/my-personas");
			}
			setIsLoading(false);
		}
	}, [personaId, router]);

	const handleMultipleChoiceChange = (questionId, value) => {
		setFormData((prev) => ({
			...prev,
			multipleChoice: { ...prev.multipleChoice, [questionId]: value },
		}));
	};

	const handleTextChange = (questionId, value) => {
		setFormData((prev) => ({
			...prev,
			openEnded: { ...prev.openEnded, [questionId]: value },
		}));
		if (questionId === "name") {
			setErrors((prev) => ({ ...prev, name: "" })); // Clear name error on change
		}
		if (questionId === "customRelationshipDetail") {
			setErrors((prev) => ({ ...prev, customRelationshipDetail: "" }));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		let currentErrors = {};

		if (!formData.openEnded.name || formData.openEnded.name.trim() === "") {
			currentErrors.name = "Persona name is required.";
		}

		if (
			formData.multipleChoice?.relationship === "custom" &&
			(!formData.openEnded.customRelationshipDetail ||
				formData.openEnded.customRelationshipDetail.trim() === "")
		) {
			currentErrors.customRelationshipDetail =
				"Please specify the custom relationship.";
		}

		if (Object.keys(currentErrors).length > 0) {
			setErrors(currentErrors);
			return;
		}

		setErrors({});
		setIsSubmitting(true);
		const result = updatePersona(personaId, formData);

		if (result && !result.error) {
			router.push(`/chat/${personaId}`); // Or /my-personas
		} else if (result && result.error === "DUPLICATE_NAME") {
			// This block handles the duplicate name error
			setErrors({ name: result.message });
		} else if (result && result.error) {
			setErrors({ general: result.message || "Failed to update persona." });
		} else {
			setErrors({ general: "An unexpected error occurred." });
		}
		setIsSubmitting(false);
	};

	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8 text-center">
				Loading persona details...
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 max-w-3xl">
			<Link
				href={`/chat/${personaId}`}
				className="inline-flex items-center text-primary hover:underline mb-6"
			>
				<ChevronLeft className="h-4 w-4 mr-1" />
				Back to Chat
			</Link>

			<div className="bg-card rounded-xl shadow-lg p-6 md:p-8">
				<h1 className="text-3xl font-bold mb-8 text-center">
					Edit Persona: {initialPersonaName}
				</h1>

				{errors.general && (
					<div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
						{errors.general}
					</div>
				)}

				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Open-ended questions - Name first */}
					{openEndedQuestions
						.filter((q) => q.id === "name")
						.map((q) => (
							<div
								key={q.id}
								className="bg-muted/30 rounded-lg p-6 border border-border"
							>
								<label
									htmlFor={q.id}
									className="block text-lg font-medium mb-1"
								>
									{q.question}
									{q.required && (
										<span className="text-destructive ml-1">*</span>
									)}
								</label>
								{q.description && ( // Added to display description if available
									<p className="text-muted-foreground text-sm mb-3">
										{q.description}
									</p>
								)}
								<input
									type="text"
									id={q.id}
									value={formData.openEnded[q.id] || ""}
									onChange={(e) => handleTextChange(q.id, e.target.value)}
									placeholder={q.placeholder}
									className={`w-full p-3 rounded-md border bg-card focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all ${
										errors.name ? "border-destructive" : "border-input"
									}`}
									required={q.required}
									maxLength={q.maxLength} // Add maxLength attribute
								/>
								{q.maxLength && (
									<div className="text-xs text-muted-foreground text-right mt-1">
										{formData.openEnded[q.id]?.length || 0} / {q.maxLength}
									</div>
								)}
								{errors.name && (
									<p className="text-destructive text-sm mt-1">{errors.name}</p>
								)}
							</div>
						))}

					{/* Multiple choice questions */}
					<h2 className="text-2xl font-semibold pt-4 border-t border-border">
						Profile Choices
					</h2>
					{multipleChoiceQuestions.map((q) => (
						<div
							key={q.id}
							className="bg-muted/30 rounded-lg p-6 border border-border"
						>
							<h3 className="text-lg font-medium mb-1">{q.question}</h3>
							{q.description && ( // Added to display description if available
								<p className="text-muted-foreground text-sm mb-3">
									{q.description}
								</p>
							)}
							<div className="space-y-2">
								{q.options.map((option) => (
									<label
										key={option.value}
										className={`flex items-center p-3 rounded-md cursor-pointer hover:bg-muted transition-colors ${
											formData.multipleChoice[q.id] === option.value
												? "bg-primary/10 border border-primary/20"
												: "border border-transparent"
										}`}
									>
										<input
											type="radio"
											name={q.id}
											value={option.value}
											checked={formData.multipleChoice[q.id] === option.value}
											onChange={() =>
												handleMultipleChoiceChange(q.id, option.value)
											}
											className="sr-only"
										/>
										<div
											className={`w-4 h-4 rounded-full border-2 ${
												formData.multipleChoice[q.id] === option.value
													? "border-primary bg-primary"
													: "border-muted-foreground"
											} flex items-center justify-center mr-3`}
										>
											{formData.multipleChoice[q.id] === option.value && (
												<div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
											)}
										</div>
										<span className="text-sm">{option.label}</span>
									</label>
								))}
							</div>
						</div>
					))}

					{/* Other Open-ended questions */}
					<h2 className="text-2xl font-semibold pt-4 border-t border-border">
						Additional Details
					</h2>
					{openEndedQuestions
						.filter((q) => q.id !== "name")
						.map((q) => {
							// Conditional rendering for customRelationshipDetail
							if (
								q.id === "customRelationshipDetail" &&
								formData.multipleChoice?.relationship !== "custom"
							) {
								return null; // Don't render if relationship is not custom
							}
							return (
								<div
									key={q.id}
									className="bg-muted/30 rounded-lg p-6 border border-border"
								>
									<label
										htmlFor={q.id}
										className="block text-lg font-medium mb-1"
									>
										{q.question}
										{q.id === "customRelationshipDetail" &&
											formData.multipleChoice?.relationship === "custom" && (
												<span className="text-destructive ml-1">*</span>
											)}
									</label>
									{q.description && ( // Added to display description if available
										<p className="text-muted-foreground text-sm mb-3">
											{q.description}
										</p>
									)}
									<textarea
										id={q.id}
										value={formData.openEnded[q.id] || ""}
										onChange={(e) => handleTextChange(q.id, e.target.value)}
										placeholder={q.placeholder}
										className={`w-full p-3 rounded-md border bg-card focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all min-h-[100px] ${
											errors[q.id] ? "border-destructive" : "border-input"
										}`}
										rows={3}
										maxLength={q.maxLength} // Add maxLength attribute
									/>
									{q.maxLength && (
										<div className="text-xs text-muted-foreground text-right mt-1">
											{formData.openEnded[q.id]?.length || 0} / {q.maxLength}
										</div>
									)}
									{errors[q.id] && (
										<p className="text-destructive text-sm mt-1">
											{errors[q.id]}
										</p>
									)}
								</div>
							);
						})}

					<div className="flex justify-end mt-10">
						<button
							type="submit"
							disabled={isSubmitting}
							className="flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-70"
						>
							{isSubmitting ? (
								"Saving..."
							) : (
								<>
									<Save className="h-4 w-4 mr-2" /> Save Changes
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

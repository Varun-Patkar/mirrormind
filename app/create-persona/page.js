"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { savePersona } from "@/lib/local-storage";
import { allQuestions } from "@/lib/questionnaire-data"; // Import questions
import { ChevronLeft, ChevronRight, Save, CheckCircle2 } from "lucide-react";
import ModelViewer from "@/components/ModelViewer"; // Import the ModelViewer

export default function CreatePersona() {
	const router = useRouter();
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [formData, setFormData] = useState({
		multipleChoice: {},
		openEnded: {},
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState({});

	const currentQuestion = allQuestions[currentQuestionIndex];
	const isCustomRelationshipDetailQuestion =
		currentQuestion.id === "customRelationshipDetail";
	const showCustomRelationshipDetail =
		formData.multipleChoice?.relationship === "custom";

	const handleMultipleChoiceChange = (questionId, value) => {
		setFormData((prev) => ({
			...prev,
			multipleChoice: { ...prev.multipleChoice, [questionId]: value },
		}));
		setErrors((prev) => ({ ...prev, [questionId]: "" })); // Clear error for this question
	};

	const handleTextChange = (questionId, value) => {
		setFormData((prev) => ({
			...prev,
			openEnded: { ...prev.openEnded, [questionId]: value },
		}));
		setErrors((prev) => ({ ...prev, [questionId]: "" })); // Clear error for this question
	};

	const validateCurrentQuestion = () => {
		if (currentQuestion.required) {
			const value =
				currentQuestion.type === "multipleChoice"
					? formData.multipleChoice[currentQuestion.id]
					: formData.openEnded[currentQuestion.id];
			if (!value || (typeof value === "string" && value.trim() === "")) {
				setErrors((prev) => ({
					...prev,
					[currentQuestion.id]: "This field is required.",
				}));
				return false;
			}
		}
		// Conditional validation for customRelationshipDetail
		if (isCustomRelationshipDetailQuestion && showCustomRelationshipDetail) {
			const value = formData.openEnded[currentQuestion.id];
			if (!value || value.trim() === "") {
				setErrors((prev) => ({
					...prev,
					[currentQuestion.id]: "Please specify the custom relationship.",
				}));
				return false;
			}
		}
		return true;
	};

	const prevQuestion = () => {
		let prevIndex = currentQuestionIndex - 1;
		// Skip customRelationshipDetail if relationship is not custom when going back
		if (
			allQuestions[prevIndex]?.id === "customRelationshipDetail" &&
			formData.multipleChoice?.relationship !== "custom"
		) {
			prevIndex--;
		}
		setCurrentQuestionIndex(Math.max(0, prevIndex));
		window.scrollTo(0, 0);
	};

	const nextQuestion = () => {
		if (!validateCurrentQuestion()) return;

		let nextIndex = currentQuestionIndex + 1;
		// Skip customRelationshipDetail if relationship is not custom when going forward
		if (
			allQuestions[nextIndex]?.id === "customRelationshipDetail" &&
			formData.multipleChoice?.relationship !== "custom"
		) {
			nextIndex++;
		}

		if (nextIndex < allQuestions.length) {
			setCurrentQuestionIndex(nextIndex);
			window.scrollTo(0, 0);
		} else {
			handleSubmit();
		}
	};

	const handleSubmit = async (e) => {
		if (e) e.preventDefault(); // Prevent default if called by form submission event

		// Final validation, especially for name if it wasn't the last question
		if (!formData.openEnded.name || formData.openEnded.name.trim() === "") {
			setErrors({ name: "Please enter a name for your persona." });
			// If name is not the current question, find its index and go there
			const nameQuestionIndex = allQuestions.findIndex((q) => q.id === "name");
			if (
				nameQuestionIndex !== -1 &&
				currentQuestionIndex !== nameQuestionIndex
			) {
				setCurrentQuestionIndex(nameQuestionIndex);
			}
			return;
		}
		// Validate custom relationship if selected
		if (
			formData.multipleChoice?.relationship === "custom" &&
			(!formData.openEnded.customRelationshipDetail ||
				formData.openEnded.customRelationshipDetail.trim() === "")
		) {
			setErrors((prev) => ({
				...prev,
				customRelationshipDetail: "Please specify the custom relationship.",
			}));
			const customRelQIndex = allQuestions.findIndex(
				(q) => q.id === "customRelationshipDetail"
			);
			if (customRelQIndex !== -1 && currentQuestionIndex !== customRelQIndex) {
				setCurrentQuestionIndex(customRelQIndex);
			}
			return;
		}
		setErrors({});
		setIsSubmitting(true);

		const result = savePersona(formData);

		if (result && !result.error) {
			router.push(`/chat/${result.id}`);
		} else if (result && result.error === "DUPLICATE_NAME") {
			// This block handles the duplicate name error
			setErrors({ name: result.message });
			const nameQuestionIndex = allQuestions.findIndex((q) => q.id === "name");
			if (nameQuestionIndex !== -1) setCurrentQuestionIndex(nameQuestionIndex);
		} else if (result && result.error) {
			setErrors({ general: result.message || "Failed to create persona." });
		} else {
			setErrors({ general: "An unexpected error occurred." });
		}
		setIsSubmitting(false);
	};

	const progressPercentage =
		((currentQuestionIndex + 1) / allQuestions.length) * 100;

	return (
		<div className="container mx-auto px-4 py-8 max-w-4xl">
			<Link
				href="/"
				className="inline-flex items-center text-primary hover:underline mb-6"
			>
				<ChevronLeft className="h-4 w-4 mr-1" />
				Back to Home
			</Link>

			<div className="bg-card rounded-xl shadow-lg p-6 md:p-8">
				<h1 className="text-3xl font-bold mb-2 text-center">
					Create a New Persona
				</h1>
				<p className="text-muted-foreground text-center mb-6">
					Answer a few questions to bring your persona to life.
				</p>

				{/* 3D Model Viewer and Progress Text */}
				<div className="mb-8">
					<ModelViewer progressPercentage={progressPercentage} stretchX={1.3} />{" "}
					{/* Pass progressPercentage here */}
					<div className="flex justify-between text-sm text-muted-foreground mb-1">
						<span>
							Question {currentQuestionIndex + 1} of {allQuestions.length}
						</span>
						<span>{Math.round(progressPercentage)}%</span>
					</div>
					{/* The visual progress bar div is removed, ModelViewer takes its place visually */}
				</div>

				{errors.general && (
					<div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
						{errors.general}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<div className="bg-muted/30 rounded-lg p-6 md:p-8 border border-border min-h-[250px] flex flex-col justify-center">
						<h2 className="text-xl font-semibold mb-1">
							{currentQuestion.question}
							{(currentQuestion.required ||
								(isCustomRelationshipDetailQuestion &&
									showCustomRelationshipDetail)) && (
								<span className="text-destructive ml-1">*</span>
							)}
						</h2>
						{currentQuestion.description && (
							<p className="text-muted-foreground text-sm mb-4">
								{currentQuestion.description}
							</p>
						)}

						{currentQuestion.type === "multipleChoice" && (
							<div className="space-y-3">
								{currentQuestion.options.map((option) => (
									<label
										key={option.value}
										className={`flex items-center p-3.5 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
											formData.multipleChoice[currentQuestion.id] ===
											option.value
												? "bg-primary/10 border border-primary/20 ring-1 ring-primary"
												: "border border-input hover:border-border"
										}`}
									>
										<input
											type="radio"
											name={currentQuestion.id}
											value={option.value}
											checked={
												formData.multipleChoice[currentQuestion.id] ===
												option.value
											}
											onChange={() =>
												handleMultipleChoiceChange(
													currentQuestion.id,
													option.value
												)
											}
											className="sr-only"
										/>
										<div
											className={`w-5 h-5 rounded-full border-2 ${
												formData.multipleChoice[currentQuestion.id] ===
												option.value
													? "border-primary bg-primary"
													: "border-muted-foreground"
											} flex items-center justify-center mr-3 transition-all`}
										>
											{formData.multipleChoice[currentQuestion.id] ===
												option.value && (
												<div className="w-2 h-2 rounded-full bg-primary-foreground" />
											)}
										</div>
										<span className="text-sm">{option.label}</span>
									</label>
								))}
							</div>
						)}

						{currentQuestion.type === "openEnded" && (
							<>
								{isCustomRelationshipDetailQuestion &&
								!showCustomRelationshipDetail ? (
									<p className="text-muted-foreground italic">
										This question is skipped because "Custom" relationship was
										not selected.
									</p>
								) : (
									<textarea
										id={currentQuestion.id}
										value={formData.openEnded[currentQuestion.id] || ""}
										onChange={(e) =>
											handleTextChange(currentQuestion.id, e.target.value)
										}
										placeholder={currentQuestion.placeholder}
										className={`w-full p-3 rounded-md border bg-card focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all min-h-[100px] text-sm ${
											errors[currentQuestion.id]
												? "border-destructive"
												: "border-input"
										}`}
										rows={currentQuestion.id === "name" ? 1 : 4}
										required={
											currentQuestion.required ||
											(isCustomRelationshipDetailQuestion &&
												showCustomRelationshipDetail)
										}
										maxLength={currentQuestion.maxLength} // Add maxLength attribute
									/>
								)}
								{currentQuestion.maxLength &&
									(!isCustomRelationshipDetailQuestion ||
										showCustomRelationshipDetail) && (
										<div className="text-xs text-muted-foreground text-right mt-1">
											{formData.openEnded[currentQuestion.id]?.length || 0} /{" "}
											{currentQuestion.maxLength}
										</div>
									)}
							</>
						)}
						{errors[currentQuestion.id] && (
							<p className="text-destructive text-sm mt-1">
								{errors[currentQuestion.id]}
							</p>
						)}
					</div>

					{/* Navigation buttons */}
					<div className="flex justify-between mt-8">
						<button
							type="button"
							onClick={prevQuestion}
							disabled={currentQuestionIndex === 0}
							className="flex items-center px-5 py-2.5 rounded-md bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<ChevronLeft className="h-4 w-4 mr-1" /> Previous
						</button>

						{currentQuestionIndex < allQuestions.length - 1 ? (
							<button
								type="button"
								onClick={nextQuestion}
								className="flex items-center px-5 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
							>
								Next <ChevronRight className="h-4 w-4 ml-1" />
							</button>
						) : (
							<button
								type="submit"
								disabled={isSubmitting}
								className="flex items-center px-5 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-70"
							>
								{isSubmitting ? (
									"Creating..."
								) : (
									<>
										<Save className="h-4 w-4 mr-2" /> Create Persona
									</>
								)}
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}

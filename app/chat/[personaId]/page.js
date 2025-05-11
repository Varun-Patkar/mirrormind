"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useRef, useCallback } from "react"; // Added useCallback
import { useRouter } from "next/navigation";
import Link from "next/link";
// Import MLCEngine directly
import { MLCEngine } from "@mlc-ai/web-llm";
import {
	getPersonaById,
	saveChatMessage,
	getChatsForPersona,
	createNewChat,
	deleteChat,
	updateUserMessageAndClearNextBotResponse,
	updateChatName, // Import updateChatName
} from "@/lib/local-storage";
import {
	ChevronLeft,
	Send,
	User,
	Calendar,
	ArrowDown,
	PlusCircle,
	MessageSquare,
	Trash2,
	Edit3,
	Check,
	X,
	Loader2, // For loading icon
} from "lucide-react";

// Import allQuestions to access labels
import { allQuestions } from "@/lib/questionnaire-data";

// WebLLM Engine Configuration
const SELECTED_MODEL = "Llama-3.2-3B-Instruct-q4f16_1-MLC"; // Updated to a generally available model
// User requested "Llama-3.2-3B-Instruct-q4f16_1-MLC", but 3.1-8B is more common for WebLLM examples.
// If "Llama-3.2-3B-Instruct-q4f16_1-MLC" is confirmed available and works, it can be used.

// Module-level state for the engine
let chatEngineInstance = null;
let globalIsEngineReady = false;
let globalIsEngineInitializing = false;
let globalEngineInitProgress = {
	progress: 0,
	text: "Initializing AI Engine...",
};
let globalInitPromise = null; // To handle concurrent initialization attempts

export default function Chat({ params }) {
	const router = useRouter();
	const { personaId } = params;
	const [persona, setPersona] = useState(null);
	const [isLoading, setIsLoading] = useState(true); // For persona data loading
	const [message, setMessage] = useState("");

	const [chats, setChats] = useState([]);
	const [activeChatId, setActiveChatId] = useState(null);

	const chatContainerRef = useRef(null);
	const [showScrollToBottomButton, setShowScrollToBottomButton] =
		useState(false);

	const [editingMessage, setEditingMessage] = useState(null);
	const [editText, setEditText] = useState("");

	// Component's local state to reflect global engine status
	const [isEngineInitializing, setIsEngineInitializing] = useState(
		globalIsEngineInitializing
	);
	const [engineInitProgress, setEngineInitProgress] = useState(
		globalEngineInitProgress
	);
	const [isEngineReady, setIsEngineReady] = useState(globalIsEngineReady);

	const [isBotResponding, setIsBotResponding] = useState(false);
	const [isGreeting, setIsGreeting] = useState(false); // New state for initial greeting

	const [isEditingChatName, setIsEditingChatName] = useState(false);
	const [editingChatNameText, setEditingChatNameText] = useState("");

	const activeChat = chats.find((c) => c.id === activeChatId);

	const initializeEngine = useCallback(async () => {
		// Use global flags to check status
		if (globalIsEngineReady) {
			console.log("WebLLM engine already initialized and ready globally.");
			if (!isEngineReady) setIsEngineReady(true); // Sync component state
			if (isEngineInitializing) setIsEngineInitializing(false); // Sync component state
			return;
		}

		if (globalIsEngineInitializing) {
			console.log(
				"WebLLM engine initialization already in progress globally. Awaiting..."
			);
			try {
				await globalInitPromise; // Wait for the ongoing initialization
			} catch (error) {
				// Error already handled by the original initializer's catch block
				console.log("Ongoing initialization failed.");
			} finally {
				// Sync component state with the outcome of the global initialization
				setIsEngineReady(globalIsEngineReady);
				setIsEngineInitializing(globalIsEngineInitializing);
				setEngineInitProgress(globalEngineInitProgress);
			}
			return;
		}

		globalIsEngineInitializing = true;
		setIsEngineInitializing(true);
		globalEngineInitProgress = {
			progress: 0,
			text: "Initializing AI Engine...",
		};
		setEngineInitProgress(globalEngineInitProgress);

		globalInitPromise = (async () => {
			try {
				if (!chatEngineInstance) {
					chatEngineInstance = new MLCEngine();
				}

				chatEngineInstance.setInitProgressCallback((report) => {
					globalEngineInitProgress = {
						progress: report.progress * 100,
						text: report.text,
					};
					setEngineInitProgress(globalEngineInitProgress);
				});

				console.log(`Loading model: ${SELECTED_MODEL}`);
				await chatEngineInstance.reload(SELECTED_MODEL, {
					// Optional: chatOpts
				});

				console.log("WebLLM Engine Initialized Successfully (Global)");
				globalIsEngineReady = true;
				setIsEngineReady(true);
			} catch (err) {
				console.error("WebLLM Engine Initialization Failed (Global):", err);
				globalEngineInitProgress = {
					progress: 0,
					text: `Error initializing AI: ${err.message}. Try refreshing.`,
				};
				setEngineInitProgress(globalEngineInitProgress);
				globalIsEngineReady = false; // Ensure it's marked as not ready
				setIsEngineReady(false);
				// throw err; // Re-throw if other parts need to catch this specific promise failure
			} finally {
				globalIsEngineInitializing = false;
				setIsEngineInitializing(false);
				// globalInitPromise = null; // Keep the promise to reflect the final state of the first attempt
			}
		})();

		try {
			await globalInitPromise;
		} catch (err) {
			// This catch is primarily for the case where initializeEngine is called and awaited directly.
			// The internal state updates are handled within the IIFE.
			console.log("Initialization promise encountered an error during await.");
		}
	}, [isEngineReady, isEngineInitializing]); // Dependencies for useCallback

	useEffect(() => {
		// On component mount, check global engine status and initialize if needed.
		if (!globalIsEngineReady && !globalIsEngineInitializing) {
			initializeEngine();
		} else {
			// Sync local state with global state if already initialized or initializing
			setIsEngineReady(globalIsEngineReady);
			setIsEngineInitializing(globalIsEngineInitializing);
			setEngineInitProgress(globalEngineInitProgress);
		}
	}, [initializeEngine]); // initializeEngine is now memoized with useCallback

	// Load persona and its chats
	useEffect(() => {
		if (!personaId) return;
		const loadedPersona = getPersonaById(personaId);
		if (!loadedPersona) {
			router.push("/my-personas");
			return;
		}
		setPersona(loadedPersona);

		let currentChats = getChatsForPersona(personaId);
		if (currentChats.length === 0) {
			const newChat = createNewChat(personaId);
			if (newChat) {
				currentChats = [newChat];
				setActiveChatId(newChat.id);
			} else {
				setActiveChatId(null);
			}
		} else {
			setActiveChatId(currentChats[0].id);
		}
		setChats(currentChats);
		setIsLoading(false); // Persona data loading complete
	}, [personaId, router]);

	// Scroll to bottom of chat when activeChatId changes or messages in activeChat change
	useEffect(() => {
		if (activeChat && chatContainerRef.current) {
			scrollToBottom();
		}
	}, [activeChat?.messages, activeChatId]);

	// Effect for showing/hiding scroll to bottom button
	useEffect(() => {
		const container = chatContainerRef.current;
		if (!container) return;

		const handleScroll = () => {
			const isScrolledUp =
				container.scrollTop <
				container.scrollHeight - container.clientHeight - 100; // 100px threshold
			setShowScrollToBottomButton(isScrolledUp);
		};

		container.addEventListener("scroll", handleScroll);
		return () => container.removeEventListener("scroll", handleScroll);
	}, [activeChatId]);

	const formatTime = (dateString) => {
		return new Date(dateString).toLocaleTimeString(undefined, {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const generateSystemPrompt = (currentPersona) => {
		if (!currentPersona) return "You are a helpful assistant.";

		const { name, multipleChoice, openEnded } = currentPersona;
		const getVal = (obj, key, defaultValue = "not specified") =>
			obj?.[key] || defaultValue;
		const getMcVal = (key, defaultValue = "not specified") =>
			getVal(multipleChoice, key, defaultValue);
		const getOeVal = (key, defaultValue = "not specified") =>
			getVal(openEnded, key, defaultValue);

		let pronouns = getMcVal("pronouns");
		let gender = "person";
		if (pronouns === "he/him") gender = "man";
		else if (pronouns === "she/her") gender = "woman";
		else if (pronouns === "they/them") gender = "person";

		let relationshipString = getMcVal("relationship");
		if (
			relationshipString === "custom" &&
			getOeVal("customRelationshipDetail", "").trim() !== ""
		) {
			relationshipString = getOeVal("customRelationshipDetail");
		} else if (relationshipString !== "custom") {
			// Get label for non-custom relationship
			const relationshipQuestion = allQuestions.find(
				(q) => q.id === "relationship"
			);
			const relationshipOption = relationshipQuestion?.options.find(
				(opt) => opt.value === relationshipString
			);
			relationshipString = relationshipOption
				? relationshipOption.label.split(":")[0]
				: relationshipString; // Get the part before ":" if exists
		}

		return `You are now roleplaying as ${name}. You are a ${getMcVal(
			"ageGroup",
			"various ages"
		)} ${gender} who is the user’s ${relationshipString}. Your pronouns are ${pronouns}. Your tone should be ${getMcVal(
			"tone"
		)} and your communication style is ${getMcVal(
			"communicationStyle"
		)}. Use the appropriate level of formality: ${getMcVal(
			"formalityLevel"
		)}. Below is your persona profile:
Personality: ${getOeVal("personalityDescription", getMcVal("personalityVibe"))}
Catchphrases: ${getOeVal("catchphrases")}
Background/Memory: ${getOeVal("story")}
Passions/Interests: ${getOeVal("passions")}
Favorite Things: ${getOeVal("favorites")}
Humor Style: ${getOeVal("humor", getMcVal("humorStyle"))}
Quirks/Habits: ${getOeVal("quirks")}
Guidelines (you must follow these):
Always speak and act as ${name}, using first-person (“I”) perspective.
Use the specified tone and style consistently in every response.
Incorporate the given catchphrases and personal details naturally.
Refer to your background and favorite topics as if you truly know them.
Never break character or mention being an AI/system or using a persona template.
Keep all personal facts fixed; do not invent new details not provided.
If asked about something outside this profile, say you don’t recall or it’s unknown.
Focus on sounding authentic and true to ${name}’s personality.
Use this persona information to guide all your replies. Speak as ${name} would, making each response feel like it’s genuinely from this person.`;
	};

	const generateLimitedConversationHistory = (
		messages,
		systemPrompt,
		limitPerRole = 2
	) => {
		const history = [];
		let userCount = 0;
		let assistantCount = 0;

		// Iterate messages in reverse to get the latest ones first
		for (let i = messages.length - 1; i >= 0; i--) {
			const msg = messages[i];
			if (msg.isUser && userCount < limitPerRole) {
				history.unshift({ role: "user", content: msg.content });
				userCount++;
			} else if (!msg.isUser && assistantCount < limitPerRole) {
				history.unshift({ role: "assistant", content: msg.content });
				assistantCount++;
			}
			if (userCount >= limitPerRole && assistantCount >= limitPerRole) {
				break;
			}
		}
		return [{ role: "system", content: systemPrompt }, ...history];
	};

	// REMOVE generateChatTitle function
	// const generateChatTitle = async (
	// 	currentPersonaId,
	// 	currentChatId,
	// 	firstUserMessage
	// ) => { ... };

	const handleSendMessage = async (e) => {
		e.preventDefault();
		if (
			!message.trim() ||
			!persona ||
			!activeChatId ||
			!isEngineReady || // Check local isEngineReady which reflects global
			isBotResponding ||
			isGreeting || // Disable if greeting
			!chatEngineInstance // Use global chatEngineInstance
		)
			return;

		const userMessageContent = message;
		// Save user message first
		saveChatMessage(personaId, activeChatId, userMessageContent, true);
		let updatedChats = getChatsForPersona(personaId);
		setChats(updatedChats);
		setMessage("");
		setIsBotResponding(true);

		// Prepare for streaming bot response
		const tempBotMessageId = `bot-streaming-${Date.now()}`;
		const botMessagePlaceholder = {
			id: tempBotMessageId,
			content: "",
			timestamp: new Date().toISOString(),
			isUser: false,
		};

		// Add placeholder to local state for immediate UI update
		updatedChats = updatedChats.map((chat) => {
			if (chat.id === activeChatId) {
				return {
					...chat,
					messages: [...chat.messages, botMessagePlaceholder],
				};
			}
			return chat;
		});
		setChats(updatedChats);
		scrollToBottom(); // Scroll after adding placeholder

		try {
			const systemPrompt = generateSystemPrompt(persona);
			// Get the latest messages from the updatedChats state for history
			const currentActiveChat = updatedChats.find((c) => c.id === activeChatId);
			const conversationHistory = generateLimitedConversationHistory(
				currentActiveChat?.messages.filter(
					(msg) => msg.id !== tempBotMessageId
				) || [],
				systemPrompt
			);
			// Ensure the latest user message (which triggered this) is included if not already by limit
			// The filter for tempBotMessageId and then taking from currentActiveChat already includes the user message
			// that triggered this send.

			const chunks = await chatEngineInstance.chat.completions.create({
				// Use global chatEngineInstance
				messages: conversationHistory,
				stream: true,
				stream_options: { include_usage: true },
			});

			let accumulatedBotReply = "";
			for await (const chunk of chunks) {
				const deltaContent = chunk.choices[0]?.delta.content || "";
				accumulatedBotReply += deltaContent;

				// Update the placeholder message content in local state
				setChats((prevChats) =>
					prevChats.map((chat) => {
						if (chat.id === activeChatId) {
							return {
								...chat,
								messages: chat.messages.map((msg) =>
									msg.id === tempBotMessageId
										? { ...msg, content: accumulatedBotReply }
										: msg
								),
							};
						}
						return chat;
					})
				);
				// No need to scroll here repeatedly, initial scroll should be enough or one at the end.
			}

			// Save the complete bot message to local storage
			if (accumulatedBotReply.trim()) {
				// Remove placeholder before saving the final message
				// This is to avoid issues if saveChatMessage relies on message order or count from storage
				// A bit complex, simpler to just save and then reload all chats from storage.

				// Let's save the final message. saveChatMessage will assign a new ID.
				saveChatMessage(
					personaId,
					activeChatId,
					accumulatedBotReply.trim(),
					false
				);
			} else {
				// Handle case where bot sends empty response (though unlikely with good prompts)
				// Optionally remove the placeholder if it's still empty
				setChats((prevChats) =>
					prevChats.map((chat) => {
						if (chat.id === activeChatId) {
							return {
								...chat,
								messages: chat.messages.filter(
									(msg) => msg.id !== tempBotMessageId
								),
							};
						}
						return chat;
					})
				);
			}

			// Refresh chats from local storage to get the final message with its persistent ID
			setChats(getChatsForPersona(personaId));
		} catch (error) {
			console.error("Error generating WebLLM response:", error);
			// Remove placeholder on error
			setChats((prevChats) =>
				prevChats.map((chat) => {
					if (chat.id === activeChatId) {
						return {
							...chat,
							messages: chat.messages.filter(
								(msg) => msg.id !== tempBotMessageId
							),
						};
					}
					return chat;
				})
			);
			saveChatMessage(
				personaId,
				activeChatId,
				"Sorry, I encountered an error trying to respond.",
				false
			);
			setChats(getChatsForPersona(personaId)); // Refresh after saving error message
		} finally {
			setIsBotResponding(false);
			scrollToBottom(); // Ensure scroll to bottom after response is complete or error
		}
	};

	// REMOVE OLD generatePersonaResponse function
	// const generatePersonaResponse = (userMessage, currentPersona) => { ... };

	const scrollToBottom = () => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop =
				chatContainerRef.current.scrollHeight;
		}
	};

	const generateInitialGreeting = async (
		personaForGreeting,
		chatIdForGreeting
	) => {
		if (
			!isEngineReady || // Check local isEngineReady
			!chatEngineInstance || // Use global chatEngineInstance
			!personaForGreeting ||
			!chatIdForGreeting
		)
			return;

		setIsGreeting(true);
		const tempBotMessageId = `bot-greeting-${Date.now()}`;
		const botMessagePlaceholder = {
			id: tempBotMessageId,
			content: "",
			timestamp: new Date().toISOString(),
			isUser: false,
		};

		setChats((prevChats) =>
			prevChats.map((chat) => {
				if (chat.id === chatIdForGreeting) {
					return { ...chat, messages: [botMessagePlaceholder] }; // Start with only placeholder
				}
				return chat;
			})
		);
		scrollToBottom();

		try {
			const systemPrompt = generateSystemPrompt(personaForGreeting);
			// Add a dummy user message to initiate the conversation for the greeting
			const conversationHistory = [
				{ role: "system", content: systemPrompt },
				{
					role: "user",
					content:
						"Start the conversation with a greeting in 5-6 sentences introducing yourself.",
				}, // Dummy user message
			];

			const chunks = await chatEngineInstance.chat.completions.create({
				// Use global chatEngineInstance
				messages: conversationHistory,
				stream: true,
				stream_options: { include_usage: true },
				// You might want a slightly different temperature or prompt for a greeting
				// For example, adding "Start the conversation with a greeting." to the system prompt
				// or a specific user message like {role: "user", content: "Introduce yourself."} (but this breaks the "no user input first" rule)
			});

			let accumulatedBotReply = "";
			for await (const chunk of chunks) {
				const deltaContent = chunk.choices[0]?.delta.content || "";
				accumulatedBotReply += deltaContent;
				setChats((prevChats) =>
					prevChats.map((chat) => {
						if (chat.id === chatIdForGreeting) {
							return {
								...chat,
								messages: chat.messages.map((msg) =>
									msg.id === tempBotMessageId
										? { ...msg, content: accumulatedBotReply }
										: msg
								),
							};
						}
						return chat;
					})
				);
			}

			if (accumulatedBotReply.trim()) {
				saveChatMessage(
					personaId,
					chatIdForGreeting,
					accumulatedBotReply.trim(),
					false
				);
			} else {
				setChats((prevChats) =>
					prevChats.map((chat) => {
						if (chat.id === chatIdForGreeting) {
							return {
								...chat,
								messages: chat.messages.filter(
									(msg) => msg.id !== tempBotMessageId
								),
							};
						}
						return chat;
					})
				);
			}
			setChats(getChatsForPersona(personaId));
		} catch (error) {
			console.error("Error generating initial bot greeting:", error);
			setChats((prevChats) =>
				prevChats.map((chat) => {
					if (chat.id === chatIdForGreeting) {
						return {
							...chat,
							messages: chat.messages.filter(
								(msg) => msg.id !== tempBotMessageId
							),
						};
					}
					return chat;
				})
			);
			saveChatMessage(
				personaId,
				chatIdForGreeting,
				"Hello! I'm ready to chat.",
				false
			); // Fallback greeting
			setChats(getChatsForPersona(personaId));
		} finally {
			setIsGreeting(false);
			scrollToBottom();
		}
	};

	const handleNewChat = () => {
		const newChat = createNewChat(personaId);
		if (newChat) {
			const updatedChats = getChatsForPersona(personaId);
			setChats(updatedChats);
			setActiveChatId(newChat.id);
			setIsEditingChatName(false); // Reset chat name editing state

			if (persona && isEngineReady) {
				// Check local isEngineReady
				// Ensure persona data is loaded and engine is ready
				generateInitialGreeting(persona, newChat.id);
			}
		}
	};

	const handleSelectChat = (chatId) => {
		setActiveChatId(chatId);
		setEditingMessage(null); // Cancel any ongoing message edit when switching chats
		setIsEditingChatName(false); // Cancel chat name editing
		setEditingChatNameText("");
	};

	const formatChatName = (chat) => {
		if (!chat || !chat.createdAt) return "Chat";
		// chat.name is already formatted by createNewChat with date and time
		return chat.name || `Chat - ${new Date(chat.createdAt).toLocaleString()}`;
	};

	const handleEditChatNameClick = () => {
		if (!activeChat) return;
		setIsEditingChatName(true);
		setEditingChatNameText(activeChat.name);
	};

	const handleSaveChatName = () => {
		if (!activeChat || !editingChatNameText.trim()) {
			// Optionally, revert to original name or show error if empty
			setEditingChatNameText(activeChat ? activeChat.name : "");
			setIsEditingChatName(false);
			return;
		}
		const success = updateChatName(
			personaId,
			activeChatId,
			editingChatNameText.trim()
		);
		if (success) {
			setChats(getChatsForPersona(personaId));
		} else {
			// Handle error, maybe show a toast
			alert("Failed to update chat name.");
			setEditingChatNameText(activeChat.name); // Revert to original on failure
		}
		setIsEditingChatName(false);
	};

	const handleCancelEditChatName = () => {
		setIsEditingChatName(false);
		setEditingChatNameText("");
	};

	const handleDeleteChat = (chatIdToDelete) => {
		if (
			confirm(
				"Are you sure you want to delete this chat? This action cannot be undone."
			)
		) {
			const success = deleteChat(personaId, chatIdToDelete);
			if (success) {
				setEditingMessage(null); // Cancel edit if the active chat is deleted

				const updatedChats = getChatsForPersona(personaId);
				setChats(updatedChats);

				if (updatedChats.length === 0) {
					setActiveChatId(null); // No chats left, no active chat
				} else {
					if (activeChatId === chatIdToDelete) {
						// If the deleted chat was active, select the new latest chat
						setActiveChatId(updatedChats[0].id);
					} else {
						// Active chat was not the one deleted, activeChatId remains valid
						// No change needed for activeChatId if it's still in updatedChats
						if (!updatedChats.some((chat) => chat.id === activeChatId)) {
							// This case should ideally not be hit if logic is sound, but as a fallback:
							setActiveChatId(updatedChats[0].id);
						}
					}
				}
			} else {
				alert("Failed to delete chat.");
			}
		}
	};

	const handleEditMessageClick = (messageToEdit) => {
		setEditingMessage({
			id: messageToEdit.id,
			originalContent: messageToEdit.content,
		});
		setEditText(messageToEdit.content);
	};

	const handleSaveEdit = async () => {
		if (
			!editingMessage ||
			!editText.trim() ||
			!isEngineReady || // Check local isEngineReady
			isBotResponding ||
			isGreeting || // Disable if greeting
			!chatEngineInstance // Use global chatEngineInstance
		)
			return;

		setIsBotResponding(true);
		const originalUserMessageId = editingMessage.id;

		// Update user message and clear old bot response
		const success = updateUserMessageAndClearNextBotResponse(
			personaId,
			activeChatId,
			originalUserMessageId,
			editText
		);

		if (!success) {
			alert("Failed to update message.");
			setIsBotResponding(false);
			return;
		}

		let updatedChats = getChatsForPersona(personaId); // Get chats after user message update
		setChats(updatedChats);

		// Prepare for streaming new bot response
		const tempBotMessageId = `bot-streaming-edit-${Date.now()}`;
		const botMessagePlaceholder = {
			id: tempBotMessageId,
			content: "",
			timestamp: new Date().toISOString(),
			isUser: false,
		};

		updatedChats = updatedChats.map((chat) => {
			if (chat.id === activeChatId) {
				return { ...chat, messages: [...chat.messages, botMessagePlaceholder] };
			}
			return chat;
		});
		setChats(updatedChats);
		scrollToBottom();

		try {
			const systemPrompt = generateSystemPrompt(persona);
			const currentActiveChat = updatedChats.find((c) => c.id === activeChatId);

			// History should only contain messages up to and including the edited user message
			const messagesForHistory =
				currentActiveChat?.messages.filter((msg) => {
					// Include system, user messages before or at the edited one, and assistant messages before it.
					// Exclude the placeholder.
					return msg.id !== tempBotMessageId;
				}) || [];

			const conversationHistory = generateLimitedConversationHistory(
				messagesForHistory,
				systemPrompt
			);

			const chunks = await chatEngineInstance.chat.completions.create({
				// Use global chatEngineInstance
				messages: conversationHistory,
				stream: true,
				stream_options: { include_usage: true },
			});

			let accumulatedBotReply = "";
			for await (const chunk of chunks) {
				const deltaContent = chunk.choices[0]?.delta.content || "";
				accumulatedBotReply += deltaContent;
				setChats((prevChats) =>
					prevChats.map((chat) => {
						if (chat.id === activeChatId) {
							return {
								...chat,
								messages: chat.messages.map((msg) =>
									msg.id === tempBotMessageId
										? { ...msg, content: accumulatedBotReply }
										: msg
								),
							};
						}
						return chat;
					})
				);
			}

			if (accumulatedBotReply.trim()) {
				saveChatMessage(
					personaId,
					activeChatId,
					accumulatedBotReply.trim(),
					false
				);
			} else {
				setChats((prevChats) =>
					prevChats.map((chat) => {
						if (chat.id === activeChatId) {
							return {
								...chat,
								messages: chat.messages.filter(
									(msg) => msg.id !== tempBotMessageId
								),
							};
						}
						return chat;
					})
				);
			}
			setChats(getChatsForPersona(personaId)); // Refresh from storage
		} catch (error) {
			console.error("Error regenerating WebLLM response after edit:", error);
			setChats((prevChats) =>
				prevChats.map((chat) => {
					if (chat.id === activeChatId) {
						return {
							...chat,
							messages: chat.messages.filter(
								(msg) => msg.id !== tempBotMessageId
							),
						};
					}
					return chat;
				})
			);
			saveChatMessage(
				personaId,
				activeChatId,
				"Sorry, I encountered an error trying to respond to your edit.",
				false
			);
			setChats(getChatsForPersona(personaId));
		}

		setEditingMessage(null);
		setEditText("");
		setIsBotResponding(false);
		scrollToBottom();
	};

	const handleCancelEdit = () => {
		setEditingMessage(null);
		setEditText("");
	};

	if (
		isLoading ||
		(isEngineInitializing && !isEngineReady) ||
		(!isEngineReady && !chatEngineInstance && !isEngineInitializing)
	) {
		// Adjusted loading condition
		return (
			<div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col justify-center items-center min-h-[70vh]">
				<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
				<p className="text-lg font-medium text-muted-foreground">
					{engineInitProgress.text}
				</p>
				{isEngineInitializing && engineInitProgress.progress > 0 && (
					<div className="w-full max-w-md bg-muted rounded-full h-2.5 mt-4">
						<div
							className="bg-primary h-2.5 rounded-full transition-all duration-150"
							style={{ width: `${engineInitProgress.progress}%` }}
						></div>
					</div>
				)}
			</div>
		);
	}

	if (!persona) {
		return (
			<div className="container mx-auto px-4 py-8 max-w-4xl">
				<div className="bg-card rounded-xl shadow-lg p-6 md:p-8 text-center">
					<h1 className="text-2xl font-bold mb-4">Persona not found</h1>
					<p className="mb-6">
						This persona doesn't exist or may have been deleted.
					</p>
					<Link
						href="/my-personas"
						className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
					>
						View My Personas
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-[calc(100vh-70px)]">
			{" "}
			{/* Sidebar */}
			<div className="w-1/4 min-w-[280px] max-w-[350px] bg-card border-r border-border flex flex-col">
				<div className="p-4 border-b border-border">
					{/* ... existing persona info and New Chat button ... */}
					<Link
						href="/my-personas"
						className="inline-flex items-center text-sm text-primary hover:underline mb-3"
					>
						<ChevronLeft className="h-4 w-4 mr-1" />
						Back to Personas
					</Link>
					<div className="flex items-center mb-3">
						<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
							<User className="h-5 w-5 text-primary" />
						</div>
						<h2 className="text-lg font-semibold truncate" title={persona.name}>
							{persona.name}
						</h2>
					</div>
					<button
						onClick={handleNewChat}
						className="w-full flex items-center justify-center px-4 py-2.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
						disabled={
							!isEngineReady ||
							isBotResponding ||
							isGreeting ||
							!chatEngineInstance // Use global chatEngineInstance
						}
					>
						<PlusCircle className="h-4 w-4 mr-2" />
						New Chat
					</button>
				</div>
				<div className="flex-grow overflow-y-auto p-2 space-y-1">
					{chats.map((chat) => (
						<div key={chat.id} className="group flex items-center">
							<button
								onClick={() => handleSelectChat(chat.id)}
								className={`flex-grow text-left px-3 py-2.5 rounded-md flex items-center transition-colors text-sm ${
									activeChatId === chat.id
										? "bg-primary/10 text-primary font-medium"
										: "hover:bg-muted"
								}`}
							>
								<MessageSquare className="h-4 w-4 mr-2.5 opacity-70 shrink-0" />
								<span className="truncate">{formatChatName(chat)}</span>
							</button>
							<button
								onClick={() => handleDeleteChat(chat.id)}
								className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
								title="Delete chat"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</div>
					))}
					{chats.length === 0 && (
						<p className="text-center text-muted-foreground text-sm p-4">
							No chats yet. Start a new one!
						</p>
					)}
				</div>
			</div>
			{/* Main Chat Area */}
			<div className="flex-grow flex flex-col bg-background">
				{" "}
				{/* Chat header */}
				<div className="bg-card shadow-sm p-4 md:p-5 flex items-center justify-between border-b border-border">
					{isEditingChatName && activeChat ? (
						<div className="flex items-center gap-2 flex-grow">
							<input
								type="text"
								value={editingChatNameText}
								onChange={(e) => setEditingChatNameText(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") handleSaveChatName();
									if (e.key === "Escape") handleCancelEditChatName();
								}}
								className="flex-grow px-3 py-1.5 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-lg font-semibold"
								disabled={isBotResponding || isGreeting}
								autoFocus
							/>
							<button
								onClick={handleSaveChatName}
								disabled={
									isBotResponding || isGreeting || !editingChatNameText.trim()
								}
								className="p-2 hover:bg-muted rounded-md text-green-500 disabled:opacity-50"
								title="Save name"
							>
								<Check className="h-5 w-5" />
							</button>
							<button
								onClick={handleCancelEditChatName}
								disabled={isBotResponding || isGreeting}
								className="p-2 hover:bg-muted rounded-md text-red-500 disabled:opacity-50"
								title="Cancel edit"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
					) : (
						<div className="flex items-center gap-2">
							<h1
								className="font-semibold text-lg truncate"
								title={
									activeChat
										? formatChatName(activeChat)
										: persona
										? persona.name
										: "Chat"
								}
							>
								{activeChat
									? formatChatName(activeChat)
									: persona
									? persona.name
									: "Chat"}
							</h1>
							{activeChat && isEngineReady && (
								<button
									onClick={handleEditChatNameClick}
									className="p-1.5 text-muted-foreground hover:text-primary rounded-md disabled:opacity-50"
									title="Edit chat name"
									disabled={isBotResponding || isGreeting || isEditingChatName}
								>
									<Edit3 className="h-4 w-4" />
								</button>
							)}
						</div>
					)}
					{/* This div is for the message count, ensure it's outside the conditional rendering of the title part if it should always be visible */}
					{!isEditingChatName && (
						<div>
							{" "}
							{/* This div might need adjustment based on overall layout goals if other elements are here */}
							<div className="flex items-center text-xs text-muted-foreground">
								<Calendar className="h-3 w-3 mr-1" />
								<span>
									{activeChat
										? (Math.floor(activeChat.messages?.length / 2) || 0) +
										  " messages"
										: "No active chat"}
								</span>
							</div>
						</div>
					)}
				</div>
				{/* Chat messages */}
				<div
					ref={chatContainerRef}
					className="flex-grow p-4 md:p-6 overflow-y-auto flex flex-col gap-4 relative bg-muted/20" // Added relative for scroll button positioning
				>
					{chats.length === 0 && !activeChatId ? ( // Adjusted condition for initial no chats state
						<div className="h-full flex flex-col items-center justify-center text-center">
							<MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
							<h3 className="text-xl font-medium mb-2">No Chats Yet</h3>
							<p className="text-muted-foreground mb-6 max-w-xs">
								Start a new conversation with {persona?.name || "this persona"}.
							</p>
							<button
								onClick={handleNewChat}
								className="inline-flex items-center px-5 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
								disabled={
									!isEngineReady ||
									isBotResponding ||
									isGreeting ||
									!chatEngineInstance // Use global chatEngineInstance
								}
							>
								<PlusCircle className="h-4 w-4 mr-2" />
								Create New Chat
							</button>
						</div>
					) : !activeChat || activeChat.messages.length === 0 ? (
						<div className="h-full flex flex-col items-center justify-center text-center">
							<div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
								<MessageSquare className="h-8 w-8 text-primary" />
							</div>
							<h3 className="text-xl font-medium mb-2">
								{activeChat ? formatChatName(activeChat) : persona?.name}
							</h3>
							<p className="text-muted-foreground max-w-xs">
								This is the beginning of your conversation.
								{!activeChat || activeChat.messages.length === 0
									? " Say hello to get started!"
									: " Select another chat or start a new one."}
							</p>
						</div>
					) : (
						<>
							{activeChat.messages.map((msg, index) => {
								const isLastMessage = index === activeChat.messages.length - 2; // Edit user message before bot response
								const canEdit =
									msg.isUser &&
									index ===
										activeChat.messages.findIndex(
											(m) =>
												m.isUser &&
												activeChat.messages[index + 1] &&
												!activeChat.messages[index + 1].isUser
										) &&
									index === activeChat.messages.length - 2;
								// A more robust way to find the last user message that has a bot response after it, or is the absolute last message.
								// For simplicity, the prompt asked for "last message", which was interpreted as last user message before potential bot reply.
								// The condition `index === activeChat.messages.length - 2` assumes user message is followed by bot.
								// A truly "last user message" would be:
								// const lastUserMsgIndex = findLastIndex(activeChat.messages, m => m.isUser);
								// const canEdit = msg.isUser && index === lastUserMsgIndex;
								// And then logic to remove bot response if it's immediately after.
								// The current `updateUserMessageAndClearNextBotResponse` handles removing the next bot response.
								// So, we need to allow editing the *actual* last user message.
								const actualLastUserMessageIndex = activeChat.messages
									.map((m) => m.isUser)
									.lastIndexOf(true);
								const canActuallyEdit =
									msg.isUser && index === actualLastUserMessageIndex;

								return (
									<div
										key={msg.id}
										className={`flex ${
											msg.isUser ? "justify-end" : "justify-start"
										}`}
									>
										<div
											className={`group relative max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3 shadow-sm ${
												msg.isUser
													? "bg-primary text-primary-foreground rounded-tr-none"
													: "bg-card text-card-foreground rounded-tl-none border border-border"
											}`}
										>
											{editingMessage?.id === msg.id ? (
												<div className="flex flex-col gap-2">
													<textarea
														value={editText}
														onChange={(e) => setEditText(e.target.value)}
														className="w-full p-2 rounded-md border bg-background text-foreground text-sm min-h-[60px] focus:ring-2 focus:ring-primary outline-none"
														rows={Math.max(2, editText.split("\n").length)}
														disabled={isBotResponding}
													/>
													<div className="flex justify-end gap-2">
														<button
															onClick={handleCancelEdit}
															className="p-1.5 hover:bg-muted rounded"
															disabled={isBotResponding}
														>
															<X className="h-4 w-4 text-muted-foreground" />
														</button>
														<button
															onClick={handleSaveEdit}
															className="p-1.5 bg-primary/20 hover:bg-primary/30 rounded"
															disabled={isBotResponding || !editText.trim()}
														>
															{isBotResponding &&
															editingMessage?.id === msg.id ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<Check className="h-4 w-4 text-muted-foreground" />
															)}
														</button>
													</div>
												</div>
											) : (
												<>
													<div className="text-sm whitespace-pre-wrap break-words">
														{msg.content}
													</div>
													<div
														className={`text-xs mt-1.5 text-right ${
															msg.isUser
																? "text-primary-foreground/70"
																: "text-muted-foreground"
														}`}
													>
														{formatTime(msg.timestamp)}
													</div>
													{canActuallyEdit &&
														!editingMessage && ( // Use canActuallyEdit
															<button
																onClick={() => handleEditMessageClick(msg)}
																className="absolute -top-2 -right-2 z-10 p-1 bg-card border rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
																title="Edit message"
															>
																<Edit3 className="h-3.5 w-3.5 text-primary" />
															</button>
														)}
												</>
											)}
										</div>
									</div>
								);
							})}
						</>
					)}

					{/* Scroll to bottom button, shown when not at bottom */}
					{showScrollToBottomButton && (
						<button
							onClick={scrollToBottom}
							className="absolute bottom-6 right-6 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all duration-300 ease-in-out"
							aria-label="Scroll to bottom"
						>
							<ArrowDown className="h-5 w-5" />
						</button>
					)}
				</div>
				{/* Message input */}
				<div className="bg-card p-3 md:p-4 border-t border-border">
					<form
						onSubmit={handleSendMessage}
						className="flex gap-3 items-center"
					>
						<input
							type="text"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder={
								!isEngineReady
									? "AI Engine loading..."
									: isGreeting
									? `${persona.name} is typing a greeting...`
									: activeChat
									? `Message ${persona.name}...`
									: "Select or start a new chat"
							}
							className="flex-grow px-4 py-3 rounded-full border border-input bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
							disabled={
								!activeChatId || !isEngineReady || isBotResponding || isGreeting
							}
						/>
						<button
							type="submit"
							disabled={
								!message.trim() ||
								!activeChatId ||
								!isEngineReady || // Use local isEngineReady
								isBotResponding ||
								isGreeting
							}
							className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
						>
							{isBotResponding || isGreeting ? ( // Show loader if bot responding or greeting
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								<Send className="h-5 w-5" />
							)}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}

// Helper functions for localStorage interaction

// Get all saved personas
export const getPersonas = () => {
	if (typeof window === "undefined") return [];

	try {
		const personas = localStorage.getItem("mirrormind-personas");
		return personas ? JSON.parse(personas) : [];
	} catch (error) {
		console.error("Error getting personas from localStorage:", error);
		return [];
	}
};

// Save a new persona
export const savePersona = (personaData) => {
	if (typeof window === "undefined") return null;

	try {
		const personas = getPersonas();
		const newName = personaData.openEnded.name
			? personaData.openEnded.name.trim()
			: "";

		if (!newName) {
			// Should be caught by frontend validation, but good to have a fallback
			return {
				error: "VALIDATION_ERROR",
				message: "Persona name cannot be empty.",
			};
		}

		// Check for duplicate name before saving (case-insensitive and trimmed)
		if (
			personas.some(
				(p) => p.name && p.name.trim().toLowerCase() === newName.toLowerCase()
			)
		) {
			return {
				error: "DUPLICATE_NAME",
				message: "A persona with this name already exists.",
			};
		}

		const newPersona = {
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			name: newName, // Store trimmed name
			multipleChoice: personaData.multipleChoice,
			openEnded: {
				...personaData.openEnded,
				name: newName, // Ensure openEnded.name is also the trimmed version
			},
			chats: [],
		};

		const updatedPersonas = [...personas, newPersona];
		localStorage.setItem(
			"mirrormind-personas",
			JSON.stringify(updatedPersonas)
		);

		return newPersona;
	} catch (error) {
		console.error("Error saving persona to localStorage:", error);
		return {
			error: "STORAGE_ERROR",
			message: "Failed to save persona due to a storage error.",
		};
	}
};

// Get a specific persona by ID
export const getPersonaById = (id) => {
	if (typeof window === "undefined") return null;

	try {
		const personas = getPersonas();
		return personas.find((persona) => persona.id === id) || null;
	} catch (error) {
		console.error("Error getting persona by ID from localStorage:", error);
		return null;
	}
};

// Save a chat message for a specific persona and chat
export const saveChatMessage = (personaId, chatId, message, isUser = true) => {
	if (typeof window === "undefined") return false;

	try {
		const personas = getPersonas();
		const personaIndex = personas.findIndex((p) => p.id === personaId);

		if (personaIndex === -1) {
			console.error("Persona not found for saving chat message");
			return false;
		}

		const persona = personas[personaIndex];

		// Ensure chats array exists
		if (!persona.chats) {
			persona.chats = [];
		}

		// Find the specific chat by chatId
		const chatIndex = persona.chats.findIndex((c) => c.id === chatId);

		if (chatIndex === -1) {
			console.error(`Chat with ID ${chatId} not found in persona ${personaId}`);
			return false; // Or handle by creating a new chat if desired, though createNewChat should be used for that.
		}

		const targetChat = persona.chats[chatIndex];

		// Add message to the target chat
		targetChat.messages.push({
			id: Date.now().toString(),
			content: message,
			timestamp: new Date().toISOString(),
			isUser,
		});

		// Update in localStorage
		personas[personaIndex] = persona;
		localStorage.setItem("mirrormind-personas", JSON.stringify(personas));

		return true;
	} catch (error) {
		console.error("Error saving chat message to localStorage:", error);
		return false;
	}
};

// Get all chat histories for a specific persona
export const getChatsForPersona = (personaId) => {
	if (typeof window === "undefined") return [];

	try {
		const persona = getPersonaById(personaId);
		// Ensure chats array exists and sort by most recent
		return persona && persona.chats
			? [...persona.chats].sort(
					(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
			  )
			: [];
	} catch (error) {
		console.error("Error getting persona chats from localStorage:", error);
		return [];
	}
};

// Create a new chat for a specific persona
export const createNewChat = (personaId) => {
	if (typeof window === "undefined") return null;

	try {
		const personas = getPersonas();
		const personaIndex = personas.findIndex((p) => p.id === personaId);

		if (personaIndex === -1) {
			console.error("Persona not found for creating new chat");
			return null;
		}

		const persona = personas[personaIndex];

		if (!persona.chats) {
			persona.chats = [];
		}

		const now = new Date();
		const newChat = {
			id: Date.now().toString(),
			name: `Chat - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, // Include time
			createdAt: now.toISOString(),
			messages: [],
		};

		persona.chats.unshift(newChat);

		personas[personaIndex] = persona;
		localStorage.setItem("mirrormind-personas", JSON.stringify(personas));

		return newChat;
	} catch (error) {
		console.error("Error creating new chat in localStorage:", error);
		return null;
	}
};

// Update the name of a specific chat
export const updateChatName = (personaId, chatId, newName) => {
	if (typeof window === "undefined") return false;
	if (!newName || newName.trim() === "") return false; // Ensure new name is not empty

	try {
		const personas = getPersonas();
		const personaIndex = personas.findIndex((p) => p.id === personaId);

		if (personaIndex === -1) {
			console.error("Persona not found for updating chat name");
			return false;
		}

		const persona = personas[personaIndex];
		if (!persona.chats) {
			console.error("No chats found for this persona");
			return false;
		}

		const chatIndex = persona.chats.findIndex((c) => c.id === chatId);
		if (chatIndex === -1) {
			console.error(`Chat with ID ${chatId} not found for renaming.`);
			return false;
		}

		persona.chats[chatIndex].name = newName.trim();

		personas[personaIndex] = persona;
		localStorage.setItem("mirrormind-personas", JSON.stringify(personas));
		return true;
	} catch (error) {
		console.error("Error updating chat name in localStorage:", error);
		return false;
	}
};

// Delete a specific persona and all its associated data
export const deletePersona = (personaId) => {
	if (typeof window === "undefined") return false;

	try {
		const personas = getPersonas();
		const updatedPersonas = personas.filter((p) => p.id !== personaId);

		if (personas.length === updatedPersonas.length) {
			// Persona not found, or no change made
			console.warn(`Persona with ID ${personaId} not found for deletion.`);
			return false;
		}

		localStorage.setItem(
			"mirrormind-personas",
			JSON.stringify(updatedPersonas)
		);

		// Optionally, clean up individual chat storage if they were stored separately
		// For this example, chats are nested, so they are removed with the persona.
		// If chats were stored under keys like `mirrormind-chats-${personaId}`,
		// you would remove that item here:
		// localStorage.removeItem(`mirrormind-chats-${personaId}`);

		return true; // Indicates success
	} catch (error) {
		console.error("Error deleting persona from localStorage:", error);
		return false; // Indicates failure
	}
};
// Delete a specific chat for a persona
export const deleteChat = (personaId, chatId) => {
	if (typeof window === "undefined") return false;

	try {
		const personas = getPersonas();
		const personaIndex = personas.findIndex((p) => p.id === personaId);

		if (personaIndex === -1) {
			console.error("Persona not found for deleting chat");
			return false;
		}

		const persona = personas[personaIndex];
		if (!persona.chats) {
			return false; // No chats to delete
		}

		const initialChatCount = persona.chats.length;
		persona.chats = persona.chats.filter((chat) => chat.id !== chatId);

		if (persona.chats.length === initialChatCount) {
			console.warn(`Chat with ID ${chatId} not found for deletion.`);
			return false; // Chat not found
		}

		personas[personaIndex] = persona;
		localStorage.setItem("mirrormind-personas", JSON.stringify(personas));
		return true;
	} catch (error) {
		console.error("Error deleting chat from localStorage:", error);
		return false;
	}
};

// Update a user's message and remove the immediately following bot message, if any
export const updateUserMessageAndClearNextBotResponse = (
	personaId,
	chatId,
	userMessageId,
	newContent
) => {
	if (typeof window === "undefined") return false;

	try {
		const personas = getPersonas();
		const personaIndex = personas.findIndex((p) => p.id === personaId);

		if (personaIndex === -1) return false;
		const persona = personas[personaIndex];

		if (!persona.chats) return false;
		const chatIndex = persona.chats.findIndex((c) => c.id === chatId);

		if (chatIndex === -1) return false;
		const chat = persona.chats[chatIndex];

		const messageIndex = chat.messages.findIndex((m) => m.id === userMessageId);

		if (messageIndex === -1 || !chat.messages[messageIndex].isUser) {
			console.error("User message to edit not found or not a user message.");
			return false; // Message not found or not a user message
		}

		// Update user message
		chat.messages[messageIndex].content = newContent;
		chat.messages[messageIndex].timestamp = new Date().toISOString(); // Update timestamp

		// Check and remove next message if it's a bot response
		if (
			messageIndex + 1 < chat.messages.length &&
			!chat.messages[messageIndex + 1].isUser
		) {
			chat.messages.splice(messageIndex + 1, 1);
		}

		personas[personaIndex] = persona;
		localStorage.setItem("mirrormind-personas", JSON.stringify(personas));
		return true;
	} catch (error) {
		console.error("Error updating user message in localStorage:", error);
		return false;
	}
};

// Update an existing persona
export const updatePersona = (personaId, updatedData) => {
	if (typeof window === "undefined") return null;

	try {
		const personas = getPersonas();
		const personaIndex = personas.findIndex((p) => p.id === personaId);

		if (personaIndex === -1) {
			return { error: "NOT_FOUND", message: "Persona not found." };
		}

		const updatedName = updatedData.openEnded.name
			? updatedData.openEnded.name.trim()
			: "";

		if (!updatedName) {
			// Should be caught by frontend validation
			return {
				error: "VALIDATION_ERROR",
				message: "Persona name cannot be empty.",
			};
		}

		// Check for duplicate name, excluding the current persona (case-insensitive and trimmed)
		if (
			personas.some(
				(p) =>
					p.id !== personaId &&
					p.name &&
					p.name.trim().toLowerCase() === updatedName.toLowerCase()
			)
		) {
			return {
				error: "DUPLICATE_NAME",
				message: "Another persona with this name already exists.",
			};
		}

		const updatedPersona = {
			...personas[personaIndex],
			name: updatedName, // Update top-level name with trimmed version
			multipleChoice: updatedData.multipleChoice,
			openEnded: {
				...updatedData.openEnded,
				name: updatedName, // Ensure openEnded.name is also the trimmed version
			},
			// chats array is preserved from the original persona
		};

		personas[personaIndex] = updatedPersona;
		localStorage.setItem("mirrormind-personas", JSON.stringify(personas));
		return updatedPersona;
	} catch (error) {
		console.error("Error updating persona in localStorage:", error);
		return {
			error: "STORAGE_ERROR",
			message: "Failed to update persona due to a storage error.",
		};
	}
};

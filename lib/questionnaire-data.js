export const allQuestions = [
	{
		type: "openEnded",
		id: "name",
		question: "Persona's Name",
		placeholder: "e.g., Alex, Jamie, Dr. Smith",
		required: true,
		description: "What is this person's name?",
		maxLength: 50, // Added maxLength
	},
	{
		type: "multipleChoice",
		id: "tone",
		question: "Persona's Tone",
		options: [
			{ value: "casual", label: "Casual: Friendly, informal" },
			{ value: "formal", label: "Formal: Polite and official" },
			{ value: "professional", label: "Professional: Businesslike and clear" },
			{ value: "friendly", label: "Friendly: Warm and welcoming" },
			{ value: "humorous", label: "Humorous: Lighthearted and funny" },
			{ value: "sarcastic", label: "Sarcastic: Witty or ironic" },
			{ value: "enthusiastic", label: "Enthusiastic: Energetic and excited" },
			{ value: "laid-back", label: "Laid-back: Relaxed and easygoing" },
		],
		description: "How does this persona generally sound?",
	},
	{
		type: "multipleChoice",
		id: "relationship",
		question: "Relationship to You",
		options: [
			{ value: "friend", label: "Friend" },
			{
				value: "sibling",
				label: "Sibling/Family: Brother/sister or other family member",
			},
			{ value: "colleague", label: "Colleague: Coworker or team member" },
			{
				value: "mentor",
				label: "Mentor/Teacher: Someone who guides or teaches you",
			},
			{
				value: "parent",
				label: "Parent/Guardian: Mother, father, or parental figure",
			},
			{
				value: "partner",
				label: "Romantic Partner: Boyfriend, girlfriend, spouse, etc.",
			},
			{
				value: "service",
				label: "Customer Service/Helper: Professional assistant or advisor",
			},
			{
				value: "stranger",
				label: "Stranger/Acquaintance: Someone you don't know well",
			},
			{ value: "custom", label: "Custom (Define Below)" }, // Updated label
		],
		description: "How do you relate to this persona?",
	},
	{
		type: "openEnded",
		id: "customRelationshipDetail", // New question
		question: "Custom Relationship Details",
		placeholder:
			"e.g., My childhood imaginary friend, The captain of my spaceship",
		required: false, // Will be conditionally required in UI if 'custom' relationship is chosen
		description:
			"If you selected 'Custom' for relationship, please describe it here.",
		maxLength: 100,
		condition: (formData) => formData.multipleChoice?.relationship === "custom", // Condition for display
	},
	{
		type: "multipleChoice",
		id: "communicationStyle",
		question: "Communication Style",
		options: [
			{ value: "concise", label: "Concise: To the point, brief" },
			{
				value: "detailed",
				label: "Detailed/Verbose: Gives lots of information and explanation",
			},
			{
				value: "enthusiastic",
				label: "Enthusiastic: Very energetic and positive",
			},
			{
				value: "reserved",
				label: "Reserved: Quiet and thoughtful, uses few words",
			},
			{
				value: "emotional",
				label: "Emotional: Expressive about feelings and moods",
			},
			{ value: "logical", label: "Logical: Rational and fact-focused" },
			{ value: "direct", label: "Direct: Straightforward and unambiguous" },
			{ value: "indirect", label: "Indirect: Subtle and suggestive" },
		],
		description: "How do they typically communicate?",
	},
	{
		type: "multipleChoice",
		id: "formalityLevel",
		question: "Formality Level",
		options: [
			{
				value: "veryFormal",
				label: "Very formal: Strictly adheres to etiquette",
			},
			{
				value: "somewhatFormal",
				label: "Somewhat formal: Mostly polite, moderately formal",
			},
			{ value: "neutral", label: "Neutral: Neither too formal nor too casual" },
			{
				value: "somewhatCasual",
				label: "Somewhat casual: Mostly informal but respectful",
			},
			{
				value: "veryCasual",
				label: "Very casual: Very informal, slang or colloquial",
			},
		],
		description: "How formal or informal is their language?",
	},
	{
		type: "multipleChoice",
		id: "pronouns",
		question: "Pronouns",
		options: [
			{ value: "he/him", label: "He/Him" },
			{ value: "she/her", label: "She/Her" },
			{ value: "they/them", label: "They/Them" },
			{ value: "ze/hir", label: "Ze/Hir" },
			{ value: "ze/zir", label: "Ze/Zir" },
			{ value: "other", label: "Other/Prefer not to say" },
		],
		description: "What are the persona's pronouns?",
	},
	{
		type: "multipleChoice",
		id: "ageGroup",
		question: "Age Group",
		options: [
			{ value: "child", label: "Child (Under 13)" },
			{ value: "teenager", label: "Teenager (13–19)" },
			{ value: "youngAdult", label: "Young Adult (20–35)" },
			{ value: "adult", label: "Adult (36–60)" },
			{ value: "senior", label: "Senior (61+)" },
			{ value: "ageless", label: "Ageless/Not Applicable" },
		],
		description: "What is the approximate age group of the persona?",
	},
	{
		type: "multipleChoice",
		id: "humorStyle",
		question: "Humor Style",
		options: [
			{ value: "none", label: "None/Straightforward" },
			{ value: "dry", label: "Dry: Subtle, deadpan humor" },
			{ value: "sarcastic", label: "Sarcastic: Irony or teasing" },
			{ value: "playful", label: "Playful/Goofy: Silly or playful jokes" },
			{ value: "dark", label: "Dark: Edgy or morbid humor" },
			{ value: "punny", label: "Punny/Wordplay: Loves puns and word jokes" },
			{
				value: "observational",
				label: "Observational: Comments on everyday life",
			},
			{
				value: "self-deprecating",
				label: "Self-deprecating: Makes fun of themselves",
			},
		],
		description: "What kind of humor, if any, do they use?",
	},
	{
		type: "multipleChoice",
		id: "personalityVibe",
		question: "General Personality Vibe",
		options: [
			{ value: "cheerful", label: "Cheerful/Optimistic" },
			{ value: "serious", label: "Serious/Calm" },
			{ value: "shy", label: "Shy/Introverted" },
			{ value: "outgoing", label: "Outgoing/Extroverted" },
			{ value: "witty", label: "Witty/Clever" },
			{ value: "analytical", label: "Analytical/Thoughtful" },
			{ value: "independent", label: "Independent/Rebellious" },
			{ value: "caring", label: "Caring/Empathetic" },
			{ value: "creative", label: "Creative/Artistic" },
			{ value: "pragmatic", label: "Pragmatic/Realistic" },
		],
		description: "What's their overall demeanor?",
	},
	{
		type: "openEnded",
		id: "personalityDescription",
		question: "Describe the Persona's Personality",
		placeholder: "e.g., Thoughtful but impatient, loves to learn new things.",
		required: false,
		description: "A few adjectives or a short description.", // Removed (Max 200 characters)
		maxLength: 200, // Added maxLength
	},
	{
		type: "openEnded",
		id: "catchphrases",
		question: "Catchphrases or Common Phrases",
		placeholder: 'e.g., "That\'s awesome!", "Let\'s get to it."',
		required: false,
		description: "Words or sayings they often use. (Separate with commas)",
		maxLength: 150, // Added maxLength
	},
	{
		type: "openEnded",
		id: "story",
		question: "Important Story or Memory",
		placeholder:
			"e.g., The time we went hiking and got lost, but found a hidden waterfall.",
		required: false,
		description: "A personal story or memory that defines them.", // Removed (Max 300 characters)
		maxLength: 300, // Added maxLength
	},
	{
		type: "openEnded",
		id: "passions",
		question: "Passionate Topics",
		placeholder: "e.g., Classic films, quantum physics, urban gardening.",
		required: false,
		description:
			"Subjects they are deeply interested in. (Separate with commas)",
		maxLength: 200, // Added maxLength
	},
	{
		type: "openEnded",
		id: "humor",
		question: "Sense of Humor Details",
		placeholder:
			"e.g., Loves dad jokes, often uses puns, finds irony in everyday situations.",
		required: false,
		description: "Elaborate on their humor style if needed.", // Removed (Max 150 characters)
		maxLength: 150, // Added maxLength
	},
	{
		type: "openEnded",
		id: "favorites",
		question: "Favorite Things",
		placeholder: "e.g., Playing piano, Thai food, rainy days, sci-fi novels.",
		required: false,
		description:
			"Hobbies, food, music, activities, etc. (Separate with commas)",
		maxLength: 200, // Added maxLength
	},
	{
		type: "openEnded",
		id: "quirks",
		question: "Quirks or Habits",
		placeholder:
			"e.g., Always taps fingers when thinking, collects vintage maps.",
		required: false,
		description: "Unique mannerisms or habits. (Separate with commas)",
		maxLength: 200, // Added maxLength
	},
	{
		type: "openEnded",
		id: "other",
		question: "Anything Else Notable",
		placeholder: "e.g., Grew up in a small town, has a pet corgi named Sparky.",
		required: false,
		description: "Other details or preferences that make them unique.", // Removed (Max 200 characters)
		maxLength: 200, // Added maxLength
	},
];

// For the edit page, we might want them separated
export const multipleChoiceQuestions = allQuestions.filter(
	(q) => q.type === "multipleChoice"
);
export const openEndedQuestions = allQuestions.filter(
	(q) => q.type === "openEnded"
);

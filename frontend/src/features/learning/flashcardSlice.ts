import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api';

export interface Flashcard {
    id?: number;
    deck: number;
    front: string;
    back: string;
    front_image?: string | null;
    back_image?: string | null;
    created_at?: string;
}

export interface FlashcardDeck {
    id?: number;
    title: string;
    sub_assign: number;
    created_by?: number;
    created_at?: string;
    cards: Flashcard[];
    is_ai_generated?: boolean;
}

interface FlashcardState {
    flashcard_decks: FlashcardDeck[];
    isLoading: boolean;
    isCardLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const initialState: FlashcardState = {
    flashcard_decks: [],
    isLoading: false,
    isCardLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
}

// Flashcard Deck Thunks
export const fetchFlashcardDecks = createAsyncThunk(
    'flashcard/fetchDecks',
    async (params: { grade?: string | number, subject?: string | number } | undefined, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/learning/decks/', { params });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || 'Failed to fetch decks.');
        }
    }
);

export const createFlashcardDeck = createAsyncThunk(
    'flashcard/createDeck',
    async (deckData: Partial<FlashcardDeck>, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/learning/decks/', deckData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.grade || "Failed to create deck.");
        }
    }
);

export const updateFlashcardDeck = createAsyncThunk(
    'flashcard/updateDeck',
    async ({ deckId, deckData }: { deckId: number; deckData: Partial<FlashcardDeck> }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/api/learning/decks/${deckId}/`, deckData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to update deck.");
        }
    }
);

export const deleteFlashcardDeck = createAsyncThunk(
    'flashcard/deleteDeck',
    async (deckId: number, { rejectWithValue }) => {
        try {
            await api.delete(`/api/learning/decks/${deckId}/`);
            return deckId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to delete deck.");
        }
    }
);

// Flashcard Thunks
export const createFlashcard = createAsyncThunk(
    'flashcard/createCard',
    async (cardData: Partial<Flashcard>, { rejectWithValue }) => {
        try {
            const response = await api.post('/api/learning/flashcards/', cardData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to create flashcard.");
        }
    }
);

export const updateFlashcard = createAsyncThunk(
    'flashcard/updateCard',
    async ({ cardId, cardData }: { cardId: number; cardData: Partial<Flashcard> }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/api/learning/flashcards/${cardId}/`, cardData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to update flashcard.");
        }
    }
);

export const deleteFlashcard = createAsyncThunk(
    'flashcard/deleteCard',
    async (cardId: number, { rejectWithValue }) => {
        try {
            await api.delete(`/api/learning/flashcards/${cardId}/`);
            return cardId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data || "Failed to delete flashcard.");
        }
    }
);

const flashcardSlice = createSlice({
    name: 'flashcard',
    initialState,
    reducers: {
        resetFlashcardState: (state) => {
            state.isLoading = false;
            state.isCardLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFlashcardDecks.pending, (state) => { state.isLoading = true; })
            .addCase(fetchFlashcardDecks.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.flashcard_decks = action.payload;
            })
            .addCase(fetchFlashcardDecks.rejected, (state, action: any) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || "Could not load decks.";
            })
            .addCase(createFlashcardDeck.fulfilled, (state, action) => {
                state.flashcard_decks.unshift(action.payload);
            })
            .addCase(updateFlashcardDeck.fulfilled, (state, action) => {
                const index = state.flashcard_decks.findIndex(d => d.id === action.payload.id);
                if (index !== -1) {
                    state.flashcard_decks[index] = { ...state.flashcard_decks[index], ...action.payload };
                }
            })
            .addCase(deleteFlashcardDeck.fulfilled, (state, action) => {
                state.flashcard_decks = state.flashcard_decks.filter(d => d.id !== action.payload);
            })
            .addCase(createFlashcard.pending, (state) => { state.isCardLoading = true; })
            .addCase(createFlashcard.fulfilled, (state, action) => {
                state.isCardLoading = false;
                const deck = state.flashcard_decks.find(d => d.id === action.payload.deck);
                if (deck) {
                    deck.cards.push(action.payload);
                }
            })
            .addCase(updateFlashcard.pending, (state) => { state.isCardLoading = true; })
            .addCase(updateFlashcard.fulfilled, (state, action) => {
                state.isCardLoading = false;
                const deck = state.flashcard_decks.find(d => d.id === action.payload.deck);
                if (deck) {
                    const cardIndex = deck.cards.findIndex(c => c.id === action.payload.id);
                    if (cardIndex !== -1) {
                        deck.cards[cardIndex] = action.payload;
                    }
                }
            })
            .addCase(updateFlashcard.rejected, (state, action: any) => {
                state.isCardLoading = false;
                state.isError = true;
                state.message = action.payload || "Failed to update flashcard.";
            })
            .addCase(deleteFlashcard.fulfilled, (state, action) => {
                state.flashcard_decks.forEach(d => {
                    d.cards = d.cards.filter(c => c.id !== action.payload);
                });
            });
    }
});

export const { resetFlashcardState } = flashcardSlice.actions;
export default flashcardSlice.reducer;
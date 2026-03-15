import { Settings2, Trash2, Edit2, SquareStack, Layers2, Eye } from "lucide-react";
import { useDispatch } from "react-redux";
import { type FlashcardDeck, deleteFlashcardDeck } from '../../features/learning/flashcardSlice';
import { type AppDispatch } from "../../store";
import { addToast } from "../../features/toasts/toastSlice";
import { DecisionPopup } from '../decision popup';
import { ActionButton } from '../Buttons/actionButton';

interface FlashcardDeckCardProps {
    deck: FlashcardDeck;
    onEdit: (deck: FlashcardDeck) => void;
    onModify: (deck: FlashcardDeck) => void;
    onPreview: (deck: FlashcardDeck) => void;
}

export const FlashcardDeckCard = ({ deck, onEdit, onModify, onPreview }: FlashcardDeckCardProps) => {
    const { openDecidePopup, DecidePopup } = DecisionPopup();
    const dispatch = useDispatch<AppDispatch>();

    const handleDelete = () => {
        openDecidePopup({
            question: `Permanently delete deck '${deck.title}'?`,
            confirmText: "Yes, Delete",
            cancelText: "Cancel",
            variant: 'primary',
            onConfirm: async () => {
                const resultAction = await dispatch(deleteFlashcardDeck(deck.id!));
        
                if (deleteFlashcardDeck.fulfilled.match(resultAction)) {
                    dispatch(addToast({
                        message: `Deck '${deck.title}' deleted successfully`,
                        type: 'success'
                    }));
                }
            }
        });
    };

    return (
        <div className="w-full bg-surface border-3 border-light/10 rounded-xl p-3 hover:-translate-y-1 transition-all duration-300 group flex flex-col hover:shadow-md hover:border-primary hover:shadow-primary/50">

            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <SquareStack size={32} />
                    </div>
                    <div>
                        <h3 className="font-bold sm:text-lg text-primary" title={deck.title}>
                            {deck.title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <Layers2 size={15} className="text-primary" />
                            <span className="text-primary">{deck.cards.length} Cards</span>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={() => onPreview(deck)}
                    className="p-2 h-full flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all cursor-pointer"
                    title="View Deck"
                >
                    <Eye size={25} strokeWidth={2.5} />
                </button>
            </div>
            
            <div className="flex gap-2 lg:gap-0 justify-between">
                <ActionButton
                    label='Edit'
                    Icon={Edit2}
                    variant='custom'
                    onClick={() => onEdit(deck)}
                />
                <ActionButton
                    label='Manage'
                    Icon={Settings2}
                    variant='custom'
                    onClick={() => onModify(deck)}
                />
                <ActionButton
                    label='Delete'
                    Icon={Trash2}
                    variant='failure'
                    onClick={handleDelete}
                />
            </div>
            <DecidePopup />
        </div>
    );
};
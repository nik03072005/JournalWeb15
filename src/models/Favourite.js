import mongoose from 'mongoose';

const FavouriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    itemType: {
        type: String,
        enum: {
            values: ['doaj', 'doaj-journal', 'doab', 'local', 'journal', 'book', 'paper'],
            message: 'Invalid item type: {VALUE}. Must be one of: doaj, doaj-journal, doab, local, journal, book, paper'
        },
        required: [true, 'Item type is required']
    },
    itemId: {
        type: String,
        required: [true, 'Item ID is required']
    },
    itemTitle: {
        type: String,
        required: [true, 'Item title is required']
    },
    itemUrl: {
        type: String,
        required: [true, 'Item URL is required']
    },
    action: {
        type: String,
        enum: {
            values: ['view', 'download', 'bookmark'],
            message: 'Invalid action: {VALUE}. Must be one of: view, download, bookmark'
        },
        default: 'bookmark'
    }
}, {
    timestamps: true
});

// Create compound index for efficient queries and prevent duplicates
FavouriteSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });

// Clear any existing model to ensure schema updates
if (mongoose.models.Favourite) {
    delete mongoose.models.Favourite;
}

const Favourite = mongoose.model('Favourite', FavouriteSchema);

export default Favourite;


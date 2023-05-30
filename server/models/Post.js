const moongoose = require('mongoose');
const { Schema, model } = moongoose;

const PostSchema = new Schema({
    title: String,
    summary: String,
    content: String,
    cover: String,
    author: {type: Schema.Types.ObjectId,ref:'User'},
}, {
    timestamps: true,
});

const PostModel = model('Post', PostSchema);

module.exports = PostModel;
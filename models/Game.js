const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameSchema = new Schema({
    score: {type: Number, required: true},
    rounds: {type: Number, required: true},
    areasSelected: [{type: Schema.Types.ObjectId, ref: "Area"}],
    choiceHistory: [{
        userLatLng:[{type: Number, required: true}, {type: Number, required: true}],
        actualLatLng: [{type: Number, required: true}, {type: Number, required: true}]
    }]
});

module.exports = mongoose.model("Game", GameSchema);
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    highScore: {type: Number, default: 0},
    gameHistory: [{type: Schema.Types.ObjectId, ref: "Game"}],
})

module.exports = mongoose.model("User", UserSchema);


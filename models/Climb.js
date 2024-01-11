const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ClimbSchema = new Schema({
    name: {type: String, required: true},
    lat: {type: Number, required: true},
    lng: {type: Number, required: true},
    grade: String,
    main_area: {type: Schema.Types.ObjectId, ref: "Area"},
    zone: String
})

module.exports = mongoose.model("Climb", ClimbSchema);
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AreaSchema = new Schema({
    name: {type: String, required: true},
    lat: {type: Number},
    lng: {type: Number},
    climbs: [{type: Schema.Types.ObjectId, ref: "Climb"}]
})

module.exports = mongoose.model("Area", AreaSchema);
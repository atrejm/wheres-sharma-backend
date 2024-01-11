var express = require('express');
var cors = require('cors');
var router = express.Router();
const asyncHandler = require('express-async-handler')
const Climb = require("../models/Climb");
const Area = require("../models/Area");
const distanceBetween = require("../helpers/distanceHelper");
const _ = require('lodash');
const { Schema } = require('mongoose');
const { ObjectId } = require('mongodb');
const Game = require("../models/Game");
const User = require("../models/User");
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const passport = require('passport');

const corsOptions = {
    origin: "*",
    optionsSuccessStatus: 200
}

router.post('/', cors(corsOptions), asyncHandler(async (req, res, next) => {
    const targetClimb = await Climb.findById(req.body.target_id);
    const distanceKM = distanceBetween(req.body.lat, req.body.lng,
                                        targetClimb.lat, targetClimb.lng);

    res.send({distance:distanceKM, correct_climb:targetClimb});
}));
  
router.post('/climbs/', cors(corsOptions), asyncHandler(async (req, res, next) => {
    // options for endpoint:
    // {trim_data:bool, default false <- will return full climb data by default, flag will limit to just {name, _id} 
    // {area_id: ObjectID}
    const mainArea = await Area.findById(req.body.area_id);
    
    let climbs;
    if (req.body.trim_data) {
        climbs = await Climb.find({main_area: mainArea}, 'name _id zone grade').exec()
    } else {
        climbs = await Climb.find({}).exec();
    }
    
    res.send(climbs);
}));

router.post('/populateboulders/', cors(corsOptions), asyncHandler(async (req, res, next) => {    
    console.log(req.body);
    const numBouldersRequested = req.body.numClimbsRequested;
    const idsToQuery = [];
    req.body.areas.forEach((area) => idsToQuery.push(new ObjectId(area._id)))
    const climbsFromProvidedAreas = await Climb.find({main_area: { "$in" : idsToQuery}})

    const climbs = [];
    for (let i = 0; i < numBouldersRequested; i++) {
        climbs.push(climbsFromProvidedAreas[_.random(climbsFromProvidedAreas.length-1)]);
    }
    
    res.send(climbs);
}));

router.get('/areas', cors(corsOptions), asyncHandler(async (req, res, next) => {
    const areas = await Area.find({}, "name lat lng");
    
    res.json(areas);
}));

router.post('/register', cors(corsOptions), asyncHandler(async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    const userAlreadyExists = await User.findOne({username:username});
    if(userAlreadyExists) {
        res.json({error: "Username Taken"})
        return;
    }

    console.log(req.body);
    let user;
    await bcrypt.hash(password, saltRounds, async (err, hash) => {
        user = new User({
            username: username,
            password: hash,
        });

        console.log(user);
        await user.save();

        const token = jwt.sign({sub: user._id}, "secretkey");
        res.json({
            jwtToken: token,
            user: user});
    });
}));

router.post('/login', cors(corsOptions), asyncHandler(async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;
    const user = await User.findOne({username: username});

    if(!user) {
        res.json({error: "User not found"})
        return;
    }

    bcrypt.compare(password, user.password, (err, auth) => {
        if (auth === true) {
            //res.json({user: "authenticated"});
            const token = jwt.sign({sub: user._id}, "secretkey");
            res.json({ 
                    jwtToken: token,
                    user: user });
        } else {
            res.json({error: "Incorrect Password"});
        }
    })

}));

router.post('/uploadscore', cors(corsOptions), [
    passport.authenticate('jwt', {session: false}),

    asyncHandler(async (req, res, next) => {
        console.log(req.body);
        const user = await User.findById(req.body.id);
        if (req.body.score > user.highScore) {
            user.highScore = req.body.score;
        }

        user.save();

        res.json("Score Successfully Uploaded");
    }
)]);

router.get('/highscores', cors(corsOptions), asyncHandler(async (req, res, next) => {
    const users = await User.aggregate([
        { $sort:{ highScore: -1 }},
        { $limit:10}
        
    ])
    
    console.log(users);
    res.json(users);
}));

module.exports = router;
const graphql = require("graphql");
const Climb = require("./models/Climb");
const Area = require("./models/Area")
const { default: mongoose } = require("mongoose");
require('dotenv').config();

function buildQuery(area) {
  const query = `query MyQuery {
    areas(filter: {area_name: {match: "${area}", exactMatch: true}}) {
      area_name
      children {
        area_name
        climbs {
          name
          grades {
            vscale
          }
          metadata {
            lat
            lng
          }
        }
      }
      metadata {
        lat
        lng
      }
    }
  }`

  return query;
}



async function addClimbs(areas){
    const climbsToAdd = [];
    console.log(areas.area_name);
    const mainzone = areas.area_name;

    let areaModel = await Area.findOne({name: areas.area_name});
    if(!areaModel) {
      // add area to DB
      console.log(`Adding ${areas.area_name} area to DB`)
      areaModel = new Area({
        name: areas.area_name,
        climbs: []}) 
    }

    areas.children.forEach(element => {
      const zone = element.area_name;
      const lat = element.metadata.lat;
      const lng = element.metadata.lng;
      element.climbs.forEach(climb => {
        const name = climb.name;
        const grade = climb.grades.vscale;

        const climbToAdd = new Climb({
          name: name,
          grade: grade,
          lat: lat,
          lng: lng,
          main_area: areaModel,
          zone: zone,
        })

        climbsToAdd.push(climbToAdd);
      })
    });

    areaModel.climbs = [...climbsToAdd];
    await areaModel.save();
    await Climb.bulkSave(climbsToAdd);
}


async function searchAndAddClimbs(area_name) {
    const query = buildQuery(area_name);
    const response = await fetch("https://stg-api.openbeta.io/", {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({query})
    });

    const responseJSON = await response.json();
    if(responseJSON.errors) {
      console.log(responseJSON);
      return;
    }
    
    return responseJSON;
    await addClimbs(responseJSON.data.areas[0]);
}

async function populateRedRock() {
  let mainArea = await Area.findOne({name: "Red Rock"});
  if(!mainArea){
    mainArea = new Area({
      name: "Red Rock",
      lat: 36.1605092,
      lng: -115.4172480,
      climbs: []
    })

    console.log("Saving: ", mainArea);
    await mainArea.save();
  }


  const climbsToAdd = [];
  data.areas.forEach((area) => {
    console.log(`Area: ${area.area_name}`)
    area.children.forEach((zone) => {
      console.log(`\tZone: ${zone.area_name}`)
      zone.climbs.forEach((climb) => {
        console.log(`\t\tClimb: ${climb.name}\n\t\tGrade: ${climb.grades.vscale}\n\t\tLat: ${climb.metadata.lat} Lng: ${climb.metadata.lng}`)
        console.log(`\t\t--------------------`)
        const climbToAdd = new Climb({
          name: climb.name,
          grade: climb.grades.vscale,
          lat: climb.metadata.lat,
          lng: climb.metadata.lng,
          zone: zone.area_name,
          main_area: mainArea
        });
        mainArea.climbs.push(climbToAdd);
        climbsToAdd.push(climbToAdd);
      })
    })
  })
}

main().catch((err) => console.log(err));
async function main() {
  mongoose.set("strictQuery", false);
  await mongoose.connect(process.env.MONGO_DB_DEV);
  const responseJSON = await searchAndAddClimbs("Right Fork");
  const data = responseJSON.data;

  let mainArea = await Area.findOne({name: "Joe's Valley"});
  if(!mainArea){
    mainArea = new Area({
      name: "Joe's Valley",
      lat: 39.277227757, 
      lng: -111.17629476,
      climbs: []
    })

    console.log("Saving: ", mainArea);
    await mainArea.save();
  }


  const climbsToAdd = [];
  data.areas.splice(0, 1); // had to do this for joe's cause there are multiple places called "Right Fork"
  data.areas.forEach((area) => {
    console.log(`Area: ${area.area_name}`)
    area.children.forEach((zone) => {
      console.log(`\tZone: ${zone.area_name}`)
      zone.climbs.forEach((climb) => {
        console.log(`\t\tClimb: ${climb.name}\n\t\tGrade: ${climb.grades.vscale}\n\t\tLat: ${climb.metadata.lat} Lng: ${climb.metadata.lng}`)
        console.log(`\t\t--------------------`)
        const climbToAdd = new Climb({
          name: climb.name,
          grade: climb.grades.vscale,
          lat: climb.metadata.lat,
          lng: climb.metadata.lng,
          zone: zone.area_name,
          main_area: mainArea
        });
        mainArea.climbs.push(climbToAdd);
        climbsToAdd.push(climbToAdd);
      })
    })
  })

  await mainArea.save();
  await Climb.bulkSave(climbsToAdd);

  await mongoose.disconnect();
}

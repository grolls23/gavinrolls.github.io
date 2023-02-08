var margin = {top: 20, right: 10, bottom: 40, left: 100},
    width = 900 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("svg")
    .attr("width", width + 400 + margin.left + margin.right)
    .attr("height", height + 200 + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

var projection = d3.geoAlbersUsa()
    .translate([width / 2 - margin.left, height / 2]);

var range = ["#F8CAEE"]

//To track state of vis
var circleMode = "deaths";

var promises = []
var data = d3.map();
promises.push(d3.json("https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json"))
promises.push(d3.csv("MassShootingsDatabase_1982_2022_postoncanvas.csv"))
myDataPromises = Promise.all(promises).then(function(my_data) {
   
  var topo = my_data[0]
  svg.append("g")
    .selectAll("path")
  
    .data(topo.features)
    .enter()
    .append("path")
    .attr("class", "topo")
    .attr("d", d3.geoPath()
      .projection(projection)
    )
    .attr("fill", "#D3D3D3")
    .attr("stroke", "#FFFFFF")

  //Sort circles to solve problem of circle overlap
  my_data[1].sort(function(a,b) {
    if (+a.Fatalities > +b.Fatalities)
      return -1;
    if (+a.Fatalities < +b.Fatalities)
      return 1;
    return 0;
  });

  //Add circles and position/size them
  svg.selectAll("circle")
    .data(my_data[1])
    .enter()
    .append("circle")
    .attr('cx', function(d){
      return projection([d["Longitude"], d["Latitude"]])[0]
    })
    .attr('cy', function(d){
      return projection([d["Longitude"], d["Latitude"]])[1]
    })
    .attr('r', function(d){
      //Call with 3x fatalities to scale circle area true to number of fatalities
      return (calcFlanneryRadius(3*d.Fatalities));
    })
    .style("fill", "blue")
    .style("opacity", .4)

    .on("mouseover", function() {
      d3.select(this)
        .call(selectDot);
      })
    .on("mouseleave", function() {
      d3.select(this)
        .call(restoreDots);
      });

  //Overview Text
  svg.append("text")
    .attr("x", 700)
    .attr("class", "overview")
    .text("Between 1982 and 2022, the United States has experienced");

  svg.append("text")
    .attr("x", 700)
    .attr("y", 40)
    .attr("class", "numberMassShooting")
    .text("137 Mass Shootings");

  svg.append("text")
    .attr("x", 700)
    .attr("y", 65)
    .attr("class", "overview")
    .text("resulting in");

  svg.append("text")
    .attr("x", 700)
    .attr("y", 105)
    .attr("class", "numberInjury")
    .text("1,592 Injuries");    

  svg.append("text")
    .attr("x", 700)
    .attr("y", 130)
    .attr("class", "overview")
    .text("and");
  
  svg.append("text")
    .attr("x", 700)
    .attr("y", 170)
    .attr("class", "numberDeath")
    .text("1,086 Deaths");   

  svg.append("text")
    .attr("x", 700)
    .attr("y", 195)
    .attr("class", "detailField")
    .text("Mouse over a circle to reveal");

  svg.append("text")
    .attr("x", 700)
    .attr("y", 210)
    .attr("class", "detailField")
    .text("the details of each one.");

  //Code for Timeline
  var timelineScale = d3.scaleLinear().domain([1981.5, 2022.5]).range([0, 700]);
  var timelineAxis = d3.axisBottom().scale(timelineScale).tickFormat(d3.format("d"));

  svg.append("g")
    .attr("transform", "translate(-50,600)")
    .call(timelineAxis)

  svg.append("text")
    .attr("x", 185)
    .attr("y", 640)
    .attr("class", "overview")
    .text("Cumulative Shooting Deaths by Year");

  //To track shootings per year
  var yearArray = new Array(41).fill(0);;

  svg.selectAll("rect")
    .data(my_data[1])
    .enter()
    .append("rect")
    .attr('x', function(d){
      return timelineScale(d.Year) - 54.5;
    })
    .attr('y', function(d){
      yearArray[d.Year - 1982] = yearArray[d.Year - 1982] + +d.Fatalities;
      return 600 - yearArray[d.Year - 1982];
    })
    .attr('width', 10)
    .attr('height', function(d){
      return d.Fatalities;
    })
    .style("fill", "blue")
    .style("opacity", .4)
    .style("stroke", "black")
      
    .on("mouseover", function() {
      d3.select(this)
        .call(selectDot);
      })
    .on("mouseleave", function() {
      restoreDots();
    });

    //Labels on bar chart
    var year = 1982;
    yearArray.forEach(function() {
      if(yearArray[year - 1982] != 0) {
        svg.append("text")
          .attr("class", "barLabel")
          .attr("x", function(){

            //Needed to space numbers of different lengths
            var xAdjustment = 54.5
            if (yearArray[year - 1982] > 99) {
              xAdjustment += 1;
            } else if (yearArray[year - 1982] < 10) {
              xAdjustment -= 2.5;
            }
            return timelineScale(year) - xAdjustment;
          })
          .attr("y", function(){
            return 600 - yearArray[year - 1982] - 5
          })
          .text(function(){
            return yearArray[year - 1982]
          })
      }
      year++
    })
});

//Hover behaviour
function selectDot(selection) {

  var circles = svg.selectAll("circle");
  circles.each(function(d){
    if(d.Case == selection.data()[0].Case) {
      d3.select(this)
      .style("fill", function() {

        //Adjust highlighting by circle mode selected - don't change rect fill
        if (circleMode == "deaths") {
          return "red";
        } else if (circleMode == "injuries") {
          return "orange";
        } else {
          return "#FF5349";
        }
        })
      .style("stroke", "black");
    }
  })

  var rects = svg.selectAll("rect")
  rects.each(function(d){
    if(d.Case == selection.data()[0].Case) {
      d3.select(this)
      .style("fill", "red")
      .style("stroke", "black");
    }
  })

  //Remove helper text
  svg.selectAll(".detailField").remove();

  //Shooting-specific info
  svg.append("text")
    .attr("x", 700)
    .attr("y", 225)
    .attr("class", "shootingName")
    .text(selection.data()[0].Case);

  svg.append("text")
    .attr("x", 700)
    .attr("y", 245)
    .attr("class", "detailField")
    .text(selection.data()[0].Date);

  svg.append("text")
    .attr("x", 700)
    .attr("y", 265)
    .attr("class", "detailField")
    .text(selection.data()[0].Location);

  svg.append("text")
    .attr("x", 700)
    .attr("y", 285)
    .attr("class", "detailField")
    .text(function() {
      if(selection.data()[0].LocationType == "Other") {
        return "No Shooting Type";
      }
      return selection.data()[0].LocationType + " Shooting";
    });

    svg.append("text")
      .attr("x", 700)
      .attr("y", 310)
      .attr("class", "killed")
      .text(selection.data()[0].Fatalities + " Killed");

    svg.append("text")
      .attr("x", 700)
      .attr("y", 330)
      .attr("class", "injured")
      .text(selection.data()[0].Injuries + " Injured");

    //Victim circles for each shooting
    for(let i = 0; i < +selection.data()[0].Fatalities + +selection.data()[0].Injuries; i++) {

      victimCircleX = 705 + 15 * (i % 30);
      victimCircleY = 350 + 15 * Math.floor(i / 30);

      svg.append("circle")
        .attr('cx', victimCircleX)
        .attr('cy', victimCircleY)
        .attr('r', 5)
        .attr("class", "victim")
        .style("fill", function(){
          //Distinguish between death and injury dots
          return (i < selection.data()[0].Fatalities) ? "red" : "orange"
        })
        .style("opacity", .7)
    }

}

//Hover finished behaviour
function restoreDots() {

  //Remove victim dots, de-select circle/bar graph, etc..
  svg.selectAll(".victim").remove();

  svg.selectAll("circle")
    .style("fill", "blue")
    .style("stroke", "");

  svg.selectAll("rect")
    .style("fill", "blue")

  svg.selectAll(".shootingName, .detailField, .killed, .injured").remove();

  //Restore helper text
  svg.append("text")
    .attr("x", 700)
    .attr("y", 225)
    .attr("class", "detailField")
    .text("Mouse over a circle to reveal");

  svg.append("text")
    .attr("x", 700)
    .attr("y", 240)
    .attr("class", "detailField")
    .text("shooting details");

}

//Scales circle radius in accordance with Flannery's compensation
var calcFlanneryRadius = function(x) {
  var flannery = 0.57;
  var log = Math.log(x);
  var r = log * flannery;
  r = Math.exp(r);
  return (r);
};

//Change circle to show injuries vs deaths vs both
function changeCircleMode(mode) {
  if (mode == "injuries") {
    circleMode = "injuries";
    svg.selectAll("circle")
    .transition()
    .duration(1000)
    .attr("r", function(d){
      return (calcFlanneryRadius(3 * d.Injuries))
    })
    .attr();

    //Sort circles to solve problem of circle overlap
    var sortedCircles = svg.selectAll("circle").sort(function(a,b) {
      if (+a.Injuries > +b.Injuries)
        return -1;
      if (+a.Injuries < +b.Injuries)
        return 1;
      return 0;
    });

    sortedCircles.forEach(this.raise());

  }
  if (mode == "deaths") {
    circleMode = "deaths";
    svg.selectAll("circle")
    .transition()
    .duration(1000)
    .attr("r", function(d){
      return (calcFlanneryRadius(3*d.Fatalities));
    });

    //Sort circles to solve problem of circle overlap
    var sortedCircles = svg.selectAll("circle").sort(function(a,b) {
      if (+a.Fatalities > +b.Fatalities)
        return -1;
      if (+a.Fatalities < +b.Fatalities)
        return 1;
      return 0;
    });

    sortedCircles.forEach(this.raise());

  } else if (mode == "total") {
    circleMode = "total";
    svg.selectAll("circle")
    .transition()
    .duration(1000)
    .attr("r", function(d){
        return (d ? calcFlanneryRadius(3 * d.Injuries + 3 * d.Fatalities): 0)
    })}

    //Sort circles to solve problem of circle overlap
    var sortedCircles = svg.selectAll("circle").sort(function(a,b) {
      if (+a.Injuries + +a.Fatalities > +b.Injuries + +b.Fatalities)
        return -1;
      if (+a.Injuries + +a.Fatalities < +b.Injuries + +b.Fatalities)
        return 1;
      return 0;
    });

    sortedCircles.forEach(this.raise());
  
}
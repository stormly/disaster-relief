let li = document.querySelectorAll("sidebar ul li");
let mapAreaSections = document.querySelectorAll(".map-area span");
let abc = document.querySelectorAll(".geolocator_button");

for (let i = 0; i < li.length; i++) {
  li[i].addEventListener("click", function() {
    hideMaps();
    showMap(i);
  });
}

function hideMaps(e) {
  for (var i = 0; i < mapAreaSections.length; i++) {
    mapAreaSections[i].style.display = "none";
  }
}

function showMap(i) {
  mapAreaSections[i].style.display = "block";
}


console.log('abc', abc);

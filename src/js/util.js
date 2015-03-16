
function displayElement(id, display) {
    if (typeof(display) === "undefined") {
        display = "switch";
    }
    var element = document.getElementById(id);
    if (display === "switch") {
        element.style.display = (element.style.display === "none") ? "" : "none";
    } else {
        element.style.display = display;
    }
}
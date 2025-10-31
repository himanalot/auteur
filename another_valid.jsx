// Another valid script
alert("Starting script...");

var comp = app.project.activeItem;
if (comp && comp instanceof CompItem) {
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        layer.enabled = false;
    }
}

alert("Script completed!"); 
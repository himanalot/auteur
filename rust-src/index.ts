/// <reference types="types-for-adobe/AfterEffects/2018"/>

// Example function with type checking
function createTextLayer(comp: CompItem, text: string): TextLayer {
    if (!comp) {
        throw new Error("No composition provided");
    }
    
    const textLayer = comp.layers.addText(text);
    const textProp = textLayer.property("Source Text") as TextProperty;
    const textDocument = textProp.value as TextDocument;
    
    textDocument.fontSize = 72;
    textDocument.fillColor = [1, 1, 1];
    textProp.setValue(textDocument);
    
    return textLayer;
}

// Example usage
function main(): void {
    try {
        const activeComp = app.project.activeItem as CompItem;
        if (!activeComp) {
            alert("Please select a composition");
            return;
        }
        
        app.beginUndoGroup("Create Text Layer");
        const layer = createTextLayer(activeComp, "Hello World!");
        layer.position.setValue([activeComp.width/2, activeComp.height/2]);
        app.endUndoGroup();
        
    } catch (error) {
        alert("Error: " + error.toString());
    }
}

main(); 
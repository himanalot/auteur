/**
 * Cursor Fix for After Effects
 * Run this script when cursor gets stuck in "hand open" state after tool calls
 */

function fixStuckCursor() {
    try {
        // Method 1: Clear viewer states
        app.activeViewer = null;
        
        // Method 2: Refresh active composition
        if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
            var comp = app.project.activeItem;
            comp.openInViewer();
        }
        
        // Method 3: Force UI refresh
        app.redraw();
        
        // Method 4: Clear any pending operations
        app.scheduleTask("", 1, false);
        
        // Method 5: Simulate escape key (clear modal states)
        try {
            app.executeCommand(2); // ESC command ID
        } catch (e) {
            // Ignore if command not available
        }
        
        return "✅ Cursor reset complete - cursor should now be normal";
        
    } catch (error) {
        return "❌ Error fixing cursor: " + error.toString();
    }
}

// Execute the fix
alert(fixStuckCursor()); 
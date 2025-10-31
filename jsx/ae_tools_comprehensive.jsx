/**
 * After Effects Comprehensive AI Tools Registry
 * Modular tool collection with all possible After Effects operations
 */

// Load all tool modules
#include "tools/project_tools.jsx"
#include "tools/composition_tools.jsx"
#include "tools/layer_tools.jsx"
#include "tools/animation_tools.jsx"
#include "tools/effects_tools.jsx"
#include "tools/text_tools.jsx"
#include "tools/render_tools.jsx"
#include "tools/shape_tools.jsx"
#include "tools/mask_tools.jsx"

// Comprehensive tools registry
var AE_TOOLS_COMPREHENSIVE = {};

// Merge all tool categories
function mergeTools(targetObj, sourceObj) {
    for (var key in sourceObj) {
        if (sourceObj.hasOwnProperty(key)) {
            targetObj[key] = sourceObj[key];
        }
    }
}

// Load all tool categories with fallback error handling
try {
    if (typeof PROJECT_TOOLS !== 'undefined') mergeTools(AE_TOOLS_COMPREHENSIVE, PROJECT_TOOLS);
} catch (e) {
    // Project tools not loaded
}

try {
    if (typeof COMPOSITION_TOOLS !== 'undefined') mergeTools(AE_TOOLS_COMPREHENSIVE, COMPOSITION_TOOLS);
} catch (e) {
    // Composition tools not loaded
}

try {
    if (typeof LAYER_TOOLS !== 'undefined') mergeTools(AE_TOOLS_COMPREHENSIVE, LAYER_TOOLS);
} catch (e) {
    // Layer tools not loaded
}

try {
    if (typeof ANIMATION_TOOLS !== 'undefined') mergeTools(AE_TOOLS_COMPREHENSIVE, ANIMATION_TOOLS);
} catch (e) {
    // Animation tools not loaded
}

try {
    if (typeof EFFECTS_TOOLS !== 'undefined') mergeTools(AE_TOOLS_COMPREHENSIVE, EFFECTS_TOOLS);
} catch (e) {
    // Effects tools not loaded
}

try {
    if (typeof TEXT_TOOLS !== 'undefined') mergeTools(AE_TOOLS_COMPREHENSIVE, TEXT_TOOLS);
} catch (e) {
    // Text tools not loaded
}

try {
    if (typeof RENDER_TOOLS !== 'undefined') mergeTools(AE_TOOLS_COMPREHENSIVE, RENDER_TOOLS);
} catch (e) {
    // Render tools not loaded
}

try {
    if (typeof SHAPE_TOOLS !== 'undefined') mergeTools(AE_TOOLS_COMPREHENSIVE, SHAPE_TOOLS);
} catch (e) {
    // Shape tools not loaded
}

try {
    if (typeof MASK_TOOLS !== 'undefined') mergeTools(AE_TOOLS_COMPREHENSIVE, MASK_TOOLS);
} catch (e) {
    // Mask tools not loaded
}

// Additional utility tools
AE_TOOLS_COMPREHENSIVE["get_tool_list"] = {
    description: "Get list of all available AI tools with descriptions",
    parameters: {
        category: "string" // optional filter by category
    },
    execute: function(params) {
        var tools = [];
        var category = params.category ? params.category.toLowerCase() : null;
        
        for (var toolName in AE_TOOLS_COMPREHENSIVE) {
            var tool = AE_TOOLS_COMPREHENSIVE[toolName];
            if (tool.description) {
                var toolInfo = {
                    name: toolName,
                    description: tool.description,
                    parameters: tool.parameters || {}
                };
                
                // Basic category detection based on tool name patterns
                if (category) {
                    var toolCategory = this.detectCategory(toolName);
                    if (toolCategory !== category) continue;
                }
                
                tools.push(toolInfo);
            }
        }
        
        return {
            success: true,
            message: "Retrieved " + tools.length + " available tools" + (category ? " in category: " + category : ""),
            data: { tools: tools, totalCount: tools.length }
        };
    },
    
    detectCategory: function(toolName) {
        if (toolName.indexOf("create_project") !== -1 || toolName.indexOf("import") !== -1 || toolName.indexOf("organize") !== -1) return "project";
        if (toolName.indexOf("create_composition") !== -1 || toolName.indexOf("comp") !== -1) return "composition";
        if (toolName.indexOf("add_layer") !== -1 || toolName.indexOf("duplicate") !== -1 || toolName.indexOf("align") !== -1) return "layer";
        if (toolName.indexOf("animate") !== -1 || toolName.indexOf("keyframe") !== -1 || toolName.indexOf("motion") !== -1) return "animation";
        if (toolName.indexOf("effect") !== -1 || toolName.indexOf("apply") !== -1) return "effects";
        if (toolName.indexOf("text") !== -1) return "text";
        if (toolName.indexOf("render") !== -1 || toolName.indexOf("export") !== -1) return "render";
        if (toolName.indexOf("shape") !== -1) return "shape";
        if (toolName.indexOf("mask") !== -1) return "mask";
        return "utility";
    }
};

AE_TOOLS_COMPREHENSIVE["get_project_status"] = {
    description: "Get comprehensive status information about the current project",
    parameters: {},
    execute: function(params) {
        try {
            var project = app.project;
            var activeItem = project.activeItem;
            
            var status = {
                projectName: project.file ? project.file.name : "Untitled Project",
                projectPath: project.file ? project.file.fsName : null,
                saved: project.dirty === false,
                totalItems: project.numItems,
                activeItem: activeItem ? {
                    name: activeItem.name,
                    type: activeItem instanceof CompItem ? "Composition" : 
                          activeItem instanceof FootageItem ? "Footage" : "Unknown",
                    duration: activeItem instanceof CompItem ? activeItem.duration : null,
                    dimensions: activeItem instanceof CompItem ? [activeItem.width, activeItem.height] : null
                } : null,
                renderQueue: {
                    totalItems: project.renderQueue.numItems,
                    canRender: project.renderQueue.canQueueInAME
                },
                compositions: 0,
                footage: 0,
                folders: 0
            };
            
            // Count different item types
            for (var i = 1; i <= project.numItems; i++) {
                var item = project.item(i);
                if (item instanceof CompItem) {
                    status.compositions++;
                } else if (item instanceof FootageItem) {
                    status.footage++;
                } else if (item instanceof FolderItem) {
                    status.folders++;
                }
            }
            
            return {
                success: true,
                message: "Retrieved project status",
                data: status
            };
        } catch (error) {
            return { success: false, message: "Error getting project status: " + error.toString() };
        }
    }
};

// Main execution function for comprehensive tools
function executeComprehensiveAITool(toolName, parameters) {
    if (!AE_TOOLS_COMPREHENSIVE[toolName]) {
        return {
            success: false,
            message: "Tool not found: " + toolName + ". Use 'get_tool_list' to see available tools."
        };
    }
    
    try {
        var tool = AE_TOOLS_COMPREHENSIVE[toolName];
        var result = tool.execute(parameters || {});
        
        // Ensure result has required properties
        if (!result.hasOwnProperty('success')) {
            result.success = true;
        }
        if (!result.hasOwnProperty('message')) {
            result.message = "Tool executed: " + toolName;
        }
        
        return result;
    } catch (error) {
        return {
            success: false,
            message: "Error executing tool '" + toolName + "': " + error.toString(),
            data: { toolName: toolName, parameters: parameters }
        };
    }
}

// Get list of all available comprehensive tools
function getComprehensiveAITools() {
    var toolList = [];
    
    for (var toolName in AE_TOOLS_COMPREHENSIVE) {
        if (AE_TOOLS_COMPREHENSIVE.hasOwnProperty(toolName)) {
            var tool = AE_TOOLS_COMPREHENSIVE[toolName];
            toolList.push({
                name: toolName,
                description: tool.description || "No description available",
                parameters: tool.parameters || {}
            });
        }
    }
    
    return {
        success: true,
        message: "Available comprehensive AI tools: " + toolList.length,
        data: { tools: toolList, count: toolList.length }
    };
}

// Category-specific tool getters
function getProjectTools() {
    return filterToolsByCategory("project");
}

function getCompositionTools() {
    return filterToolsByCategory("composition");
}

function getLayerTools() {
    return filterToolsByCategory("layer");
}

function getAnimationTools() {
    return filterToolsByCategory("animation");
}

function getEffectsTools() {
    return filterToolsByCategory("effects");
}

function getTextTools() {
    return filterToolsByCategory("text");
}

function getRenderTools() {
    return filterToolsByCategory("render");
}

function getShapeTools() {
    return filterToolsByCategory("shape");
}

function getMaskTools() {
    return filterToolsByCategory("mask");
}

function filterToolsByCategory(category) {
    var filteredTools = [];
    
    for (var toolName in AE_TOOLS_COMPREHENSIVE) {
        if (AE_TOOLS_COMPREHENSIVE.hasOwnProperty(toolName)) {
            var tool = AE_TOOLS_COMPREHENSIVE[toolName];
            var toolCategory = detectToolCategory(toolName);
            
            if (toolCategory === category) {
                filteredTools.push({
                    name: toolName,
                    description: tool.description || "No description available",
                    parameters: tool.parameters || {}
                });
            }
        }
    }
    
    return {
        success: true,
        message: "Found " + filteredTools.length + " tools in category: " + category,
        data: { tools: filteredTools, category: category, count: filteredTools.length }
    };
}

function detectToolCategory(toolName) {
    if (toolName.indexOf("project") !== -1 || toolName.indexOf("import") !== -1 || toolName.indexOf("organize") !== -1 || toolName.indexOf("save") !== -1) return "project";
    if (toolName.indexOf("composition") !== -1 || toolName.indexOf("comp") !== -1) return "composition";
    if (toolName.indexOf("layer") !== -1 || toolName.indexOf("duplicate") !== -1 || toolName.indexOf("align") !== -1 || toolName.indexOf("parent") !== -1) return "layer";
    if (toolName.indexOf("animate") !== -1 || toolName.indexOf("keyframe") !== -1 || toolName.indexOf("motion") !== -1 || toolName.indexOf("camera") !== -1) return "animation";
    if (toolName.indexOf("effect") !== -1 || toolName.indexOf("apply") !== -1) return "effects";
    if (toolName.indexOf("text") !== -1) return "text";
    if (toolName.indexOf("render") !== -1 || toolName.indexOf("export") !== -1) return "render";
    if (toolName.indexOf("shape") !== -1) return "shape";
    if (toolName.indexOf("mask") !== -1 || toolName.indexOf("rotoscope") !== -1) return "mask";
    return "utility";
}

// Export comprehensive tools for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AE_TOOLS_COMPREHENSIVE: AE_TOOLS_COMPREHENSIVE,
        executeComprehensiveAITool: executeComprehensiveAITool,
        getComprehensiveAITools: getComprehensiveAITools,
        getProjectTools: getProjectTools,
        getCompositionTools: getCompositionTools,
        getLayerTools: getLayerTools,
        getAnimationTools: getAnimationTools,
        getEffectsTools: getEffectsTools,
        getTextTools: getTextTools,
        getRenderTools: getRenderTools,
        getShapeTools: getShapeTools,
        getMaskTools: getMaskTools
    };
} 
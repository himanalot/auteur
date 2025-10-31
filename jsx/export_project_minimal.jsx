// Minimal Project Export for Graph Visualization
// Simple, fast export that won't hang

function exportProjectForGraph() {
    try {
        var project = app.project;
        if (!project) {
            return JSON.stringify({
                success: false,
                message: "No active project found"
            });
        }

        var projectData = {
            project: {
                name: project.file ? project.file.name : "Untitled Project",
                num_items: project.numItems,
                exported_at: new Date().toString()
            },
            nodes: [],
            edges: [],
            embedding_content: []
        };

        // Create project root node
        projectData.nodes.push({
            id: "project_root",
            type: "Project",
            properties: projectData.project
        });

        // Export items with basic info only
        for (var i = 1; i <= Math.min(project.numItems, 10); i++) {
            try {
                var item = project.item(i);
                var itemId = "item_" + i;
                
                var itemType = "Item";
                if (item instanceof CompItem) itemType = "Composition";
                else if (item instanceof FootageItem) itemType = "FootageItem";
                else if (item instanceof FolderItem) itemType = "ProjectFolder";
                
                projectData.nodes.push({
                    id: itemId,
                    type: itemType,
                    properties: {
                        name: item.name || "Unnamed",
                        index: i
                    }
                });

                projectData.edges.push({
                    from: "project_root",
                    to: itemId,
                    type: "CONTAINS",
                    properties: { index: i }
                });

                projectData.embedding_content.push({
                    id: itemId,
                    field: "name",
                    content: item.name || "Unnamed",
                    type: "name"
                });

            } catch (itemError) {
                // Skip problematic items
            }
        }

        return JSON.stringify({
            success: true,
            message: "Project exported for graph visualization",
            data: {
                nodes: projectData.nodes,
                edges: projectData.edges,
                embedding_content: projectData.embedding_content,
                stats: {
                    total_nodes: projectData.nodes.length,
                    total_edges: projectData.edges.length,
                    embedding_entries: projectData.embedding_content.length
                }
            }
        });

    } catch (error) {
        return JSON.stringify({
            success: false,
            message: "Export failed: " + error.toString()
        });
    }
}

// Execute the export
exportProjectForGraph();
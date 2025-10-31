// Ultra Simple Project Export - Just basic info

try {
    var project = app.project;
    
    if (!project) {
        JSON.stringify({
            success: false,
            message: "No project"
        });
    } else {
        JSON.stringify({
            success: true,
            message: "Graph created",
            data: {
                nodes: [
                    {
                        id: "project_root",
                        type: "Project", 
                        properties: {
                            name: project.file ? project.file.name : "Untitled",
                            items: project.numItems
                        }
                    }
                ],
                edges: [],
                embedding_content: [],
                stats: {
                    total_nodes: 1,
                    total_edges: 0,
                    embedding_entries: 0
                }
            }
        });
    }
} catch (e) {
    JSON.stringify({
        success: false,
        message: "Error: " + e.toString()
    });
}
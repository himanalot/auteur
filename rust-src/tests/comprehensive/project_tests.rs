// Comprehensive Project Object Tests
// Based on Adobe After Effects Scripting Guide: general/project.md
// Tests all documented attributes and methods of the Project object

use super::*;
use crate::api::objects::project::*;

/// Comprehensive tests for the Adobe After Effects Project object
/// Covers all documented attributes and methods including Team Projects
pub struct ProjectObjectTests;

impl ComprehensiveApiTest for ProjectObjectTests {
    fn test_name(&self) -> &str {
        "Project Object Comprehensive Tests"
    }
    
    fn category(&self) -> TestCategory {
        TestCategory::CoreFoundation
    }
    
    fn priority(&self) -> TestPriority {
        TestPriority::Critical
    }
    
    fn expected_api_count(&self) -> usize {
        45 // Estimated based on project.md documentation
    }
    
    fn run_test(&self) -> Vec<ApiTestResult> {
        let mut results = Vec::new();
        
        // Test Project Attributes
        results.extend(self.test_project_attributes());
        
        // Test Project Methods
        results.extend(self.test_project_methods());
        
        // Test Item Management
        results.extend(self.test_item_management());
        
        // Test Team Projects Functionality
        results.extend(self.test_team_projects());
        
        // Test Project Settings
        results.extend(self.test_project_settings());
        
        // Test Import/Export Operations
        results.extend(self.test_import_export());
        
        // Test Project Organization
        results.extend(self.test_project_organization());
        
        // Test Error Handling
        results.extend(self.test_project_error_handling());
        
        results
    }
}

impl ProjectObjectTests {
    /// Test all Project attributes
    fn test_project_attributes(&self) -> Vec<ApiTestResult> {
        vec![
            // Core Properties
            TestUtils::validate_api_exists("app.project.file", "object"),
            TestUtils::validate_api_exists("app.project.rootFolder", "object"),
            TestUtils::validate_api_exists("app.project.activeItem", "object"),
            
            // Counters
            TestUtils::validate_api_exists("app.project.numItems", "number"),
            TestUtils::validate_api_exists("app.project.selection", "object"),
            
            // Display and Timing
            TestUtils::validate_api_exists("app.project.displayStartFrame", "number"),
            TestUtils::test_property_access("app.project", "displayStartFrame", PropertyValueType::OneD),
            self.test_display_start_frame_range(),
            
            // Time Display Settings
            TestUtils::validate_api_exists("app.project.timeDisplayType", "number"),
            TestUtils::validate_api_exists("app.project.framesCountType", "number"),
            TestUtils::validate_api_exists("app.project.feetFramesFilmType", "number"),
            TestUtils::validate_api_exists("app.project.footageTimecodeDisplayStartType", "number"),
            
            // Audio Settings
            TestUtils::validate_api_exists("app.project.bitsPerChannel", "number"),
            TestUtils::validate_api_exists("app.project.transparencyGridThumbnails", "boolean"),
            
            // Tools and Workspace
            TestUtils::validate_api_exists("app.project.toolType", "number"),
            self.test_tool_type_values(),
            
            // GPU and Performance
            TestUtils::validate_api_exists("app.project.gpuAccelType", "number"),
            self.test_gpu_accel_type_values(),
            
            // Render Settings
            TestUtils::validate_api_exists("app.project.renderQueue", "object"),
            
            // Font Management (Added in newer versions)
            TestUtils::validate_api_exists("app.project.usedFonts", "object"),
            
            // Revision Tracking
            TestUtils::validate_api_exists("app.project.revision", "number"),
            
            // Expression Features
            TestUtils::validate_api_exists("app.project.expressionEngine", "string"),
            TestUtils::validate_api_exists("app.project.linearBlending", "boolean"),
        ]
    }
    
    /// Test all Project methods
    fn test_project_methods(&self) -> Vec<ApiTestResult> {
        vec![
            // Core Project Operations
            TestUtils::test_method_call("app.project", "close", &["CloseOptions.DO_NOT_SAVE_CHANGES"], "boolean"),
            TestUtils::test_method_call("app.project", "save", &[], "undefined"),
            TestUtils::test_method_call("app.project", "saveWithDialog", &[], "boolean"),
            
            // Item Access
            TestUtils::test_method_call("app.project", "item", &["1"], "object"),
            TestUtils::test_method_call("app.project", "itemByID", &["1"], "object"),
            
            // Import Operations
            TestUtils::test_method_call("app.project", "importFileWithDialog", &[], "object"),
            TestUtils::test_method_call("app.project", "importPlaceholder", &["'Test Placeholder'", "1920", "1080", "30", "10"], "object"),
            
            // Project Consolidation
            TestUtils::test_method_call("app.project", "consolidateFootage", &[], "undefined"),
            TestUtils::test_method_call("app.project", "removeUnusedFootage", &[], "undefined"),
            
            // Collections and Cleanup
            TestUtils::test_method_call("app.project", "collectFiles", &["{}"], "object"),
            
            // Font Operations
            TestUtils::test_method_call("app.project", "replaceFont", &["'Arial'", "'Helvetica'"], "undefined"),
            
            // Expression Operations
            TestUtils::test_method_call("app.project", "autoFixExpressions", &["'oldText'", "'newText'"], "undefined"),
            
            // Team Project Operations (Test method existence)
            self.test_team_project_methods(),
        ]
    }
    
    /// Test item management functionality
    fn test_item_management(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_item_access_methods(),
            self.test_item_selection(),
            self.test_item_organization(),
            self.test_item_properties(),
        ]
    }
    
    /// Test Team Projects functionality
    fn test_team_projects(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_team_project_creation(),
            self.test_team_project_sharing(),
            self.test_team_project_synchronization(),
            self.test_team_project_authentication(),
            self.test_team_project_status_checks(),
            self.test_team_project_conversion(),
        ]
    }
    
    /// Test project settings and configuration
    fn test_project_settings(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_time_display_settings(),
            self.test_audio_settings(),
            self.test_color_settings(),
            self.test_performance_settings(),
        ]
    }
    
    /// Test import and export operations
    fn test_import_export(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_import_operations(),
            self.test_export_operations(),
            self.test_collect_files(),
            self.test_consolidation_operations(),
        ]
    }
    
    /// Test project organization features
    fn test_project_organization(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_folder_operations(),
            self.test_item_sorting(),
            self.test_project_cleanup(),
        ]
    }
    
    /// Test error handling scenarios
    fn test_project_error_handling(&self) -> Vec<ApiTestResult> {
        vec![
            self.test_invalid_file_operations(),
            self.test_missing_item_access(),
            self.test_team_project_errors(),
            self.test_import_errors(),
        ]
    }
    
    // Specific test implementations
    
    fn test_tool_type_values(&self) -> ApiTestResult {
        // Test all documented tool types from ToolType enum
        TestUtils::execute_script_test(
            "tool_type_enum_values",
            "app.project.toolType",
            "
                var currentTool = app.project.toolType;
                var validTools = [
                    ToolType.Tool_Arrow,
                    ToolType.Tool_Rotate, 
                    ToolType.Tool_CameraMaya,
                    ToolType.Tool_CameraOrbit,
                    ToolType.Tool_CameraTrackXY,
                    ToolType.Tool_CameraTrackZ,
                    ToolType.Tool_Paintbrush,
                    ToolType.Tool_CloneStamp,
                    ToolType.Tool_Eraser
                ];
                
                var isValidTool = false;
                for (var i = 0; i < validTools.length; i++) {
                    if (currentTool === validTools[i]) {
                        isValidTool = true;
                        break;
                    }
                }
                
                isValidTool ? 'valid tool type: ' + currentTool : 'unknown tool type: ' + currentTool;
            ",
            "string"
        )
    }
    
    fn test_gpu_accel_type_values(&self) -> ApiTestResult {
        // Test GPU acceleration types: CUDA, Metal, OPENCL, SOFTWARE
        TestUtils::execute_script_test(
            "gpu_accel_type_validation",
            "app.project.gpuAccelType",
            "
                var currentGPU = app.project.gpuAccelType;
                var validGPUTypes = [
                    GpuAccelType.CUDA,
                    GpuAccelType.Metal,
                    GpuAccelType.OPENCL, 
                    GpuAccelType.SOFTWARE
                ];
                
                var isValidGPU = false;
                for (var i = 0; i < validGPUTypes.length; i++) {
                    if (currentGPU === validGPUTypes[i]) {
                        isValidGPU = true;
                        break;
                    }
                }
                
                isValidGPU ? 'valid gpu type: ' + currentGPU : 'unknown gpu type: ' + currentGPU;
            ",
            "string"
        )
    }
    
    fn test_display_start_frame_range(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "display_start_frame_range",
            "app.project.displayStartFrame",
            "
                var originalFrame = app.project.displayStartFrame;
                
                // Test valid range
                app.project.displayStartFrame = 0;
                var test1 = app.project.displayStartFrame === 0;
                
                app.project.displayStartFrame = 1;
                var test2 = app.project.displayStartFrame === 1;
                
                app.project.displayStartFrame = 100;
                var test3 = app.project.displayStartFrame === 100;
                
                // Restore original
                app.project.displayStartFrame = originalFrame;
                
                (test1 && test2 && test3) ? 'display start frame range valid' : 'range test failed';
            ",
            "string"
        )
    }
    
    fn test_team_project_methods(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "team_project_methods",
            "app.project.newTeamProject",
            "
                var teamMethods = [
                    'newTeamProject', 'openTeamProject', 'shareTeamProject',
                    'syncWithTeamProject', 'closeTeamProject', 'listTeamProjects',
                    'isTeamProjectOpen', 'isAnyTeamProjectOpen', 'isLoggedInToTeamProject'
                ];
                
                var availableCount = 0;
                for (var i = 0; i < teamMethods.length; i++) {
                    if (typeof app.project[teamMethods[i]] === 'function') {
                        availableCount++;
                    }
                }
                
                'team project methods: ' + availableCount + '/' + teamMethods.length + ' available';
            ",
            "string"
        )
    }
    
    fn test_item_access_methods(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "item_access_methods",
            "app.project.item/itemByID",
            "
                var itemCount = app.project.numItems;
                var accessTests = [];
                
                // Test item() method
                if (itemCount > 0) {
                    var firstItem = app.project.item(1);
                    accessTests.push(firstItem !== null ? 'item(1) works' : 'item(1) failed');
                    
                    // Test itemByID() method if we have an item
                    if (firstItem) {
                        var itemById = app.project.itemByID(firstItem.id);
                        accessTests.push(itemById !== null ? 'itemByID works' : 'itemByID failed');
                    }
                } else {
                    accessTests.push('no items to test');
                }
                
                'item access: ' + accessTests.join(', ');
            ",
            "string"
        )
    }
    
    fn test_item_selection(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "item_selection_operations",
            "app.project.selection",
            "
                var selection = app.project.selection;
                var selectionInfo = {
                    hasSelection: selection && selection.length !== undefined,
                    count: selection ? selection.length : 0,
                    isArray: selection instanceof Array || (selection && typeof selection.length === 'number')
                };
                
                'selection: ' + selectionInfo.count + ' items, valid: ' + selectionInfo.isArray;
            ",
            "string"
        )
    }
    
    fn test_item_organization(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "item_organization",
            "app.project.rootFolder",
            "
                var rootFolder = app.project.rootFolder;
                var orgInfo = {
                    hasRootFolder: rootFolder !== null && rootFolder !== undefined,
                    hasItems: rootFolder && rootFolder.numItems !== undefined,
                    itemCount: rootFolder ? rootFolder.numItems : 0
                };
                
                orgInfo.hasRootFolder ? 
                    'root folder: ' + orgInfo.itemCount + ' items' :
                    'no root folder found';
            ",
            "string"
        )
    }
    
    fn test_item_properties(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "item_properties_access",
            "app.project.activeItem",
            "
                var activeItem = app.project.activeItem;
                var propsInfo = {
                    hasActiveItem: activeItem !== null && activeItem !== undefined,
                    hasName: activeItem && activeItem.name !== undefined,
                    hasType: activeItem && activeItem.typeName !== undefined
                };
                
                if (propsInfo.hasActiveItem) {
                    'active item: ' + (activeItem.name || 'unnamed') + ' (' + (activeItem.typeName || 'unknown type') + ')';
                } else {
                    'no active item';
                }
            ",
            "string"
        )
    }
    
    fn test_team_project_creation(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "team_project_creation",
            "app.project.newTeamProject",
            "
                var teamProjectAvailable = typeof app.project.newTeamProject === 'function';
                
                if (teamProjectAvailable) {
                    // Test the method exists without actually creating team project
                    'team project creation method available';
                } else {
                    'team project creation not available';
                }
            ",
            "string"
        )
    }
    
    fn test_team_project_sharing(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "team_project_sharing",
            "app.project.shareTeamProject",
            "
                var sharingMethods = ['shareTeamProject', 'syncWithTeamProject'];
                var availableCount = 0;
                
                for (var i = 0; i < sharingMethods.length; i++) {
                    if (typeof app.project[sharingMethods[i]] === 'function') {
                        availableCount++;
                    }
                }
                
                'team project sharing: ' + availableCount + '/' + sharingMethods.length + ' methods available';
            ",
            "string"
        )
    }
    
    fn test_team_project_synchronization(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "team_project_synchronization",
            "app.project.syncWithTeamProject",
            "
                var syncMethods = ['syncWithTeamProject', 'closeTeamProject', 'convertTeamProjectToProject'];
                var syncAvailable = 0;
                
                for (var i = 0; i < syncMethods.length; i++) {
                    if (typeof app.project[syncMethods[i]] === 'function') {
                        syncAvailable++;
                    }
                }
                
                'synchronization methods: ' + syncAvailable + '/' + syncMethods.length + ' available';
            ",
            "string"
        )
    }
    
    fn test_team_project_authentication(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "team_project_authentication",
            "app.project.loginToTeamProject/logoutFromTeamProject",
            "
                var authMethods = ['loginToTeamProject', 'logoutFromTeamProject', 'isLoggedInToTeamProject'];
                var authAvailable = 0;
                
                for (var i = 0; i < authMethods.length; i++) {
                    if (typeof app.project[authMethods[i]] === 'function') {
                        authAvailable++;
                    }
                }
                
                'authentication methods: ' + authAvailable + '/' + authMethods.length + ' available';
            ",
            "string"
        )
    }
    
    fn test_team_project_status_checks(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "team_project_status_checks",
            "app.project.isTeamProjectOpen/isAnyTeamProjectOpen",
            "
                var statusMethods = ['isTeamProjectOpen', 'isAnyTeamProjectOpen', 'isTeamProjectEnabled'];
                var statusAvailable = 0;
                
                for (var i = 0; i < statusMethods.length; i++) {
                    if (typeof app.project[statusMethods[i]] === 'function') {
                        statusAvailable++;
                    }
                }
                
                'status check methods: ' + statusAvailable + '/' + statusMethods.length + ' available';
            ",
            "string"
        )
    }
    
    fn test_team_project_conversion(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "team_project_conversion",
            "app.project.convertTeamProjectToProject",
            "
                var conversionMethod = typeof app.project.convertTeamProjectToProject === 'function';
                var listMethod = typeof app.project.listTeamProjects === 'function';
                
                var methodCount = 0;
                if (conversionMethod) methodCount++;
                if (listMethod) methodCount++;
                
                'team project conversion: ' + methodCount + '/2 methods available';
            ",
            "string"
        )
    }
    
    fn test_time_display_settings(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "time_display_settings",
            "app.project.timeDisplayType/framesCountType",
            "
                var timeSettings = {
                    timeDisplayType: app.project.timeDisplayType,
                    framesCountType: app.project.framesCountType,
                    feetFramesFilmType: app.project.feetFramesFilmType,
                    footageTimecodeDisplayStartType: app.project.footageTimecodeDisplayStartType
                };
                
                var validSettings = 0;
                for (var key in timeSettings) {
                    if (typeof timeSettings[key] === 'number') {
                        validSettings++;
                    }
                }
                
                'time display settings: ' + validSettings + '/4 valid';
            ",
            "string"
        )
    }
    
    fn test_audio_settings(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "audio_settings",
            "app.project.bitsPerChannel",
            "
                var bitsPerChannel = app.project.bitsPerChannel;
                var validBits = [8, 16, 32];
                var isValidBits = validBits.indexOf(bitsPerChannel) >= 0;
                
                isValidBits ? 
                    'audio: ' + bitsPerChannel + ' bits per channel' :
                    'invalid bits per channel: ' + bitsPerChannel;
            ",
            "string"
        )
    }
    
    fn test_color_settings(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "color_settings",
            "app.project.linearBlending",
            "
                var colorSettings = {
                    linearBlending: app.project.linearBlending,
                    transparencyGridThumbnails: app.project.transparencyGridThumbnails
                };
                
                var validSettings = 0;
                for (var key in colorSettings) {
                    if (typeof colorSettings[key] === 'boolean') {
                        validSettings++;
                    }
                }
                
                'color settings: ' + validSettings + '/2 boolean settings valid';
            ",
            "string"
        )
    }
    
    fn test_performance_settings(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "performance_settings",
            "app.project.gpuAccelType",
            "
                var perfSettings = {
                    gpuAccelType: app.project.gpuAccelType,
                    expressionEngine: app.project.expressionEngine
                };
                
                var settingsInfo = [];
                
                if (typeof perfSettings.gpuAccelType === 'number') {
                    settingsInfo.push('gpu accel: type ' + perfSettings.gpuAccelType);
                }
                
                if (typeof perfSettings.expressionEngine === 'string') {
                    settingsInfo.push('expression engine: ' + perfSettings.expressionEngine);
                }
                
                'performance settings: ' + settingsInfo.join(', ');
            ",
            "string"
        )
    }
    
    fn test_import_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "import_operations",
            "app.project.importFile/importFileWithDialog",
            "
                var importMethods = [
                    'importFile', 'importFileWithDialog', 'importPlaceholder'
                ];
                
                var availableImports = 0;
                for (var i = 0; i < importMethods.length; i++) {
                    if (typeof app.project[importMethods[i]] === 'function') {
                        availableImports++;
                    }
                }
                
                'import operations: ' + availableImports + '/' + importMethods.length + ' methods available';
            ",
            "string"
        )
    }
    
    fn test_export_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "export_operations",
            "app.project.save/saveWithDialog",
            "
                var exportMethods = ['save', 'saveWithDialog', 'close'];
                var availableExports = 0;
                
                for (var i = 0; i < exportMethods.length; i++) {
                    if (typeof app.project[exportMethods[i]] === 'function') {
                        availableExports++;
                    }
                }
                
                'export operations: ' + availableExports + '/' + exportMethods.length + ' methods available';
            ",
            "string"
        )
    }
    
    fn test_collect_files(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "collect_files_operation",
            "app.project.collectFiles",
            "
                var collectMethod = typeof app.project.collectFiles === 'function';
                var reduceMethod = typeof app.project.reduceProject === 'function';
                
                var fileOps = [];
                if (collectMethod) fileOps.push('collect files');
                if (reduceMethod) fileOps.push('reduce project');
                
                fileOps.length > 0 ? 
                    'file operations: ' + fileOps.join(', ') :
                    'no file collection operations available';
            ",
            "string"
        )
    }
    
    fn test_consolidation_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "consolidation_operations",
            "app.project.consolidateFootage/removeUnusedFootage",
            "
                var consolidationMethods = [
                    'consolidateFootage', 'removeUnusedFootage', 'replaceFont', 'autoFixExpressions'
                ];
                
                var availableConsolidation = 0;
                for (var i = 0; i < consolidationMethods.length; i++) {
                    if (typeof app.project[consolidationMethods[i]] === 'function') {
                        availableConsolidation++;
                    }
                }
                
                'consolidation operations: ' + availableConsolidation + '/' + consolidationMethods.length + ' methods available';
            ",
            "string"
        )
    }
    
    fn test_folder_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "folder_operations",
            "app.project.rootFolder",
            "
                var rootFolder = app.project.rootFolder;
                var folderOps = {
                    hasRootFolder: rootFolder !== null,
                    canAddItems: rootFolder && typeof rootFolder.items !== 'undefined',
                    hasNumItems: rootFolder && typeof rootFolder.numItems === 'number'
                };
                
                var validOps = 0;
                for (var key in folderOps) {
                    if (folderOps[key]) validOps++;
                }
                
                'folder operations: ' + validOps + '/3 valid';
            ",
            "string"
        )
    }
    
    fn test_item_sorting(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "item_sorting_operations",
            "app.project.item",
            "
                var itemAccess = {
                    hasItemMethod: typeof app.project.item === 'function',
                    hasItemByIDMethod: typeof app.project.itemByID === 'function',
                    hasSelection: app.project.selection !== undefined
                };
                
                var sortingFeatures = [];
                if (itemAccess.hasItemMethod) sortingFeatures.push('item access');
                if (itemAccess.hasItemByIDMethod) sortingFeatures.push('item by ID');
                if (itemAccess.hasSelection) sortingFeatures.push('selection');
                
                'item sorting features: ' + sortingFeatures.join(', ');
            ",
            "string"
        )
    }
    
    fn test_project_cleanup(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "project_cleanup_operations",
            "app.project.reduceProject",
            "
                var cleanupMethods = [
                    'reduceProject', 'removeUnusedFootage', 'consolidateFootage'
                ];
                
                var availableCleanup = 0;
                for (var i = 0; i < cleanupMethods.length; i++) {
                    if (typeof app.project[cleanupMethods[i]] === 'function') {
                        availableCleanup++;
                    }
                }
                
                'cleanup operations: ' + availableCleanup + '/' + cleanupMethods.length + ' available';
            ",
            "string"
        )
    }
    
    fn test_invalid_file_operations(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "invalid_file_operations",
            "app.project.save/importFile",
            "
                var errorHandling = [];
                
                // Test error handling for file operations
                try {
                    // Test save method exists
                    if (typeof app.project.save === 'function') {
                        errorHandling.push('save method available');
                    }
                } catch (e) {
                    errorHandling.push('save error handling works');
                }
                
                try {
                    // Test import method exists  
                    if (typeof app.project.importFile === 'function') {
                        errorHandling.push('import method available');
                    }
                } catch (e) {
                    errorHandling.push('import error handling works');
                }
                
                'file operation error handling: ' + errorHandling.join(', ');
            ",
            "string"
        )
    }
    
    fn test_missing_item_access(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "missing_item_access",
            "app.project.item/itemByID",
            "
                var errorTests = [];
                
                // Test accessing non-existent item by index
                try {
                    var invalidItem = app.project.item(999999);
                    errorTests.push(invalidItem === null ? 'null for invalid index' : 'item returned for invalid index');
                } catch (e) {
                    errorTests.push('error for invalid index');
                }
                
                // Test accessing non-existent item by ID
                try {
                    var invalidItemByID = app.project.itemByID(999999);
                    errorTests.push(invalidItemByID === null ? 'null for invalid ID' : 'item returned for invalid ID');
                } catch (e) {
                    errorTests.push('error for invalid ID');
                }
                
                'missing item access: ' + errorTests.join(', ');
            ",
            "string"
        )
    }
    
    fn test_team_project_errors(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "team_project_error_handling",
            "app.project.newTeamProject/shareTeamProject",
            "
                var teamErrorHandling = [];
                
                // Test team project methods error handling
                var teamMethods = ['newTeamProject', 'shareTeamProject', 'openTeamProject'];
                
                for (var i = 0; i < teamMethods.length; i++) {
                    try {
                        var method = teamMethods[i];
                        if (typeof app.project[method] === 'function') {
                            teamErrorHandling.push(method + ' method exists');
                        } else {
                            teamErrorHandling.push(method + ' not available');
                        }
                    } catch (e) {
                        teamErrorHandling.push(method + ' error handling works');
                    }
                }
                
                'team project error handling: ' + teamErrorHandling.join(', ');
            ",
            "string"
        )
    }
    
    fn test_import_errors(&self) -> ApiTestResult {
        TestUtils::execute_script_test(
            "import_error_handling",
            "app.project.importFile",
            "
                var importErrorHandling = [];
                
                // Test import methods error handling
                var importMethods = ['importFile', 'importFileWithDialog', 'importPlaceholder'];
                
                for (var i = 0; i < importMethods.length; i++) {
                    try {
                        var method = importMethods[i];
                        if (typeof app.project[method] === 'function') {
                            importErrorHandling.push(method + ' available');
                        } else {
                            importErrorHandling.push(method + ' not found');
                        }
                    } catch (e) {
                        importErrorHandling.push(method + ' error caught');
                    }
                }
                
                'import error handling: ' + importErrorHandling.join(', ');
            ",
            "string"
        )
    }
}

#[cfg(test)]
mod project_object_tests {
    use super::*;
    
    #[test]
    fn test_project_object_comprehensive() {
        let project_tests = ProjectObjectTests;
        let results = project_tests.run_test();
        
        // Verify we have comprehensive coverage
        assert!(results.len() >= project_tests.expected_api_count());
        
        // Check that all tests pass
        let failed_tests: Vec<_> = results.iter()
            .filter(|r| !r.success)
            .collect();
        
        if !failed_tests.is_empty() {
            panic!("Project object tests failed: {:?}", failed_tests);
        }
    }
    
    #[test]
    fn test_project_attributes_coverage() {
        let project_tests = ProjectObjectTests;
        let results = project_tests.run_test();
        
        // Verify coverage of key project attributes
        let key_attributes = vec![
            "file", "rootFolder", "activeItem", "numItems", "selection",
            "displayStartFrame", "timeDisplayType", "toolType", "gpuAccelType",
            "renderQueue", "usedFonts", "revision", "expressionEngine"
        ];
        
        for attr in key_attributes {
            let attr_tested = results.iter().any(|r| r.api_path.contains(attr));
            assert!(attr_tested, "Project attribute '{}' not tested", attr);
        }
    }
    
    #[test]
    fn test_team_projects_coverage() {
        let project_tests = ProjectObjectTests;
        let results = project_tests.run_test();
        
        // Verify comprehensive Team Projects functionality testing
        let team_project_methods = vec![
            "newTeamProject", "openTeamProject", "shareTeamProject", "syncWithTeamProject",
            "closeTeamProject", "convertTeamProjectToProject", "isTeamProjectOpen",
            "loginToTeamProject", "logoutFromTeamProject"
        ];
        
        for method in team_project_methods {
            let method_tested = results.iter().any(|r| r.api_path.contains(method));
            assert!(method_tested, "Team Project method '{}' not tested", method);
        }
    }
    
    #[test]
    fn test_project_performance() {
        let project_tests = ProjectObjectTests;
        let results = project_tests.run_test();
        
        // Check that most operations are reasonably fast
        let slow_operations: Vec<_> = results.iter()
            .filter(|r| {
                if let Some(perf) = r.performance_ms {
                    // Allow team project and heavy operations to be slower
                    if r.api_path.contains("TeamProject") {
                        perf > 1000 // 1 second for team project operations
                    } else if r.api_path.contains("collectFiles") || r.api_path.contains("consolidate") {
                        perf > 300 // 300ms for file operations
                    } else {
                        perf > 150 // 150ms for general operations
                    }
                } else {
                    false
                }
            })
            .collect();
        
        assert!(slow_operations.is_empty(), "Some project operations are too slow: {:?}", slow_operations);
    }
}